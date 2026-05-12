import React from "react";
import Link from "next/link";
import { Users, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { initials, getPositionLabel, getPositionShort } from "@/lib/utils";
import type { Player } from "@/lib/types";

export const metadata = { title: "Players" };

async function getPlayers() {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("players")
      .select("*, team:teams(*)")
      .order("is_national_team", { ascending: false })
      .order("career_points", { ascending: false })
      .limit(100);
    return (data ?? []) as unknown as Player[];
  } catch {
    return [];
  }
}

export default async function PlayersPage() {
  const players = await getPlayers();
  const nationalTeam = players.filter((p) => p.is_national_team);
  const clubPlayers = players.filter((p) => !p.is_national_team);

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-zva-green/10 flex items-center justify-center">
              <Users size={24} className="text-zva-green" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Players</h1>
              <p className="text-sm text-zinc-400">{players.length} registered players</p>
            </div>
          </div>
        </div>
      </div>

      <div className="zva-container py-12 space-y-12">
        {/* National team */}
        {nationalTeam.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                🇿🇼 National Team
              </h2>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <Badge variant="gold">{nationalTeam.length} players</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {nationalTeam.map((p) => (
                <Link key={p.id} href={`/players/${p.id}`} className="group">
                  <Card className="text-center hover:shadow-md hover:border-zva-gold/40 transition-all duration-300 overflow-hidden">
                    <div className="h-2 bg-zva-gold" />
                    <CardContent className="p-4">
                      <Avatar className="w-14 h-14 mx-auto mb-3 ring-2 ring-zva-gold/30">
                        <AvatarImage src={p.photo_url ?? undefined} />
                        <AvatarFallback className="text-sm font-black">{initials(`${p.first_name} ${p.last_name}`)}</AvatarFallback>
                      </Avatar>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white leading-tight group-hover:text-zva-green transition-colors">
                        {p.first_name}<br />{p.last_name}
                      </div>
                      {p.position && (
                        <Badge variant="outline" className="mt-2 text-[10px] px-1.5">{getPositionShort(p.position)}</Badge>
                      )}
                      {p.number && <div className="text-xs text-zinc-400 mt-1">#{p.number}</div>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Club players */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Club Players</h2>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <Badge variant="outline">{clubPlayers.length} players</Badge>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Player</span>
              <span className="col-span-2">Position</span>
              <span className="col-span-3">Club</span>
              <span className="col-span-1 text-center">Pts</span>
              <span className="col-span-1 text-center">Ht</span>
            </div>
            {clubPlayers.map((p, i) => (
              <Link
                key={p.id}
                href={`/players/${p.id}`}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <span className="col-span-1 text-zinc-400 font-medium">{i + 1}</span>
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={p.photo_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(`${p.first_name} ${p.last_name}`)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-900 dark:text-white group-hover:text-zva-green transition-colors truncate">
                      {p.first_name} {p.last_name}
                    </div>
                    {p.number && <div className="text-xs text-zinc-400">#{p.number}</div>}
                  </div>
                </div>
                <span className="col-span-2 text-zinc-500 text-xs">
                  {p.position ? getPositionLabel(p.position) : "—"}
                </span>
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  {p.team && (
                    <>
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage src={p.team.logo_url ?? undefined} />
                        <AvatarFallback className="text-[8px]">{initials(p.team.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate">{p.team.short_name}</span>
                    </>
                  )}
                </div>
                <span className="col-span-1 text-center font-bold text-zva-green">{p.career_points}</span>
                <span className="col-span-1 text-center text-zinc-400 text-xs">{p.height_cm ?? "—"}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
