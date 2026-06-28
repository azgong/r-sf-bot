/**
 * SERVER CLIENT
 * =============
 * Use this in API routes (app/api/.../route.ts) and server components —
 * code that runs on the server, not in the browser. This needs to handle
 * cookies differently than the browser client because it's reading the
 * user's session from the incoming request, not from the browser directly.
 *
 * WHY TWO DIFFERENT CLIENTS EXIST AT ALL:
 * Next.js runs some code in the browser and some on the server, and they
 * access cookies/auth completely differently under the hood. This is a
 * common point of confusion for beginners — just remember: UI button click
 * → browser client. API route handling a request → server client.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component, which can't
            // set cookies directly — safe to ignore here since middleware
            // handles refreshing the session in that case.
          }
        },
      },
    }
  );
}
