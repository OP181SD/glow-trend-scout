import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, Search, Wand2 } from "lucide-react";
import { BlurText } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { imageForSearch, search, SearchFailed } from "@/lib/api";
import { getState, setState, useStore } from "@/lib/store";
import type { Platform, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produits")({
  head: () => ({
    meta: [
      { title: "Trouver des inspirations — TrendMe" },
      { name: "description", content: "Tapez ce que vous voulez promouvoir, on trouve les vidéos qui cartonnent." },
      { property: "og:title", content: "Trouver des inspirations — TrendMe" },
      { property: "og:description", content: "Une recherche, des vidéos qui cartonnent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddProduct,
});

const TONES = ["chaleureux et expert", "fun et décalé", "premium et élégant", "scientifique", "authentique et simple"];
const FORMATS = ["UGC", "tutoriel", "avant/après", "témoignage"];
const DURATIONS = [15, 30, 60];

const blank = (): Product => ({
  id: crypto.randomUUID(), name: "", description: "", imageUrl: "",
  brand: { name: "", tone: "", colors: [], target: "" },
  style: { format: "UGC", durationSeconds: 30, platform: "tiktok" },
});

const example = (id: string): Product => ({
  id,
  name: "Sérum-Crème Renaissance",
  description: "Crème anti-âge au rétinol encapsulé et peptides, texture fondante, pour lisser les rides en 4 semaines.",
  imageUrl: "",
  brand: { name: "Maison Aube", tone: "chaleureux et expert", colors: ["bleu nuit", "blanc", "argent"], target: "femmes de 40 à 60 ans" },
  style: { format: "UGC", durationSeconds: 30, platform: "tiktok" },
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm", active ? "border-solid border-primary bg-primary/15 text-foreground" : "text-muted-foreground")}>
      {children}
    </button>
  );
}

function AddProduct() {
  const navigate = useNavigate();
  const [p, setP] = useState<Product>(blank);
  const [loading, setLoading] = useState(false);
  const [useImage, setUseImage] = useState(true);
  const s = useStore();
  // Masquée si Oriane a déjà refusé une image, en mode démo, ou si le format n'est pas JPG/PNG/WebP.
  const canUseImage = !s.imageSearchUnsupported && !s.demoMode && !!imageForSearch(p.imageUrl);
  const set = (patch: Partial<Product>) => setP({ ...p, ...patch });
  const setBrand = (patch: Partial<Product["brand"]>) => set({ brand: { ...p.brand, ...patch } });
  const setStyle = (patch: Partial<Product["style"]>) => set({ style: { ...p.style, ...patch } });

  function onImage(file?: File) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => set({ imageUrl: String(r.result) });
    r.readAsDataURL(file);
  }

  async function finish() {
    setLoading(true);
    const product = { ...p, createdAt: new Date().toISOString() };
    let videos;
    try {
      const res = await search(product, { demo: getState().demoMode, useImage: canUseImage && useImage });
      videos = res.videos;
      if (res.imageUnsupported) {
        setState((st) => ({ ...st, imageSearchUnsupported: true }));
        toast.info("La recherche par image n'est pas disponible : résultats trouvés avec la description seule.");
      }
    } catch (e) {
      setLoading(false);
      const demoOn = getState().demoMode;
      toast.error(e instanceof SearchFailed ? e.message : "La recherche a échoué.", {
        description: demoOn ? "Aucune vidéo enregistrée pour la démo." : "Passez en mode démo pour utiliser les vidéos déjà enregistrées.",
        duration: 12000,
        ...(demoOn ? {} : { action: { label: "Passer en mode démo", onClick: () => { setState((st) => ({ ...st, demoMode: true })); void finish(); } } }),
      });
      return;
    }
    setState((st) => ({
      ...st,
      products: [product, ...st.products],
      activeProductId: product.id,
      videos: { ...st.videos, [product.id]: videos },
      searches: [{ id: crypto.randomUUID(), productId: product.id, query: product.description, count: videos.length, createdAt: new Date().toISOString() }, ...st.searches],
    }));
    setLoading(false);
    navigate({ to: "/top-videos" });
  }

  const ready = !!p.name.trim() && !loading;
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <BlurText text="Trouver des inspirations" className="text-5xl font-bold tracking-tight" />
      <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); if (ready) void finish(); }}>
        <div className="flex items-center gap-2 rounded-full border bg-card p-2 pl-5 focus-within:border-primary">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input autoFocus className="flex-1 bg-transparent py-2 text-lg outline-none" value={p.name}
            onChange={(e) => set({ name: e.target.value, description: e.target.value })} placeholder="Ex. crème anti-âge" />
          <button type="submit" disabled={!ready} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Chercher
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={!p.style.platform} onClick={() => setStyle({ platform: undefined })}>Tous</Chip>
          {(["tiktok", "instagram", "youtube"] as Platform[]).map((pl) => (
            <Chip key={pl} active={p.style.platform === pl} onClick={() => setStyle({ platform: pl })}><PlatformIcon platform={pl} /> {platformLabel[pl]}</Chip>
          ))}
          <button type="button" onClick={() => setP(example(p.id))} className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Wand2 className="h-4 w-4" /> Exemple
          </button>
        </div>
        <details className="rounded-3xl border border-dashed p-5">
          <summary className="cursor-pointer text-sm text-muted-foreground">Plus d'options (facultatif)</summary>
          <div className="mt-5 space-y-4">
            <Field label="Image">
              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-3 hover:border-primary">
                {p.imageUrl ? <img src={p.imageUrl} alt="Aperçu" className="h-12 w-12 rounded-xl object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></span>}
                <span className="text-sm text-muted-foreground">{p.imageUrl ? "Changer" : "Ajouter une image"}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onImage(e.target.files?.[0])} />
              </label>
              {canUseImage && (
                <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox checked={useImage} onCheckedChange={(v) => setUseImage(v === true)} />
                  Vidéos visuellement proches
                </label>
              )}
            </Field>
            <Field label="Détails"><Textarea className="rounded-2xl" rows={2} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="Bénéfice clé, pour qui" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marque"><Input className="rounded-2xl" value={p.brand.name} onChange={(e) => setBrand({ name: e.target.value })} /></Field>
              <Field label="Cible"><Input className="rounded-2xl" value={p.brand.target} onChange={(e) => setBrand({ target: e.target.value })} /></Field>
            </div>
            <Field label="Ton">
              <Select value={p.brand.tone} onValueChange={(tone) => setBrand({ tone })}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Choisir un ton" /></SelectTrigger>
                <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Format"><div className="flex flex-wrap gap-2">{FORMATS.map((f) => <Chip key={f} active={p.style.format === f} onClick={() => setStyle({ format: f })}>{f}</Chip>)}</div></Field>
            <Field label="Durée"><div className="flex gap-2">{DURATIONS.map((d) => <Chip key={d} active={p.style.durationSeconds === d} onClick={() => setStyle({ durationSeconds: d })}><span className="font-mono">{d} s</span></Chip>)}</div></Field>
          </div>
        </details>
      </form>
    </div>
  );
}
