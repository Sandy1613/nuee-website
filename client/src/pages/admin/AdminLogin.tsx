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

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { admin, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && admin) navigate("/admin");
  }, [admin, isLoading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema) });

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
    <div className="min-h-screen flex items-center justify-center bg-charcoal-deep px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-display text-3xl tracking-widest2 mb-2">
            NU<span className="text-gold">É</span>E
          </div>
          <p className="eyebrow">Admin Dashboard</p>
        </div>
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
