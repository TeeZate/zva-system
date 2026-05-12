import React from "react";
import Link from "next/link";
import { Plus, Calendar, Wifi, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatMatchDate, getStatusLabel, initials } from "@/lib/utils";
import type { Match } from "@/lib/types";

export const revalidate = 0;

async function getMatches() {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(*), tournament:tournaments(*)")
      .order("scheduled_at", { ascending: false })
      .limit(50);
    return (data ?? []) as unknown as Match[];
  } catch {
    return [];
  }
}

const STATUS_ICON = {
  live: <span className="live-dot" />,
  scheduled: <Clock size={13} className="text-blue-400" />,
  finished: <CheckCircle size={13} className="text-zinc-500" />,
  postponed: <Clock size={13} className="text-amber-400" />,
  cancelled: <Clock size={13} className="text-red-400" />,
};

export default async function AdminMatchesPage() {
  const matches = await getMatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Matches</h1>
          <p className="text-sm text-zinc-500 mt-1">{matches.length} matches in database</p>
        </div>
        <Link href="/admin/matches/new">
          <Button variant="primary" size="sm" className="gap-2">
            <Plus size={15} />
            Schedule Match
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {matches.map((m) => (
          <div
            key={m.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-zinc-600 transition-colors"
          >
            <div className="shrink-0">{STATUS_ICON[m.status]}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={m.home_team?.logo_url ?? undefined} />
                    <AvatarFallback className="text-[8px]">{initials(m.home_team?.name ?? "H")}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-white text-sm">{m.home_team?.short_name}</span>
                </div>
                {m.status !== "scheduled" ? (
                  <span className="font-black text-zva-gold">{m.home_sets} – {m.away_sets}</span>
                ) : (
                  <span className="text-zinc-600 text-sm font-bold">vs</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{m.away_team?.short_name}</span>
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={m.away_team?.logo_url ?? undefined} />
                    <AvatarFallback className="text-[8px]">{initials(m.away_team?.name ?? "A")}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <span>{formatMatchDate(m.scheduled_at)}</span>
                {m.tournament && <span>· {m.tournament.short_name}</span>}
                {m.venue && <span>· {m.venue.name}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {m.status === "live" && (
                <Link href={`/admin/live/${m.id}`}>
                  <Button variant="gold" size="sm" className="gap-1"><Wifi size={12} />Score</Button>
                </Link>
              )}
              {m.status === "scheduled" && (
                <Link href={`/admin/live/${m.id}`}>
                  <Button variant="primary" size="sm" className="gap-1"><Wifi size={12} />Start</Button>
                </Link>
              )}
              <Link href={`/scores/${m.id}`} target="_blank">
                <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">↗</Button>
              </Link>
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-16 text-center text-zinc-600">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold mb-3">No matches yet.</p>
              <Link href="/admin/matches/new">
                <Button variant="primary" size="sm"><Plus size={14} />Schedule First Match</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
