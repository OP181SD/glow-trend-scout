import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, RefreshCw } from "lucide-react";
import { BlurText, FadeContent, ShinyText } from "@/components/reactbits";
import { Button } from "@/components/ui/button";
import { Message, MessageAction, MessageActions, MessageContent } from "@/components/ui/message";
import { generate } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShootingScriptView } from "@/components/ShootingScriptView";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/prompt/$id")({
  head: () => ({
    meta: [
      { title: "Prompt final — TrendMe" },
      { name: "description", content: "Votre prompt vidéo IA structuré : scènes, plans, durée, voix off, texte à l'écran, musique et CTA." },
      { property: "og:title", content: "Prompt final — TrendMe" },
      { property: "og:description", content: "Un prompt vidéo prêt à copier." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PromptPage,
});

function PromptPage() {
  const { id } = Route.useParams();
  const s = useStore();
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);
  const [regen, setRegen] = useState(false);

  if (!hydrated) return null;
  const g = s.generations.find((x) => x.id === id);
  const product = g && s.products.find((p) => p.id === g.productId);
  if (!g || !product) return <div className="p-12 text-center text-muted-foreground">Prompt introuvable. <Link to="/generations" className="text-primary">Voir les générations</Link></div>;
  const r = g.result;

  async function copy() {
    await navigator.clipboard.writeText(r.prompt);
    setCopied(true); toast.success("Prompt copié");
    setTimeout(() => setCopied(false), 2000);
  }
  async function regenerate() {
    if (!g || !product) return;
    setRegen(true);
    let result;
    try {
      result = await generate(product, g.videos, r.targetTool, s.demoMode);
    } catch {
      setRegen(false);
      toast.error("La régénération a échoué.", { description: "Réessayez dans un instant." });
      return;
    }
    setState((st) => ({ ...st, generations: st.generations.map((x) => (x.id === g.id ? { ...x, result, createdAt: new Date().toISOString() } : x)) }));
    setRegen(false);
    toast.success("Nouvelle version générée");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <Button asChild variant="ghost" className="-ml-3 mb-4 rounded-full"><Link to="/generation"><ArrowLeft /> Génération</Link></Button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BlurText text={g.mode === "humain" ? "Votre script de tournage" : `Votre prompt pour ${r.targetTool}`} className="text-5xl font-bold tracking-tight" />
        <p className="font-mono text-sm text-muted-foreground">{r.scenes.length} scènes · {r.totalSeconds} s</p>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-1.5" aria-label="Chronologie des scènes">
        {r.scenes.map((sc) => (
          <div key={sc.title} className="rounded-2xl border border-dashed p-3" style={{ gridColumn: "span 1" }}>
            <p className="font-mono text-xs text-primary">{sc.start}–{sc.end} s</p>
            <p className="mt-1 truncate text-sm">{sc.title}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue={g.mode === "humain" ? "script" : "prompt"} className="mt-6">
        <TabsList className="rounded-full">
          <TabsTrigger value="prompt" className="rounded-full">Prompt IA</TabsTrigger>
          <TabsTrigger value="script" className="rounded-full">Script de tournage</TabsTrigger>
        </TabsList>
        <TabsContent value="script" className="mt-4">
          {regen ? <div className="py-16 text-center"><ShinyText text="Nouvelle version en cours…" className="text-lg" /></div> : <ShootingScriptView script={r.shootingScript} title={product.name} onRegenerate={regenerate} />}
        </TabsContent>
        <TabsContent value="prompt">
      <Message className="mt-2 block">
        <div className="rounded-[2rem] border border-dashed bg-card p-6">
          {regen ? (
            <div className="py-16 text-center"><ShinyText text="Nouvelle version en cours…" className="text-lg" /></div>
          ) : (
            <MessageContent markdown className="max-w-none bg-transparent p-0 text-[15px] leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:font-bold [&_h3]:text-primary [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2 [&_strong]:text-foreground">
              {r.prompt}
            </MessageContent>
          )}
          <MessageActions className="mt-6 border-t border-dashed pt-5">
            <MessageAction tooltip="Copier le prompt">
              <Button onClick={copy} className="rounded-full">{copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier"}</Button>
            </MessageAction>
            <MessageAction tooltip="Générer une autre version">
              <Button variant="secondary" onClick={regenerate} disabled={regen} className="rounded-full"><RefreshCw className={regen ? "animate-spin" : ""} /> Régénérer</Button>
            </MessageAction>
          </MessageActions>
        </div>
      </Message>
        </TabsContent>
      </Tabs>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FadeContent className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Ce qui est repris</p>
          <p className="mt-1 text-sm text-muted-foreground">La structure des vidéos d'inspiration</p>
          <List items={r.kept} />
        </FadeContent>
        <FadeContent delay={0.08} className="rounded-[1.75rem] border border-solid border-primary/50 bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-primary">Ce qui est original</p>
          <p className="mt-1 text-sm text-muted-foreground">Ce qui vient de votre marque</p>
          <List items={r.original} />
        </FadeContent>
      </div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return <ul className="mt-4 space-y-2 border-t border-dashed pt-4">{items.map((it) => <li key={it} className="flex gap-2"><span className="text-primary">✦</span>{it}</li>)}</ul>;
}
