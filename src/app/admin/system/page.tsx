import React from "react";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  Database, Shield, HardDrive, Radio, Key, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Clock, Activity,
  Users, FileText, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SystemRefreshButton from "./RefreshButton";
import type { SystemEvent } from "@/lib/types";

export const metadata = { title: "System Monitor | ZVA Admin" };
export const revalidate = 0;

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type CheckStatus = "ok" | "warn" | "error" | "skip";

interface HealthResult {
  status: CheckStatus;
  ms: number;
  message: string;
  detail?: string;
}

async function checkDatabase(): Promise<HealthResult> {
  const start = Date.now();
  try {
    const db = createAdminClient();
    const { error } = await db.from("teams").select("id").limit(1);
    const ms = Date.now() - start;
    if (error) return { status: "error", ms, message: error.message };
    return { status: ms > 800 ? "warn" : "ok", ms, message: ms > 800 ? "Connected but slow" : "Connected" };
  } catch (e) {
    return { status: "error", ms: Date.now() - start, message: String(e) };
  }
}

async function checkAuth(): Promise<HealthResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      cache: "no-store",
    });
    const ms = Date.now() - start;
    if (!res.ok) return { status: "error", ms, message: `Auth API returned ${res.status}` };
    return { status: ms > 800 ? "warn" : "ok", ms, message: ms > 800 ? "Auth API slow" : "Auth API operational" };
  } catch (e) {
    return { status: "error", ms: Date.now() - start, message: String(e) };
  }
}

async function checkStorage(): Promise<HealthResult> {
  const start = Date.now();
  try {
    const db = createAdminClient();
    const { data, error } = await db.storage.listBuckets();
    const ms = Date.now() - start;
    if (error) return { status: "error", ms, message: error.message };
    const hasO2 = data?.some((b) => b.name === "o2-forms");
    return {
      status: hasO2 ? (ms > 800 ? "warn" : "ok") : "warn",
      ms,
      message: hasO2 ? "Storage operational" : "Storage OK · o2-forms bucket not found",
      detail: hasO2 ? `Buckets: ${data?.map((b) => b.name).join(", ")}` : "Create bucket 'o2-forms' in Supabase Dashboard > Storage",
    };
  } catch (e) {
    return { status: "error", ms: Date.now() - start, message: String(e) };
  }
}

async function checkRealtime(): Promise<HealthResult> {
  const start = Date.now();
  try {
    const db = createAdminClient();
    // Check realtime by querying the matches table (which has realtime enabled)
    const { error } = await db.from("matches").select("id").limit(1);
    const ms = Date.now() - start;
    if (error) return { status: "warn", ms, message: `Realtime tables: ${error.message}` };
    return { status: ms > 800 ? "warn" : "ok", ms, message: "Realtime tables reachable", detail: "matches · set_scores · match_events · standings" };
  } catch (e) {
    return { status: "error", ms: Date.now() - start, message: String(e) };
  }
}

function checkEnvVars(): HealthResult {
  const required: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  const malformed = SUPABASE_URL.includes("/rest/v1") || SUPABASE_URL.includes("/rest") ? ["NEXT_PUBLIC_SUPABASE_URL includes path — use base URL only"] : [];

  if (missing.length > 0) return { status: "error", ms: 0, message: `Missing: ${missing.join(", ")}` };
  if (malformed.length > 0) return { status: "warn", ms: 0, message: malformed[0] };
  return { status: "ok", ms: 0, message: "All env vars present", detail: Object.keys(required).join(" · ") };
}

async function getSystemStats() {
  try {
    const db = createAdminClient();
    const [teams, players, matches, admins, o2Total, o2Pending, recentEvents] = await Promise.all([
      db.from("teams").select("id", { count: "exact" }),
      db.from("players").select("id", { count: "exact" }),
      db.from("matches").select("id", { count: "exact" }),
      db.from("admin_users").select("id", { count: "exact" }),
      db.from("team_o2_uploads").select("id", { count: "exact" }),
      db.from("team_o2_uploads").select("id", { count: "exact" }).eq("status", "pending"),
      db.from("system_events").select("*").order("created_at", { ascending: false }).limit(30),
    ]);

    return {
      teams: teams.count ?? 0,
      players: players.count ?? 0,
      matches: matches.count ?? 0,
      admins: admins.count ?? 0,
      o2Total: o2Total.count ?? 0,
      o2Pending: o2Pending.count ?? 0,
      events: (recentEvents.data ?? []) as SystemEvent[],
    };
  } catch {
    return { teams: 0, players: 0, matches: 0, admins: 0, o2Total: 0, o2Pending: 0, events: [] };
  }
}

