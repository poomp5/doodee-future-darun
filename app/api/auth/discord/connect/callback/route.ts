import { NextRequest, NextResponse } from "next/server";
import { DISCORD_LINK_COOKIE } from "@/lib/auth-linked-accounts";

function getBaseUrl(request: NextRequest) {
  const configuredBaseUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/profile?connected=discord", getBaseUrl(request)),
  );
  response.cookies.delete(DISCORD_LINK_COOKIE);
  return response;
}
