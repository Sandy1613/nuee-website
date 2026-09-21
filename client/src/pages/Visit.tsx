import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Clock, Car } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/Button";
import { useTableBookingModal } from "@/context/TableBookingModalContext";

const GALLERY = [
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=900&auto=format&fit=crop",
];

export default function Visit() {
  const { open } = useTableBookingModal();
  const { data: content } = useQuery<Record<string, string>>({ queryKey: ["/api/website-content"] });

  return (
    <div className="pt-40 pb-28">
      <div className="container-editorial mb-16">
        <Reveal>
          <SectionHeading eyebrow="Visit Us" title="Nuée Tavern & Bar" description="Kalyani Nagar, Pune" />
        </Reveal>
      </div>

      <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 mb-28">
        <Reveal className="space-y-8">
          <div className="flex gap-4">
            <MapPin className="text-gold shrink-0 mt-1" size={20} />
            <div>
              <p className="eyebrow mb-1">Address</p>
              <p className="text-ivory/70">{content?.address}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Clock className="text-gold shrink-0 mt-1" size={20} />
            <div>
              <p className="eyebrow mb-1">Opening Hours</p>
              <p className="text-ivory/70">{content?.hours}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Phone className="text-gold shrink-0 mt-1" size={20} />
            <div>
              <p className="eyebrow mb-1">Telephone</p>
              <p className="text-ivory/70">{content?.phone}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Car className="text-gold shrink-0 mt-1" size={20} />
            <div>
              <p className="eyebrow mb-1">Parking &amp; Dining</p>
              <p className="text-ivory/70">{content?.parking_info}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <a href={content?.maps_link ?? "#"} target="_blank" rel="noreferrer">
              <Button variant="outline">Google Maps</Button>
            </a>
            <Button onClick={open}>Book a Table</Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1400&auto=format&fit=crop"
              alt="Nuée Tavern & Bar exterior"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="container-editorial">
        <Reveal>
          <p className="eyebrow mb-8">Gallery</p>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {GALLERY.map((src, i) => (
            <Reveal key={src} delay={i * 0.05} className="aspect-square overflow-hidden group">
              <img src={src} alt="Nuée" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
