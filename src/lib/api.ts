import type { Analysis, GeneratedPrompt, Product, TargetTool, Video } from "./types";

/** Erreur de recherche affichable à l'utilisateur, avec proposition de mode démo. */
export class SearchFailed extends Error {}

export async function search(product: Product, opts: { demo: boolean; limit?: number }): Promise<{ videos: Video[]; source: "oriane" | "demo" }> {
  const { searchVideos } = await import("./search.functions");
  let res;
  try {
    res = await searchVideos({ data: { query: product.description || product.name, limit: opts.limit ?? 10, demo: opts.demo } });
  } catch {
    throw new SearchFailed("Le service de recherche ne répond pas.");
  }
  if (res.error) throw new SearchFailed(res.error);
  return { videos: res.videos, source: res.source };
}

export function getVideo(id: string, extra: Video[] = []): Video | undefined {
  return extra.find((v) => v.id === id);
}

// Analyses déjà obtenues pendant la session (clé = id de la vidéo).
const done = new Map<string, Analysis>();
const pending = new Map<string, Promise<Analysis>>();
export const getCachedAnalysis = (videoId: string) => done.get(videoId);

/** Mode démo : analyse enregistrée d'abord. Sinon : analyse par l'IA, puis analyse enregistrée en secours. */
export function analyze(video: Video, product: Product, demo: boolean): Promise<Analysis> {
  const hit = done.get(video.id);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(video.id);
  if (!p) {
    p = (async () => {
      const [{ analyzeVideo }, { getStoredAnalysis }] = await Promise.all([import("./ai.functions"), import("./search.functions")]);
      if (demo) {
        const stored = await getStoredAnalysis({ data: { videoId: video.id } });
        if (stored) return stored;
      }
      try {
        return await analyzeVideo({ data: { video, product } });
      } catch (e) {
        const stored = await getStoredAnalysis({ data: { videoId: video.id } }).catch(() => null);
        if (stored) return stored;
        throw e;
      }
    })();
    pending.set(video.id, p);
    p.then((a) => done.set(video.id, a)).catch(() => {}).finally(() => pending.delete(video.id));
  }
  return p;
}

export async function generate(product: Product, videos: Video[], tool: TargetTool, demo: boolean): Promise<GeneratedPrompt> {
  if (videos.length === 0) throw new Error("Choisissez au moins une inspiration");
  const analyses = await Promise.all(videos.map((v) => analyze(v, product, demo)));
  const { generateAdPrompt } = await import("./ai.functions");
  const out = await generateAdPrompt({ data: { product, analyses, tool } });
  return {
    prompt: out.prompt, kept: out.kept, original: out.original, targetTool: tool,
    scenes: out.scenes, totalSeconds: out.totalSeconds ?? product.style.durationSeconds, music: out.music, cta: out.cta,
  };
}

export async function saveSearchForDemo(query: string, videos: Video[]) {
  const { saveForDemo } = await import("./search.functions");
  const analyses = videos.flatMap((v) => { const a = done.get(v.id); return a ? [{ videoId: v.id, analysis: a }] : []; });
  return saveForDemo({ data: { query, videos, analyses } });
}
