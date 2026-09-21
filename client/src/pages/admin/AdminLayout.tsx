import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  UtensilsCrossed,
  MessageSquareQuote,
  HelpCircle,
  FileText,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  Armchair,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/table-reservations", label: "Table Reservations", icon: Armchair },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/content", label: "Website Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !admin) navigate("/admin/login");
  }, [admin, isLoading, navigate]);

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/me"], null);
      navigate("/admin/login");
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-charcoal-deep flex items-center justify-center text-ivory/50">Loading…</div>;
  }
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-charcoal-deep flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-ivory/10 p-6">
        <Link href="/admin" className="font-display text-xl tracking-widest2 mb-10 block">
          NU<span className="text-gold">É</span>E <span className="text-ivory/40 text-xs align-top">ADMIN</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200",
                  active ? "bg-gold/10 text-gold" : "text-ivory/60 hover:text-ivory hover:bg-ivory/5",
                )}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ivory/10 pt-4 mt-4">
          <p className="text-xs text-ivory/40 mb-3">{admin.name} · {admin.email}</p>
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 text-sm text-ivory/60 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-charcoal-deep border-b border-ivory/10 flex items-center justify-between px-5 py-4">
        <Link href="/admin" className="font-display text-lg tracking-widest2">
          NU<span className="text-gold">É</span>E ADMIN
        </Link>
        <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed top-[61px] inset-x-0 z-30 bg-charcoal-deep border-b border-ivory/10 p-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm",
                  location === item.href ? "text-gold" : "text-ivory/70",
                )}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
          <button onClick={() => logout.mutate()} className="flex items-center gap-2 text-sm text-red-400 pt-3">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      )}

      <main className="flex-1 min-w-0 p-6 lg:p-10 pt-24 lg:pt-10">{children}</main>
    </div>
  );
}
