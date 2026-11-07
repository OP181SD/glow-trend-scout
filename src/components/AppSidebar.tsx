import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Folder, PanelLeftClose, PanelLeftOpen, FolderOpen, LayoutDashboard, PlaySquare, Search, Plus, Sparkles } from "lucide-react";
import { setState, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import logoTrendme from "@/assets/logo-trendme-color.png";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/produits", label: "Rechercher", icon: Search },
  { to: "/generations", label: "Générations", icon: Sparkles },
] as const;

export function AppSidebar() {
  const s = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const item = "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground";
  if (!open) {
    return (
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center gap-1 border-r border-dashed bg-sidebar py-4 md:flex">
        <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="mb-6 rounded-full p-2.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><PanelLeftOpen className="h-4 w-4" /></button>
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} title={label} aria-label={label} className="rounded-full p-2.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "!bg-sidebar-accent !text-foreground" }}>
            <Icon className="h-4 w-4" />
          </Link>
        ))}
      </aside>
    );
  }
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-dashed bg-sidebar p-4 md:flex">
      <div className="mb-8 flex items-center justify-between px-2 pt-2">
        <Link to="/" className="flex items-center gap-2" aria-label="TrendMe — accueil">
          <img src={logoTrendme} alt="TrendMe" width={1152} height={576} className="h-7 w-auto" />
        </Link>
        <button onClick={() => setOpen(false)} aria-label="Ranger le menu" className="rounded-full p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><PanelLeftClose className="h-4 w-4" /></button>
      </div>
      <nav className="space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={item} activeOptions={{ exact: true }} activeProps={{ className: "!bg-sidebar-accent !text-foreground" }}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="my-5 border-t border-dashed" />
      <div className="mb-2 flex items-center justify-between px-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Mes recherches</span>
        <Link to="/produits" aria-label="Trouver des inspirations" className="text-muted-foreground hover:text-primary"><Plus className="h-4 w-4" /></Link>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {s.products.length === 0 && <p className="px-4 text-sm text-muted-foreground">Aucun dossier.</p>}
        {s.products.map((p) => {
          const active = p.id === s.activeProductId;
          const Icon = active ? FolderOpen : Folder;
          return (
            <button key={p.id} onClick={() => { setState((st) => ({ ...st, activeProductId: p.id })); navigate({ to: "/top-videos" }); }}
              className={cn(item, "w-full text-left", active && "text-foreground")}>
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto font-mono text-xs">{s.videos[p.id]?.length ?? 0}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-dashed pt-4">
        <label htmlFor="demo-mode" className="flex cursor-pointer items-center justify-between rounded-full px-4 py-2 text-sm">
          <span className={cn(s.demoMode ? "text-primary" : "text-muted-foreground")}>Mode démo</span>
          <Switch id="demo-mode" checked={s.demoMode} onCheckedChange={(v) => setState((st) => ({ ...st, demoMode: v }))} />
        </label>
        {s.demoMode && <p className="px-4 text-xs text-muted-foreground">Vidéos enregistrées, sans appel réseau.</p>}
      </div>
    </aside>
  );
}
