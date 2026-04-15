import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];

function getDefaultRedirect(role?: string) {
  return role === "EMPLEADO" ? "/arqueo" : "/dashboard";
}

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
  const { nextUrl, auth: session } = req as NextRequest & {
    auth: { user?: { id: string; role: string } } | null;
  };

  const isPublic = PUBLIC_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // No autenticado → redirigir a login
  if (!session?.user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Autenticado en login → redirigir según rol
  if (session?.user && isPublic) {
    const redirect = getDefaultRedirect(session.user.role);
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
