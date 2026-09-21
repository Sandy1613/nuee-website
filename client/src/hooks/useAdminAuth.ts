import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface AdminMe {
  id: number;
  name: string;
  email: string;
}

export function useAdminAuth() {
  const query = useQuery<AdminMe | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  return {
    admin: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
