import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Folder, Plus } from "lucide-react";
import { OrbitHero } from "@/components/OrbitHero";
import { BlurText, CountUp, FadeContent } from "@/components/reactbits";
import { Button } from "@/components/ui/button";
import { setState, useStore } from "@/lib/store";

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
  const navigate = useNavigate();
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
      <OrbitHero>
        <p className="text-sm font-bold uppercase tracking-[0.3em]">Ads inspirées</p>
        <BlurText text="Votre espace d'inspiration vidéo" className="mt-4 max-w-xl justify-center text-5xl font-medium leading-[1.02] tracking-tight md:text-7xl" />
        <FadeContent delay={0.4}>
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button asChild size="lg" className="rounded-full"><Link to="/produits">Trouver des inspirations <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full"><Link to="/top-videos">Mes vidéos</Link></Button>
          </div>
        </FadeContent>
      </OrbitHero>
      <div className="relative mx-auto max-w-6xl px-6 pb-12 md:px-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <FadeContent key={m.label} delay={0.5 + i * 0.08} className="rounded-[1.75rem] border border-dashed bg-card/70 p-5 backdrop-blur">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <CountUp to={m.value} className="mt-2 block text-4xl" />
            </FadeContent>
          ))}
        </div>
        {views > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">Vues cumulées : <CountUp to={views} className="text-foreground" /></p>
        )}

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="flex items-end justify-between border-b border-dashed pb-4">
              <h2 className="text-2xl font-bold">Mes produits</h2>
              <Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/produits"><Plus /> Trouver des inspirations</Link></Button>
            </div>
            {s.products.length === 0 ? (
              <p className="mt-6 text-muted-foreground">Rien ici. Lancez votre première recherche.</p>
            ) : (
              <ul className="divide-y divide-dashed">
                {s.products.map((p, i) => (
                  <FadeContent key={p.id} delay={i * 0.05}>
                    <li>
                      <button onClick={() => { setState((st) => ({ ...st, activeProductId: p.id })); navigate({ to: "/top-videos" }); }} className="flex w-full items-center gap-4 py-4 text-left hover:text-primary">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Folder className="h-4 w-4 text-primary" /></span>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="block truncate text-sm text-muted-foreground">{p.brand.name || "Sans marque"}</span>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—"}</span>
                      </button>
                    </li>
                  </FadeContent>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="border-b border-dashed pb-4 text-2xl font-bold">Dernières recherches</h2>
            {s.searches.length === 0 ? (
              <p className="mt-6 text-muted-foreground">Aucune recherche encore.</p>
            ) : (
              <ul className="divide-y divide-dashed">
                {s.searches.slice(0, 6).map((r, i) => (
                  <FadeContent key={r.id} delay={i * 0.05}>
                    <li className="py-4">
                      <p className="line-clamp-2 text-sm">{r.query}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{r.count} vidéos · {new Date(r.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                    </li>
                  </FadeContent>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
