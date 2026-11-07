import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { activeCount, defaultFilters, type Filters } from "@/lib/filters";
import { cn } from "@/lib/utils";

type Opt<K extends keyof Filters> = { key: K; label: string; options: [Filters[K], string][] };
const groups: Opt<keyof Filters>[] = [
  { key: "reach", label: "Shadow reach", options: [["all", "Tous"], ["viral", "Viral hors abo"], ["normal", "Normal"], ["bridee", "Portée bridée"]] },
  { key: "period", label: "Période", options: [["all", "Tout"], ["7", "7 j"], ["30", "30 j"], ["90", "3 mois"], ["365", "1 an"]] },
  { key: "lang", label: "Langue / zone", options: [["all", "Toutes"], ["fr", "🇫🇷 Français"], ["en", "🇬🇧 Anglais"], ["es", "🇪🇸 Espagnol"]] },
  { key: "type", label: "Type", options: [["all", "Tous"], ["ads", "Ads"], ["sketch", "Sketch"], ["tutoriel", "Tuto"], ["avant-apres", "Avant/après"], ["temoignage", "Avis"], ["ugc", "UGC"]] },
  { key: "tone", label: "Ton", options: [["all", "Tous"], ["humour", "Humour"], ["expert", "Expert"], ["storytelling", "Story"], ["promo", "Promo"], ["choc", "Choc"]] },
  { key: "age", label: "Âge cible", options: [["all", "Tous"], ["genz", "15-24"], ["25-34", "25-34"], ["35+", "35+"]] },
  { key: "minViews", label: "Vues min.", options: [[0, "Toutes"], [10_000, "10k+"], [100_000, "100k+"], [1_000_000, "1M+"]] },
  { key: "minEngagement", label: "Engagement", options: [[0, "Tout"], [3, "3 %+"], [7, "7 %+"], [12, "12 %+"]] },
  { key: "creatorSize", label: "Créateur", options: [["all", "Tous"], ["nano", "< 10k"], ["micro", "10k-100k"], ["macro", "100k+"]] },
  { key: "duration", label: "Durée", options: [["all", "Toutes"], ["short", "≤ 15 s"], ["medium", "15-45 s"], ["long", "45 s+"]] },
] as Opt<keyof Filters>[];

export function FilterPanel({ value, onChange, shown, total }: { value: Filters; onChange: (f: Filters) => void; shown: number; total: number }) {
  const [open, setOpen] = useState(false);
  const n = activeCount(value);
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setOpen((o) => !o)} className={cn("inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm", n > 0 && "border-solid border-primary bg-primary/10")}>
          <SlidersHorizontal className="h-4 w-4" /> Filtres {n > 0 && <span className="rounded-full bg-primary px-1.5 font-mono text-[11px] text-primary-foreground">{n}</span>}
        </button>
        {n > 0 && <button onClick={() => onChange(defaultFilters)} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><X className="h-3.5 w-3.5" /> Effacer</button>}
        <span className="font-mono text-xs text-muted-foreground">{shown}/{total}</span>
      </div>
      {open && (
        <div className="mt-3 grid gap-3 rounded-[1.75rem] border border-dashed p-4 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-1.5 text-xs text-muted-foreground">{g.label}</p>
              <div className="flex flex-wrap gap-1">
                {g.options.map(([val, label]) => (
                  <button key={String(val)} onClick={() => onChange({ ...value, [g.key]: val })}
                    className={cn("rounded-full border border-dashed px-2.5 py-1 text-xs", value[g.key] === val ? "border-solid border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
