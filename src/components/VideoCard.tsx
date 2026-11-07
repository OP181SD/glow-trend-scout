import { SpotlightCard } from "@/components/reactbits";
import { PlatformIcon, platformLabel } from "@/components/PlatformIcon";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils";

export const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function VideoCard({ v, selected, onClick }: { v: Video; selected?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="block w-full text-left">
      <SpotlightCard className={cn("aspect-[9/16] transition-colors", selected && "border-solid border-primary")}>
        <div className="absolute inset-0 bg-gradient-to-b from-accent/60 via-card to-ink" />
        <div className="relative z-0 flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-xs">
              <PlatformIcon platform={v.platform} className="h-3.5 w-3.5" /> {platformLabel[v.platform]}
            </span>
            <span className="rounded-full bg-ink/70 px-2 py-1 font-mono text-xs">{v.durationSeconds}s</span>
          </div>
          <p className="text-xl font-bold leading-tight">« {v.onScreenText[0]} »</p>
          <div>
            <p className="mb-3 text-sm font-medium">@{v.creator.handle}</p>
            <div className="grid grid-cols-3 gap-2 border-t border-dashed pt-3 font-mono text-xs">
              <div><div className="text-muted-foreground">vues</div>{fmt(v.views)}</div>
              <div><div className="text-muted-foreground">eng.</div>{v.engagementRate.toString().replace(".", ",")}%</div>
              <div><div className="text-muted-foreground">score</div><span className="text-primary">{v.score}</span></div>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </button>
  );
}
