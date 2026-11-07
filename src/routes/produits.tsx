import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Folder, Loader2, Search } from "lucide-react";
import { BlurText, FadeContent, Stepper } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { search } from "@/lib/api";
import { setState, useStore } from "@/lib/store";
import type { Platform, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produits")({
  head: () => ({
    meta: [
      { title: "Produits — Ads inspirées" },
      { name: "description", content: "Décrivez votre produit et votre marque pour trouver les vidéos concurrentes qui performent." },
      { property: "og:title", content: "Produits — Ads inspirées" },
      { property: "og:description", content: "Créez un produit en 3 étapes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Produits,
});

const blank = (): Product => ({
  id: crypto.randomUUID(),
  name: "", description: "", imageUrl: "",
  brand: { name: "", tone: "", colors: [], target: "" },
  style: { format: "UGC", durationSeconds: 30, platform: "tiktok" },
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}

function Produits() {
  const s = useStore();
  const navigate = useNavigate();
  const [p, setP] = useState<Product>(blank);
  const [loading, setLoading] = useState(false);
  const set = (patch: Partial<Product>) => setP({ ...p, ...patch });
  const setBrand = (patch: Partial<Product["brand"]>) => set({ brand: { ...p.brand, ...patch } });
  const input = "rounded-2xl";

  async function finish() {
    setLoading(true);
    const videos = await search(p);
    setState((st) => ({ ...st, products: [p, ...st.products], activeProductId: p.id, videos: { ...st.videos, [p.id]: videos } }));
    setLoading(false);
    navigate({ to: "/top-videos" });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <BlurText text="Nouveau produit" className="text-5xl font-bold tracking-tight" />
      <p className="mt-3 text-muted-foreground">Trois étapes, puis on cherche les vidéos qui marchent.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <Stepper steps={["Produit", "Marque", "Format"]} onComplete={finish}
          canNext={(i) => (i === 0 ? !!p.name.trim() && !!p.description.trim() : !loading)}
          finishLabel={loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Recherche…</> : <><Search className="h-4 w-4" /> Trouver les vidéos</>}>
          <div className="space-y-4">
            <Field label="Nom du produit"><Input className={input} value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. Crème anti-âge au rétinol" /></Field>
            <Field label="Description"><Textarea className={input} rows={4} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ce que fait le produit, pour qui, son bénéfice clé" /></Field>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Marque"><Input className={input} value={p.brand.name} onChange={(e) => setBrand({ name: e.target.value })} /></Field>
              <Field label="Ton"><Input className={input} value={p.brand.tone} onChange={(e) => setBrand({ tone: e.target.value })} placeholder="chaleureux, expert…" /></Field>
            </div>
            <Field label="Cible"><Input className={input} value={p.brand.target} onChange={(e) => setBrand({ target: e.target.value })} /></Field>
            <Field label="Couleurs (séparées par des virgules)"><Input className={input} value={p.brand.colors.join(", ")} onChange={(e) => setBrand({ colors: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })} /></Field>
          </div>
          <div className="space-y-5">
            <Field label="Plateforme">
              <div className="flex gap-2">
                {(["tiktok", "instagram", "youtube"] as Platform[]).map((pl) => (
                  <button key={pl} type="button" onClick={() => set({ style: { ...p.style, platform: pl } })}
                    className={cn("inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm", p.style.platform === pl ? "border-solid border-primary bg-primary/15 text-foreground" : "text-muted-foreground")}>
                    <PlatformIcon platform={pl} /> {platformLabel[pl]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Durée (secondes)"><Input className={cn(input, "font-mono")} type="number" min={5} max={120} value={p.style.durationSeconds} onChange={(e) => set({ style: { ...p.style, durationSeconds: Number(e.target.value) } })} /></Field>
          </div>
        </Stepper>
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Dossiers</p>
          <div className="space-y-2">
            {s.products.length === 0 && <p className="text-sm text-muted-foreground">Vos produits apparaîtront ici.</p>}
            {s.products.map((pr, i) => (
              <FadeContent key={pr.id} delay={i * 0.05}>
                <button onClick={() => { setState((st) => ({ ...st, activeProductId: pr.id })); navigate({ to: "/top-videos" }); }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-dashed bg-card p-3 text-left hover:border-primary">
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="truncate text-sm">{pr.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{s.videos[pr.id]?.length ?? 0}</span>
                </button>
              </FadeContent>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
