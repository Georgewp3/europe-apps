import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Menu,
  Moon,
  NotebookPen,
  Plus,
  Scale,
  Search,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";

import { GlobalSearch } from "@/components/common/GlobalSearch";
import { ProgramFormDialog } from "@/components/programs/ProgramFormDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppData } from "@/hooks/useStore";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { exportJson } from "@/services/export";
import { StorageService } from "@/services/storage";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "Applications", icon: ListChecks },
  { to: "/universities", label: "Universities", icon: GraduationCap },
  { to: "/programmes", label: "Programmes", icon: FileText },
  { to: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { to: "/compare", label: "Compare", icon: Scale },
  { to: "/countries", label: "Countries", icon: MapPin },
  { to: "/documents", label: "Documents", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const SUBMITTED_OR_LATER = [
  "Submitted",
  "Under Review",
  "Interview",
  "Offer",
  "Accepted",
  "Waitlisted",
  "Rejected",
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const data = useAppData();
  const submitted = data.programs.filter((p) => SUBMITTED_OR_LATER.includes(p.status)).length;
  const offers = data.programs.filter((p) => ["Offer", "Accepted"].includes(p.status)).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">AI Masters</p>
          <p className="text-xs text-muted-foreground">Application Tracker</p>
        </div>
      </div>

      <nav className="scrollbar-slim flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border bg-card p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          At a glance
        </p>
        <dl className="mt-2 space-y-1.5 text-sm">
          <Row label="Total applications" value={data.programs.length} />
          <Row label="Submitted" value={submitted} />
          <Row label="Offers received" value={offers} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="numeric font-semibold">{value}</dd>
    </div>
  );
}

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const data = useAppData();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent onNavigate={() => setDrawerOpen(false)} />
              </SheetContent>
            </Sheet>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 flex-1 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent sm:max-w-md"
            >
              <Search className="size-4" />
              <span className="truncate">Search everything…</span>
              <kbd className="numeric ml-auto hidden rounded border px-1.5 text-[10px] sm:block">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => exportJson(StorageService.exportData())}
                title="Export backup"
              >
                <Download className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Programme</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <ProgramFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        universities={data.universities}
      />
    </div>
  );
}
