import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, Phone } from "lucide-react";

export function Footer() {
  const { data: content } = useQuery<Record<string, string>>({
    queryKey: ["/api/website-content"],
  });

  return (
    <footer className="border-t border-ivory/10 bg-charcoal-deep">
      <div className="container-editorial py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="font-display text-2xl tracking-widest2 mb-4">
            NU<span className="text-gold">É</span>E
          </div>
          <p className="text-sm text-ivory/55 leading-relaxed">
            {content?.intro_text?.slice(0, 140) ?? "A tavern and bar built around slowness, seasonal produce and considered hospitality."}
          </p>
        </div>

        <div>
          <h4 className="eyebrow mb-4">Explore</h4>
          <ul className="space-y-3 text-sm text-ivory/70">
            <li><Link href="/menu" className="hover:text-gold transition-colors">Menu</Link></li>
            <li><Link href="/events" className="hover:text-gold transition-colors">Events</Link></li>
            <li><Link href="/about" className="hover:text-gold transition-colors">About Us</Link></li>
            <li><Link href="/visit" className="hover:text-gold transition-colors">Visit Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4">Visit</h4>
          <ul className="space-y-3 text-sm text-ivory/70">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 text-gold shrink-0" /> {content?.address ?? "Kalyani Nagar, Pune"}</li>
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 text-gold shrink-0" /> {content?.phone ?? "+91 98765 43210"}</li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4">Follow</h4>
          <a
            href={content?.maps_link ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-ivory/70 hover:text-gold transition-colors"
          >
            <Instagram size={16} className="text-gold" /> {content?.instagram_handle ?? "@nuee.tavern"}
          </a>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-6">
        <div className="container-editorial flex flex-col sm:flex-row justify-between gap-2 text-xs text-ivory/40">
          <p>&copy; {new Date().getFullYear()} Nuée Tavern &amp; Bar. All rights reserved.</p>
          <p>Kalyani Nagar, Pune</p>
        </div>
      </div>
    </footer>
  );
}
