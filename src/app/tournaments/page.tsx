import React from "react";
import Link from "next/link";
import { Trophy, Calendar, ChevronRight, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { getDivisionLabel, formatFullDate, initials } from "@/lib/utils";
import type { Tournament, Standing } from "@/lib/types";

export const metadata = { title: "Tournaments & Standings" };

const STATUS_STYLES = {
  ongoing: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

async function getData() {
  if (!isSupabaseConfigured()) return { tournaments: [], standings: [] };
  try {
    const supabase = await createServerSupabase();
    const [tourRes, standRes] = await Promise.all([
      supabase.from("tournaments").select("*").order("start_date", { ascending: false }),
      supabase
        .from("standings")
        .select("*, team:teams(*), tournament:tournaments(*)")
        .order("position", { ascending: true }),
    ]);
    return {
      tournaments: (tourRes.data ?? []) as Tournament[],
      standings: (standRes.data ?? []) as unknown as Standing[],
    };
  } catch {
    return { tournaments: [], standings: [] };
  }
}

export default async function TournamentsPage() {
  const { tournaments, standings } = await getData();
  const ongoing = tournaments.filter((t) => t.status === "ongoing");
  const upcoming = tournaments.filter((t) => t.status === "upcoming");
  const completed = tournaments.filter((t) => t.status === "completed");

  function getStandings(tournId: string) {
    return standings.filter((s) => s.tournament_id === tournId);
  }

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zva-gold/10 flex items-center justify-center">
              <Trophy size={24} className="text-zva-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Tournaments & Standings</h1>
              <p className="text-sm text-zinc-400">{ongoing.length} active competitions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="zva-container py-12 space-y-14">
        {/* Ongoing */}
        {ongoing.map((t) => {
          const ts = getStandings(t.id);
          return (
            <section key={t.id}>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="live-dot" />
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white">{t.name}</h2>
                  <Badge className={STATUS_STYLES[t.status]}>Active</Badge>
                  <Badge variant="outline">{getDivisionLabel(t.division)}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Calendar size={13} />
                  {formatFullDate(t.start_date)} – {t.end_date ? formatFullDate(t.end_date) : "TBD"}
                </div>
              </div>

              {ts.length > 0 ? (
                <Card className="overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-zva-green text-white text-xs font-bold uppercase tracking-wider">
                    <span className="col-span-1 text-center">#</span>
                    <span className="col-span-4">Team</span>
                    <span className="col-span-1 text-center">P</span>
                    <span className="col-span-1 text-center">W</span>
                    <span className="col-span-1 text-center">L</span>
                    <span className="col-span-2 text-center">Sets W–L</span>
                    <span className="col-span-2 text-center font-black">Pts</span>
                  </div>
                  {ts.map((s, i) => (
                    <div
                      key={s.id}
                      className={`grid grid-cols-12 gap-2 px-5 py-3.5 text-sm items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                        i < 2 ? "border-l-4 border-l-zva-gold" : i < 4 ? "border-l-4 border-l-zva-green/40" : ""
                      }`}
                    >
                      <span className={`col-span-1 text-center font-black text-base ${
                        i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-600" : "text-zinc-400"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={s.team?.logo_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">{initials(s.team?.name ?? "T")}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold truncate text-zinc-900 dark:text-white">
                            <Link href={`/teams/${s.team_id}`} className="hover:text-zva-green transition-colors">
                              {s.team?.name}
                            </Link>
                          </div>
                          <div className="text-xs text-zinc-400 truncate">{s.team?.city}</div>
                        </div>
                      </div>
                      <span className="col-span-1 text-center text-zinc-500">{s.played}</span>
                      <span className="col-span-1 text-center text-zinc-500">{s.won}</span>
                      <span className="col-span-1 text-center text-zinc-500">{s.lost}</span>
                      <span className="col-span-2 text-center text-zinc-500 text-xs">{s.sets_won}–{s.sets_lost}</span>
                      <div className="col-span-2 text-center">
                        <span className="font-black text-zva-green text-lg">{s.league_points}</span>
                      </div>
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-zva-gold" />
                      Promotion zone
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-zva-green/30" />
                      Continental qualification
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="py-10 text-center text-zinc-400 text-sm">
                  Standings will appear once matches are played.
                </Card>
              )}
            </section>
          );
        })}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Upcoming Competitions</h2>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map((t) => (
                <Card key={t.id} className="hover:shadow-md hover:border-zva-green/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0">
                        <Trophy size={18} className="text-blue-500" />
                      </div>
                      <Badge className={STATUS_STYLES.upcoming}>Upcoming</Badge>
                    </div>
                    <h3 className="font-black text-zinc-900 dark:text-white mb-1">{t.name}</h3>
                    <div className="text-xs text-zinc-400 mb-3">{getDivisionLabel(t.division)}</div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar size={11} />
                      Starts {formatFullDate(t.start_date)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Past Seasons</h2>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {completed.map((t) => (
                <Card key={t.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-5">
                    <Badge className={STATUS_STYLES.completed + " mb-3"}>Completed</Badge>
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">{t.name}</h3>
                    <div className="text-xs text-zinc-400">{getDivisionLabel(t.division)} · Season {t.season}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
