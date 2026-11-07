import { useSyncExternalStore } from "react";
import type { GeneratedPrompt, Product, Video } from "./types";

export interface Generation { id: string; productId: string; video: Video; result: GeneratedPrompt; createdAt: string }
export interface SearchEntry { id: string; productId: string; query: string; count: number; createdAt: string }
interface State { searches: SearchEntry[]; products: Product[]; activeProductId: string | null; videos: Record<string, Video[]>; analyses: number; generations: Generation[] }

const KEY = "ads-inspirees-v1";
const EMPTY: State = { searches: [], products: [], activeProductId: null, videos: {}, analyses: 0, generations: [] };
let state: State = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...EMPTY, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
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
