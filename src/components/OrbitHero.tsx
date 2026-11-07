import type { ReactNode } from "react";
import o1 from "@/assets/orbit-1.jpg";
import o2 from "@/assets/orbit-2.jpg";
import o3 from "@/assets/orbit-3.jpg";
import o4 from "@/assets/orbit-4.jpg";
import o5 from "@/assets/orbit-5.jpg";
import o6 from "@/assets/orbit-6.jpg";

const IMAGES = [o1, o2, o3, o4, o5, o6];

function Ring({ radius, count, size, duration, offset = 0, reverse }: { radius: number; count: number; size: number; duration: number; offset?: number; reverse?: boolean }) {
  return (
    <div className="orbit absolute left-1/2 top-1/2" style={{ ["--orbit-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i;
        const src = IMAGES[(i + offset) % IMAGES.length];
        return (
          <div key={i} className="absolute left-0 top-0" style={{ transform: `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)` }}>
            <div className="orbit-item" style={{ ["--orbit-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}>
              <img src={src} alt="" width={size} height={size * 1.25} loading="lazy"
                className="-translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-elegant ring-1 ring-border"
                style={{ width: size, height: size * 1.25, rotate: `${(i % 3) * 6 - 6}deg` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OrbitHero({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex h-[min(88vh,760px)] items-center justify-center overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Ring radius={330} count={10} size={78} duration={80} />
        <Ring radius={520} count={14} size={96} duration={120} offset={3} reverse />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_22%,transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">{children}</div>
    </section>
  );
}
