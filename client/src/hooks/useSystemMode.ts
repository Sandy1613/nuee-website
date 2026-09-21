import { useQuery } from "@tanstack/react-query";

export interface SystemMode {
  mode: "demo" | "production";
  demoAdmin?: { email: string; password: string };
}

export function useSystemMode() {
  const query = useQuery<SystemMode>({
    queryKey: ["/api/system/mode"],
    staleTime: Infinity,
  });
  return {
    mode: query.data?.mode,
    isDemo: query.data?.mode === "demo",
    demoAdmin: query.data?.demoAdmin,
    isLoading: query.isLoading,
  };
}
