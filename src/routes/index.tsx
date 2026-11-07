import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Aurora, BlurText, CountUp, FadeContent } from "@/components/reactbits";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ads inspirées" },
      { name: "description", content: "Suivez vos produits, les vidéos concurrentes analysées et vos prompts vidéo IA générés." },
      { property: "og:title", content: "Dashboard — Ads inspirées" },
      { property: "og:description", content: "Vos pubs vidéo inspirées des meilleures, en un coup d'œil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useStore();
  const allVideos = Object.values(s.videos).flat();
  const views = allVideos.reduce((a, v) => a + v.views, 0);
  const metrics = [
    { label: "Produits", value: s.products.length },
    { label: "Vidéos trouvées", value: allVideos.length },
    { label: "Analyses", value: s.analyses },
    { label: "Générations", value: s.generations.length },
  ];
  return (
    <div className="relative">
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-6 py-12 md:px-10">
        <BlurText text="Les pubs qui marchent, réinventées pour vous." className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl" />
        <FadeContent delay={0.4}>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">Créez un produit, on trouve les vidéos concurrentes qui performent et on écrit votre prompt vidéo IA.</p>
          <Button asChild size="lg" className="mt-6 rounded-full"><Link to="/produits">Nouveau produit <ArrowRight /></Link></Button>
        </FadeContent>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <FadeContent key={m.label} delay={0.5 + i * 0.08} className="rounded-[1.75rem] border border-dashed bg-card/70 p-5 backdrop-blur">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <CountUp to={m.value} className="mt-2 block text-4xl" />
            </FadeContent>
          ))}
        </div>
        {views > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">Vues cumulées des vidéos repérées : <CountUp to={views} className="text-foreground" /></p>
        )}

        <div className="mt-14 flex items-end justify-between border-b border-dashed pb-4">
          <h2 className="text-2xl font-bold">Dernières vidéos repérées</h2>
          <Link to="/top-videos" className="text-sm text-primary">Tout voir</Link>
        </div>
        {allVideos.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Rien encore. Créez votre premier produit pour lancer la recherche.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {allVideos.slice(0, 4).map((v, i) => <FadeContent key={v.id + i} delay={i * 0.06}><VideoCard v={v} /></FadeContent>)}
          </div>
        )}
      </div>
    </div>
  );
}
