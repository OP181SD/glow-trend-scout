import { describe, expect, it } from "vitest";
import { contentType, defaultFilters, matches, shadowReach } from "@/lib/filters";
import type { Video } from "@/lib/types";
const v = (o: Partial<Video> = {}): Video => ({ id: "1", platform: "tiktok", url: "", thumbnailUrl: "", creator: { handle: "a", name: "a", followers: 10_000 }, publishedAt: new Date().toISOString(), durationSeconds: 20, views: 10_000, likes: 0, comments: 0, shares: 0, engagementRate: 5, caption: "", transcript: "", onScreenText: [], hashtags: [], score: 50, scoreReason: "", ...o });
describe("filters", () => {
  it("shadow reach viral when views ≥ 2× followers", () => expect(shadowReach(v({ views: 20_000 }))).toBe("viral"));
  it("portée bridée when views < 5% followers", () => expect(shadowReach(v({ views: 400 }))).toBe("bridee"));
  it("detects ads by #ad hashtag", () => expect(contentType(v({ hashtags: ["ad"] }))).toBe("ads"));
  it("filters by min views", () => expect(matches(v({ views: 5000 }), { ...defaultFilters, minViews: 10_000 })).toBe(false));
  it("filters by period", () => expect(matches(v({ publishedAt: "2020-01-01" }), { ...defaultFilters, period: "30" })).toBe(false));
});
