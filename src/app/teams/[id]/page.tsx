import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, User, Trophy, Calendar, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { getDivisionLabel, initials, getPositionLabel } from "@/lib/utils";
import type { Team, Player, Match } from "@/lib/types";

export const revalidate = 60;

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createServerSupabase();

  const [teamRes, playersRes, matchesRes] = await Promise.all([
    supabase.from("teams").select("*, home_venue:venues(*)").eq("id", id).single(),
    supabase.from("players").select("*").eq("team_id", id).order("number"),
    supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), tournament:tournaments(*)")
      .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  if (!teamRes.data) notFound();

  const team = teamRes.data as unknown as Team;
  const players = (playersRes.data ?? []) as Player[];
  const matches = (matchesRes.data ?? []) as unknown as Match[];

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-4">
          <Link href="/teams" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zva-green transition-colors">
            <ChevronLeft size={16} /> Teams
          </Link>
        </div>
        {/* Team hero */}
        <div
          className="h-48 relative"
          style={{
            background: team.colors
              ? `linear-gradient(135deg, ${team.colors.split(",")[0]} 0%, ${team.colors.split(",")[1] ?? "#004000"} 100%)`
              : "linear-gradient(135deg, #006400 0%, #0a0a0a 100%)",
          }}
        />
        <div className="zva-container pb-6 -mt-16 relative">
          <Avatar className="w-24 h-24 border-4 border-white dark:border-zinc-900 shadow-xl">
            <AvatarImage src={team.logo_url ?? undefined} />
            <AvatarFallback className="text-2xl font-black">{initials(team.name)}</AvatarFallback>
          </Avatar>
          <div className="mt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">{team.name}</h1>
              <Badge variant="primary">{getDivisionLabel(team.division)}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><MapPin size={13} />{team.city}, {team.province}</span>
              {team.coach && <span className="flex items-center gap-1.5"><User size={13} />Coach: {team.coach}</span>}
              {team.founded_year && <span>Est. {team.founded_year}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="zva-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players roster */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={16} className="text-zva-green" />
                  Squad ({players.length} players)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {players.length > 0 ? (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {players.map((p) => (
                      <Link key={p.id} href={`/players/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-zva-green/10 flex items-center justify-center font-black text-zva-green text-sm shrink-0">
                          {p.number ?? "–"}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={p.photo_url ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(`${p.first_name} ${p.last_name}`)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-white group-hover:text-zva-green transition-colors truncate">
                            {p.first_name} {p.last_name}
                          </div>
                          <div className="text-xs text-zinc-400">{p.position ? getPositionLabel(p.position) : "—"}</div>
                        </div>
                        {p.is_national_team && <Badge variant="gold" className="text-[10px] shrink-0">🇿🇼 National</Badge>}
                        <div className="text-xs text-zinc-400 shrink-0">{p.height_cm ? `${p.height_cm}cm` : ""}</div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-400 text-sm">No players registered yet.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="text-base">Season Record</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[
                  { label: "Wins", value: team.wins, color: "text-zva-green" },
                  { label: "Losses", value: team.losses, color: "text-red-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
                    <div className={`text-3xl font-black ${color}`}>{value}</div>
                    <div className="text-xs text-zinc-400 mt-1">{label}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy size={14} className="text-zva-gold" />Recent Matches</CardTitle></CardHeader>
              <CardContent className="p-0">
                {matches.slice(0, 5).map((m) => {
                  const isHome = m.home_team_id === id;
                  const opponent = isHome ? m.away_team : m.home_team;
                  const ownSets = isHome ? m.home_sets : m.away_sets;
                  const oppSets = isHome ? m.away_sets : m.home_sets;
                  const result = m.status === "finished" ? (ownSets > oppSets ? "W" : "L") : "–";
                  return (
                    <Link key={m.id} href={`/scores/${m.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-sm">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${result === "W" ? "bg-green-100 text-green-700" : result === "L" ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>{result}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-white truncate">{isHome ? "vs" : "@"} {opponent?.short_name}</div>
                        <div className="text-xs text-zinc-400">{m.status === "scheduled" ? "Upcoming" : `${ownSets}–${oppSets}`}</div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
