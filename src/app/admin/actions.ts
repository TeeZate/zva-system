"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function signOut() {
  const cookieStore = await cookies();

  // Determine the session cookie name from the Supabase project URL
  const projectRef = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : null;

  if (projectRef && SUPABASE_ANON_KEY) {
    const storageKey = `sb-${projectRef}-auth-token`;
    // Call Supabase logout API to invalidate the refresh token server-side
    const allCookies = cookieStore.getAll();
    const sessionCookie = allCookies.find((c) => c.name === storageKey)?.value;

    if (sessionCookie) {
      try {
        // Decode the session to get the access token for the API call
        const encoded = sessionCookie.startsWith("base64-")
          ? Buffer.from(sessionCookie.slice(7), "base64url").toString()
          : sessionCookie;
        const session = JSON.parse(encoded);
        if (session?.access_token) {
          await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: "POST",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${session.access_token}`,
            },
          }).catch(() => null);
        }
      } catch {
        // Best-effort; proceed to clear cookies regardless
      }
    }

    // Clear all session cookies (single and chunked)
    for (const cookie of allCookies) {
      if (cookie.name === storageKey || cookie.name.startsWith(`${storageKey}.`)) {
        cookieStore.delete(cookie.name);
      }
    }
  }

  redirect("/admin/login");
}
