// Composants inspirés de React Bits (TS + Tailwind), réimplémentés légèrement.
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* 1. CountUp */
export function CountUp({ to, decimals = 0, className, suffix = "" }: { to: number; decimals?: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 40, stiffness: 120 });
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  useEffect(() => spring.on("change", (v) => {
    if (ref.current) ref.current.textContent = new Intl.NumberFormat("fr-FR", { notation: to >= 10000 ? "compact" : "standard", maximumFractionDigits: decimals, minimumFractionDigits: to >= 10000 ? 0 : decimals }).format(v) + suffix;
  }), [spring, decimals, suffix, to]);
  return <span ref={ref} className={cn("font-mono tabular-nums", className)}>0{suffix}</span>;
}

/* 2. SpotlightCard */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, o: 0 });
  return (
    <div ref={ref} className={cn("relative overflow-hidden rounded-[1.75rem] border border-dashed bg-card", className)}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top, o: 1 }); }}
      onMouseLeave={() => setPos((p) => ({ ...p, o: 0 }))}>
      <div className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300" style={{ opacity: pos.o, background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, var(--spotlight), transparent 70%)` }} />
      {children}
    </div>
  );
}

/* 3. FadeContent */
export function FadeContent({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.5, delay }}>
      {children}
    </motion.div>
  );
}

/* 4. Stepper */
export function Stepper({ steps, children, onComplete, canNext = () => true, finishLabel = "Terminer" }: { steps: string[]; children: ReactNode; onComplete: () => void; canNext?: (i: number) => boolean; finishLabel?: ReactNode }) {
  const [i, setI] = useState(0);
  const panes = Children.toArray(children);
  const last = i === steps.length - 1;
  return (
    <div className="rounded-[2rem] border border-dashed bg-card p-6">
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((s, k) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button type="button" onClick={() => k < i && setI(k)} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm transition-colors", k < i ? "bg-primary text-primary-foreground" : k === i ? "bg-primary/20 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground")}>
              {k < i ? <Check className="h-4 w-4" /> : k + 1}
            </button>
            <span className={cn("hidden text-sm sm:inline", k === i ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            {k < steps.length - 1 && <span className="mx-1 h-px flex-1 border-t border-dashed" />}
          </li>
        ))}
      </ol>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={i + 1} aria-valuemax={steps.length}>
        <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${((i + 1) / steps.length) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>{panes[i]}</motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-between border-t border-dashed pt-5">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full px-4 py-2 text-sm text-muted-foreground disabled:opacity-30">Retour</button>
        <button type="button" disabled={!canNext(i)} onClick={() => (last ? onComplete() : setI(i + 1))} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
          {last ? finishLabel : "Continuer"}
        </button>
      </div>
    </div>
  );
}

/* 5. ShinyText */
export function ShinyText({ text, className }: { text: string; className?: string }) {
  return <span className={cn("shiny-text", className)}>{text}</span>;
}

/* 6. BlurText */
export function BlurText({ text, className, as: Tag = "h1" }: { text: string; className?: string; as?: "h1" | "h2" }) {
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <motion.span key={i + w} className="inline-block" initial={{ opacity: 0, filter: "blur(10px)", y: -8 }} animate={{ opacity: 1, filter: "blur(0px)", y: 0 }} transition={{ delay: i * 0.08, duration: 0.45 }}>
          {w}{i < words.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

/* Aurora discret, en CSS pur (pas de WebGL) — accueil uniquement */
export function Aurora() {
  return <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" />;
}
