import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useTableBookingModal } from "@/context/TableBookingModalContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About Us" },
  { href: "/visit", label: "Visit Us" },
];

export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open } = useTableBookingModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-editorial",
        scrolled || mobileOpen ? "bg-charcoal-deep/95 backdrop-blur border-b border-ivory/10 py-4" : "bg-transparent py-7",
      )}
    >
      <div className="container-editorial flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-widest2 text-ivory">
          NU<span className="text-gold">É</span>E
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs uppercase tracking-widest transition-colors duration-300",
                location === link.href ? "text-gold" : "text-ivory/75 hover:text-gold",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button size="sm" onClick={open}>
            Book a Table
          </Button>
        </div>

        <button
          className="lg:hidden text-ivory"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden container-editorial mt-6 pb-6 flex flex-col gap-5 border-t border-ivory/10 pt-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm uppercase tracking-widest",
                location === link.href ? "text-gold" : "text-ivory/80",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button size="sm" onClick={open} className="w-full mt-2">
            Book a Table
          </Button>
        </div>
      )}
    </header>
  );
}
