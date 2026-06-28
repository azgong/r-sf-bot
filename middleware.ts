/**
 * MIDDLEWARE
 * ==========
 * Next.js runs this on every request, before any page loads. Its one job
 * here is keeping the user's Supabase auth session "fresh" — auth tokens
 * expire periodically, and this is what silently refreshes them in the
 * background so a logged-in student doesn't randomly get logged out mid-
 * conversation. Without this file, sessions can behave inconsistently
 * between server components and API routes.
 *
 * You generally don't need to touch this file — it's plumbing, not
 * something you'll customize for your coaching logic.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touching getUser() is what actually triggers the refresh if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
