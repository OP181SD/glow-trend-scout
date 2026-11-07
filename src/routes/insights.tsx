import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { BlurText, CountUp, FadeContent, ShinyText } from "@/components/reactbits";
import { Button } from "@/components/ui/button";
import { computeInsights, type Share } from "@/lib/insights";
import { activeProduct, useStore } from "@/lib/store";
import { useAnalyses } from "@/lib/use-analyses";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights de la recherche — Ads inspirées" },
      { name: "description", content: "Ce que les meilleures vidéos de votre recherche ont en commun : types de hook, formats, plateformes et engagement." },
      { property: "og:title", content: "Insights de la recherche — Ads inspirées" },
      { property: "og:description", content: "Les tendances des meilleures vidéos de marques et concurrents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InsightsPage,
});

const config = { percent: { label: "Part des meilleures vidéos (%)", colors: { light: ["var(--primary)"], dark: ["var(--primary)"] } } };

function ShareChart({ title, data }: { title: string; data: Share[] }) {
  return (
    <FadeContent className="rounded-[1.75rem] border border-dashed bg-card p-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      {data.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Pas encore de données.</p> : (
        <EvilBarChart config={config} data={data.map((d) => ({ ...d }))} className="mt-4 h-56 w-full" layout="horizontal">
          <EvilBarChart.XAxis dataKey="percent" type="number" domain={[0, 100]} />
          <EvilBarChart.YAxis dataKey="label" type="category" width={110} />
          <EvilBarChart.Tooltip />
          <EvilBarChart.Bar dataKey="percent" />
        </EvilBarChart>
      )}
    </FadeContent>
  );
}

function InsightsPage() {
  const s = useStore();
  const hydrated = useHydrated();
  const product = activeProduct(s);
  const videos = product ? s.videos[product.id] ?? [] : [];
  const { analyses, pending } = useAnalyses(videos, product, s.demoMode);

  if (!hydrated) return null;
  if (!product || videos.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <BlurText text="Aucune recherche pour l'instant" className="text-4xl font-bold" />
        <Button asChild className="mt-6 rounded-full"><Link to="/produits">Lancer une recherche</Link></Button>
      </div>
    );
  }
  const r = computeInsights(videos, analyses);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
      <Button asChild variant="ghost" className="-ml-3 mb-6 rounded-full"><Link to="/top-videos"><ArrowLeft /> Top vidéos</Link></Button>
      <p className="text-sm text-muted-foreground">Dossier · {product.name}</p>
      <BlurText text="Insights de la recherche" className="mt-2 text-5xl font-bold tracking-tight" />
      <p className="mt-3 text-sm text-muted-foreground">« Meilleures vidéos » = la moitié du haut du classement (<span className="font-mono">{r.topCount}</span> sur <span className="font-mono">{videos.length}</span>).</p>
      {pending > 0 && <ShinyText text={`Analyse de ${pending} vidéo${pending > 1 ? "s" : ""} en cours…`} className="mt-2 block text-sm" />}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <FadeContent className="rounded-[1.75rem] border border-dashed bg-card p-6 md:col-span-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">À retenir</p>
          <p className="mt-3 text-2xl font-bold leading-tight">{r.headline ?? "En attente des analyses…"}</p>
          {r.formats[0] && <p className="mt-3 text-muted-foreground"><span className="font-mono text-foreground">{r.formats[0].percent} %</span> sont au format {r.formats[0].label}.</p>}
        </FadeContent>
        <FadeContent className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Engagement moyen · meilleures</p>
          <p className="mt-3 font-mono text-4xl"><CountUp to={r.avgEngagementTop} decimals={1} suffix=" %" /></p>
        </FadeContent>
        <FadeContent className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Engagement moyen · les autres</p>
          <p className="mt-3 font-mono text-4xl text-muted-foreground"><CountUp to={r.avgEngagementRest} decimals={1} suffix=" %" /></p>
        </FadeContent>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <ShareChart title="Types de hook" data={r.hookTypes} />
        <ShareChart title="Formats" data={r.formats} />
        <ShareChart title="Plateformes" data={r.platforms} />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Classement basé sur les vues et l'engagement public, pas sur les performances publicitaires.</p>
    </div>
  );
}
