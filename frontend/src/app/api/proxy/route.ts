import { NextRequest } from "next/server";
import { getCookie } from "../../../proxy";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN;

const createBackendUrl = (backendEndpoint: string | null) => {
  if (!BACKEND_ORIGIN || !backendEndpoint) {
    throw new Error("Missing backend proxy configuration");
  }

  return `${BACKEND_ORIGIN}${backendEndpoint}`;
};

const createHeaders = (
  req: NextRequest,
  cookie: string,
  includeJsonContentType = false,
) => {
  const headers: Record<string, string> = {
    Cookie: cookie,
  };

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  const contentType = req.headers.get("content-type");
  if (
    contentType &&
    !contentType.toLowerCase().startsWith("multipart/form-data")
  ) {
    headers["Content-Type"] = contentType;
  }

  return headers;
};

const proxyRequest = async (req: NextRequest, method: string) => {
  const backendEndpoint = req.headers.get("backend-endpoint");
  const backendApiURL = createBackendUrl(backendEndpoint);
  const cookie = await getCookie();

  const noCacheHeader = req.headers.get("no-cache");
  const noCache = noCacheHeader === "true" || noCacheHeader === "no-cache";
  const revalidateTag = req.headers.get("revalidate-tag");

  const contentType = req.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const hasBody = method !== "GET" && method !== "DELETE";

  let body: BodyInit | undefined;
  if (hasBody) {
    body = isJson ? JSON.stringify(await req.json()) : await req.formData();
  }

  return fetch(backendApiURL, {
    method,
    headers: createHeaders(
      req,
      cookie,
      method === "GET" || method === "DELETE",
    ),
    body,
    cache: method === "GET" ? (noCache ? "no-store" : "default") : undefined,
    next:
      method === "GET" && revalidateTag ? { tags: [revalidateTag] } : undefined,
  });
};

export async function GET(req: NextRequest) {
  return proxyRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, "POST");
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, "PATCH");
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req, "PUT");
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req, "DELETE");
}
