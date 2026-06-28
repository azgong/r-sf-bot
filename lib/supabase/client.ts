/**
 * BROWSER CLIENT
 * ==============
 * Use this in client components (anything with "use client" at the top) —
 * code that runs in the user's actual browser, like a button's onClick handler
 * or a form. This client automatically handles reading the user's auth
 * session from cookies, so once they're logged in, every request
 * automatically knows who they are.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
