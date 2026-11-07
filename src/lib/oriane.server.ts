// SEUL fichier qui connaît l'API Oriane : URL, format de requête et format de réponse.
// Pour changer de fournisseur ou de format, ne modifier que ce fichier.
import type { Platform, Video } from "./types";

export interface OrianeSearchInput {
  query: string;
  platform?: Platform | undefined;
  limit: number;
  image?: { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string } | undefined;
}

/** Vidéo normalisée, avant calcul du score (score/scoreReason ajoutés ensuite). */
export type RawVideo = Omit<Video, "score" | "scoreReason"> & { providedEngagement: boolean };

interface OrianeResult {
  id: string;
  platform: string;
  platformId?: string | null;
  platformType?: string | null;
  profileHandle?: string | null;
  profileDisplayName?: string | null;
  profileFollowersCount?: number | null;
  caption?: string | null;
  hashtags?: string[] | null;
  publishedAt?: string | null;
  thumbnailMediaUrl?: string | null;
  viewsCount?: number | null;
  likesCount?: number | null;
  sharesCount?: number | null;
  commentsCount?: number | null;
  engagementRatePerViews?: number | null;
  media?: { duration?: number | null; onScreenText?: string[] | null; transcript?: string | null }[] | null;
}

function buildUrl(r: OrianeResult): string {
  const handle = r.profileHandle ?? "";
  if (r.platform === "tiktok") return `https://www.tiktok.com/@${handle}/video/${r.platformId ?? ""}`;
  if (r.platform === "instagram") return `https://www.instagram.com/reel/${r.platformId ?? ""}/`;
  if (r.platform === "youtube") return `https://www.youtube.com/shorts/${r.platformId ?? ""}`;
  return "";
}

export function normalizeOriane(r: OrianeResult): RawVideo | null {
  if (r.platform !== "tiktok" && r.platform !== "instagram" && r.platform !== "youtube") return null;
  const views = r.viewsCount ?? 0;
  if (views <= 0) return null;
  const likes = r.likesCount ?? 0;
  const comments = r.commentsCount ?? 0;
  const shares = r.sharesCount ?? 0;
  const provided = typeof r.engagementRatePerViews === "number" && Number.isFinite(r.engagementRatePerViews);
  const media = r.media?.[0];
  return {
    id: r.id,
    platform: r.platform,
    url: buildUrl(r),
    thumbnailUrl: r.thumbnailMediaUrl ?? "",
    creator: { handle: r.profileHandle ?? "inconnu", name: r.profileDisplayName ?? r.profileHandle ?? "Inconnu", followers: r.profileFollowersCount ?? 0 },
    publishedAt: r.publishedAt ?? new Date().toISOString(),
    durationSeconds: Math.round(media?.duration ?? 0),
    views, likes, comments, shares,
    // En pourcentage. Fourni par Oriane si possible, sinon calculé.
    engagementRate: provided ? r.engagementRatePerViews! : ((likes + comments + shares) / views) * 100,
    providedEngagement: provided,
    caption: r.caption ?? "",
    transcript: media?.transcript ?? "",
    onScreenText: (media?.onScreenText ?? []).filter(Boolean),
    hashtags: r.hashtags ?? [],
  };
}

/** Oriane n'accepte pas l'image fournie (format, taille ou fonction indisponible). */
export class ImageSearchUnsupported extends Error {
  constructor() { super("Recherche par image non acceptée"); }
}

export async function searchOriane(input: OrianeSearchInput): Promise<RawVideo[]> {
  let baseUrl: string = process.env["ORIANE_API_URL"]?.replace(/\s+/g, "") ?? "";
  const apiKey = process.env["ORIANE_API_KEY"]?.trim();
  if (!baseUrl || !apiKey) throw new Error("Oriane non configuré");
  if (!/^https?:\/\//.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  try {
    if (!new URL(baseUrl).hostname.includes(".")) throw new Error();
  } catch {
    throw new Error("ORIANE_API_URL n'est pas une adresse valide");
  }

  // Oriane cherche l'expression exacte : une phrase entière ne trouve rien.
  // On essaie la requête complète, puis son début (« Crème anti-âge »), puis ses 2 premiers mots.
  const full = input.query.trim().toLowerCase().slice(0, 200);
  const head = full.split(/[,.;:!?()]| au | aux | avec | pour | à base | de \d/i)[0]!.trim();
  const terms = [...new Set([full, head, head.split(/\s+/).slice(0, 2).join(" ")])].filter((t) => t.length >= 3);
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const root = baseUrl.replace(/\/$/, "");

  // Recherche par image : on crée un « asset » image, puis on filtre par similarité visuelle.
  let assetId: string | null = null;
  if (input.image) {
    let ok = false;
    try {
      const r = await fetch(`${root}/assets`, { method: "POST", headers, body: JSON.stringify({ type: "image", image: { type: "base64", mediaType: input.image.mediaType, base64: input.image.base64 } }) });
      if (r.ok) { assetId = ((await r.json()) as { data?: { id?: string } }).data?.id ?? null; ok = !!assetId; }
      else console.error("Oriane asset image HTTP", r.status);
    } catch { /* traité ci-dessous */ }
    if (!ok) throw new ImageSearchUnsupported();
  }

  for (const t of terms) {
    const found = await fetchTerm(t);
    if (found.length) return found;
  }
  // Image seule si le texte ne donne rien avec l'image.
  return assetId ? fetchTerm(null) : [];

  async function fetchTerm(term: string | null): Promise<RawVideo[]> {
  const body = {
    operator: "and",
    filters: {
      format: { includes: ["video"] },
      platform: { includes: input.platform ? [input.platform] : ["tiktok", "instagram", "youtube"] },
      ...(assetId ? { visualSimilarity: { includes: { values: [{ assetId, minScore: 0.2 }] } } } : {}),
    },
    queries: term === null ? [] : [{
      operator: "or",
      filters: {
        caption: { includesExactly: { values: [term] } },
        transcript: { includesExactly: { values: [term] } },
        onScreenText: { includesExactly: { values: [term] } },
      },
    }],
  };
  const url = `${root}/contents/search?limit=${input.limit}&sort=${assetId ? "visualSimilarity:desc" : "viewsCount:desc"}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    // Message générique : l'erreur réseau d'origine peut contenir l'adresse configurée.
    throw new Error("Oriane injoignable");
  }
  if (!res.ok) {
    // On ne journalise que le statut : jamais la clé ni les en-têtes.
    throw new Error(`Oriane a répondu ${res.status}`);
  }
  const json = (await res.json()) as { data?: { results?: OrianeResult[] } };
  return (json.data?.results ?? []).map(normalizeOriane).filter((v): v is RawVideo => v !== null);
  }
}
