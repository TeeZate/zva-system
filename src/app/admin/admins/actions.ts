"use server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AdminUser } from "@/lib/types";

export async function listAdminUsers(): Promise<AdminUser[]> {
  const db = createAdminClient();
  const { data: rows, error } = await db
    .from("admin_users")
    .select("*, team:teams(id,name,short_name)")
    .order("created_at", { ascending: false });

  if (error || !rows) return [];

  // Fetch emails from auth.users via admin API
  const { data: authList } = await db.auth.admin.listUsers({ perPage: 200 });
  const emailMap = new Map(authList?.users?.map((u) => [u.id, u.email]) ?? []);

  return rows.map((r: any) => ({ ...r, email: emailMap.get(r.user_id) ?? "" }));
}

export async function createTeamAdmin(formData: FormData): Promise<{ error: string | null }> {
  const email = (formData.get("email") as string).trim();
  const teamId = formData.get("team_id") as string;
  const role = (formData.get("role") as string) || "team_admin";

  if (!email) return { error: "Email is required" };

  const db = createAdminClient();

  // Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/login`,
  });

  if (inviteError) {
    return { error: inviteError.message };
  }

  const userId = inviteData.user.id;

  // Upsert role record
  const { error: roleError } = await db.from("admin_users").upsert({
    user_id: userId,
    role,
    team_id: teamId || null,
    is_active: true,
  });

  if (roleError) return { error: roleError.message };
  return { error: null };
}

export async function toggleAdminActive(userId: string, isActive: boolean): Promise<{ error: string | null }> {
  const db = createAdminClient();
  const { error } = await db
    .from("admin_users")
    .update({ is_active: isActive })
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function resetAdminPassword(userId: string): Promise<{ error: string | null }> {
  const db = createAdminClient();
  // Fetch user email
  const { data: user, error: fetchErr } = await db.auth.admin.getUserById(userId);
  if (fetchErr || !user.user.email) return { error: "User not found" };

  const { error } = await db.auth.resetPasswordForEmail(user.user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/login`,
  });
  return { error: error?.message ?? null };
}

export async function listTeams() {
  const db = createAdminClient();
  const { data } = await db.from("teams").select("id, name, short_name").order("name");
  return data ?? [];
}
