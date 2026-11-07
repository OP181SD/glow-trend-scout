import { CountUp, SpotlightCard } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { attractionTier, isTrending, viewsPerFollower, type AttractionTier } from "@/lib/scoring";
import { Eye, Heart } from "lucide-react";

const tierLabel: Record<AttractionTier, string> = {
  pepite: "Pépite virale",
  breakout: "Sort de sa commu",
  audience: "Reste dans sa commu",
  inconnu: "Attraction",
};

/** Vues ÷ abonnés ramené sur 100 (échelle log) : 1× = 50, 4× = 100, ≤0,25× = 0. */
export function attractionScore(vfr: number | null): number | null {
  if (vfr === null || vfr <= 0) return vfr === null ? null : 0;
  return Math.round(Math.min(100, Math.max(0, 50 + 25 * Math.log2(vfr))));
}

export const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

interface Props {
  v: Video;
  format?: string | undefined;
  selected?: boolean;
  onClick?: () => void;
  inspiration?: { checked: boolean; disabled: boolean; onToggle: () => void };
}

export function VideoCard({ v, format, selected, onClick, inspiration }: Props) {
  const hook = v.onScreenText[0]?.replace(/[«»"]/g, "").trim();
  const vfr = viewsPerFollower(v);
  const tier = attractionTier(vfr);
  const attr = attractionScore(vfr);
  const tierStyle = tier === "pepite" ? "bg-primary text-primary-foreground" : tier === "breakout" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground";
  return (
    <div className="flex flex-col gap-3">
      <SpotlightCard className={cn("aspect-[9/16] text-ink-foreground transition-colors", selected && "ring-2 ring-primary")}>
        {v.thumbnailUrl ? (
          <img src={v.thumbnailUrl} alt={`Miniature de @${v.creator.handle}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/60 to-ink p-6">
            <p className="text-center text-xl font-bold leading-tight">« {hook} »</p>
          </div>
        )}
        <button onClick={onClick} aria-label={`Voir l'analyse de la vidéo de @${v.creator.handle}`} className="absolute inset-0 z-0" />
        <div className="pointer-events-none relative flex items-start justify-between gap-2 p-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 backdrop-blur">
            <PlatformIcon platform={v.platform} className="h-3.5 w-3.5" />
          </span>
          {isTrending(v) && <span className="ml-auto mr-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">Tendance</span>}
          {format && <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[11px] backdrop-blur">{format}</span>}
        </div>
      </SpotlightCard>

      <div className="space-y-2 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">@{v.creator.handle}</p>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{vfr !== null ? `${fmt(v.creator.followers)} abo` : platformLabel[v.platform]}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help space-y-1.5 rounded-2xl border border-dashed px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">Attraction</span>
                <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium", tierStyle)}>{tierLabel[tier]}</span>
                <span className="ml-auto font-mono text-sm text-primary">{attr === null ? "—" : <CountUp to={attr} />}<span className="text-[10px] text-muted-foreground">/100</span></span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${attr ?? 0}%` }} />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-60">
            Vues ÷ abonnés, sur 100. 50 = la vidéo touche autant de monde que le compte a d'abonnés. 100 = 4× plus. 0 = moins d'un quart.
            {vfr !== null && ` Ici : ${fmt(v.views)} vues pour ${fmt(v.creator.followers)} abonnés.`}
          </TooltipContent>
        </Tooltip>
        <div className="flex gap-3 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /><CountUp to={v.views} /></span>
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /><CountUp to={v.engagementRate} decimals={1} suffix="%" /></span>
        </div>
        {inspiration && (
          <label className={cn("flex cursor-pointer items-center gap-2 text-xs", inspiration.disabled && "cursor-not-allowed opacity-50")}>
            <Checkbox checked={inspiration.checked} disabled={inspiration.disabled} onCheckedChange={inspiration.onToggle} />
            Ajouter aux inspirations
          </label>
        )}
      </div>
    </div>
  );
}
