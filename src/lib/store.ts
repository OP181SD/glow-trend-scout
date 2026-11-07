import { useSyncExternalStore } from "react";
import type { GeneratedPrompt, Product, Video } from "./types";

export interface Generation { id: string; productId: string; videos: Video[]; result: GeneratedPrompt; mode?: "ia" | "humain"; createdAt: string }
export interface SearchEntry { id: string; productId: string; query: string; count: number; createdAt: string }
interface State { inspirations: Record<string, string[]>; searches: SearchEntry[]; products: Product[]; activeProductId: string | null; videos: Record<string, Video[]>; analyses: number; generations: Generation[]; demoMode: boolean; imageSearchUnsupported: boolean }

const KEY = "ads-inspirees-v2";
const EMPTY: State = { inspirations: {}, searches: [], products: [], activeProductId: null, videos: {}, analyses: 0, generations: [], demoMode: false, imageSearchUnsupported: false };
let state: State = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...EMPTY, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
export function getState(): State { load(); return state; }
export function setState(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function useStore(): State {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); if (!loaded) { load(); queueMicrotask(cb); } return () => subs.delete(cb); },
    () => state,
    () => EMPTY,
  );
}
export const activeProduct = (s: State) => s.products.find((p) => p.id === s.activeProductId) ?? null;
export const MAX_INSPIRATIONS = 3;
export function toggleInspiration(productId: string, videoId: string): boolean {
  const cur = state.inspirations[productId] ?? [];
  if (!cur.includes(videoId) && cur.length >= MAX_INSPIRATIONS) return false;
  const next = cur.includes(videoId) ? cur.filter((id) => id !== videoId) : [...cur, videoId];
  setState((s) => ({ ...s, inspirations: { ...s.inspirations, [productId]: next } }));
  return true;
}
