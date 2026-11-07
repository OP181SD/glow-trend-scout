import { createFileRoute, Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { BlurText, FadeContent, ShinyText } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generate, getVideo } from "@/lib/api";
import { activeProduct, setState, toggleInspiration, useStore } from "@/lib/store";
import type { TargetTool, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/generation")({
  head: () => ({
    meta: [
      { title: "Génération — Ads inspirées" },
      { name: "description", content: "Récapitulez produit, marque et inspirations, choisissez Veo, Sora, Kling ou Runway et générez votre prompt." },
      { property: "og:title", content: "Génération — Ads inspirées" },
      { property: "og:description", content: "Générez votre prompt vidéo IA à partir de vos inspirations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GenerationPage,
});

export const TOOLS: TargetTool[] = ["Veo", "Sora", "Kling", "Runway"];

function GenerationPage() {
  const s = useStore();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const product = activeProduct(s);
  const [tool, setTool] = useState<TargetTool>("Veo");
  const [mode, setMode] = useState<"ia" | "humain">("humain");
  const [loading, setLoading] = useState(false);

  if (!hydrated) return null;
  if (!product) {
    return <div className="p-12 text-center text-muted-foreground">Aucun produit sélectionné. <Link to="/produits" className="text-primary">Créer un produit</Link></div>;
  }
  const videos = (s.inspirations[product.id] ?? []).map((id) => getVideo(id, s.videos[product.id] ?? [])).filter((v): v is Video => !!v);

  async function run() {
    if (!product) return;
    setLoading(true);
    let result;
    try {
      result = await generate(product, videos, tool, s.demoMode);
    } catch {
      setLoading(false);
      toast.error("La génération a échoué.", { description: "Réessayez dans un instant." });
      return;
    }
    const id = crypto.randomUUID();
    setState((st) => ({ ...st, generations: [{ id, productId: product.id, videos, result, mode, createdAt: new Date().toISOString() }, ...st.generations] }));
    setLoading(false);
    navigate({ to: "/prompt/$id", params: { id } });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <BlurText text="Génération" className="text-5xl font-bold tracking-tight" />
      <p className="mt-3 text-muted-foreground">Vérifiez le récapitulatif, choisissez l'outil vidéo, puis générez.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <FadeContent className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Produit</p>
          <div className="mt-3 flex gap-4">
            {product.imageUrl && <img src={product.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />}
            <div><p className="text-lg font-bold">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{product.description}</p></div>
          </div>
          <p className="mt-4 border-t border-dashed pt-4 text-sm">{product.style.format} · <span className="font-mono">{product.style.durationSeconds} s</span> · {platformLabel[product.style.platform]}</p>
        </FadeContent>
        <FadeContent delay={0.08} className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Marque</p>
          <p className="mt-3 text-lg font-bold">{product.brand.name || "—"}</p>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-muted-foreground">Ton</dt><dd>{product.brand.tone || "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Cible</dt><dd>{product.brand.target || "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Couleurs</dt><dd>{product.brand.colors.join(", ") || "—"}</dd></div>
          </dl>
        </FadeContent>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between border-b border-dashed pb-3">
          <h2 className="text-2xl font-bold">Inspirations</h2>
          <span className="font-mono text-sm text-muted-foreground">{videos.length}/3</span>
        </div>
        {videos.length === 0 ? (
          <p className="mt-5 text-muted-foreground">Aucune inspiration choisie. <Link to="/top-videos" className="text-primary">Cochez 1 à 3 vidéos</Link> dans les Top vidéos.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {videos.map((v, i) => (
              <FadeContent key={v.id} delay={i * 0.06} className="relative flex aspect-[9/16] max-h-80 flex-col justify-end overflow-hidden rounded-[1.75rem] border border-dashed bg-gradient-to-b from-accent/60 via-card to-ink p-4">
                <button onClick={() => toggleInspiration(product.id, v.id)} aria-label="Retirer" className="absolute right-3 top-3 rounded-full bg-ink/80 p-1.5"><X className="h-3.5 w-3.5" /></button>
                <p className="font-bold">« {v.onScreenText[0]?.replace(/[«»"]/g, "")} »</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><PlatformIcon platform={v.platform} className="h-3.5 w-3.5" /> @{v.creator.handle}</p>
              </FadeContent>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Qui tourne la vidéo">
        {([["humain", "Je la tourne moi-même", "Script de tournage au téléphone, prêt à filmer"], ["ia", "Générée par IA", "Prompt pour Veo, Sora, Kling ou Runway"]] as const).map(([m, label, desc]) => (
          <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("rounded-[1.5rem] border border-dashed bg-card p-5 text-left", mode === m && "border-solid border-primary bg-primary/10")}>
            <p className="font-bold">{label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1.75rem] border border-dashed bg-card p-5">
        {mode === "ia" && <span className="mr-2 text-sm text-muted-foreground">Format du prompt</span>}
        {mode === "ia" && TOOLS.map((t) => (
          <button key={t} onClick={() => setTool(t)} className={cn("rounded-full border border-dashed px-4 py-2 text-sm", tool === t ? "border-solid border-primary bg-primary/15" : "text-muted-foreground")}>{t}</button>
        ))}
        <Button size="lg" className="ml-auto min-w-52 rounded-full" onClick={run} disabled={loading || videos.length === 0}>
          {loading ? <ShinyText text="Écriture de votre pub…" /> : <><Sparkles /> {mode === "humain" ? "Générer mon script" : "Générer ma pub"}</>}
        </Button>
      </div>
    </div>
  );
}
