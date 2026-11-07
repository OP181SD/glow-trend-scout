import { siInstagram, siTiktok, siYoutube } from "simple-icons";
import type { Platform } from "@/lib/types";

const ICONS = { tiktok: siTiktok, instagram: siInstagram, youtube: siYoutube };
export const platformLabel: Record<Platform, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };

export function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: Platform; className?: string }) {
  const icon = ICONS[platform];
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill="currentColor" aria-label={icon.title}>
      <path d={icon.path} />
    </svg>
  );
}
