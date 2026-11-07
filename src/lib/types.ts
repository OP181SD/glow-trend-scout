export type Platform = "tiktok" | "instagram" | "youtube";

export interface Video {
  id: string;
  platform: Platform;
  url: string;
  thumbnailUrl: string;
  creator: { handle: string; name: string; followers: number };
  publishedAt: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  caption: string;
  transcript: string;
  onScreenText: string[];
  hashtags: string[];
  score: number;
  scoreReason: string;
}

export type AnalysisFormat = "UGC" | "tutoriel" | "avant/après" | "témoignage" | "unboxing" | "sketch" | "autre";

export interface Analysis {
  concept: string;
  format: AnalysisFormat;
  hook: { description: string; seconds: number; type: "question" | "choc" | "promesse" | "visuel" };
  message: string;
  storytelling: [string, string, string];
  visual_style: string;
  cta: string;
  why_it_works: [string, string, string];
  brandMatch: { score: number; reason: string };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  brand: { name: string; tone: string; colors: string[]; target: string };
  style: { format: string; durationSeconds: number; platform: Platform };
}

export type TargetTool = "Veo" | "Sora" | "Kling" | "Runway";

export interface GeneratedPrompt {
  prompt: string;
  kept: string[];
  original: string[];
  targetTool: TargetTool;
}
