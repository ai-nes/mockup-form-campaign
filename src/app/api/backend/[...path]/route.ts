import { NextRequest, NextResponse } from "next/server";

/**
 * Chuyển tiếp các lời gọi công khai của form sang crm-backend (`/api/v1/...`).
 * Trình duyệt chỉ gọi cùng origin nên không cần CORS, và địa chỉ backend nằm ở
 * biến môi trường phía server `CRM_BACKEND_URL`.
 */
const ROUTES: { method: string; pattern: RegExp }[] = [
  { method: "GET", pattern: /^public\/(provinces|wards|high-schools|majors|campuses|campaigns)$/ },
  { method: "POST", pattern: /^leads\/intake$/ },
];

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept", "idempotency-key"];
const RELAYED_RESPONSE_HEADERS = ["content-type", "retry-after", "cache-control"];
const TIMEOUT_MS = 15_000;

function backendBase(): string | null {
  const url = process.env.CRM_BACKEND_URL?.trim().replace(/\/+$/, "");
  return url || null;
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!ROUTES.some((route) => route.method === req.method && route.pattern.test(path))) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
  }

  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      { error: { code: "BACKEND_NOT_CONFIGURED", message: "Chưa cấu hình CRM_BACKEND_URL." } },
      { status: 503 },
    );
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Backend giới hạn tần suất theo IP người gửi, không phải IP của máy chủ form.
  const client = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
  if (client) headers.set("x-forwarded-for", client);

  try {
    const upstream = await fetch(`${base}/api/v1/${path}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const relayed = new Headers();
    for (const name of RELAYED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) relayed.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers: relayed });
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "Không kết nối được máy chủ CRM." } },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
