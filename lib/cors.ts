import { NextResponse } from "next/server";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-Api-Key, X-Doodee-User-Id, Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export function withCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export function corsOk(body: unknown, status = 200): NextResponse {
  return withCors(NextResponse.json(body, { status }));
}

export function corsError(message: string, status: number): NextResponse {
  return withCors(NextResponse.json({ error: message }, { status }));
}

/** สำหรับ OPTIONS preflight */
export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
