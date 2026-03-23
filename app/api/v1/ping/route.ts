import { NextResponse } from "next/server";
import { OPTIONS, withCors } from "@/lib/cors";

export { OPTIONS };

export async function GET() {
  return withCors(NextResponse.json({ status: "ok", api: "doodee-future", version: "1" }));
}
