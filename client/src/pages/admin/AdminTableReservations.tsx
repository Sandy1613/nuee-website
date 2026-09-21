import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableReservation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Select } from "@/components/ui/Field";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"];

export default function AdminTableReservations() {
  const queryClient = useQueryClient();
  const { data: reservations, isLoading } = useQuery<TableReservation[]>({ queryKey: ["/api/admin/table-reservations"] });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/admin/table-reservations/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/table-reservations"] }),
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Table Reservations</h1>
      <p className="text-ivory/50 text-sm mb-8">General "Book a Table" requests, not tied to a specific event.</p>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="overflow-x-auto border border-ivory/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ivory/40 border-b border-ivory/10">
              <th className="p-4">Reference</th>
              <th className="p-4">Guest</th>
              <th className="p-4">Party Size</th>
              <th className="p-4">Preferred Date/Time</th>
              <th className="p-4">Requests</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(reservations ?? []).map((r) => (
              <tr key={r.id} className="border-b border-ivory/5">
                <td className="p-4 text-gold">{r.reference}</td>
                <td className="p-4">
                  <p className="text-ivory">{r.name}</p>
                  <p className="text-ivory/40 text-xs">{r.mobile} {r.email && `· ${r.email}`}</p>
                </td>
                <td className="p-4">{r.partySize}</td>
                <td className="p-4">{formatDate(r.preferredDate)} · {formatTime(r.preferredTime)}</td>
                <td className="p-4 text-ivory/60 max-w-xs truncate">{r.specialRequests || "—"}</td>
                <td className="p-4">
                  <Select
                    className="w-auto py-1.5 text-xs"
                    value={r.status}
                    onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations && reservations.length === 0 && <p className="text-ivory/50 p-6">No table reservations yet.</p>}
      </div>
    </div>
  );
}
