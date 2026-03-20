import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/auth"];

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const token = await getToken({ req, secret });
  const isAuthenticated = Boolean(token);

  // Debug auth redirect loops on Vercel without leaking secrets.
  // This only logs for the most common post-login landing routes.
  if (pathname === "/" || pathname.startsWith("/profile") || pathname.startsWith("/stats")) {
    console.error("[proxy] auth check", {
      pathname,
      isPublicPath,
      hasSecret: Boolean(secret),
      secretLen: secret?.length ?? 0,
      tokenPresent: isAuthenticated,
    });
  }

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
