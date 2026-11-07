import type { Analysis, GeneratedPrompt, Product, TargetTool, Video } from "./types";

/** Erreur de recherche affichable à l'utilisateur, avec proposition de mode démo. */
export class SearchFailed extends Error {}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

/** Image produit utilisable par la recherche visuelle (data URL JPG, PNG ou WebP), sinon null. */
export function imageForSearch(dataUrl: string): { mediaType: ImageType; base64: string } | null {
  const m = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!m || !(IMAGE_TYPES as readonly string[]).includes(m[1]!)) return null;
  return { mediaType: m[1] as ImageType, base64: m[2]! };
}

export async function search(product: Product, opts: { demo: boolean; limit?: number; useImage?: boolean }) {
  const { searchVideos } = await import("./search.functions");
  const image = opts.useImage && !opts.demo ? imageForSearch(product.imageUrl) : null;
  let res;
  try {
    res = await searchVideos({ data: { query: product.description || product.name, limit: opts.limit ?? 10, demo: opts.demo, ...(image ? { image } : {}) } });
  } catch {
    throw new SearchFailed("Le service de recherche ne répond pas.");
  }
  if (res.error) throw new SearchFailed(res.error);
  return { videos: res.videos, source: res.source, imageUsed: !!res.imageUsed, imageUnsupported: !!res.imageUnsupported };
}

export function getVideo(id: string, extra: Video[] = []): Video | undefined {
  return extra.find((v) => v.id === id);
}

// L'image n'est pas utile à l'IA : on ne l'envoie pas (requêtes plus légères).
const lite = (p: Product): Product => ({ ...p, imageUrl: "" });

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
        return await analyzeVideo({ data: { video, product: lite(product) } });
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
  const out = await generateAdPrompt({ data: { product: lite(product), analyses, tool } });
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
