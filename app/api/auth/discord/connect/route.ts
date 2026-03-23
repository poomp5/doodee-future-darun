import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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
  const session = await auth();
  const baseUrl = getBaseUrl(request);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const redirectUrl = new URL("/api/auth/signin/discord", baseUrl);
  redirectUrl.searchParams.set(
    "callbackUrl",
    new URL("/api/auth/discord/connect/callback", baseUrl).toString(),
  );

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(DISCORD_LINK_COOKIE, session.user.id, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
