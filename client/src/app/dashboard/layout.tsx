"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Package,
  Receipt,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { label: "Gateway", icon: <LayoutDashboard className="h-4 w-4" />, href: "/dashboard", shortcut: "F1" },
  { label: "Companies", icon: <Building2 className="h-4 w-4" />, href: "/dashboard/companies", shortcut: "F2" },
  { label: "Groups", icon: <BookOpen className="h-4 w-4" />, href: "/dashboard/groups", shortcut: "F3" },
  { label: "Ledgers", icon: <Users className="h-4 w-4" />, href: "/dashboard/ledgers", shortcut: "F4" },
  { label: "Stock Items", icon: <Package className="h-4 w-4" />, href: "#", shortcut: "F5" },
  { label: "Vouchers", icon: <Receipt className="h-4 w-4" />, href: "#", shortcut: "F6" },
  { label: "Reports", icon: <FileSpreadsheet className="h-4 w-4" />, href: "#", shortcut: "F7" },
  { label: "Settings", icon: <Settings className="h-4 w-4" />, href: "#", shortcut: "F8" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      if (key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < navItems.length - 1 ? prev + 1 : 0;
          navRefs.current[next]?.focus();
          return next;
        });
      }

      if (key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : navItems.length - 1;
          navRefs.current[next]?.focus();
          return next;
        });
      }

      if (key === "Escape") {
        setSidebarOpen((prev) => !prev);
      }

      if (key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const item = navItems[focusedIndex];
        if (item.href !== "#") router.push(item.href);
      }

      if (e.key.startsWith("F") && e.key.length <= 3) {
        const fNum = parseInt(e.key.replace("F", ""));
        const item = navItems.find((n) => n.shortcut === e.key);
        if (item && item.href !== "#") {
          e.preventDefault();
          router.push(item.href);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, focusedIndex]);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-200",
          sidebarOpen ? "w-60" : "w-0 overflow-hidden border-r-0"
        )}
      >
        {/* Logo area */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold">
            SE
          </div>
          {sidebarOpen && <span className="font-semibold">SmartERP</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.label}
                ref={(el) => { navRefs.current[i] = el; }}
                href={item.href}
                onClick={(e) => {
                  if (item.href === "#") e.preventDefault();
                }}
                tabIndex={0}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.shortcut}
                  </kbd>
                )}
                {item.href !== "#" && <ChevronRight className="h-3 w-3 opacity-50" />}
              </a>
            );
          })}
        </nav>

        {/* User area */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 truncate text-sm">
              <p className="truncate font-medium">{user.name || user.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Toggle button */}
      <button
        className="fixed left-0 top-1/2 z-40 -translate-y-1/2 rounded-r-md border border-l-0 bg-card p-1 shadow-sm hover:bg-accent"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
