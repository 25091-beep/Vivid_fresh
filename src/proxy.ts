import { type NextRequest, NextResponse } from "next/server";

// Next.js 16: proxy.ts replaces middleware.ts
// No authentication required — single-user local app
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
