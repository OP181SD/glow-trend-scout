import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Check, ExternalLink, Plus } from "lucide-react";
import { BlurText, CountUp, FadeContent, ShinyText } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { analyze, getVideo } from "@/lib/api";
import { activeProduct, MAX_INSPIRATIONS, toggleInspiration, useStore } from "@/lib/store";
import type { Analysis, Video } from "@/lib/types";

export const Route = createFileRoute("/analyse/$videoId")({
  head: () => ({
    meta: [
      { title: "Analyse de la vidéo — TrendMe" },
      { name: "description", content: "Pourquoi cette vidéo marche : hook, déroulé, style et correspondance avec votre marque." },
      { property: "og:title", content: "Analyse de la vidéo — TrendMe" },
      { property: "og:description", content: "Analyse détaillée d'une vidéo de marque ou concurrente." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalysePage,
});

// Renvoie une URL d'intégration seulement pour les vraies vidéos (identifiants plausibles).
function embedUrl(v: Video): string | null {
  const tt = v.url.match(/tiktok\.com\/@[^/]+\/video\/(\d{15,})/);
  if (tt) return `https://www.tiktok.com/player/v1/${tt[1]}?music_info=0&description=0&rel=0`;
  const ig = v.url.match(/instagram\.com\/(?:reel|p)\/([\w-]{8,})/);
  if (ig) return `https://www.instagram.com/reel/${ig[1]}/embed`;
  const yt = v.url.match(/(?:shorts\/|v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

function AnalysePage() {
  const { videoId } = Route.useParams();
  const s = useStore();
  const hydrated = useHydrated();
  const product = activeProduct(s);
  const [ai, setAi] = useState<{ id: string; a?: Analysis; error?: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const v = hydrated ? getVideo(videoId, Object.values(s.videos).flat()) : undefined;
  useEffect(() => {
    if (!v || !product) return;
    let alive = true;
    analyze(v, product, s.demoMode)
      .then((a) => { if (alive) setAi({ id: v.id, a }); })
      .catch(() => { if (alive) setAi({ id: v.id, error: true }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.id, product?.id, attempt]);
  if (!hydrated) return null;
  const a = v && ai?.id === v.id ? ai.a : undefined;
  if (v && product && !a) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-12 text-center">
        {ai?.id === v.id && ai.error ? (
          <>
            <p className="text-lg font-medium">L'analyse de cette vidéo n'a pas abouti.</p>
            <Button className="rounded-full" onClick={() => { setAi(null); setAttempt((n) => n + 1); }}>Réessayer</Button>
          </>
        ) : <ShinyText text="Analyse de la vidéo en cours…" className="text-2xl font-bold" />}
      </div>
    );
  }
  if (!v || !a) return <div className="p-12 text-center text-muted-foreground">Vidéo introuvable. <Link to="/top-videos" className="text-primary">Retour aux vidéos</Link></div>;
  const picked = product ? s.inspirations[product.id] ?? [] : [];
  const checked = picked.includes(v.id);
  const embed = embedUrl(v);
  const hook = v.onScreenText[0]?.replace(/[«»"]/g, "").trim();

  function addInspiration() {
    if (!v) return;
    if (!product) { toast.error("Lancez d'abord une recherche"); return; }
    if (!toggleInspiration(product.id, v.id)) toast.error(`${MAX_INSPIRATIONS} inspirations maximum`);
    else toast.success(checked ? "Retirée des inspirations" : "Ajoutée aux inspirations");
  }

  const metrics = [
    { label: "Vues", node: <CountUp to={v.views} /> },
    { label: "Engagement", node: <CountUp to={v.engagementRate} decimals={1} suffix="%" /> },
    { label: "Attraction", node: v.creator.followers > 0 ? <CountUp to={v.views / v.creator.followers} decimals={1} suffix="×" /> : <span className="font-mono">—</span> },
    { label: "Score créa", node: <><CountUp to={v.score} /><span className="text-muted-foreground">/100</span></> },
    { label: "Date", node: <span className="font-mono">{new Date(v.publishedAt).toLocaleDateString("fr-FR")}</span> },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* Centre */}
      <div className="px-6 py-10 md:px-10">
        <Button asChild variant="ghost" className="-ml-3 mb-6 rounded-full"><Link to="/top-videos"><ArrowLeft /> Inspirations</Link></Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary/20 text-lg text-primary">{v.creator.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <p className="font-bold">{v.creator.name} <span className="font-normal text-muted-foreground">@{v.creator.handle}</span></p>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><PlatformIcon platform={v.platform} className="h-3.5 w-3.5" /> {platformLabel[v.platform]} · <span className="font-mono">{new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v.creator.followers)}</span> abonnés</p>
          </div>
          <span className="ml-auto rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">{a.format}</span>
        </div>

        <blockquote className="mt-8 border-l-2 border-primary pl-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Hook · <span className="font-mono">{a.hook.seconds} s</span> · {a.hook.type}</p>
          <BlurText as="h2" text={`« ${a.hook.description} »`} className="mt-2 text-3xl font-bold leading-tight" />
        </blockquote>

        <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-dashed py-5 md:grid-cols-4">
          {metrics.map((m) => <div key={m.label}><dt className="text-xs text-muted-foreground">{m.label}</dt><dd className="mt-1 text-xl xl:text-2xl">{m.node}</dd></div>)}
        </dl>

        <FadeContent className="mt-8 grid gap-8 md:grid-cols-2">
          <Section title="Concept"><p className="text-lg font-medium">{a.concept}</p></Section>
          <Section title="Message"><p>{a.message}</p></Section>
          <Section title="Déroulé en 3 étapes"><Numbered items={a.storytelling} /></Section>
          <Section title="Trois raisons du succès"><Numbered items={a.why_it_works} /></Section>
          <Section title="Style visuel"><p>{a.visual_style}</p></Section>
          <Section title="CTA"><p>{a.cta}</p></Section>
        </FadeContent>

        <div className="mt-8 rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Score de correspondance avec la marque</p>
          <div className="mt-2 flex items-end gap-2"><CountUp to={a.brandMatch.score} className="text-5xl text-primary" /><span className="mb-1.5 font-mono text-muted-foreground">/100</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${a.brandMatch.score}%` }} /></div>
          <p className="mt-3 text-sm text-muted-foreground">{a.brandMatch.reason}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-dashed pt-6">
          <Button variant="secondary" size="lg" className="rounded-full" onClick={addInspiration} disabled={!hydrated}>
            {checked ? <Check /> : <Plus />} {checked ? "Dans les inspirations" : "Ajouter aux inspirations"}
          </Button>
          <Button asChild size="lg" className="rounded-full"><a href={v.url} target="_blank" rel="noreferrer">Voir la vidéo <ExternalLink /></a></Button>
        </div>
      </div>

      {/* Droite : lecteur */}
      <aside className="relative overflow-hidden border-l border-dashed lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute inset-0 scale-125 bg-gradient-to-b from-primary/40 via-accent to-ink blur-3xl" aria-hidden />
        <div className="relative flex h-full items-center justify-center p-8">
          {embed ? (
            <iframe src={embed} title={`Vidéo de @${v.creator.handle}`} className="aspect-[9/16] max-h-[calc(100vh-4rem)] w-full max-w-[380px] overflow-hidden rounded-[1.75rem] border-0 bg-ink shadow-2xl ring-1 ring-border" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <a href={v.url} target="_blank" rel="noreferrer" className="group relative flex aspect-[9/16] w-full max-w-[340px] flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed bg-ink/70 p-6 text-center">
              {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
              <p className="relative text-2xl font-bold">« {hook} »</p>
              <span className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground group-hover:opacity-90">
                <PlatformIcon platform={v.platform} /> Ouvrir sur {platformLabel[v.platform]}
              </span>
              <span className="relative mt-3 text-xs text-muted-foreground">Lecture intégrée indisponible pour cette vidéo</span>
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{title}</p>{children}</section>;
}
function Numbered({ items }: { items: readonly string[] }) {
  return <ol className="space-y-2">{items.map((it, i) => <li key={i} className="flex gap-3"><span className="font-mono text-primary">{i + 1}</span>{it}</li>)}</ol>;
}
