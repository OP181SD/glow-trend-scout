import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Download, Lightbulb, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ShootingScript } from "@/lib/types";
import { downloadBlob, scriptToPdf, scriptToText } from "@/lib/script-export";

export function ShootingScriptView({ script, title, onRegenerate }: { script?: ShootingScript; title: string; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const [pdf, setPdf] = useState<Blob | null>(null);

  if (!script) {
    return (
      <div className="rounded-[2rem] border border-dashed bg-card p-10 text-center text-muted-foreground">
        Ce prompt a été généré avant l'ajout du script de tournage.
        <div className="mt-4"><Button className="rounded-full" onClick={onRegenerate}>Régénérer pour obtenir le script</Button></div>
      </div>
    );
  }

  async function copy() {
    await navigator.clipboard.writeText(scriptToText(script!, title));
    setCopied(true); toast.success("Script copié");
    setTimeout(() => setCopied(false), 2000);
  }
  async function preparePdf() {
    const b = await scriptToPdf(script!, title);
    setPdf(b);
    downloadBlob(b, "script-de-tournage.pdf");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-solid border-primary/60 bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-primary">Hook · les premières secondes</p>
          <span className="font-mono text-sm text-primary">0–{script.hook.seconds} s</span>
        </div>
        <p className="mt-3 text-2xl font-bold">« {script.hook.texte_oral} »</p>
        <div className="mt-4 grid gap-3 border-t border-dashed pt-4 text-sm md:grid-cols-2">
          <Field label="Action" value={script.hook.action} />
          <Field label="Texte à l'écran" value={script.hook.texte_ecran} />
        </div>
      </div>

      <ol className="space-y-3">
        {script.scenes.map((sc, i) => (
          <li key={i} className="flex gap-4 rounded-[1.75rem] border border-dashed bg-card p-5">
            <span className="font-mono text-3xl text-primary">{String(sc.numero || i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{sc.plan}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{sc.duree_s} s</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{sc.action}</p>
              <div className="mt-3 grid gap-3 border-t border-dashed pt-3 text-sm md:grid-cols-2">
                <Field label="Ce qu'on dit" value={sc.texte_oral} />
                <Field label="Ce qu'on écrit à l'écran" value={sc.texte_ecran} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-[1.75rem] border border-dashed bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Appel à l'action</p>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <Field label="Ce qu'on dit" value={script.cta.texte_oral} />
          <Field label="Ce qu'on écrit à l'écran" value={script.cta.texte_ecran} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Package className="size-4" /> Matériel</p>
          <ul className="mt-4 flex flex-wrap gap-2 border-t border-dashed pt-4">
            {script.materiel.map((m) => <li key={m}><Badge variant="outline" className="rounded-full">{m}</Badge></li>)}
          </ul>
        </div>
        <div className="rounded-[1.75rem] border border-dashed bg-card p-6">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Lightbulb className="size-4" /> 3 conseils</p>
          <ol className="mt-4 space-y-2 border-t border-dashed pt-4 text-sm">
            {script.conseils.slice(0, 3).map((c, i) => <li key={i} className="flex gap-2"><span className="font-mono text-primary">{i + 1}</span>{c}</li>)}
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={copy} className="rounded-full">{copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier le script"}</Button>
        <Button variant="secondary" className="rounded-full" onClick={() => (pdf ? downloadBlob(pdf, "script-de-tournage.pdf") : preparePdf())}><Download /> Télécharger en PDF</Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5">{value || "—"}</p></div>;
}
