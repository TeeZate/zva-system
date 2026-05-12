import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Service role client — bypasses RLS. Server-side only.
export function createAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function logSystemEvent(params: {
  type: string;
  severity?: "info" | "warning" | "error" | "critical";
  source: string;
  message: string;
  details?: Record<string, unknown>;
  user_email?: string;
}) {
  try {
    const db = createAdminClient();
    await db.from("system_events").insert({
      type: params.type,
      severity: params.severity ?? "error",
      source: params.source,
      message: params.message,
      details: params.details ?? null,
      user_email: params.user_email ?? null,
    });
  } catch {
    // Never let logging crash the calling code
  }
}
