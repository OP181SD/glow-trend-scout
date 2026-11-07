import { describe, expect, it } from "vitest";
import { percentileRank, scoreVideos } from "@/lib/scoring";
import type { Video } from "@/lib/types";

const base = (id: string, platform: Video["platform"], views: number, engagementRate: number): Omit<Video, "score" | "scoreReason"> => ({
  id, platform, views, engagementRate, url: "", thumbnailUrl: "", creator: { handle: id, name: id, followers: 0 },
  publishedAt: "2026-10-01", durationSeconds: 20, likes: 0, comments: 0, shares: 0, caption: "", transcript: "", onScreenText: [], hashtags: [],
});

describe("score", () => {
  it("percentile rank goes from 0 to 1", () => {
    expect(percentileRank([1, 2, 3], 1)).toBe(0);
    expect(percentileRank([1, 2, 3], 3)).toBe(1);
  });
  it("weights engagement 60% and views 40%", () => {
    const [top, , low] = scoreVideos([base("a", "tiktok", 100, 9), base("b", "tiktok", 300, 1), base("c", "tiktok", 200, 5)]);
    // a: eng rank 1, views rank 0 -> 60 ; b: eng 0, views 1 -> 40 ; c: 0.5/0.5 -> 50
    expect(top!.id).toBe("a");
    expect(top!.score).toBe(60);
    expect(low!.score).toBe(40);
  });
  it("does not penalise Instagram for missing shares: engagement ranked per platform", () => {
    const res = scoreVideos([base("t1", "tiktok", 100, 10), base("t2", "tiktok", 100, 8), base("i1", "instagram", 100, 4), base("i2", "instagram", 100, 2)]);
    const i1 = res.find((v) => v.id === "i1")!;
    const t1 = res.find((v) => v.id === "t1")!;
    expect(i1.score).toBe(t1.score);
  });
  it("writes a justification sentence", () => {
    const [v] = scoreVideos([base("a", "tiktok", 100, 8.2), base("b", "tiktok", 50, 1)]);
    expect(v!.scoreReason).toContain("8,2 %");
  });
});
