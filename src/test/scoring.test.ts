import { describe, expect, it } from "vitest";
import { attractionTier, percentileRank, scoreVideos, viewsPerFollower } from "@/lib/scoring";
import type { Video } from "@/lib/types";

const base = (id: string, platform: Video["platform"], views: number, engagementRate: number, followers = 0): Omit<Video, "score" | "scoreReason"> => ({
  id, platform, views, engagementRate, url: "", thumbnailUrl: "", creator: { handle: id, name: id, followers },
  publishedAt: "2026-10-01", durationSeconds: 20, likes: 0, comments: 0, shares: 0, caption: "", transcript: "", onScreenText: [], hashtags: [],
});

describe("score", () => {
  it("percentile rank goes from 0 to 1", () => {
    expect(percentileRank([1, 2, 3], 1)).toBe(0);
    expect(percentileRank([1, 2, 3], 3)).toBe(1);
  });
  it("without followers: engagement 60% and views 40%", () => {
    const [top, , low] = scoreVideos([base("a", "tiktok", 100, 9), base("b", "tiktok", 300, 1), base("c", "tiktok", 200, 5)]);
    expect(top!.id).toBe("a");
    expect(top!.score).toBe(60);
    expect(low!.score).toBe(40);
  });
  it("1M views from a 10k account beats 1M views from a 20M account", () => {
    const res = scoreVideos([base("big", "tiktok", 1_000_000, 5, 20_000_000), base("small", "tiktok", 1_000_000, 5, 10_000)]);
    expect(res[0]!.id).toBe("small");
    expect(res[0]!.score).toBe(75); // 0.5×1 + 0.3×0.5 + 0.2×0.5
    expect(res[1]!.score).toBe(25);
  });
  it("views per follower and tiers", () => {
    expect(viewsPerFollower(base("a", "tiktok", 1_000_000, 0, 10_000))).toBe(100);
    expect(viewsPerFollower(base("a", "tiktok", 1_000_000, 0, 0))).toBeNull();
    expect(attractionTier(0.05)).toBe("audience");
    expect(attractionTier(1.5)).toBe("breakout");
    expect(attractionTier(100)).toBe("pepite");
  });
  it("does not penalise Instagram for missing shares", () => {
    const res = scoreVideos([base("t1", "tiktok", 100, 10), base("t2", "tiktok", 100, 8), base("i1", "instagram", 100, 4), base("i2", "instagram", 100, 2)]);
    expect(res.find((v) => v.id === "i1")!.score).toBe(res.find((v) => v.id === "t1")!.score);
  });
});

import { recencyFactor, trendScore, viewsMomentum, viewsPerDay } from "@/lib/scoring";
describe("tendance", () => {
  const now = new Date("2026-11-07").getTime();
  it("une vidéo récente passe devant une vieille au même score", () => {
    expect(trendScore({ score: 80, publishedAt: "2026-11-03" }, now)).toBe(80);
    expect(trendScore({ score: 80, publishedAt: "2026-01-01" }, now)).toBe(20);
  });
  it("paliers de fraîcheur", () => {
    expect(recencyFactor("2026-10-20", now)).toBe(0.8);
    expect(recencyFactor("2026-09-01", now)).toBe(0.5);
  });
});

describe("tendance des vues", () => {
  const now = new Date("2026-11-07").getTime();
  const v = (id: string, views: number, publishedAt: string, platform: Video["platform"] = "tiktok") =>
    ({ id, platform, views, publishedAt });
  it("vues par jour depuis la publication", () => {
    expect(viewsPerDay(v("a", 1000, "2026-11-01"), now)).toBe(200);
    // vidéo publiée aujourd'hui : jamais de division par 0
    expect(viewsPerDay(v("b", 1000, "2026-11-07"), now)).toBe(2000);
  });
  it("flèche montante au-dessus de 1,25× la médiane, descendante sous 0,8×", () => {
    const pool = [v("fast", 100_000, "2026-11-05"), v("mid", 20_000, "2026-11-05"), v("slow", 1_000, "2026-11-05")];
    expect(viewsMomentum(pool[0]!, pool, now).momentum).toBe("up");
    expect(viewsMomentum(pool[1]!, pool, now).momentum).toBe("flat");
    expect(viewsMomentum(pool[2]!, pool, now).momentum).toBe("down");
  });
  it("compare seulement à la même plateforme", () => {
    const pool = [v("t1", 100_000, "2026-11-05"), v("t2", 90_000, "2026-11-05"), v("i1", 500, "2026-11-05", "instagram"), v("i2", 400, "2026-11-05", "instagram")];
    expect(viewsMomentum(pool[0]!, pool, now).momentum).toBe("up");
    expect(viewsMomentum(pool[2]!, pool, now).momentum).toBe("up");
  });
  it("aucune flèche avec une seule vidéo", () => {
    const only = [v("solo", 10_000, "2026-11-05")];
    expect(viewsMomentum(only[0]!, only, now).momentum).toBe("flat");
  });
});
