import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import analyzeSystem from "@/prompts/analyze.system.txt?raw";
import generateSystem from "@/prompts/generate.system.txt?raw";
import type { Analysis, Product, TargetTool, Video } from "./types";

const str = z.string();
const AnalysisSchema = z.object({
  concept: str,
  format: z.enum(["UGC", "tutoriel", "avant/après", "témoignage", "unboxing", "sketch", "autre"]).catch("autre"),
  hook: z.object({ description: str, seconds: z.coerce.number().catch(0), type: z.enum(["question", "choc", "promesse", "visuel"]).catch("visuel") }),
  message: str,
  storytelling: z.tuple([str, str, str]),
  visual_style: str,
  cta: str,
  why_it_works: z.tuple([str, str, str]),
  brandMatch: z.object({ score: z.coerce.number().min(0).max(100), reason: str }),
});

const SceneSchema = z.object({
  title: str.catch(""), start: z.coerce.number().catch(0), end: z.coerce.number().catch(0),
  shot: str.catch(""), visual: str.catch(""), voiceOver: str.catch(""), onScreenText: str.catch(""),
});
const Shot = z.enum(["face caméra", "gros plan produit", "mains", "avant/après", "plan large"]).catch("face caméra");
const ScriptSchema = z.object({
  hook: z.object({ texte_oral: str.catch(""), texte_ecran: str.catch(""), action: str.catch(""), seconds: z.coerce.number().catch(3) }),
  scenes: z.array(z.object({
    numero: z.coerce.number().catch(0), duree_s: z.coerce.number().catch(0), plan: Shot,
    action: str.catch(""), texte_oral: str.catch(""), texte_ecran: str.catch(""),
  })),
  cta: z.object({ texte_oral: str.catch(""), texte_ecran: str.catch("") }),
  materiel: z.array(str).catch([]),
  conseils: z.array(str).catch([]),
});
const GenerateSchema = z.object({
  shootingScript: ScriptSchema.optional().catch(undefined),
  prompt: str, kept: z.array(str), original: z.array(str),
  scenes: z.array(SceneSchema).catch([]), totalSeconds: z.coerce.number().optional(),
  music: str.catch(""), cta: str.catch(""),
});

function videoFacts(v: Video) {
  return {
    plateforme: v.platform, createur: v.creator.handle, legende: v.caption, transcription: v.transcript,
    texte_a_l_ecran: v.onScreenText, hashtags: v.hashtags, duree_s: v.durationSeconds,
    vues: v.views, likes: v.likes, commentaires: v.comments, partages: v.shares, engagement_pct: v.engagementRate,
  };
}

export const analyzeVideo = createServerFn({ method: "POST" })
  .validator((d: { video: Video; product: Product }) => d)
  .handler(async ({ data }): Promise<Analysis> => {
    const { claudeJson } = await import("./claude.server");
    const user = JSON.stringify({ video: videoFacts(data.video), marque: data.product.brand, produit: { nom: data.product.name, description: data.product.description } }, null, 2);
    const analysis = (await claudeJson(analyzeSystem, user, (v) => AnalysisSchema.parse(v))) as Analysis;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analyses").insert({ video_id: data.video.id, data: analysis as unknown as Json });
    return analysis;
  });

export const generateAdPrompt = createServerFn({ method: "POST" })
  .validator((d: { product: Product; analyses: Analysis[]; tool: TargetTool }) => {
    if (!d.analyses.length || d.analyses.length > 3) throw new Error("1 à 3 inspirations");
    return d;
  })
  .handler(async ({ data }) => {
    const { claudeJson } = await import("./claude.server");
    const p = data.product;
    const user = JSON.stringify({
      outil_cible: data.tool,
      produit: { nom: p.name, description: p.description },
      marque: p.brand,
      style: p.style,
      inspirations: data.analyses.map((a) => ({ format: a.format, hook: a.hook, deroule: a.storytelling, style_visuel: a.visual_style })),
    }, null, 2);
    const out = await claudeJson(generateSystem, user, (v) => GenerateSchema.parse(v));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("prompts").insert({ product_id: p.id, data: { ...out, targetTool: data.tool } as unknown as Json });
    return out;
  });
