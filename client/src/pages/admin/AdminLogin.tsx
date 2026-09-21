import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminLoginSchema } from "@shared/schema";
import type { z } from "zod";
import { apiRequest, ApiError } from "@/lib/queryClient";

type AdminLoginInput = z.infer<typeof adminLoginSchema>;
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSystemMode } from "@/hooks/useSystemMode";
import { DemoBanner } from "@/components/DemoBanner";
import { cn } from "@/lib/utils";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { admin, isLoading } = useAdminAuth();
  const { isDemo, demoAdmin } = useSystemMode();

  useEffect(() => {
    if (!isLoading && admin) navigate("/admin");
  }, [admin, isLoading, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema) });

  function fillDemoCredentials() {
    if (!demoAdmin) return;
    setValue("email", demoAdmin.email);
    setValue("password", demoAdmin.password);
  }

  const mutation = useMutation({
    mutationFn: async (data: AdminLoginInput) => {
      const res = await apiRequest("POST", "/api/admin/login", data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      navigate("/admin");
    },
  });

  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-charcoal-deep px-6", isDemo && "pt-9")}>
      <DemoBanner />
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-display text-3xl tracking-widest2 mb-2">
            NU<span className="text-gold">É</span>E
          </div>
          <p className="eyebrow">Admin Dashboard</p>
        </div>

        {isDemo && demoAdmin && (
          <div className="border border-amber-400/40 bg-amber-400/10 p-4 mb-6 text-sm text-amber-200">
            <p className="font-medium mb-1">Demo Mode</p>
            <p className="text-amber-200/80 mb-3">
              This is a temporary preview admin account. It does not represent a real production login and any
              changes made here reset when the server restarts.
            </p>
            <p className="text-xs mb-3">
              Email: <span className="font-mono">{demoAdmin.email}</span> · Password:{" "}
              <span className="font-mono">{demoAdmin.password}</span>
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs uppercase tracking-widest underline underline-offset-4"
            >
              Fill demo credentials
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="border border-ivory/10 p-8 space-y-5">
          <div>
            <Label>Email</Label>
            <Input type="email" autoComplete="username" {...register("email")} placeholder="admin@nuee.example" />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" autoComplete="current-password" {...register("password")} placeholder="••••••••" />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          {mutation.isError && (
            <p className="text-sm text-red-400">
              {mutation.error instanceof ApiError ? mutation.error.message : "Login failed."}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