const STATUS_CONFIG = {
  ok: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "OK" },
  warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "Warning" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", label: "Error" },
  skip: { icon: Clock, color: "text-zinc-500", bg: "bg-zinc-800", border: "border-zinc-700", label: "Unknown" },
};

const SEVERITY_CONFIG = {
  info: { color: "text-blue-400", bg: "bg-blue-400/10", label: "INFO" },
  warning: { color: "text-amber-400", bg: "bg-amber-400/10", label: "WARN" },
  error: { color: "text-red-400", bg: "bg-red-400/10", label: "ERR" },
  critical: { color: "text-rose-400", bg: "bg-rose-400/10", label: "CRIT" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  const s = Math.floor(diff / 1000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return `${s}s ago`;
}

export default async function SystemMonitorPage() {
  const [db, auth, storage, realtime, env, stats] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
    checkRealtime(),
    Promise.resolve(checkEnvVars()),
    getSystemStats(),
  ]);

  const checks: { label: string; icon: React.ElementType; result: HealthResult; description: string }[] = [
    { label: "Database", icon: Database, result: db, description: "Supabase PostgreSQL" },
    { label: "Auth API", icon: Shield, result: auth, description: "Supabase Auth service" },
    { label: "Storage", icon: HardDrive, result: storage, description: "File upload (O2 forms)" },
    { label: "Realtime", icon: Radio, result: realtime, description: "Live score subscriptions" },
    { label: "Env Vars", icon: Key, result: env, description: "Required env configuration" },
  ];

  const overallStatus = checks.some((c) => c.result.status === "error")
    ? "error"
    : checks.some((c) => c.result.status === "warn")
    ? "warn"
    : "ok";

  const overallCfg = STATUS_CONFIG[overallStatus];
  const OverallIcon = overallCfg.icon;

  const overallLabel = {
    ok: "All Systems Operational",
    warn: "Degraded — Check Warnings",
    error: "System Issues Detected",
  }[overallStatus];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">System Monitor</h1>
          <p className="text-sm text-zinc-500">Real-time health of every ZVA subsystem</p>
        </div>
        <SystemRefreshButton />
      </div>

      {/* Overall status banner */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${overallCfg.bg} ${overallCfg.border}`}>
        <OverallIcon size={20} className={overallCfg.color} />
        <span className={`font-black text-base ${overallCfg.color}`}>{overallLabel}</span>
        <span className="text-xs text-zinc-500 ml-auto">Last checked: just now</span>
      </div>

      {/* Health checks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {checks.map(({ label, icon: Icon, result, description }) => {
          const cfg = STATUS_CONFIG[result.status];
          const StatusIcon = cfg.icon;
          return (
            <Card key={label} className={`bg-zinc-900 border ${cfg.border}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <StatusIcon size={16} className={cfg.color} />
                </div>
                <div className="text-sm font-black text-white mb-0.5">{label}</div>
                <div className="text-xs text-zinc-500 mb-3">{description}</div>
                <div className={`text-xs font-medium ${cfg.color} mb-1`}>{result.message}</div>
                {result.detail && (
                  <div className="text-xs text-zinc-600 leading-relaxed">{result.detail}</div>
                )}
                {result.ms > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Zap size={10} className="text-zinc-600" />
                    <span className="text-xs text-zinc-600">{result.ms}ms</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System stats */}
      <div>
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Data Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Teams", value: stats.teams, icon: Shield, color: "text-zva-green" },
            { label: "Players", value: stats.players, icon: Users, color: "text-blue-400" },
            { label: "Matches", value: stats.matches, icon: Activity, color: "text-purple-400" },
            { label: "Admins", value: stats.admins, icon: Key, color: "text-amber-400" },
            { label: "O2 Forms", value: stats.o2Total, icon: FileText, color: "text-orange-400" },
            { label: "O2 Pending", value: stats.o2Pending, icon: Clock, color: stats.o2Pending > 0 ? "text-amber-400" : "text-zinc-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <Icon size={15} className={`${color} mb-2`} />
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System events log */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Activity size={15} />
            System Event Log
            <span className="text-xs font-normal text-zinc-500 ml-auto">Last 30 entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.events.length === 0 ? (
            <div className="py-10 text-center text-zinc-600 text-sm">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500/30" />
              <p className="font-semibold text-emerald-500/60">No system events recorded</p>
              <p className="text-xs mt-1">Events are logged automatically when errors occur (uploads, auth, DB writes).</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.events.map((event) => {
                const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.error;
                return (
                  <div key={event.id} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${sev.bg} ${sev.color} font-mono`}>
                      {sev.label}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono w-24 shrink-0">{event.source}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-zinc-200 truncate block">{event.message}</span>
                      {event.user_email && (
                        <span className="text-xs text-zinc-600">{event.user_email}</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">{timeAgo(event.created_at)}</span>
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
