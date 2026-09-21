import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { EventSessionWithAvailability } from "@shared/schema";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { AVAILABILITY_LABELS, AVAILABILITY_STYLES } from "@/lib/availability";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/utils";

const emptyDraft = {
  name: "",
  sessionDate: "",
  startTime: "",
  endTime: "",
  capacity: 20,
  displayPrice: "",
};

export function AdminSessionsManager({ eventId, sessions }: { eventId: number; sessions: EventSessionWithAvailability[] }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${eventId}`] });

  const createSession = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/events/${eventId}/sessions`, draft),
    onSuccess: () => {
      setDraft(emptyDraft);
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create session"),
  });

  const updateSession = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof emptyDraft }) =>
      apiRequest("PUT", `/api/admin/sessions/${id}`, data),
    onSuccess: () => {
      setEditingId(null);
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not update session"),
  });

  const deleteSession = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/sessions/${id}`),
    onSuccess: () => invalidate(),
  });

  return (
    <div className="border border-ivory/10 p-6">
      <h3 className="font-display text-xl mb-1">Sessions</h3>
      <p className="text-ivory/45 text-sm mb-6">
        Remaining seats = capacity − confirmed guest count. Capacity cannot be reduced below confirmed guests.
      </p>

      <div className="space-y-3 mb-6">
        {sessions.map((session) =>
          editingId === session.id ? (
            <SessionRowEditor
              key={session.id}
              initial={session}
              onCancel={() => setEditingId(null)}
              onSave={(data) => updateSession.mutate({ id: session.id, data })}
              saving={updateSession.isPending}
            />
          ) : (
            <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 border border-ivory/10 px-4 py-3">
              <div>
                <p className="text-ivory text-sm">{session.name} · {formatDate(session.sessionDate)}</p>
                <p className="text-ivory/40 text-xs">
                  {formatTime(session.startTime)}{session.endTime && ` – ${formatTime(session.endTime)}`} · Capacity {session.capacity} · {session.remainingSeats} left · {session.confirmedGuestCount} confirmed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={AVAILABILITY_STYLES[session.availability]}>{AVAILABILITY_LABELS[session.availability]}</Badge>
                <button className="text-xs text-gold underline underline-offset-4" onClick={() => setEditingId(session.id)}>
                  Edit
                </button>
                <button
                  className="text-ivory/40 hover:text-red-400"
                  onClick={() => confirm("Delete this session?") && deleteSession.mutate(session.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ),
        )}
        {sessions.length === 0 && <p className="text-ivory/40 text-sm">No sessions yet — add the first one below.</p>}
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div>
          <Label>Session Name</Label>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Evening" />
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={draft.sessionDate} onChange={(e) => setDraft({ ...draft, sessionDate: e.target.value })} />
        </div>
        <div>
          <Label>Start</Label>
          <Input type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
        </div>
        <div>
          <Label>End</Label>
          <Input type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
        </div>
        <div>
          <Label>Capacity</Label>
          <Input type="number" min={0} value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Display Price</Label>
          <Input value={draft.displayPrice} onChange={(e) => setDraft({ ...draft, displayPrice: e.target.value })} placeholder="Optional override" />
        </div>
      </div>
      <Button
        size="sm"
        className="mt-4"
        onClick={() => createSession.mutate()}
        disabled={createSession.isPending || !draft.name || !draft.sessionDate || !draft.startTime}
      >
        <Plus size={14} /> Add Session
      </Button>
    </div>
  );
}

function SessionRowEditor({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: EventSessionWithAvailability;
  onSave: (data: typeof emptyDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [data, setData] = useState({
    name: initial.name,
    sessionDate: initial.sessionDate,
    startTime: initial.startTime,
    endTime: initial.endTime,
    capacity: initial.capacity,
    displayPrice: initial.displayPrice,
  });

  return (
    <div className="border border-gold/30 px-4 py-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        <Input type="date" value={data.sessionDate} onChange={(e) => setData({ ...data, sessionDate: e.target.value })} />
        <Input type="time" value={data.startTime} onChange={(e) => setData({ ...data, startTime: e.target.value })} />
        <Input type="time" value={data.endTime} onChange={(e) => setData({ ...data, endTime: e.target.value })} />
        <Input type="number" min={0} value={data.capacity} onChange={(e) => setData({ ...data, capacity: Number(e.target.value) })} />
        <Input value={data.displayPrice} onChange={(e) => setData({ ...data, displayPrice: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <Button size="sm" onClick={() => onSave(data)} disabled={saving}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
