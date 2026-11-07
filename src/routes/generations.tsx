import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BlurText, FadeContent } from "@/components/reactbits";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { useStore, type Generation } from "@/lib/store";

export const Route = createFileRoute("/generations")({
  head: () => ({
    meta: [
      { title: "Générations — Ads inspirées" },
      { name: "description", content: "Retrouvez et copiez vos prompts vidéo IA pour Veo, Sora, Kling et Runway." },
      { property: "og:title", content: "Générations — Ads inspirées" },
      { property: "og:description", content: "Vos prompts publicitaires prêts à copier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Generations,
});

function Generations() {
  const s = useStore();
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <BlurText text="Générations" className="border-b border-dashed pb-6 text-5xl font-bold tracking-tight" />
      {s.generations.length === 0 && (
        <p className="mt-8 text-muted-foreground">Aucun prompt pour l'instant. <Link to="/top-videos" className="text-primary">Analysez une vidéo</Link> puis cliquez sur « Générer ma pub ».</p>
      )}
      <div className="mt-8 space-y-5">
        {s.generations.map((g, i) => (
          <FadeContent key={g.id} delay={i * 0.06}>
            <Item g={g} productName={s.products.find((p) => p.id === g.productId)?.name ?? "Produit"} />
          </FadeContent>
        ))}
      </div>
    </div>
  );
}

function Item({ g, productName }: { g: Generation; productName: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(g.result.prompt);
    setCopied(true); toast.success("Prompt copié");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-[2rem] border border-dashed bg-card p-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-dashed pb-4 text-sm">
        <span className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground">{g.result.targetTool}</span>
        <span className="font-medium">{productName}</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground"><PlatformIcon platform={g.video.platform} className="h-3.5 w-3.5" /> @{g.video.creator.handle}</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{new Date(g.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
      </div>
      <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{g.result.prompt}</pre>
      <Button onClick={copy} className="mt-5 rounded-full">{copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier le prompt"}</Button>
    </div>
  );
}
