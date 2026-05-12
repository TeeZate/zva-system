import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { FileText, CheckCircle, Clock, XCircle, Upload, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Team, TeamO2Upload } from "@/lib/types";

export const metadata = { title: "Team Portal | ZVA" };
export const revalidate = 0;

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function getTeamAdminContext() {
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

  if (!adminUser?.is_active) redirect("/admin/login");

  let team: Team | null = null;
  if (adminUser.team_id) {
    const { data } = await db.from("teams").select("*").eq("id", adminUser.team_id).single();
    team = data as Team | null;
  }

  const { data: uploads } = await db
    .from("team_o2_uploads")
    .select("*")
    .eq("team_id", adminUser.team_id)
    .order("uploaded_at", { ascending: false })
    .limit(5);

  const { data: allUploads } = await db
    .from("team_o2_uploads")
    .select("status")
    .eq("team_id", adminUser.team_id);

  const stats = {
    total: allUploads?.length ?? 0,
    pending: allUploads?.filter((u) => u.status === "pending").length ?? 0,
    approved: allUploads?.filter((u) => u.status === "approved").length ?? 0,
    rejected: allUploads?.filter((u) => u.status === "rejected").length ?? 0,
  };

  const { data: players } = await db
    .from("players")
    .select("id", { count: "exact" })
    .eq("team_id", adminUser.team_id);

  return {
    user,
    adminUser,
    team,
    recentUploads: (uploads ?? []) as TeamO2Upload[],
    stats,
    playerCount: players?.length ?? 0,
  };
}

const statusConfig = {
  pending: { label: "Pending Review", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  approved: { label: "Approved", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  return bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

export default async function TeamPortalPage() {
  const { user, team, recentUploads, stats, playerCount } = await getTeamAdminContext();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">
            {team ? team.name : "Team Portal"}
          </h1>
          <p className="text-sm text-zinc-500">
            {user.email} · FIVB Registration & O2 Forms
          </p>
        </div>
        <Link href="/admin/team/o2">
          <button className="flex items-center gap-2 bg-zva-green hover:bg-zva-green/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Upload size={15} />
            Upload O2 Form
          </button>
        </Link>
      </div>

      {/* Team card */}
      {team && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-16 h-16 rounded-xl object-contain bg-zinc-800" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zva-green/10 flex items-center justify-center">
                  <span className="text-zva-green font-black text-lg">{team.short_name}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="text-xl font-black text-white">{team.name}</div>
                <div className="text-sm text-zinc-400">{team.city}, {team.province}</div>
                <div className="text-xs text-zinc-500 mt-0.5 capitalize">{team.division.replace(/_/g, " ")}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white">{playerCount}</div>
                <div className="text-xs text-zinc-500 flex items-center gap-1 justify-end mt-0.5">
                  <Users size={11} />
                  Registered Players
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* O2 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: stats.total, color: "text-white", bg: "bg-zinc-800" },
          { label: "Pending Review", value: stats.pending, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Approved", value: stats.approved, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Rejected", value: stats.rejected, color: "text-red-400", bg: "bg-red-400/10" },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} mb-3`}>
                <FileText size={16} className={color} />
              </div>
              <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent uploads */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center justify-between">
            <span className="flex items-center gap-2"><FileText size={15} />Recent O2 Submissions</span>
            <Link href="/admin/team/o2" className="text-xs text-zva-green hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUploads.length === 0 ? (
            <div className="py-10 text-center text-zinc-600 text-sm">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No O2 forms submitted yet.</p>
              <p className="text-xs mt-1">Upload your first FIVB registration form to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentUploads.map((upload) => {
                const cfg = statusConfig[upload.status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={upload.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800"
                  >
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{upload.file_name}</div>
                      <div className="text-xs text-zinc-500">
                        {upload.season} · {upload.player_count ? `${upload.player_count} players` : "—"} · {formatBytes(upload.file_size_bytes)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                      <div className="text-xs text-zinc-600 mt-0.5">{timeAgo(upload.uploaded_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
