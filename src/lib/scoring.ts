import type { Video } from "./types";

type Scorable = Omit<Video, "score" | "scoreReason">;

/** Rang percentile dans [0, 1] ; les ex æquo partagent le rang moyen. */
export function percentileRank(values: number[], v: number): number {
  if (values.length <= 1) return 1;
  const below = values.filter((x) => x < v).length;
  const equal = values.filter((x) => x === v).length;
  return (below + (equal - 1) / 2) / (values.length - 1);
}

/** Attraction = vues / abonnés. null si le nombre d'abonnés est inconnu. */
export function viewsPerFollower(v: Pick<Video, "views" | "creator">): number | null {
  return v.creator.followers > 0 ? v.views / v.creator.followers : null;
}

export type AttractionTier = "pepite" | "breakout" | "audience" | "inconnu";
export function attractionTier(vfr: number | null): AttractionTier {
  if (vfr === null) return "inconnu";
  if (vfr >= 3) return "pepite";
  if (vfr >= 1) return "breakout";
  return "audience";
}

const pct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const ratio = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: n < 10 ? 1 : 0 });

/**
 * Score créa sur 100 :
 *  - abonnés connus : 0,5 × rang(attraction vues/abonnés) + 0,3 × rang(engagement) + 0,2 × rang(vues)
 *  - abonnés inconnus : 0,6 × rang(engagement) + 0,4 × rang(vues)
 * L'engagement est comparé par plateforme (Instagram n'expose pas les partages).
 */
export function scoreVideos(videos: Scorable[]): Video[] {
  const allViews = videos.map((v) => v.views);
  const vfrs = videos.map(viewsPerFollower).filter((x): x is number => x !== null);
  const scored = videos.map((v) => {
    const samePlatform = videos.filter((o) => o.platform === v.platform);
    const pool = samePlatform.length >= 2 ? samePlatform : videos;
    const engRank = percentileRank(pool.map((o) => o.engagementRate), v.engagementRate);
    const viewRank = percentileRank(allViews, v.views);
    const vfr = viewsPerFollower(v);
    const raw = vfr !== null
      ? 0.5 * percentileRank(vfrs, vfr) + 0.3 * engRank + 0.2 * viewRank
      : 0.6 * engRank + 0.4 * viewRank;
    const score = Math.round(raw * 100);
    const scoreReason = vfr !== null
      ? `Attraction ${ratio(vfr)}× la communauté, engagement ${pct(v.engagementRate)} %.`
      : `Engagement ${pct(v.engagementRate)} % (abonnés inconnus).`;
    return { ...v, score, scoreReason };
  });
  return scored.sort((a, b) => b.score - a.score);
}
