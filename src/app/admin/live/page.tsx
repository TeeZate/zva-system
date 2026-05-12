import React from "react";
import Link from "next/link";
import { Wifi, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatMatchDate } from "@/lib/utils";
import type { Match } from "@/lib/types";

export const revalidate = 0;

async function getMatches() {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .in("status", ["live", "scheduled"])
      .order("scheduled_at", { ascending: true })
      .limit(20);
    return (data ?? []) as unknown as Match[];
  } catch {
    return [];
  }
}

export default async function LiveScoringPage() {
  const matches = await getMatches();
  const live = matches.filter((m) => m.status === "live");
  const scheduled = matches.filter((m) => m.status === "scheduled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="live-dot" />
            Live Score Entry
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Update scores in real time — all connected viewers sync instantly</p>
        </div>
        <Link href="/admin/matches/new">
          <Button variant="primary" size="sm" className="gap-2">
            <Plus size={15} />
            New Match
          </Button>
        </Link>
      </div>

      {/* Live matches */}
      {live.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Currently Live</h2>
          {live.map((m) => (
            <Card key={m.id} className="bg-zinc-900 border-red-800/40 ring-1 ring-red-800/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="live-dot" />
                      <Badge variant="live">LIVE · Set {m.current_set}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                      <span className="font-bold text-lg">{m.home_team?.name}</span>
                      <div className="text-3xl font-black score-number text-zva-gold">
                        {m.home_sets} – {m.away_sets}
                      </div>
                      <span className="font-bold text-lg">{m.away_team?.name}</span>
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">Current set: {m.home_score} – {m.away_score}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/scoreboard/${m.id}`} target="_blank">
                      <Button variant="secondary" size="sm">TV View</Button>
                    </Link>
                    <Link href={`/admin/live/${m.id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5">
                        <Wifi size={14} />
                        Score Entry
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scheduled matches */}
      {scheduled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Scheduled — Ready to Start</h2>
          {scheduled.map((m) => (
            <Card key={m.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">{formatMatchDate(m.scheduled_at)}</div>
                    <div className="flex items-center gap-3 text-white">
                      <span className="font-bold">{m.home_team?.name}</span>
                      <span className="text-zinc-600 font-bold">vs</span>
                      <span className="font-bold">{m.away_team?.name}</span>
                    </div>
                  </div>
                  <Link href={`/admin/live/${m.id}`}>
                    <Button variant="gold" size="sm" className="gap-1.5">
                      <Wifi size={14} />
                      Start Match
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {matches.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center text-zinc-600">
            <Wifi size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-3">No active or upcoming matches.</p>
            <Link href="/admin/matches/new">
              <Button variant="primary" size="sm"><Plus size={14} />Schedule a Match</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
