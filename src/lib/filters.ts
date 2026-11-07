// Filtres et détections purs (sans réseau), calculés sur les données Oriane déjà reçues.
import type { Video } from "./types";

const DAY = 86_400_000;
const text = (v: Video) => `${v.caption} ${v.transcript} ${v.onScreenText.join(" ")} ${v.hashtags.map((h) => `#${h}`).join(" ")}`.toLowerCase();
const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/** Shadow reach : part de la portée hors abonnés.
 * "viral" = vues ≥ 2× abonnés ; "bridee" = vues < 5 % des abonnés (portée possiblement limitée par l'algorithme). */
export type ShadowReach = "viral" | "normal" | "bridee" | "inconnu";
export function shadowReach(v: Video): ShadowReach {
  if (!v.creator.followers) return "inconnu";
  const r = v.views / v.creator.followers;
  if (r >= 2) return "viral";
  if (r < 0.05) return "bridee";
  return "normal";
}

export type ContentType = "ads" | "sketch" | "tutoriel" | "avant-apres" | "temoignage" | "ugc";
export function contentType(v: Video): ContentType {
  const t = text(v);
  if (has(t, ["#ad ", "#ad\n", "#ads", "#pub", "#sponsor", "sponsorisé", "partenariat", "paid partnership", "code promo", "#collab", "#gifted"]) || / #ad$/.test(t)) return "ads";
  if (has(t, ["pov", "sketch", "#comedy", "#humour", "#funny", "quand ta", "quand tu", "when your", "😂"])) return "sketch";
  if (has(t, ["avant/après", "avant après", "before after", "before/after", "#beforeandafter", "résultat après", "jours après"])) return "avant-apres";
  if (has(t, ["tuto", "how to", "comment ", "étape", "routine", "step"])) return "tutoriel";
  if (has(t, ["mon avis", "review", "j'ai testé", "i tried", "honest", "honnête", "testé"])) return "temoignage";
  return "ugc";
}

export type Tone = "humour" | "expert" | "storytelling" | "promo" | "choc";
export function tone(v: Video): Tone {
  const t = text(v);
  if (has(t, ["😂", "🤣", "pov", "#funny", "#humour", "lol", "mdr"])) return "humour";
  if (has(t, ["-50", "promo", "offre", "code ", "lien en bio", "link in bio", "shop", "achète"])) return "promo";
  if (has(t, ["choc", "personne ne", "nobody", "stop", "erreur", "mistake", "never", "jamais", "?!", "secret"])) return "choc";
  if (has(t, ["dermato", "expert", "ingrédient", "rétinol", "retinol", "acide", "spf", "science", "pharmacien"])) return "expert";
  return "storytelling";
}

export type AgeGroup = "genz" | "25-34" | "35+";
export function ageGroup(v: Video): AgeGroup {
  const t = text(v);
  if (has(t, ["anti-âge", "anti-age", "rides", "wrinkle", "ménopause", "40 ans", "50 ans", "mature", "fermeté"])) return "35+";
  if (v.platform === "tiktok" && has(t, ["pov", "grwm", "lycée", "school", "acné", "acne", "😭", "fyp"])) return "genz";
  if (has(t, ["grwm", "fyp", "pov", "acné", "acne"])) return "genz";
  return "25-34";
}

export type Lang = "fr" | "en" | "es" | "autre";
export function language(v: Video): Lang {
  const words = ` ${text(v).replace(/[^\p{L}\s]/gu, " ")} `;
  const count = (ws: string[]) => ws.reduce((n, w) => n + (words.split(` ${w} `).length - 1), 0);
  const s = { fr: count(["le", "la", "les", "et", "pour", "avec", "est", "une", "des", "mon", "ma"]), en: count(["the", "and", "for", "with", "is", "my", "this", "you", "your"]), es: count(["el", "los", "con", "para", "es", "mi", "una", "que", "por"]) };
  const best = (Object.entries(s) as [Lang, number][]).sort((a, b) => b[1] - a[1])[0]!;
  return best[1] >= 2 ? best[0] : "autre";
}

export interface Filters {
  period: "all" | "7" | "30" | "90" | "365";
  lang: Lang | "all";
  minViews: number;
  minEngagement: number;
  reach: ShadowReach | "all";
  type: ContentType | "all";
  tone: Tone | "all";
  age: AgeGroup | "all";
  creatorSize: "all" | "nano" | "micro" | "macro";
  duration: "all" | "short" | "medium" | "long";
}
export const defaultFilters: Filters = { period: "all", lang: "all", minViews: 0, minEngagement: 0, reach: "all", type: "all", tone: "all", age: "all", creatorSize: "all", duration: "all" };

export function matches(v: Video, f: Filters, now = Date.now()): boolean {
  if (f.period !== "all" && now - new Date(v.publishedAt).getTime() > Number(f.period) * DAY) return false;
  if (f.lang !== "all" && language(v) !== f.lang) return false;
  if (v.views < f.minViews || v.engagementRate < f.minEngagement) return false;
  if (f.reach !== "all" && shadowReach(v) !== f.reach) return false;
  if (f.type !== "all" && contentType(v) !== f.type) return false;
  if (f.tone !== "all" && tone(v) !== f.tone) return false;
  if (f.age !== "all" && ageGroup(v) !== f.age) return false;
  const fo = v.creator.followers;
  if (f.creatorSize === "nano" && fo >= 10_000) return false;
  if (f.creatorSize === "micro" && (fo < 10_000 || fo >= 100_000)) return false;
  if (f.creatorSize === "macro" && fo < 100_000) return false;
  const d = v.durationSeconds;
  if (f.duration === "short" && d > 15) return false;
  if (f.duration === "medium" && (d <= 15 || d > 45)) return false;
  if (f.duration === "long" && d <= 45) return false;
  return true;
}

export const activeCount = (f: Filters) => (Object.keys(f) as (keyof Filters)[]).filter((k) => f[k] !== defaultFilters[k]).length;
