import type { Video } from "./types";

type Scorable = Omit<Video, "score" | "scoreReason">;

/** Rang percentile dans [0, 1] ; les ex æquo partagent le rang moyen. */
export function percentileRank(values: number[], v: number): number {
  if (values.length <= 1) return 1;
  const below = values.filter((x) => x < v).length;
  const equal = values.filter((x) => x === v).length;
  return (below + (equal - 1) / 2) / (values.length - 1);
}

const pct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/**
 * score = 0,6 × rang_percentile(engagement) + 0,4 × rang_percentile(vues), sur 100.
 * L'engagement est comparé par plateforme dès qu'il y a au moins 2 vidéos de cette plateforme :
 * Instagram n'expose pas les partages, il n'est donc pas comparé aux taux TikTok qui les incluent.
 */
export function scoreVideos(videos: Scorable[]): Video[] {
  const allViews = videos.map((v) => v.views);
  const scored = videos.map((v) => {
    const samePlatform = videos.filter((o) => o.platform === v.platform);
    const pool = samePlatform.length >= 2 ? samePlatform : videos;
    const engRank = percentileRank(pool.map((o) => o.engagementRate), v.engagementRate);
    const viewRank = percentileRank(allViews, v.views);
    const score = Math.round((0.6 * engRank + 0.4 * viewRank) * 100);
    const top = Math.max(1, Math.round((1 - engRank) * 100));
    const scope = pool === samePlatform && samePlatform.length < videos.length ? ` parmi les vidéos ${v.platform === "instagram" ? "Instagram" : v.platform === "tiktok" ? "TikTok" : "YouTube"}` : "";
    const scoreReason = `Engagement de ${pct(v.engagementRate)} %, top ${top} %${scope} de la recherche.`;
    return { ...v, score, scoreReason };
  });
  return scored.sort((a, b) => b.score - a.score);
}
