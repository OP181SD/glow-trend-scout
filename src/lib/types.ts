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
  createdAt?: string;
  brand: { name: string; tone: string; colors: string[]; target: string };
  style: { format: string; durationSeconds: number; platform: Platform };
}

export type TargetTool = "Veo" | "Sora" | "Kling" | "Runway";

export interface PromptScene {
  title: string;
  start: number;
  end: number;
  shot: string;
  visual: string;
  voiceOver: string;
  onScreenText: string;
}

export interface GeneratedPrompt {
  prompt: string;
  scenes: PromptScene[];
  totalSeconds: number;
  music: string;
  cta: string;
  kept: string[];
  original: string[];
  targetTool: TargetTool;
  shootingScript?: ShootingScript | undefined;
}

export type ShotType = "face caméra" | "gros plan produit" | "mains" | "avant/après" | "plan large";
export interface ShootingScript {
  hook: { texte_oral: string; texte_ecran: string; action: string; seconds: number };
  scenes: { numero: number; duree_s: number; plan: ShotType; action: string; texte_oral: string; texte_ecran: string }[];
  cta: { texte_oral: string; texte_ecran: string };
  materiel: string[];
  conseils: string[];
}
