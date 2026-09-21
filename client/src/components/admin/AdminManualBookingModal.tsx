import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventWithSessions } from "@shared/schema";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { formatDate, formatTime } from "@/lib/utils";

export function AdminManualBookingModal({
  events,
  onClose,
}: {
  events: EventWithSessions[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    eventId: events[0]?.id ?? 0,
    sessionId: events[0]?.sessions[0]?.id ?? 0,
    name: "",
    mobile: "",
    email: "",
    guestCount: 2,
    dietaryPreferences: "",
    allergyInfo: "",
    specialRequests: "",
    status: "confirmed",
    source: "admin_manual" as "admin_manual" | "admin_complimentary",
    isComplimentary: false,
    internalNotes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = events.find((e) => e.id === Number(form.eventId));

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/bookings", { ...form, eventId: Number(form.eventId), sessionId: Number(form.sessionId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      onClose();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create booking"),
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-charcoal-deep/80" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-charcoal border border-ivory/10 p-8 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-2xl mb-6">Add Manual Booking</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event</Label>
              <Select
                value={form.eventId}
                onChange={(e) => {
                  const eventId = Number(e.target.value);
                  const ev = events.find((ev) => ev.id === eventId);
                  setForm({ ...form, eventId, sessionId: ev?.sessions[0]?.id ?? 0 });
                }}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Session</Label>
              <Select value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: Number(e.target.value) })}>
                {(selectedEvent?.sessions ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {formatDate(s.sessionDate)} · {formatTime(s.startTime)} ({s.remainingSeats} left)
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Guests</Label>
              <Input type="number" min={1} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["enquiry_received", "pending_confirmation", "confirmed", "checked_in"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 text-sm text-ivory/70">
                <input
                  type="checkbox"
                  className="accent-gold w-4 h-4"
                  checked={form.isComplimentary}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isComplimentary: e.target.checked,
                      source: e.target.checked ? "admin_complimentary" : "admin_manual",
                    })
                  }
                />
                Complimentary Booking
              </label>
            </div>
          </div>

          <div>
            <Label>Internal Notes</Label>
            <Textarea rows={2} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} />
          </div>
        </div>

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.mobile || !form.sessionId}>
            {mutation.isPending ? "Saving…" : "Create Booking"}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
