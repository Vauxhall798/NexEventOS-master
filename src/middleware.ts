import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// A plain `withAuth` middleware would redirect an unauthenticated *API*
// request to /login too — the client's `fetch(...).then(r => r.json())`
// would then try to parse the login page's HTML as JSON. Handling API vs
// page requests separately here keeps API error handling consistent with
// the rest of the app (src/lib/apiError.ts's JSON-error convention).
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApiRequest = req.nextUrl.pathname.startsWith("/api/");

  if (!token) {
    if (isApiRequest) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login (the sign-in page itself)
     * - /api/auth/* (NextAuth's own endpoints)
     * - Next.js internals and static assets
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
