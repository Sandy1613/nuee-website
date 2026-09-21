import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Pencil, Copy, Archive } from "lucide-react";
import type { EventWithSessions, Event } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";

const STATUS_STYLES: Record<string, string> = {
  draft: "text-ivory/50 border-ivory/20",
  scheduled: "text-blue-300 border-blue-300/40",
  published: "text-gold border-gold/50",
  sold_out: "text-orange-300 border-orange-300/40",
  bookings_closed: "text-ivory/40 border-ivory/20",
  cancelled: "text-red-400 border-red-400/40",
  completed: "text-emerald-300 border-emerald-300/40",
  archived: "text-ivory/30 border-ivory/10",
};

const STATUS_OPTIONS = [
  "draft",
  "scheduled",
  "published",
  "sold_out",
  "bookings_closed",
  "cancelled",
  "completed",
  "archived",
];

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery<EventWithSessions[]>({ queryKey: ["/api/admin/events"] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("POST", `/api/admin/events/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] }),
  });

  const duplicate = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/events/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl mb-1">Events</h1>
          <p className="text-ivory/50 text-sm">Create, edit, publish and manage every Nuée event.</p>
        </div>
        <Link href="/admin/events/new">
          <Button size="sm"><Plus size={14} /> New Event</Button>
        </Link>
      </div>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="space-y-3">
        {(events ?? []).map((event) => (
          <div key={event.id} className="border border-ivory/10 p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 shrink-0 bg-charcoal-light overflow-hidden">
                {event.coverImageUrl && <img src={event.coverImageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-ivory truncate">{event.title}</p>
                <p className="text-xs text-ivory/40">{event.category} · {event.sessions.length} session(s) · {event.totalRemainingSeats}/{event.totalCapacity} seats left</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Badge className={STATUS_STYLES[event.status]}>{event.status.replace(/_/g, " ")}</Badge>
              <Select
                className="w-auto py-2 text-xs"
                value={event.status}
                onChange={(e) => setStatus.mutate({ id: event.id, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </Select>
              <a href={`/events/${event.slug}`} target="_blank" rel="noreferrer" title="Preview">
                <Button size="sm" variant="ghost"><Eye size={14} /></Button>
              </a>
              <Link href={`/admin/events/${event.id}`} title="Edit">
                <Button size="sm" variant="ghost"><Pencil size={14} /></Button>
              </Link>
              <Button size="sm" variant="ghost" title="Duplicate" onClick={() => duplicate.mutate(event.id)}>
                <Copy size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Archive"
                onClick={() => setStatus.mutate({ id: event.id, status: "archived" })}
              >
                <Archive size={14} />
              </Button>
              <Link href={`/admin/bookings?eventId=${event.id}`} className="text-xs text-gold underline underline-offset-4">
                Bookings
              </Link>
            </div>
          </div>
        ))}
        {events && events.length === 0 && <p className="text-ivory/50">No events yet. Create your first event.</p>}
      </div>
    </div>
  );
}
