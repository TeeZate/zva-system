import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import ScoutClient from "./ScoutClient";
import type { Match } from "@/lib/types";

export const revalidate = 0;

async function getAdminRole(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", userId)
      .single();
    if (!data || !data.is_active) return null;
    return data.role as string;
  } catch {
    return null;
  }
}

async function getUpcomingMatches(): Promise<Match[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, short_name),
        away_team:teams!matches_away_team_id_fkey(id, name, short_name),
        tournament:tournaments(id, name, short_name)
      `)
      .in("status", ["scheduled", "live"])
      .order("scheduled_at", { ascending: true })
      .limit(30);
    return (data ?? []) as unknown as Match[];
  } catch {
    return [];
  }
}

export default async function ScoutPage() {
  // Auth gate
  if (!isSupabaseConfigured()) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Supabase not configured.
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const role = await getAdminRole(user.id);
  const allowedRoles = ["super_admin", "statistician"];
  if (!role || !allowedRoles.includes(role)) {
    redirect("/admin");
  }

  const matches = await getUpcomingMatches();

  return <ScoutClient matches={matches} />;
}
