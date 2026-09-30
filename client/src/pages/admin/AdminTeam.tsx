import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminTeam() {
  const { admin } = useAdminAuth();
  const queryClient = useQueryClient();
  const { data: team, isLoading } = useQuery<TeamMember[]>({ queryKey: ["/api/admin/team"] });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });

  const addMember = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/team", { name, email, password }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setPassword("");
      invalidate();
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/admin/team/${id}/active`, { isActive }),
    onSuccess: invalidate,
  });

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-3xl mb-1">Team</h1>
        <p className="text-ivory/50 text-sm">
          People with admin access to this dashboard. Anyone on this list can manage events, bookings, menu and
          content.
        </p>
      </div>

      <div className="border border-ivory/10 p-6">
        <h2 className="font-display text-xl mb-4">Add Team Member</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label>Temporary Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
        </div>
        {addMember.isError && (
          <p className="text-sm text-red-400 mb-3">
            {addMember.error instanceof ApiError ? addMember.error.message : "Could not add team member."}
          </p>
        )}
        <Button
          onClick={() => addMember.mutate()}
          disabled={addMember.isPending || !name || !email || password.length < 8}
        >
          {addMember.isPending ? "Adding…" : "Add Team Member"}
        </Button>
        <p className="text-xs text-ivory/35 mt-4">
          Share this password with them directly — they should change it from Settings after their first login.
        </p>
      </div>

      <div className="border border-ivory/10 p-6">
        <h2 className="font-display text-xl mb-4">Current Team</h2>
        {isLoading && <p className="text-ivory/50 text-sm">Loading…</p>}
        <div className="space-y-3">
          {(team ?? []).map((member) => (
            <div key={member.id} className="flex flex-wrap items-center justify-between gap-4 border border-ivory/10 px-5 py-4">
              <div>
                <p className="text-ivory flex items-center gap-2">
                  {member.name}
                  {!member.isActive && (
                    <span className="text-[10px] uppercase tracking-widest text-red-400 border border-red-400/40 px-2 py-0.5">
                      Deactivated
                    </span>
                  )}
                  {member.id === admin?.id && (
                    <span className="text-[10px] uppercase tracking-widest text-gold border border-gold/40 px-2 py-0.5">
                      You
                    </span>
                  )}
                </p>
                <p className="text-ivory/45 text-sm">{member.email}</p>
                <p className="text-ivory/30 text-xs mt-1">
                  {member.lastLoginAt ? `Last login ${new Date(member.lastLoginAt).toLocaleString()}` : "Never logged in"}
                </p>
              </div>
              {member.id !== admin?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive.mutate({ id: member.id, isActive: !member.isActive })}
                  disabled={toggleActive.isPending}
                >
                  {member.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
