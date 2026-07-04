/**
 * Edge middleware: session presence check for protected areas.
 * Fine-grained RBAC/ABAC happens server-side in lib/permissions.ts -
 * this layer only keeps anonymous traffic out and applies basic security headers.
 */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/firm", "/client", "/partner", "/admin", "/api/documents"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (needsAuth) {
    const token = request.cookies.get("visaops_session")?.value;
    let valid = false;
    if (token && process.env.AUTH_SECRET) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
