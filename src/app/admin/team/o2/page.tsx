import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import O2UploadPageClient from "./O2UploadClient";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export default async function O2ServerPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { flowType: "implicit" },
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const db = createAdminClient();
  const { data: adminUser } = await db
    .from("admin_users")
    .select("role, team_id, is_active")
    .eq("user_id", user.id)
    .single();

  if (!adminUser?.is_active || !adminUser.team_id) redirect("/admin/team");

  const { data: team } = await db
    .from("teams")
    .select("id, name")
    .eq("id", adminUser.team_id)
    .single();

  const { data: uploads } = await db
    .from("team_o2_uploads")
    .select("*")
    .eq("team_id", adminUser.team_id)
    .order("uploaded_at", { ascending: false });

  return (
    <O2UploadPageClient
      uploads={uploads ?? []}
      teamId={adminUser.team_id}
      teamName={team?.name ?? ""}
    />
  );
}
