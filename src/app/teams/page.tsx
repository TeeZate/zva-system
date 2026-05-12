import React from "react";
import Link from "next/link";
import { Shield, MapPin, User, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { getDivisionLabel, initials } from "@/lib/utils";
import type { Team, Division } from "@/lib/types";

export const metadata = { title: "Teams" };

const DIVISIONS: Division[] = ["premier", "division_one", "division_two", "women", "junior"];

async function getTeams() {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("teams")
      .select("*, home_venue:venues(*)")
      .order("name", { ascending: true });
    return (data ?? []) as unknown as Team[];
  } catch {
    return [];
  }
}

export default async function TeamsPage() {
  const teams = await getTeams();
  const byDivision = DIVISIONS.reduce(
    (acc, div) => ({ ...acc, [div]: teams.filter((t) => t.division === div) }),
    {} as Record<Division, Team[]>
  );

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-zva-green/10 flex items-center justify-center">
              <Shield size={24} className="text-zva-green" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Teams</h1>
              <p className="text-sm text-zinc-400">{teams.length} registered clubs across Zimbabwe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="zva-container py-12 space-y-14">
        {DIVISIONS.map((div) => {
          const divTeams = byDivision[div];
          if (!divTeams.length) return null;
          return (
            <section key={div}>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">{getDivisionLabel(div)}</h2>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                <Badge variant="outline">{divTeams.length} clubs</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {divTeams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="group">
                    <Card className="h-full overflow-hidden hover:shadow-md hover:border-zva-green/30 transition-all duration-300">
                      {/* Banner */}
                      <div
                        className="h-24 relative"
                        style={{
                          background: team.colors
                            ? `linear-gradient(135deg, ${team.colors.split(",")[0]} 0%, ${team.colors.split(",")[1] ?? "#004000"} 100%)`
                            : "linear-gradient(135deg, #006400 0%, #004000 100%)",
                        }}
                      >
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }}
                        />
                        {team.division === "premier" && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="gold" className="text-[10px]">
                              <Trophy size={9} className="mr-0.5" />
                              Premier
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 -mt-8 relative">
                        <Avatar className="w-14 h-14 border-4 border-white dark:border-zinc-900 shadow-md mb-3">
                          <AvatarImage src={team.logo_url ?? undefined} />
                          <AvatarFallback className="text-sm font-black">{initials(team.name)}</AvatarFallback>
                        </Avatar>

                        <h3 className="font-black text-zinc-900 dark:text-white text-sm leading-tight group-hover:text-zva-green transition-colors mb-1">
                          {team.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                          <MapPin size={11} />
                          {team.city}, {team.province}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {team.coach && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-full px-2.5 py-1">
                              <User size={10} />
                              {team.coach}
                            </div>
                          )}
                          {team.founded_year && (
                            <div className="text-xs text-zinc-400">Est. {team.founded_year}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold">
                          <span className="text-zva-green">{team.wins}W</span>
                          <span className="text-zinc-400">·</span>
                          <span className="text-zinc-500">{team.losses}L</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
