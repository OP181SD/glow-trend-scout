import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { scoreVideos } from "./scoring";
import type { Video } from "./types";

const Input = z.object({
  query: z.string().trim().min(2).max(500),
  platform: z.enum(["tiktok", "instagram", "youtube"]).optional(),
  limit: z.number().int().min(1).max(10).default(5),
});

export type SearchResult = { videos: Video[]; source: "oriane" | "demo" };

export const searchVideos = createServerFn({ method: "POST" })
  .inputValidator((data: z.input<typeof Input>) => Input.parse(data))
  .handler(async ({ data }): Promise<SearchResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const demo = process.env["DEMO_MODE"] === "true";

    if (!demo) {
      try {
        const { searchOriane } = await import("./oriane.server");
        const raw = await searchOriane({ query: data.query, platform: data.platform, limit: data.limit });
        const videos = scoreVideos(raw.map(({ providedEngagement: _p, ...v }) => v));
        const { data: s } = await supabaseAdmin.from("searches")
          .insert({ query: data.query, platform: data.platform ?? null, source: "oriane", data: { limit: data.limit, count: videos.length } })
          .select("id").single();
        if (videos.length) {
          await supabaseAdmin.from("videos").upsert(videos.map((v) => ({ id: v.id, search_id: s?.id ?? null, query: data.query, platform: v.platform, score: v.score, data: v })));
        }
        if (videos.length) return { videos, source: "oriane" };
      } catch (e) {
        console.error("Recherche Oriane échouée, passage en mode démo:", e instanceof Error ? e.message : "erreur inconnue");
      }
    }

    // Mode démo : relire les vidéos déjà enregistrées.
    let q = supabaseAdmin.from("videos").select("data").order("created_at", { ascending: false }).limit(50);
    if (data.platform) q = q.eq("platform", data.platform);
    const { data: rows } = await q;
    const stored = (rows ?? []).map((r) => r.data as unknown as Video);
    const rescored = scoreVideos(stored).slice(0, data.limit);
    return { videos: rescored, source: "demo" };
  });
