import type { Analysis, Video } from "./types";

export interface Share { label: string; count: number; percent: number }
export interface Insights {
  topCount: number;
  analysedCount: number;
  hookTypes: Share[];
  formats: Share[];
  platforms: Share[];
  avgEngagementTop: number;
  avgEngagementRest: number;
  headline: string | null;
}

const HOOK_LABEL: Record<Analysis["hook"]["type"], string> = { question: "hook question", choc: "hook choc", promesse: "hook promesse", visuel: "hook visuel" };
export const hookLabel = (t: Analysis["hook"]["type"]) => HOOK_LABEL[t];

function shares(values: string[]): Share[] {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()]
    .map(([label, count]) => ({ label, count, percent: values.length ? Math.round((count / values.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * « Meilleures vidéos » = la moitié supérieure par score (au moins 1).
 * Les pourcentages de hook et de format portent sur les meilleures vidéos analysées.
 */
export function computeInsights(videos: Video[], analyses: Record<string, Analysis | undefined>): Insights {
  const sorted = [...videos].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
  const rest = sorted.slice(top.length);
  const topAnalysed = top.map((v) => analyses[v.id]).filter((a): a is Analysis => !!a);
  const hookTypes = shares(topAnalysed.map((a) => HOOK_LABEL[a.hook.type]));
  const formats = shares(topAnalysed.map((a) => a.format));
  const lead = hookTypes[0];
  return {
    topCount: top.length,
    analysedCount: topAnalysed.length,
    hookTypes,
    formats,
    platforms: shares(top.map((v) => v.platform)),
    avgEngagementTop: avg(top.map((v) => v.engagementRate)),
    avgEngagementRest: avg(rest.map((v) => v.engagementRate)),
    headline: lead ? `${lead.percent} % des meilleures vidéos utilisent un ${lead.label}` : null,
  };
}
