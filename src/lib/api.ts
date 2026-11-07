import { MOCK_ANALYSES, MOCK_VIDEOS } from "./mock-data";
import type { Analysis, GeneratedPrompt, Product, TargetTool, Video } from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

export async function generate(product: Product, video: Video, analysis: Analysis, tool: TargetTool): Promise<GeneratedPrompt> {
  await wait(1000);
  const ratio = product.style.platform === "youtube" ? "16:9" : "9:16";
  const prompt = [
    `[${tool}] Vidéo publicitaire verticale ${ratio}, ${product.style.durationSeconds} secondes, format ${analysis.format}.`,
    `Hook (0-${analysis.hook.seconds}s) : ${analysis.hook.description}, adapté à ${product.name}.`,
    `Acte 1 : ${analysis.storytelling[0]}. Acte 2 : ${analysis.storytelling[1]}, avec ${product.name} bien visible. Acte 3 : ${analysis.storytelling[2]}.`,
    `Produit : ${product.description}`,
    `Style visuel : ${analysis.visual_style}. Palette de marque : ${product.brand.colors.join(", ")}.`,
    `Ton ${product.brand.tone}, pour ${product.brand.target}.`,
    `Fin : packshot de ${product.name} (${product.brand.name}) et appel à l'action « ${analysis.cta.replace(/[«»"]/g, "").trim()} ».`,
    `Rendu réaliste, peau naturelle non retouchée, mouvements de caméra à la main, sans texte incrusté illisible.`,
  ].join("\n");
  return {
    prompt,
    targetTool: tool,
    kept: [`Format ${analysis.format}`, `Hook ${analysis.hook.type} en ${analysis.hook.seconds}s`, "Structure en 3 actes", analysis.visual_style],
    original: [`Produit ${product.name}`, `Ton ${product.brand.tone}`, `Cible : ${product.brand.target}`, `Couleurs ${product.brand.colors.join(", ")}`],
  };
}
