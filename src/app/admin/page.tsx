import React from "react";
import Link from "next/link";
import { Calendar, Wifi, Shield, Users, Trophy, Newspaper, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatMatchDate } from "@/lib/utils";
import type { Match } from "@/lib/types";

export const metadata = { title: "Admin Dashboard | ZVA" };
export const revalidate = 60;

async function getStats() {
  if (!isSupabaseConfigured()) return { teamCount: 0, playerCount: 0, newsCount: 0, liveMatches: [], recentMatches: [] };
  try {
    const supabase = await createServerSupabase();
    const [teams, players, liveMatches, recentMatches, news] = await Promise.all([
      supabase.from("teams").select("id", { count: "exact" }),
      supabase.from("players").select("id", { count: "exact" }),
      supabase.from("matches").select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("status", "live"),
      supabase.from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), tournament:tournaments(*)")
        .order("scheduled_at", { ascending: false })
        .limit(5),
      supabase.from("news_articles").select("id", { count: "exact" }),
    ]);

    return {
      teamCount: teams.count ?? 0,
      playerCount: players.count ?? 0,
      newsCount: news.count ?? 0,
      liveMatches: (liveMatches.data ?? []) as unknown as Match[],
      recentMatches: (recentMatches.data ?? []) as unknown as Match[],
    };
  } catch {
    return { teamCount: 0, playerCount: 0, newsCount: 0, liveMatches: [], recentMatches: [] };
  }
}

export default async function AdminDashboard() {
  const { teamCount, playerCount, newsCount, liveMatches, recentMatches } = await getStats();

  const statCards = [
    { label: "Total Teams", value: teamCount, icon: Shield, href: "/admin/teams", color: "text-zva-green" },
    { label: "Registered Players", value: playerCount, icon: Users, href: "/admin/players", color: "text-blue-400" },
    { label: "Live Matches", value: liveMatches.length, icon: Wifi, href: "/admin/live", color: "text-red-400" },
    { label: "News Articles", value: newsCount, icon: Newspaper, href: "/admin/news", color: "text-zva-gold" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Dashboard</h1>
        <p className="text-sm text-zinc-500">ZVA Admin Control Panel · Zimbabwe Volleyball Association</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Icon size={20} className={color} />
                  {label === "Live Matches" && value > 0 && <span className="live-dot" />}
                </div>
                <div className="text-3xl font-black text-white mb-1">{value}</div>
                <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live matches */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <span className="live-dot" />
              Live Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveMatches.length > 0 ? (
              liveMatches.map((m) => (
                <div key={m.id} className="bg-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="live" className="text-xs">LIVE · Set {m.current_set}</Badge>
                    <Link href={`/admin/live/${m.id}`} className="text-xs text-zva-green hover:underline">
                      Manage
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm truncate">{m.home_team?.short_name}</span>
                    <div className="flex items-center gap-2 text-2xl font-black score-number text-zva-gold">
                      {m.home_sets}<span className="text-zinc-600 text-lg font-normal">–</span>{m.away_sets}
                    </div>
                    <span className="font-semibold text-white text-sm truncate text-right">{m.away_team?.short_name}</span>
                  </div>
                  <div className="text-xs text-zinc-500 text-center mt-1">
                    Current: {m.home_score} – {m.away_score}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-600 text-sm">
                <Wifi size={28} className="mx-auto mb-2 opacity-40" />
                No live matches. <Link href="/admin/matches" className="text-zva-green hover:underline">Start one →</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent matches */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Calendar size={15} />Recent Matches</span>
              <Link href="/admin/matches" className="text-xs text-zva-green hover:underline flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMatches.map((m) => (
              <Link
                key={m.id}
                href={`/admin/matches/${m.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  m.status === "live" ? "bg-red-500" :
                  m.status === "finished" ? "bg-zinc-500" :
                  "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium text-white truncate">
                    {m.home_team?.short_name} vs {m.away_team?.short_name}
                  </div>
                  <div className="text-xs text-zinc-500">{formatMatchDate(m.scheduled_at)}</div>
                </div>
                {m.status !== "scheduled" && (
                  <span className="text-sm font-bold text-zva-gold shrink-0">
                    {m.home_sets}–{m.away_sets}
                  </span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/matches/new", label: "New Match", icon: Calendar, color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
            { href: "/admin/teams/new", label: "Add Team", icon: Shield, color: "bg-zva-green/10 text-zva-green hover:bg-zva-green/20" },
            { href: "/admin/players/new", label: "Add Player", icon: Users, color: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" },
            { href: "/admin/tournaments/new", label: "New Tournament", icon: Trophy, color: "bg-zva-gold/10 text-zva-gold hover:bg-zva-gold/20" },
            { href: "/admin/news/new", label: "Write Article", icon: Newspaper, color: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
            { href: "/admin/live", label: "Score Entry", icon: Wifi, color: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <div className={`${color} rounded-xl p-4 text-center transition-colors cursor-pointer`}>
                <Icon size={20} className="mx-auto mb-2" />
                <div className="text-xs font-semibold">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
