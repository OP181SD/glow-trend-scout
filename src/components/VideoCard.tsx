import { CountUp, SpotlightCard } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { attractionTier, viewsPerFollower, type AttractionTier } from "@/lib/scoring";
import { Eye, Heart } from "lucide-react";

const tierLabel: Record<AttractionTier, string> = {
  pepite: "Pépite virale",
  breakout: "Sort de sa commu",
  audience: "Reste dans sa commu",
  inconnu: "Attraction",
};

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
  return (
    <SpotlightCard className={cn("aspect-[9/16] text-ink-foreground transition-colors", selected && "border-solid border-primary")}>
      {/* Miniature */}
      {v.thumbnailUrl ? (
        <img src={v.thumbnailUrl} alt={`Miniature de @${v.creator.handle}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/60 to-ink p-6">
          <p className="text-center text-xl font-bold leading-tight">« {hook} »</p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink" />

      <button onClick={onClick} aria-label={`Voir l'analyse de la vidéo de @${v.creator.handle}`} className="absolute inset-0 z-0" />

      <div className="pointer-events-none relative flex h-full flex-col justify-between p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 text-xs">
            <PlatformIcon platform={v.platform} className="h-3.5 w-3.5" /> {platformLabel[v.platform]}
          </span>
          {format && <span className="rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground">{format}</span>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">@{v.creator.handle}</p>
            {vfr !== null && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{fmt(v.creator.followers)} abo</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="pointer-events-auto mb-2 flex cursor-help items-end justify-between rounded-2xl bg-ink/80 px-3 py-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{tierLabel[tier]}</div>
                  <span className="font-mono text-2xl leading-none text-primary">{vfr === null ? "—" : <CountUp to={vfr} decimals={vfr < 10 ? 1 : 0} suffix="×" />}</span>
                </div>
                <span className="font-mono text-lg leading-none"><CountUp to={v.score} /><span className="text-[10px] text-muted-foreground">/100</span></span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-56">{v.scoreReason}</TooltipContent>
          </Tooltip>
          <div className="flex gap-3 border-t border-dashed pt-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3 text-muted-foreground" /><CountUp to={v.views} /></span>
            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 text-muted-foreground" /><CountUp to={v.engagementRate} decimals={1} suffix="%" /></span>
          </div>
          {inspiration && (
            <label className={cn("pointer-events-auto mt-3 flex cursor-pointer items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-xs", inspiration.disabled && "cursor-not-allowed opacity-50")}>
              <Checkbox checked={inspiration.checked} disabled={inspiration.disabled} onCheckedChange={inspiration.onToggle} />
              Ajouter aux inspirations
            </label>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}
