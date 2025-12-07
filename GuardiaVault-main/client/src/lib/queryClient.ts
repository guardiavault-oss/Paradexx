import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone response to read text without consuming the original
    const clonedRes = res.clone();
    let errorText = res.statusText;
    try {
      const contentType = clonedRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorJson = await clonedRes.json();
        errorText = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } else {
        const text = await clonedRes.text();
        // Only use first 200 chars to avoid huge HTML error pages
        errorText = text.substring(0, 200) || res.statusText;
      }
    } catch {
      // If parsing fails, use status text
      errorText = res.statusText;
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - better than Infinity
      retry: (failureCount, error: any) => {
        // Retry on network errors and 5xx errors, but not 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false; // Don't retry client errors
        }
        return failureCount < 2; // Retry up to 2 times
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Retry on network errors and 5xx errors, but not 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false; // Don't retry client errors
        }
        return failureCount < 1; // Retry once for mutations
      },
      retryDelay: 1000,
    },
  },
});
