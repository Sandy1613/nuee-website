import { QueryClient, type QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.clone().json();
      if (data?.message) message = data.message;
    } catch {
      // ignore non-json error bodies
    }
    throw new ApiError(res.status, message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: unknown,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res;
}

export const getQueryFn: (opts?: { on401?: "returnNull" }) => QueryFunction<any> =
  (opts = {}) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, { credentials: "include" });
    if (opts.on401 === "returnNull" && res.status === 401) {
      return null;
    }
    await throwIfNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
