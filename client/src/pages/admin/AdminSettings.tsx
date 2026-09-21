import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AuditLogRow {
  log: {
    id: number;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    ipAddress: string;
  };
  adminName: string | null;
}

export default function AdminSettings() {
  const { admin } = useAdminAuth();
  const { data: logs } = useQuery<AuditLogRow[]>({ queryKey: ["/api/admin/audit-logs"] });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const changePassword = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/admin/me/password", { currentPassword, newPassword }),
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    },
  });

  return (
    <div className="max-w-3xl space-y-12">
      <div>
        <h1 className="font-display text-3xl mb-1">Settings</h1>
        <p className="text-ivory/50 text-sm">Account security and system activity.</p>
      </div>

      <div className="border border-ivory/10 p-6">
        <h2 className="font-display text-xl mb-4">Account</h2>
        <p className="text-sm text-ivory/60 mb-1">Name: {admin?.name}</p>
        <p className="text-sm text-ivory/60 mb-6">Email: {admin?.email}</p>

        <h3 className="text-sm uppercase tracking-widest text-ivory/50 mb-3">Change Password</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        {changePassword.isError && (
          <p className="text-sm text-red-400 mb-3">
            {changePassword.error instanceof ApiError ? changePassword.error.message : "Could not change password."}
          </p>
        )}
        {success && <p className="text-sm text-emerald-400 mb-3">Password updated successfully.</p>}
        <Button
          onClick={() => changePassword.mutate()}
          disabled={changePassword.isPending || !currentPassword || newPassword.length < 8}
        >
          Update Password
        </Button>
        <p className="text-xs text-ivory/35 mt-6">
          Admin sessions expire automatically after 8 hours of inactivity for security.
        </p>
      </div>

      <div className="border border-ivory/10 p-6">
        <h2 className="font-display text-xl mb-4">Recent Activity (Audit Log)</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(logs ?? []).map((row) => (
            <div key={row.log.id} className="flex justify-between text-sm border-b border-ivory/5 pb-2">
              <span className="text-ivory/70">
                {row.adminName ?? "System"} · {row.log.action}
                {row.log.entityType && ` · ${row.log.entityType} #${row.log.entityId}`}
              </span>
              <span className="text-ivory/35 text-xs">{new Date(row.log.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {logs && logs.length === 0 && <p className="text-ivory/40 text-sm">No activity recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
