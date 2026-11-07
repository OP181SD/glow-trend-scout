import { MOCK_ANALYSES, MOCK_VIDEOS } from "./mock-data";
import type { Analysis, GeneratedPrompt, Product, PromptScene, TargetTool, Video } from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clean = (t: string) => t.replace(/[«»"]/g, "").trim();

// Pour l'instant : données fictives. À remplacer par les vraies sources plus tard.
export async function search(_product: Product): Promise<Video[]> {
  await wait(900);
  return [...MOCK_VIDEOS].sort((a, b) => b.score - a.score);
}

export async function analyze(video: Video): Promise<Analysis> {
  await wait(700);
  const a = MOCK_ANALYSES[video.id];
  if (!a) throw new Error("Analyse introuvable");
  return a;
}

export function getVideo(id: string): Video | undefined {
  return MOCK_VIDEOS.find((v) => v.id === id);
}
export function getAnalysis(id: string): Analysis | undefined {
  return MOCK_ANALYSES[id];
}

const MUSIC = ["Lo-fi douce et lumineuse, 90 BPM, montée légère à la révélation", "Piano minimaliste puis beat acoustique discret", "Pop acoustique chaleureuse, claps légers sur les coupes"];

export function buildPrompt(product: Product, inspirations: { video: Video; analysis: Analysis }[], tool: TargetTool, variant = 0): GeneratedPrompt {
  const main = inspirations[0]!;
  const a = main.analysis;
  const total = product.style.durationSeconds;
  const ratio = product.style.platform === "youtube" ? "16:9" : "9:16";
  const hookEnd = Math.min(a.hook.seconds + 1, 4);
  const mid = Math.round(hookEnd + (total - hookEnd) * 0.55);
  const ctaStart = total - Math.max(3, Math.round(total * 0.15));
  const extra = inspirations.slice(1).map((i) => i.analysis.why_it_works[0]).join(" ; ");
  const cta = clean(a.cta);

  const scenes: PromptScene[] = [
    { title: "Hook", start: 0, end: hookEnd, shot: variant % 2 ? "Plan serré caméra à la main" : "Très gros plan frontal, caméra portée", visual: `${a.hook.description}, transposé à ${product.name}`, voiceOver: a.hook.type === "question" ? `Vous aussi, vous vous demandez si ça marche vraiment ?` : `Personne ne m'avait prévenue de ça.`, onScreenText: clean(main.video.onScreenText[0] ?? product.name) },
    { title: "Problème & contexte", start: hookEnd, end: mid, shot: "Plan moyen face caméra, lumière naturelle", visual: `${a.storytelling[0]}. Personne représentative de : ${product.brand.target}`, voiceOver: `${product.description.split(",")[0]}.`, onScreenText: "Le vrai problème" },
    { title: "Démonstration produit", start: mid, end: ctaStart, shot: "Gros plan texture puis plan d'application, coupes rythmées", visual: `${a.storytelling[1]} avec ${product.name} bien visible.${extra ? ` Reprendre aussi : ${extra}.` : ""} ${a.storytelling[2]}`, voiceOver: `Avec ${product.name}, ${product.brand.name || "la marque"} a pensé chaque détail.`, onScreenText: product.brand.colors.length ? `Couleurs : ${product.brand.colors.join(", ")}` : "Le résultat" },
    { title: "CTA", start: ctaStart, end: total, shot: "Packshot fixe, produit au centre", visual: `Packshot de ${product.name} (${product.brand.name}), fond aux couleurs de la marque`, voiceOver: cta, onScreenText: cta },
  ];
  const music = MUSIC[variant % MUSIC.length]!;

  const prompt = [
    `## ${tool} · Vidéo ${ratio} · ${total} s · format ${product.style.format}`,
    `**Style visuel :** ${a.visual_style}. Ton ${product.brand.tone || "naturel"}, pour ${product.brand.target || "la cible"}.`,
    ...scenes.map((s, i) => `### Scène ${i + 1} — ${s.title} (${s.start}–${s.end} s)\n- **Plan :** ${s.shot}\n- **Visuel :** ${s.visual}\n- **Voix off :** « ${s.voiceOver} »\n- **Texte à l'écran :** ${s.onScreenText}`),
    `### Musique\n${music}`,
    `### CTA\n« ${cta} » — ${product.name}`,
    `_Rendu réaliste, peau naturelle non retouchée, pas de texte illisible incrusté._`,
  ].join("\n\n");

  return {
    prompt, scenes, totalSeconds: total, music, cta, targetTool: tool,
    kept: [`Hook ${a.hook.type} en ${a.hook.seconds} s`, "Rythme en 3 temps : problème, démonstration, révélation", `Format ${a.format}`, ...inspirations.slice(1).map((i) => `Idée de @${i.video.creator.handle}`)],
    original: [`Produit : ${product.name}`, `Marque : ${product.brand.name || "—"}`, `Ton ${product.brand.tone || "—"}`, `Cible : ${product.brand.target || "—"}`, `Couleurs : ${product.brand.colors.join(", ") || "—"}`, `Durée ${total} s sur ${product.style.platform}`],
  };
}

export async function generate(product: Product, inspirations: { video: Video; analysis: Analysis }[], tool: TargetTool, variant = 0): Promise<GeneratedPrompt> {
  await wait(1600);
  if (inspirations.length === 0) throw new Error("Choisissez au moins une inspiration");
  return buildPrompt(product, inspirations, tool, variant);
}
