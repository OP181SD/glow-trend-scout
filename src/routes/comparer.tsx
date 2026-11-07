import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BlurText, FadeContent, ShinyText } from "@/components/reactbits";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { getVideo } from "@/lib/api";
import { activeProduct, useStore } from "@/lib/store";
import type { Video } from "@/lib/types";
import { useAnalyses } from "@/lib/use-analyses";

export const Route = createFileRoute("/comparer")({
  head: () => ({
    meta: [
      { title: "Comparer les vidéos — Ads inspirées" },
      { name: "description", content: "Comparez côte à côte 2 ou 3 vidéos : hook, format, CTA, score et correspondance avec votre marque." },
      { property: "og:title", content: "Comparer les vidéos — Ads inspirées" },
      { property: "og:description", content: "Hook, format, CTA et score de 2 ou 3 vidéos, côte à côte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const s = useStore();
  const hydrated = useHydrated();
  const product = activeProduct(s);
  const videos = product ? (s.inspirations[product.id] ?? []).map((id) => getVideo(id, s.videos[product.id] ?? [])).filter((v): v is Video => !!v) : [];
  const { analyses, pending } = useAnalyses(videos, product, s.demoMode);

  if (!hydrated) return null;
  if (!product || videos.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <BlurText text="Choisissez 2 ou 3 vidéos" className="text-4xl font-bold" />
        <p className="mt-3 text-muted-foreground">Cochez « Ajouter aux inspirations » sur 2 ou 3 vidéos pour les comparer.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/top-videos">Voir les vidéos</Link></Button>
      </div>
    );
  }

  const rows: { label: string; cell: (v: Video) => React.ReactNode }[] = [
    { label: "Hook", cell: (v) => { const a = analyses[v.id]; return a ? <><span className="text-xs uppercase tracking-wider text-primary">{a.hook.type}</span><p className="mt-1">« {a.hook.description} »</p></> : null; } },
    { label: "Format", cell: (v) => analyses[v.id]?.format },
    { label: "CTA", cell: (v) => analyses[v.id]?.cta },
    { label: "Score", cell: (v) => <span className="font-mono text-2xl">{v.score}<span className="text-sm text-muted-foreground">/100</span></span> },
    { label: "Correspondance marque", cell: (v) => { const a = analyses[v.id]; return a ? <><span className="font-mono text-2xl">{a.brandMatch.score}<span className="text-sm text-muted-foreground">/100</span></span><p className="mt-1 text-sm text-muted-foreground">{a.brandMatch.reason}</p></> : null; } },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
      <Button asChild variant="ghost" className="-ml-3 mb-6 rounded-full"><Link to="/top-videos"><ArrowLeft /> Top vidéos</Link></Button>
      <BlurText text="Comparaison côte à côte" className="text-5xl font-bold tracking-tight" />
      {pending > 0 && <ShinyText text={`Analyse de ${pending} vidéo${pending > 1 ? "s" : ""} en cours…`} className="mt-3 block text-sm" />}
      <FadeContent className="mt-8 overflow-x-auto rounded-[2rem] border border-dashed bg-card">
        <table className="w-full min-w-[720px] text-left align-top">
          <thead>
            <tr className="border-b border-dashed">
              <th className="w-44 p-5" />
              {videos.map((v) => (
                <th key={v.id} className="p-5 font-normal">
                  <Link to="/analyse/$videoId" params={{ videoId: v.id }} className="flex items-center gap-3 hover:text-primary">
                    {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="aspect-[9/16] w-12 rounded-xl object-cover" /> : <span className="aspect-[9/16] w-12 rounded-xl bg-muted" />}
                    <span><span className="block font-bold">@{v.creator.handle}</span><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><PlatformIcon platform={v.platform} className="h-3 w-3" /> {v.platform}</span></span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-dashed last:border-0">
                <th scope="row" className="p-5 align-top text-xs font-normal uppercase tracking-wider text-muted-foreground">{r.label}</th>
                {videos.map((v) => <td key={v.id} className="p-5 align-top">{r.cell(v) ?? <span className="text-muted-foreground">…</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </FadeContent>
    </div>
  );
}
