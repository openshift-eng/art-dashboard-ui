import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  History,
  AlertTriangle,
  ExternalLink,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Menu,
  X,
  LayoutGrid,
} from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";
import { cn } from "../../lib/utils";
import { Product } from "../../lib/releases";

const SIDEBAR_KEY = "art-dashboard-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  gaVersion?: string | null;
  gaHref?: string;
  gaLoading?: boolean;
  versionList?: string[];
  currentVersion?: string;
  onVersionSelect?: (version: string) => void;
  products?: Product[];
  productId?: string;
  onProductChange?: (product: string) => void;
  overview?: boolean;
  releaseHref?: string;
}

export function DashboardLayout({
  children,
  gaVersion,
  gaHref,
  gaLoading = false,
  versionList,
  currentVersion,
  onVersionSelect,
  products,
  productId,
  onProductChange,
  overview = false,
  releaseHref = "/dashboard",
}: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === "collapsed") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setCollapsed(true);
    };
    mql.addEventListener("change", handler);
    if (mql.matches) setCollapsed(true);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const compact = collapsed && !mobileOpen;

  const buildHistoryLink = process.env.NEXT_PUBLIC_BUILD_HISTORY_LINK || "#";
  const buildFailuresLink = process.env.NEXT_PUBLIC_BUILD_FAILURES_LINK || "#";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-200 ease-out",
          compact ? "w-12" : "w-[220px]",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50",
          mobileOpen ? "max-md:translate-x-0" : "max-md:hidden",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center border-b border-border",
            compact ? "justify-center px-1 py-3" : "gap-2 px-3 py-3",
          )}
        >
          {!compact && (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">
                  ART Dashboard
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  Release coordination
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden shrink-0 rounded p-1 text-muted-foreground transition-colors duration-100 hover:bg-muted hover:text-foreground md:flex"
          >
            {compact ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="ml-auto shrink-0 text-muted-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!compact && products && (
          <div className="px-4 pt-5">
            <label
              htmlFor="dashboard-product"
              className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground"
            >
              Product
            </label>
            <select
              id="dashboard-product"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={productId || ""}
              onChange={(event) => {
                onProductChange?.(event.target.value);
                setMobileOpen(false);
              }}
            >
              {!productId && (
                <option value="" disabled>
                  Select product
                </option>
              )}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="px-2 py-2">
          {!compact && (
            <div className="px-2 pb-1 pt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Navigation
            </div>
          )}
          <Link
            href={releaseHref}
            onClick={() => setMobileOpen(false)}
            aria-label="Release status"
            aria-current={!overview ? "page" : undefined}
            className={cn(
              "flex items-center rounded-md py-2 text-sm transition-colors duration-100",
              !overview
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-muted",
              compact ? "justify-center px-1" : "gap-2 px-2",
            )}
          >
            <Rocket className="h-5 w-5 shrink-0" />
            {!compact && <span>Release Status</span>}
          </Link>
          {products && (
            <Link
              href="/dashboard/products"
              onClick={() => setMobileOpen(false)}
              aria-label="All products"
              aria-current={overview ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                overview
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className="h-5 w-5 shrink-0" />
              {!compact && <span>All products</span>}
            </Link>
          )}
          <a
            href={buildHistoryLink}
            aria-label="Build history"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center rounded-md py-2 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground",
              compact ? "justify-center px-1" : "gap-2 px-2",
            )}
          >
            <History className="h-5 w-5 shrink-0" />
            {!compact && (
              <>
                <span>Build History</span>
                <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
              </>
            )}
          </a>
          <a
            href={buildFailuresLink}
            aria-label="Build failures"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center rounded-md py-2 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground",
              compact ? "justify-center px-1" : "gap-2 px-2",
            )}
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {!compact && (
              <>
                <span>Build Failures</span>
                <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
              </>
            )}
          </a>
        </nav>

        {/* Version list */}
        {!compact && versionList && versionList.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col border-t border-border">
            <div className="px-4 pb-1 pt-3 text-xs uppercase tracking-wider text-muted-foreground">
              Versions ({versionList.length})
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {versionList.map((version) => (
                <button
                  key={version}
                  onClick={() => {
                    onVersionSelect?.(version);
                    setMobileOpen(false);
                  }}
                  aria-current={version === currentVersion ? "page" : undefined}
                  className={cn(
                    "block w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors duration-100",
                    version === currentVersion
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {version}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto border-t border-border px-3 py-3">
          {!compact && (gaVersion || productId) && (
            <div className="mb-3">
              <div className="text-sm text-muted-foreground">
                Latest GA Version
              </div>
              <div className="text-base">
                {gaVersion ? (
                  gaHref ? (
                    <Link
                      href={gaHref}
                      onClick={() => setMobileOpen(false)}
                      className="text-accent hover:underline"
                    >
                      v{gaVersion}
                    </Link>
                  ) : (
                    `v${gaVersion}`
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {gaLoading ? "Loading…" : "Not determined"}
                  </span>
                )}
              </div>
            </div>
          )}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex items-center gap-2 rounded-md px-1 py-1.5 text-base text-muted-foreground transition-colors duration-100 hover:text-foreground"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            {!compact && (
              <span className="text-xs">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile hamburger */}
        <div className="flex items-center border-b border-border px-3 py-2 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-2 text-sm font-semibold">ART Dashboard</span>
        </div>
        {children}
      </main>
    </div>
  );
}
