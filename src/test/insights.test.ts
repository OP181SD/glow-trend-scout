import { describe, expect, it } from "vitest";
import { computeInsights } from "@/lib/insights";
import type { Analysis, Video } from "@/lib/types";

const v = (id: string, score: number, engagementRate = 5) => ({ id, score, engagementRate, platform: "tiktok" }) as Video;
const a = (type: Analysis["hook"]["type"], format: Analysis["format"] = "UGC") => ({ hook: { type, description: "", seconds: 1 }, format }) as Analysis;

describe("computeInsights", () => {
  it("compte les hooks sur la moitié supérieure par score", () => {
    const videos = [v("1", 90), v("2", 80), v("3", 70), v("4", 20), v("5", 10), v("6", 5)];
    const r = computeInsights(videos, { "1": a("question"), "2": a("question"), "3": a("choc"), "4": a("choc"), "5": a("choc"), "6": a("choc") });
    expect(r.topCount).toBe(3);
    expect(r.hookTypes[0]).toEqual({ label: "hook question", count: 2, percent: 67 });
    expect(r.headline).toBe("67 % des meilleures vidéos utilisent un hook question");
  });

  it("compare l'engagement moyen du haut et du bas du classement", () => {
    const r = computeInsights([v("1", 90, 10), v("2", 10, 2)], {});
    expect(r.avgEngagementTop).toBe(10);
    expect(r.avgEngagementRest).toBe(2);
    expect(r.headline).toBeNull();
  });
});
