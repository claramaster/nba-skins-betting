import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "nba_skins_player";

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (request.nextUrl.pathname === "/login") {
    if (cookie?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
  if (!cookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/draft", "/draft/:path*", "/matchs", "/scores", "/classement", "/login"],
};
