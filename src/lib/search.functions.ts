import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { scoreVideos } from "./scoring";
import type { Analysis, Video } from "./types";

const Input = z.object({
  query: z.string().trim().min(2).max(500),
  platform: z.enum(["tiktok", "instagram", "youtube"]).optional(),
  limit: z.number().int().min(1).max(10).default(5),
  demo: z.boolean().optional(),
  image: z.object({
    mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    base64: z.string().min(10).max(14_000_000),
  }).optional(),
});

export type SearchResult = { videos: Video[]; source: "oriane" | "demo"; error?: string; imageUsed?: boolean; imageUnsupported?: boolean };

export const searchVideos = createServerFn({ method: "POST" })
  .validator((data: z.input<typeof Input>) => Input.parse(data))
  .handler(async ({ data }): Promise<SearchResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const demo = data.demo === true || process.env["DEMO_MODE"] === "true";

    if (!demo) {
      try {
        const { searchOriane, ImageSearchUnsupported } = await import("./oriane.server");
        const base = { query: data.query, platform: data.platform, limit: data.limit };
        let raw;
        let imageUnsupported = false;
        try {
          raw = await searchOriane({ ...base, image: data.image });
        } catch (e) {
          if (!(e instanceof ImageSearchUnsupported)) throw e;
          imageUnsupported = true;
          raw = await searchOriane(base);
        }
        const flags = { imageUsed: !!data.image && !imageUnsupported, imageUnsupported };
        const videos = scoreVideos(raw.map(({ providedEngagement: _p, ...v }) => v));
        const { data: s } = await supabaseAdmin.from("searches")
          .insert({ query: data.query, platform: data.platform ?? null, source: "oriane", data: { limit: data.limit, count: videos.length } })
          .select("id").single();
        if (videos.length) {
          await supabaseAdmin.from("videos").upsert(videos.map((v) => ({ id: v.id, search_id: s?.id ?? null, query: data.query, platform: v.platform, score: v.score, data: v as unknown as Json })), { ignoreDuplicates: false });
        }
        return { videos, source: "oriane", ...flags };
      } catch (e) {
        console.error("Recherche Oriane échouée:", e instanceof Error ? e.message : "erreur inconnue");
        return { videos: [], source: "oriane", error: "La recherche de vidéos n'a pas abouti." };
      }
    }

    // Mode démo : vidéos enregistrées pour la démo d'abord, sinon les dernières enregistrées.
    const read = async (pinned: boolean) => {
      let q = supabaseAdmin.from("videos").select("data").order("created_at", { ascending: false }).limit(50);
      if (pinned) q = q.eq("pinned", true);
      if (data.platform) q = q.eq("platform", data.platform);
      return ((await q).data ?? []).map((r) => r.data as unknown as Video);
    };
    let stored = await read(true);
    if (!stored.length) stored = await read(false);
    return { videos: scoreVideos(stored).slice(0, data.limit), source: "demo" };
  });

/** Dernière analyse enregistrée (priorité à celles gardées pour la démo). */
export const getStoredAnalysis = createServerFn({ method: "POST" })
  .validator((d: { videoId: string }) => z.object({ videoId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<Analysis | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("analyses").select("data").eq("video_id", data.videoId)
      .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return (row?.data as unknown as Analysis) ?? null;
  });

/** Garde une recherche, ses vidéos et ses analyses pour le scénario de démo. */
export const saveForDemo = createServerFn({ method: "POST" })
  .validator((d: { query: string; videos: Video[]; analyses: { videoId: string; analysis: Analysis }[] }) => {
    if (!d.videos.length || d.videos.length > 20) throw new Error("1 à 20 vidéos");
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin.from("searches")
      .insert({ query: data.query.slice(0, 500), source: "demo", pinned: true, data: { count: data.videos.length } })
      .select("id").single();
    await supabaseAdmin.from("videos").upsert(data.videos.map((v) => ({ id: v.id, search_id: s?.id ?? null, query: data.query.slice(0, 500), platform: v.platform, score: v.score, pinned: true, data: v as unknown as Json })));
    if (data.analyses.length) {
      await supabaseAdmin.from("analyses").insert(data.analyses.map((a) => ({ video_id: a.videoId, pinned: true, data: a.analysis as unknown as Json })));
    }
    return { videos: data.videos.length, analyses: data.analyses.length };
  });
