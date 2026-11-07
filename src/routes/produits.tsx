import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, Search, Wand2 } from "lucide-react";
import { BlurText, Stepper } from "@/components/reactbits";
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
      { title: "Ajouter un produit — Ads inspirées" },
      { name: "description", content: "Décrivez votre produit, votre marque et le style voulu pour trouver des vidéos d'inspiration." },
      { property: "og:title", content: "Ajouter un produit — Ads inspirées" },
      { property: "og:description", content: "Créez un produit en 3 étapes." },
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
  const [formKey, setFormKey] = useState(0);
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <BlurText text="Trouver des inspirations" className="text-5xl font-bold tracking-tight" />
          <p className="mt-3 text-muted-foreground">3 étapes, 1 minute.</p>
        </div>
        <button type="button" onClick={() => { setP(example(p.id)); setFormKey((k) => k + 1); }} className="inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm hover:border-primary">
          <Wand2 className="h-4 w-4 text-primary" /> Utiliser l'exemple
        </button>
      </div>
      <div className="mt-8">
        <Stepper key={formKey} steps={["Produit", "Marque", "Style voulu"]} onComplete={finish}
          canNext={(i) => (i === 0 ? !!p.name.trim() && !!p.description.trim() : !loading)}
          finishLabel={loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Recherche…</> : <><Search className="h-4 w-4" /> Trouver des inspirations</>}>
          <div className="space-y-4">
            <Field label="Nom du produit"><Input className="rounded-2xl" value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Crème anti-âge" /></Field>
            <Field label="Description"><Textarea className="rounded-2xl" rows={4} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="Bénéfice clé, pour qui" /></Field>
            <Field label="Image du produit">
              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-4 hover:border-primary">
                {p.imageUrl ? <img src={p.imageUrl} alt="Aperçu du produit" className="h-16 w-16 rounded-xl object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></span>}
                <span className="text-sm text-muted-foreground">{p.imageUrl ? "Changer" : "Ajouter une image"}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onImage(e.target.files?.[0])} />
              </label>
              {canUseImage && (
                <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox checked={useImage} onCheckedChange={(v) => setUseImage(v === true)} />
                  Inclure les vidéos visuellement proches
                </label>
              )}
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Nom de la marque"><Input className="rounded-2xl" value={p.brand.name} onChange={(e) => setBrand({ name: e.target.value })} /></Field>
            <Field label="Ton">
              <Select value={p.brand.tone} onValueChange={(tone) => setBrand({ tone })}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Choisir un ton" /></SelectTrigger>
                <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Couleurs"><Input className="rounded-2xl" value={p.brand.colors.join(", ")} onChange={(e) => setBrand({ colors: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })} /></Field>
            <Field label="Cible"><Input className="rounded-2xl" value={p.brand.target} onChange={(e) => setBrand({ target: e.target.value })} /></Field>
          </div>
          <div className="space-y-5">
            <Field label="Format"><div className="flex flex-wrap gap-2">{FORMATS.map((f) => <Chip key={f} active={p.style.format === f} onClick={() => setStyle({ format: f })}>{f}</Chip>)}</div></Field>
            <Field label="Durée"><div className="flex gap-2">{DURATIONS.map((d) => <Chip key={d} active={p.style.durationSeconds === d} onClick={() => setStyle({ durationSeconds: d })}><span className="font-mono">{d} s</span></Chip>)}</div></Field>
            <Field label="Plateforme">
              <div className="flex flex-wrap gap-2">
                {(["tiktok", "instagram", "youtube"] as Platform[]).map((pl) => (
                  <Chip key={pl} active={p.style.platform === pl} onClick={() => setStyle({ platform: pl })}><PlatformIcon platform={pl} /> {platformLabel[pl]}</Chip>
                ))}
              </div>
            </Field>
          </div>
        </Stepper>
      </div>
    </div>
  );
}
