import { createFileRoute, Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BarChart3, Columns3, Info, Loader2, Save } from "lucide-react";
import { BlurText, FadeContent } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { analyze, getCachedAnalysis, saveSearchForDemo } from "@/lib/api";
import { activeProduct, MAX_INSPIRATIONS, toggleInspiration, useStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/top-videos")({
  head: () => ({
    meta: [
      { title: "Top vidéos de marques et concurrents — Ads inspirées" },
      { name: "description", content: "Les vidéos TikTok, Instagram et YouTube de marques et concurrents qui performent, analysées pour votre produit." },
      { property: "og:title", content: "Top vidéos de marques et concurrents — Ads inspirées" },
      { property: "og:description", content: "Les vidéos de marques et concurrents qui marchent, et pourquoi." },
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
  const hydrated = useHydrated();
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [saving, setSaving] = useState(false);

  if (!hydrated) return <div className="mx-auto max-w-6xl px-6 py-12 md:px-10"><Skeleton className="h-12 w-2/3 rounded-full" /><SkeletonGrid /></div>;
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <BlurText text="Aucun produit sélectionné" className="text-4xl font-bold" />
        <p className="mt-3 text-muted-foreground">Choisissez un dossier ou lancez une recherche.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/produits">Trouver des inspirations</Link></Button>
      </div>
    );
  }
  const all = s.videos[product.id];
  const picked = s.inspirations[product.id] ?? [];
  const list = (all ?? []).filter((v) => filter === "all" || v.platform === filter);

  async function saveDemo() {
    if (!product || !all?.length) return;
    setSaving(true);
    // Analyse les vidéos pas encore analysées, puis garde tout en base.
    await Promise.allSettled(all.map((v) => analyze(v, product, s.demoMode)));
    try {
      const r = await saveSearchForDemo(product.description || product.name, all);
      toast.success("Enregistré pour la démo", { description: `${r.videos} vidéos et ${r.analyses} analyses gardées en base.` });
    } catch {
      toast.error("L'enregistrement a échoué.", { description: "Réessayez dans un instant." });
    }
    setSaving(false);
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
          <Info className="h-4 w-4 text-primary" /> Classé par vues, engagement et vues ÷ abonnés — pas par performance pub.
        </p>
        {all && all.length > 0 && (
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="outline" className="rounded-full border-dashed"><Link to="/insights"><BarChart3 /> Insights</Link></Button>
            <Button asChild size="sm" variant="outline" className="rounded-full border-dashed" disabled={picked.length < 2}>
              <Link to="/comparer" disabled={picked.length < 2}><Columns3 /> Comparer</Link>
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-dashed" disabled={saving} onClick={saveDemo}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Démo
            </Button>
            <p className="text-sm text-muted-foreground">Inspirations <span className="font-mono text-foreground">{picked.length}/{MAX_INSPIRATIONS}</span></p>
            <Button asChild size="sm" className="rounded-full" disabled={picked.length === 0}>
              <Link to="/generation" disabled={picked.length === 0}>Générer <ArrowRight /></Link>
            </Button>
          </div>
        )}
      </div>

      {!all ? <SkeletonGrid /> : list.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-dashed p-10 text-center">
          <p className="text-lg font-medium">Aucune vidéo trouvée</p>
          <p className="mt-1 text-sm text-muted-foreground">{filter === "all" ? "Reformulez la description." : `Rien sur ${platformLabel[filter]}.`}</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={150}>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((v, i) => {
              const checked = picked.includes(v.id);
              return (
                <FadeContent key={v.id} delay={i * 0.06}>
                  <VideoCard v={v} format={getCachedAnalysis(v.id)?.format} onClick={() => navigate({ to: "/analyse/$videoId", params: { videoId: v.id } })}
                    inspiration={{ checked, disabled: !checked && picked.length >= MAX_INSPIRATIONS, onToggle: () => { if (!toggleInspiration(product.id, v.id)) toast.error(`${MAX_INSPIRATIONS} inspirations maximum`); } }} />
                </FadeContent>
              );
            })}
          </div>
        </TooltipProvider>
      )}
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
