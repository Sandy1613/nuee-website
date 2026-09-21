import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, CheckCircle } from "lucide-react";
import type { Booking, EventWithSessions } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/utils";
import { AdminManualBookingModal } from "@/components/admin/AdminManualBookingModal";

type BookingRow = Booking & { eventTitle?: string | null; sessionName?: string | null; sessionDate?: string | null };

const STATUS_OPTIONS = ["enquiry_received", "pending_confirmation", "confirmed", "checked_in", "cancelled", "no_show"];

const STATUS_STYLES: Record<string, string> = {
  enquiry_received: "text-blue-300 border-blue-300/40",
  pending_confirmation: "text-amber-300 border-amber-300/40",
  confirmed: "text-gold border-gold/50",
  checked_in: "text-emerald-300 border-emerald-300/40",
  cancelled: "text-red-400 border-red-400/40",
  no_show: "text-ivory/40 border-ivory/20",
};

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [selected, setSelected] = useState<BookingRow | null>(null);

  const { data: events } = useQuery<EventWithSessions[]>({ queryKey: ["/api/admin/events"] });

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const queryString = params.toString();

  const { data: bookings, isLoading } = useQuery<BookingRow[]>({
    queryKey: [`/api/admin/bookings${queryString ? `?${queryString}` : ""}`],
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/admin/bookings/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] }),
  });

  const checkIn = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/bookings/${id}/checkin`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] }),
  });

  const saveNotes = useMutation({
    mutationFn: ({ id, internalNotes }: { id: number; internalNotes: string }) =>
      apiRequest("PUT", `/api/admin/bookings/${id}/notes`, { internalNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setSelected(null);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Bookings</h1>
          <p className="text-ivory/50 text-sm">Every enquiry and reservation across all events.</p>
        </div>
        <div className="flex gap-3">
          <a href={`/api/admin/bookings/export.csv${queryString ? `?${queryString}` : ""}`}>
            <Button size="sm" variant="outline"><Download size={14} /> Export CSV</Button>
          </a>
          <Button size="sm" onClick={() => setShowManualModal(true)}><Plus size={14} /> Manual Booking</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Input
          placeholder="Search name, phone, email or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </Select>
      </div>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="overflow-x-auto border border-ivory/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ivory/40 border-b border-ivory/10">
              <th className="p-4">Reference</th>
              <th className="p-4">Guest</th>
              <th className="p-4">Event / Session</th>
              <th className="p-4">Guests</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b) => (
              <tr key={b.id} className="border-b border-ivory/5 hover:bg-ivory/5">
                <td className="p-4 text-gold">{b.reference}</td>
                <td className="p-4">
                  <p className="text-ivory">{b.name}</p>
                  <p className="text-ivory/40 text-xs">{b.mobile} {b.email && `· ${b.email}`}</p>
                </td>
                <td className="p-4">
                  <p className="text-ivory/80">{b.eventTitle}</p>
                  <p className="text-ivory/40 text-xs">{b.sessionName} {b.sessionDate && `· ${formatDate(b.sessionDate)}`}</p>
                </td>
                <td className="p-4">{b.guestCount}</td>
                <td className="p-4">
                  <Select
                    className="w-auto py-1.5 text-xs"
                    value={b.status}
                    onChange={(e) => updateStatus.mutate({ id: b.id, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </Select>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <button className="text-xs text-gold underline underline-offset-4" onClick={() => setSelected(b)}>
                      Notes
                    </button>
                    {b.status !== "checked_in" && (
                      <button
                        title="Check in"
                        className="text-ivory/50 hover:text-emerald-300"
                        onClick={() => checkIn.mutate(b.id)}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings && bookings.length === 0 && (
          <p className="text-ivory/50 p-6">No bookings match these filters.</p>
        )}
      </div>

      {showManualModal && (
        <AdminManualBookingModal
          events={events ?? []}
          onClose={() => setShowManualModal(false)}
        />
      )}

      {selected && (
        <NotesModal
          booking={selected}
          onClose={() => setSelected(null)}
          onSave={(notes) => saveNotes.mutate({ id: selected.id, internalNotes: notes })}
        />
      )}
    </div>
  );
}

function NotesModal({
  booking,
  onClose,
  onSave,
}: {
  booking: BookingRow;
  onClose: () => void;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(booking.internalNotes ?? "");
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-charcoal-deep/80" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-charcoal border border-ivory/10 p-8">
        <h3 className="font-display text-2xl mb-1">{booking.name}</h3>
        <p className="text-ivory/40 text-sm mb-6">{booking.reference}</p>
        <div className="space-y-3 text-sm mb-6">
          <p><span className="text-ivory/40">Dietary:</span> {booking.dietaryPreferences || "—"}</p>
          <p><span className="text-ivory/40">Allergies:</span> {booking.allergyInfo || "—"}</p>
          <p><span className="text-ivory/40">Special Requests:</span> {booking.specialRequests || "—"}</p>
        </div>
        <label className="block text-xs uppercase tracking-widest text-ivory/50 mb-2">Internal Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full bg-transparent border border-ivory/20 px-4 py-3 text-sm focus:outline-none focus:border-gold"
        />
        <div className="flex gap-3 mt-6">
          <Button onClick={() => onSave(notes)}>Save Notes</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
