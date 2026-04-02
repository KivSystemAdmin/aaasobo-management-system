const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";
const FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "";

export type ApiClientOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  backendEndpoint: string;
  cookie?: string;
  body?: BodyInit | object;
  noCache?: boolean;
  revalidateTag?: string;
  timeoutMs?: number;
};

const PROXY_URL = `${FRONTEND_ORIGIN}/api/proxy`;

const createTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
};

export const apiRequest = async <T>({
  method = "GET",
  backendEndpoint,
  cookie,
  body,
  noCache = false,
  revalidateTag,
  timeoutMs = 15000,
}: ApiClientOptions): Promise<T> => {
  const { signal, clear } = createTimeoutSignal(timeoutMs);

  try {
    let response: globalThis.Response;
    const isServerRequest = Boolean(cookie);

    if (isServerRequest) {
      const headers: HeadersInit = {
        Cookie: cookie!,
      };

      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      response = await fetch(`${BACKEND_ORIGIN}${backendEndpoint}`, {
        method,
        headers,
        body:
          body && !(body instanceof FormData) && typeof body !== "string"
            ? JSON.stringify(body)
            : (body as BodyInit | undefined),
        cache: noCache ? "no-store" : undefined,
        next: revalidateTag ? { tags: [revalidateTag] } : undefined,
        signal,
      });
    } else {
      const headers: Record<string, string> = {
        "backend-endpoint": backendEndpoint,
      };

      if (revalidateTag) headers["revalidate-tag"] = revalidateTag;
      if (noCache) headers["no-cache"] = "true";
      if (!(body instanceof FormData))
        headers["Content-Type"] = "application/json";

      response = await fetch(PROXY_URL, {
        method,
        headers,
        body:
          body && !(body instanceof FormData) && typeof body !== "string"
            ? JSON.stringify(body)
            : (body as BodyInit | undefined),
        signal,
      });
    }

    if (!response.ok) {
      const errorPayload = await response
        .json()
        .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorPayload.message || errorPayload.error);
    }

    return (await response.json()) as T;
  } finally {
    clear();
  }
};
