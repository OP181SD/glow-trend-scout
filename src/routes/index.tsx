import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { analyze, generate, search } from "@/lib/api";
import type { Analysis, GeneratedPrompt, Platform, Product, TargetTool, Video } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ads inspirées — vos pubs vidéo inspirées des meilleures" },
      { name: "description", content: "Décrivez votre produit, découvrez les vidéos TikTok et Instagram concurrentes qui marchent, comprenez pourquoi et générez votre prompt vidéo IA." },
      { property: "og:title", content: "Ads inspirées" },
      { property: "og:description", content: "Des vidéos concurrentes qui performent à votre prompt vidéo IA, en 4 étapes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Step = 0 | 1 | 2 | 3;
const STEPS = ["Produit", "Top vidéos", "Analyse", "Prompt"];

const DEFAULT_PRODUCT: Product = {
  id: "p1",
  name: "Sérum-Crème Renaissance",
  description: "Crème anti-âge au rétinol encapsulé et peptides, texture fondante, pour lisser les rides en 4 semaines.",
  imageUrl: "",
  brand: { name: "Maison Aube", tone: "chaleureux et expert", colors: ["terracotta", "crème", "or doux"], target: "femmes de 40 à 60 ans" },
  style: { format: "UGC", durationSeconds: 30, platform: "tiktok" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const platformLabel: Record<Platform, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };

function Index() {
  const [step, setStep] = useState<Step>(0);
  const [product, setProduct] = useState<Product>(DEFAULT_PRODUCT);
  const [videos, setVideos] = useState<Video[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [tool, setTool] = useState<TargetTool>("Veo");
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    setLoading(true);
    setVideos(await search(product));
    setLoading(false);
    setStep(1);
  }
  async function pick(v: Video) {
    setVideo(v);
    setLoading(true);
    setAnalysis(await analyze(v));
    setLoading(false);
    setStep(2);
  }
  async function runGenerate(t = tool) {
    if (!video || !analysis) return;
    setLoading(true);
    setResult(await generate(product, video, analysis, t));
    setLoading(false);
    setStep(3);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <button onClick={() => setStep(0)} className="font-display text-3xl italic text-foreground">Ads inspirées</button>
        <ol className="hidden gap-2 md:flex">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${i === step ? "bg-ink text-ink-foreground" : i < step ? "text-foreground" : "text-muted-foreground"}`}>
              <span className="text-xs">{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            {step === 0 && <ProductStep product={product} setProduct={setProduct} onNext={runSearch} loading={loading} />}
            {step === 1 && <VideosStep videos={videos} onPick={pick} loadingId={loading ? video?.id : undefined} onBack={() => setStep(0)} />}
            {step === 2 && video && analysis && <AnalysisStep video={video} analysis={analysis} tool={tool} setTool={setTool} onGenerate={() => runGenerate()} loading={loading} onBack={() => setStep(1)} />}
            {step === 3 && result && <PromptStep result={result} onBack={() => setStep(2)} onRestart={() => setStep(0)} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function ProductStep({ product, setProduct, onNext, loading }: { product: Product; setProduct: (p: Product) => void; onNext: () => void; loading: boolean }) {
  const set = (patch: Partial<Product>) => setProduct({ ...product, ...patch });
  const setBrand = (patch: Partial<Product["brand"]>) => set({ brand: { ...product.brand, ...patch } });
  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div className="pt-8">
        <h1 className="font-display text-6xl leading-[0.95] text-foreground md:text-7xl">
          Les pubs qui marchent,<br /><em className="text-primary">réinventées pour vous.</em>
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          Décrivez votre produit. On trouve les vidéos concurrentes qui performent, on explique pourquoi, et on écrit votre prompt vidéo IA.
        </p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-4 rounded-3xl border bg-card p-6 shadow-elegant">
        <Field label="Nom du produit"><Input value={product.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
        <Field label="Description"><Textarea rows={3} value={product.description} onChange={(e) => set({ description: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Marque"><Input value={product.brand.name} onChange={(e) => setBrand({ name: e.target.value })} /></Field>
          <Field label="Ton"><Input value={product.brand.tone} onChange={(e) => setBrand({ tone: e.target.value })} /></Field>
        </div>
        <Field label="Cible"><Input value={product.brand.target} onChange={(e) => setBrand({ target: e.target.value })} /></Field>
        <Field label="Couleurs (séparées par des virgules)"><Input value={product.brand.colors.join(", ")} onChange={(e) => setBrand({ colors: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Plateforme">
            <div className="flex gap-1">
              {(["tiktok", "instagram", "youtube"] as Platform[]).map((p) => (
                <Button key={p} type="button" size="sm" variant={product.style.platform === p ? "default" : "outline"} onClick={() => set({ style: { ...product.style, platform: p } })}>{platformLabel[p]}</Button>
              ))}
            </div>
          </Field>
          <Field label="Durée (secondes)"><Input type="number" min={5} max={120} value={product.style.durationSeconds} onChange={(e) => set({ style: { ...product.style, durationSeconds: Number(e.target.value) } })} /></Field>
        </div>
        <Button type="submit" size="lg" className="w-full bg-gradient-primary" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Trouver les vidéos qui marchent
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}

function Thumb({ v, className = "" }: { v: Video; className?: string }) {
  return (
    <div className={`relative flex aspect-[9/14] items-end overflow-hidden rounded-2xl bg-gradient-primary p-4 ${className}`}>
      <p className="font-display text-2xl leading-tight text-primary-foreground">« {v.onScreenText[0]} »</p>
      <Badge className="absolute left-3 top-3 bg-ink text-ink-foreground">{platformLabel[v.platform]}</Badge>
      <span className="absolute right-3 top-3 rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-foreground">{v.durationSeconds}s</span>
    </div>
  );
}

function VideosStep({ videos, onPick, loadingId, onBack }: { videos: Video[]; onPick: (v: Video) => void; loadingId?: string; onBack: () => void }) {
  const [filter, setFilter] = useState<Platform | "all">("all");
  const list = videos.filter((v) => filter === "all" || v.platform === filter);
  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-3"><ArrowLeft /> Modifier le produit</Button>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-5xl text-foreground">Top vidéos concurrentes</h2>
        <div className="flex gap-1">
          {(["all", "tiktok", "instagram", "youtube"] as const).map((p) => (
            <Button key={p} size="sm" variant={filter === p ? "default" : "outline"} onClick={() => setFilter(p)}>{p === "all" ? "Toutes" : platformLabel[p]}</Button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((v, i) => (
          <motion.button key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}
            onClick={() => onPick(v)} disabled={!!loadingId} className="group text-left">
            <Thumb v={v} />
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">@{v.creator.handle}</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">{v.score}/100</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{fmt(v.views)} vues · {v.engagementRate.toString().replace(".", ",")} % d'engagement</p>
            <p className="mt-1 line-clamp-2 text-sm text-foreground">{v.scoreReason}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
              {loadingId === v.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse…</> : <>Analyser <ArrowRight className="h-4 w-4" /></>}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function AnalysisStep({ video, analysis, tool, setTool, onGenerate, loading, onBack }: { video: Video; analysis: Analysis; tool: TargetTool; setTool: (t: TargetTool) => void; onGenerate: () => void; loading: boolean; onBack: () => void }) {
  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-3"><ArrowLeft /> Retour aux vidéos</Button>
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <Thumb v={video} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[["Vues", fmt(video.views)], ["Likes", fmt(video.likes)], ["Commentaires", fmt(video.comments)], ["Partages", fmt(video.shares)]].map(([k, val]) => (
              <div key={k} className="rounded-xl bg-muted p-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-lg font-semibold text-foreground">{val}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm italic text-muted-foreground">« {video.transcript} »</p>
        </div>
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-3">{analysis.format}</Badge>
            <h2 className="font-display text-5xl leading-tight text-foreground">{analysis.concept}</h2>
            <p className="mt-2 text-lg text-muted-foreground">{analysis.message}</p>
          </div>
          <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
            <p className="text-xs uppercase tracking-wide opacity-70">Hook · {analysis.hook.type} · {analysis.hook.seconds} premières secondes</p>
            <p className="mt-1 font-display text-2xl">{analysis.hook.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Storytelling" items={analysis.storytelling} numbered />
            <Block title="Pourquoi ça marche" items={analysis.why_it_works} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Style visuel</p><p className="mt-1 text-foreground">{analysis.visual_style}</p><p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Appel à l'action</p><p className="mt-1 text-foreground">{analysis.cta}</p></div>
            <div className="rounded-2xl border p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Compatibilité avec votre marque</p>
              <p className="mt-1 font-display text-5xl text-primary">{analysis.brandMatch.score}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><motion.div className="h-full bg-gradient-primary" initial={{ width: 0 }} animate={{ width: `${analysis.brandMatch.score}%` }} transition={{ duration: 0.8 }} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{analysis.brandMatch.reason}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary p-5">
            <span className="text-sm font-medium text-secondary-foreground">Outil vidéo IA :</span>
            {(["Veo", "Sora", "Kling", "Runway"] as TargetTool[]).map((t) => (
              <Button key={t} size="sm" variant={tool === t ? "default" : "outline"} onClick={() => setTool(t)}>{t}</Button>
            ))}
            <Button size="lg" className="ml-auto bg-gradient-primary" onClick={onGenerate} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Générer ma pub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ title, items, numbered }: { title: string; items: string[]; numbered?: boolean }) {
  return (
    <div className="rounded-2xl border p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-foreground"><span className="font-display text-xl text-primary">{numbered ? i + 1 : "✦"}</span><span>{it}</span></li>
        ))}
      </ul>
    </div>
  );
}

function PromptStep({ result, onBack, onRestart }: { result: GeneratedPrompt; onBack: () => void; onRestart: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    toast.success("Prompt copié");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-3"><ArrowLeft /> Retour à l'analyse</Button>
      <h2 className="font-display text-5xl text-foreground">Votre prompt pour <em className="text-primary">{result.targetTool}</em></h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="relative rounded-3xl bg-ink p-6 text-ink-foreground shadow-elegant">
          <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{result.prompt}</pre>
          <Button onClick={copy} className="mt-6 bg-gradient-primary">{copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier le prompt"}</Button>
        </div>
        <div className="space-y-4">
          <Block title="Repris de la vidéo" items={result.kept} />
          <Block title="Propre à votre marque" items={result.original} />
          <Button variant="outline" className="w-full" onClick={onRestart}>Nouveau produit</Button>
        </div>
      </div>
    </div>
  );
}
