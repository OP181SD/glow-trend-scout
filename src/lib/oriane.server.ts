// SEUL fichier qui connaît l'API Oriane : URL, format de requête et format de réponse.
// Pour changer de fournisseur ou de format, ne modifier que ce fichier.
import type { Platform, Video } from "./types";

export interface OrianeSearchInput {
  query: string;
  platform?: Platform | undefined;
  limit: number;
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

export async function searchOriane(input: OrianeSearchInput): Promise<RawVideo[]> {
  let baseUrl = process.env["ORIANE_API_URL"]?.replace(/\s+/g, "");
  const apiKey = process.env["ORIANE_API_KEY"]?.trim();
  if (!baseUrl || !apiKey) throw new Error("Oriane non configuré");
  if (!/^https?:\/\//.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  try { new URL(baseUrl); } catch { throw new Error("ORIANE_API_URL n'est pas une adresse valide"); }

  const term = input.query.trim().slice(0, 200);
  const body = {
    operator: "and",
    filters: {
      format: { includes: ["video"] },
      platform: { includes: input.platform ? [input.platform] : ["tiktok", "instagram", "youtube"] },
    },
    queries: [{
      operator: "or",
      filters: {
        caption: { includesExactly: { values: [term] } },
        transcript: { includesExactly: { values: [term] } },
        onScreenText: { includesExactly: { values: [term] } },
      },
    }],
  };
  const url = `${baseUrl.replace(/\/$/, "")}/contents/search?limit=${input.limit}&sort=viewsCount:desc`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // On ne journalise que le statut : jamais la clé ni les en-têtes.
    throw new Error(`Oriane a répondu ${res.status}`);
  }
  const json = (await res.json()) as { data?: { results?: OrianeResult[] } };
  return (json.data?.results ?? []).map(normalizeOriane).filter((v): v is RawVideo => v !== null);
}
