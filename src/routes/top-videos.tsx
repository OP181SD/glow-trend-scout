import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { BlurText, CountUp, FadeContent, ShinyText } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { analyze, generate } from "@/lib/api";
import { activeProduct, MAX_INSPIRATIONS, setState, toggleInspiration, useStore } from "@/lib/store";
import { MOCK_ANALYSES } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHydrated } from "@tanstack/react-router";
import { toast } from "sonner";
import { Info } from "lucide-react";
import type { Analysis, Platform, TargetTool, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/top-videos")({
  head: () => ({
    meta: [
      { title: "Top vidéos de marques et concurrents — Ads inspirées" },
      { name: "description", content: "Les vidéos TikTok, Instagram et YouTube concurrentes qui performent, analysées pour votre produit." },
      { property: "og:title", content: "Top vidéos de marques et concurrents — Ads inspirées" },
      { property: "og:description", content: "Les vidéos concurrentes qui marchent, et pourquoi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TopVideos,
});

function TopVideos() {
  const s = useStore();
  const product = activeProduct(s);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [video, setVideo] = useState<Video | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tool, setTool] = useState<TargetTool>("Veo");
  const [generating, setGenerating] = useState(false);
  const hydrated = useHydrated();

  if (!hydrated) return <div className="mx-auto max-w-6xl px-6 py-12 md:px-10"><Skeleton className="h-12 w-2/3 rounded-full" /><SkeletonGrid /></div>;

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <BlurText text="Aucun produit sélectionné" className="text-4xl font-bold" />
        <p className="mt-3 text-muted-foreground">Choisissez un dossier dans la barre latérale ou créez un produit.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/produits">Créer un produit</Link></Button>
      </div>
    );
  }
  const all = s.videos[product.id];
  const picked = s.inspirations[product.id] ?? [];
  const list = (all ?? []).filter((v) => filter === "all" || v.platform === filter);

  async function pick(v: Video) {
    setLoadingId(v.id);
    const a = await analyze(v);
    setState((st) => ({ ...st, analyses: st.analyses + 1 }));
    setVideo(v); setAnalysis(a); setLoadingId(null);
  }
  async function runGenerate() {
    if (!video || !analysis || !product) return;
    setGenerating(true);
    const result = await generate(product, video, analysis, tool);
    setState((st) => ({ ...st, generations: [{ id: crypto.randomUUID(), productId: product.id, video, result, createdAt: new Date().toISOString() }, ...st.generations] }));
    setGenerating(false);
    navigate({ to: "/generations" });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
      <p className="text-sm text-muted-foreground">Dossier · {product.name}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-dashed pb-6">
        <BlurText text="Top vidéos de marques et concurrents" className="text-5xl font-bold tracking-tight" />
        <div className="flex gap-1.5">
          {(["all", "tiktok", "instagram", "youtube"] as const).map((p) => (
            <button key={p} onClick={() => setFilter(p)} className={cn("inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm", filter === p ? "border-solid border-primary bg-primary/15" : "text-muted-foreground")}>
              {p !== "all" && <PlatformIcon platform={p} className="h-3.5 w-3.5" />}{p === "all" ? "Toutes" : platformLabel[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-primary" /> Classement basé sur les vues et l'engagement public, pas sur les performances publicitaires.
        </p>
        {all && all.length > 0 && <p className="text-sm text-muted-foreground">Inspirations <span className="font-mono text-foreground">{picked.length}/{MAX_INSPIRATIONS}</span></p>}
      </div>

      {video && analysis && (
        <FadeContent key={video.id} className="mt-8 rounded-[2rem] border border-dashed bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"><PlatformIcon platform={video.platform} className="h-3.5 w-3.5" /> @{video.creator.handle} · {analysis.format}</span>
              <h2 className="mt-3 text-3xl font-bold">{analysis.concept}</h2>
              <p className="mt-1 text-muted-foreground">{analysis.message}</p>
            </div>
            <button onClick={() => { setVideo(null); setAnalysis(null); }} aria-label="Fermer"><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-y border-dashed py-5 md:grid-cols-5">
            {[["Vues", video.views], ["Likes", video.likes], ["Commentaires", video.comments], ["Partages", video.shares]].map(([k, val]) => (
              <div key={k as string}><p className="text-xs text-muted-foreground">{k}</p><CountUp to={val as number} className="text-2xl" /></div>
            ))}
            <div><p className="text-xs text-muted-foreground">Compatibilité</p><CountUp to={analysis.brandMatch.score} suffix="%" className="text-2xl text-primary" /></div>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Hook · <span className="font-mono">{analysis.hook.seconds}s</span></p><p className="mt-1">{analysis.hook.description}</p></div>
            <List title="Storytelling" items={analysis.storytelling} />
            <List title="Pourquoi ça marche" items={analysis.why_it_works} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-dashed pt-5">
            <span className="mr-1 text-sm text-muted-foreground">Outil vidéo IA</span>
            {(["Veo", "Sora", "Kling", "Runway"] as TargetTool[]).map((t) => (
              <button key={t} onClick={() => setTool(t)} className={cn("rounded-full border border-dashed px-3 py-1.5 text-sm", tool === t ? "border-solid border-primary bg-primary/15" : "text-muted-foreground")}>{t}</button>
            ))}
            <Button onClick={runGenerate} disabled={generating} className="ml-auto rounded-full" size="lg">
              {generating ? <ShinyText text="Génération du prompt…" /> : <><Sparkles /> Générer ma pub</>}
            </Button>
          </div>
        </FadeContent>
      )}

      {!all ? <SkeletonGrid /> : list.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-dashed p-10 text-center">
          <p className="text-lg font-medium">Aucune vidéo trouvée</p>
          <p className="mt-1 text-sm text-muted-foreground">{filter === "all" ? "Essayez de reformuler la description du produit." : `Aucun résultat sur ${platformLabel[filter]}. Essayez une autre plateforme.`}</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={150}>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((v, i) => {
              const checked = picked.includes(v.id);
              return (
                <FadeContent key={v.id} delay={i * 0.06} className="relative">
                  <VideoCard v={v} format={MOCK_ANALYSES[v.id]?.format} selected={video?.id === v.id} onClick={() => !loadingId && pick(v)}
                    inspiration={{ checked, disabled: !checked && picked.length >= MAX_INSPIRATIONS, onToggle: () => { if (!toggleInspiration(product.id, v.id)) toast.error(`${MAX_INSPIRATIONS} inspirations maximum`); } }} />
                  {loadingId === v.id && <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.75rem] bg-ink/70"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                </FadeContent>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <ol className="mt-1 space-y-1.5">{items.map((it, i) => <li key={i} className="flex gap-2"><span className="font-mono text-primary">{i + 1}</span>{it}</li>)}</ol>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-label="Chargement des vidéos">
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[9/16] rounded-[1.75rem]" />)}
    </div>
  );
}
