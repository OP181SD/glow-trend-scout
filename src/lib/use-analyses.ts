import { useEffect, useState } from "react";
import { analyze, getCachedAnalysis } from "./api";
import type { Analysis, Product, Video } from "./types";

/** Charge (ou relit) l'analyse de chaque vidéo ; renvoie celles prêtes et le nombre restant. */
export function useAnalyses(videos: Video[], product: Product | null, demo: boolean) {
  const [map, setMap] = useState<Record<string, Analysis | undefined>>(() => Object.fromEntries(videos.map((v) => [v.id, getCachedAnalysis(v.id)])));
  const [failed, setFailed] = useState<string[]>([]);
  const key = videos.map((v) => v.id).join(",");
  useEffect(() => {
    if (!product) return;
    let alive = true;
    videos.forEach((v) => {
      analyze(v, product, demo)
        .then((a) => { if (alive) setMap((m) => ({ ...m, [v.id]: a })); })
        .catch(() => { if (alive) setFailed((f) => [...f, v.id]); });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, product?.id]);
  const pending = videos.filter((v) => !map[v.id] && !failed.includes(v.id)).length;
  return { analyses: map, pending, failed: failed.length };
}
