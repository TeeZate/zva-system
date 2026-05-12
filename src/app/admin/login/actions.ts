"use server";
import { cookies } from "next/headers";
import { logSystemEvent } from "@/lib/supabase-admin";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// @supabase/ssr 0.10.x hardcodes flowType:"pkce" in createServerClient,
// overriding any auth.flowType option we pass. PKCE breaks signInWithPassword
// on the server because it requires a URL code exchange. We bypass it entirely
// by calling the Supabase Auth REST API directly and writing the session cookie
// in the exact format @supabase/ssr expects to read it back.
export async function signIn(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data.error_description || data.msg || data.error || `Auth failed (${res.status})`;
    console.error("[signIn] Supabase API error", res.status, JSON.stringify(data));
    await logSystemEvent({
      type: "auth_failure",
      severity: "warning",
      source: "login",
      message: errMsg,
      details: { status: res.status, email },
      user_email: email,
    });
    return errMsg;
  }

  if (!data.access_token) {
    console.error("[signIn] No access_token in response", JSON.stringify(data));
    return "Sign in failed: no token returned";
  }

  // Write session cookie in @supabase/ssr base64url format.
  // Storage key matches SupabaseClient default: sb-{projectRef}-auth-token
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify(data);
  // Node.js Buffer supports "base64url" natively
  const encoded = `base64-${Buffer.from(sessionJson).toString("base64url")}`;

  const cookieStore = await cookies();
  const cookieOpts = {
    // Must NOT be httpOnly — the browser Supabase client reads this cookie
    // via document.cookie to attach the auth JWT to write requests.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: data.expires_in ?? 3600,
    path: "/",
  };

  const MAX_CHUNK = 3180;
  if (encoded.length <= MAX_CHUNK) {
    cookieStore.set(storageKey, encoded, cookieOpts);
  } else {
    // Delete the unchunked cookie in case it exists
    cookieStore.delete(storageKey);
    let i = 0;
    for (let offset = 0; offset < encoded.length; offset += MAX_CHUNK, i++) {
      cookieStore.set(`${storageKey}.${i}`, encoded.slice(offset, offset + MAX_CHUNK), cookieOpts);
    }
  }

  // Return null to signal success; the client handles navigation.
  // (redirect() in directly-invoked server actions is unreliable in Next.js 16)
  return null;
}
