"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, MapPin, Calendar, Trophy, Monitor,
  Users, Clock, Zap, TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { formatMatchDate, getStatusLabel, initials } from "@/lib/utils";
import type { Match, MatchEvent } from "@/lib/types";

const eventIcons: Record<string, string> = {
  point_home: "🏐",
  point_away: "🏐",
  set_home: "🎯",
  set_away: "🎯",
  timeout_home: "⏸️",
  timeout_away: "⏸️",
  substitution: "🔄",
  challenge: "⚡",
};

export default function MatchDetailClient({
  initialMatch,
  initialEvents,
}: {
  initialMatch: Match;
  initialEvents: MatchEvent[];
}) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents);
  const [scoreFlash, setScoreFlash] = useState<"home" | "away" | null>(null);
  const prevScoreRef = useRef({ home: initialMatch.home_sets, away: initialMatch.away_sets });

  useEffect(() => {
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (payload) => {
          const updated = payload.new as Match;
          // Detect which team scored
          if (updated.home_sets > prevScoreRef.current.home) setScoreFlash("home");
          else if (updated.away_sets > prevScoreRef.current.away) setScoreFlash("away");
          prevScoreRef.current = { home: updated.home_sets, away: updated.away_sets };
          setTimeout(() => setScoreFlash(null), 1000);
          setMatch((prev) => ({ ...prev, ...updated }));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_events", filter: `match_id=eq.${match.id}` },
        async (payload) => {
          const { data } = await supabase
            .from("match_events")
            .select("*, player:players(*)")
            .eq("id", payload.new.id)
            .single();
          if (data) setEvents((prev) => [data as MatchEvent, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "set_scores", filter: `match_id=eq.${match.id}` },
        (payload) => {
          setMatch((prev) => ({
            ...prev,
            set_scores: (prev.set_scores ?? []).map((s) =>
              s.set_number === payload.new.set_number ? { ...s, ...payload.new } : s
            ),
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match.id]);

  const isLive = match.status === "live";

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Back */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-4 flex items-center gap-3">
          <Link href="/scores" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zva-green transition-colors">
            <ChevronLeft size={16} />
            Live Scores
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
            {match.home_team?.short_name} vs {match.away_team?.short_name}
          </span>
          {isLive && (
            <Link href={`/scoreboard/${match.id}`} target="_blank" className="ml-auto">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Monitor size={14} />
                Scoreboard View
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="zva-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main scoreboard */}
          <div className="lg:col-span-2 space-y-5">
            {/* Score card */}
            <Card className="overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-3 flex items-center justify-between ${isLive ? "bg-red-50 dark:bg-red-950/20" : "bg-zinc-50 dark:bg-zinc-800/50"}`}>
                <div className="flex items-center gap-2">
                  {isLive && <span className="live-dot" />}
                  <span className={`text-sm font-bold ${isLive ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>
                    {getStatusLabel(match.status)}
                  </span>
                  {isLive && <span className="text-sm text-zinc-500">· Set {match.current_set}</span>}
                </div>
                {match.tournament && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Trophy size={12} />
                    {match.tournament.name}
                  </div>
                )}
              </div>

              <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Home */}
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-zva-green/20">
                      <AvatarImage src={match.home_team?.logo_url ?? undefined} />
                      <AvatarFallback className="text-lg">{initials(match.home_team?.name ?? "H")}</AvatarFallback>
                    </Avatar>
                    <div className="font-black text-lg text-zinc-900 dark:text-white leading-tight">
                      {match.home_team?.name}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{match.home_team?.city}</div>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        key={`home-${match.home_sets}`}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className={`text-6xl sm:text-7xl font-black score-number rounded-xl px-3 py-2 transition-colors ${
                          scoreFlash === "home"
                            ? "bg-zva-gold/20 text-zva-green"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      >
                        {match.home_sets}
                      </motion.div>
                      <span className="text-3xl font-light text-zinc-300 dark:text-zinc-600">–</span>
                      <motion.div
                        key={`away-${match.away_sets}`}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className={`text-6xl sm:text-7xl font-black score-number rounded-xl px-3 py-2 transition-colors ${
                          scoreFlash === "away"
                            ? "bg-zva-gold/20 text-zva-green"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      >
                        {match.away_sets}
                      </motion.div>
                    </div>

                    {isLive && (
                      <div className="mt-3 text-sm text-zinc-500">
                        Current: <span className="font-bold text-zinc-900 dark:text-white">{match.home_score} – {match.away_score}</span>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                      <Calendar size={11} />
                      {formatMatchDate(match.scheduled_at)}
                    </div>
                  </div>

                  {/* Away */}
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-zva-green/20">
                      <AvatarImage src={match.away_team?.logo_url ?? undefined} />
                      <AvatarFallback className="text-lg">{initials(match.away_team?.name ?? "A")}</AvatarFallback>
                    </Avatar>
                    <div className="font-black text-lg text-zinc-900 dark:text-white leading-tight">
                      {match.away_team?.name}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{match.away_team?.city}</div>
                  </div>
                </div>

                {/* Set breakdown */}
                {(match.set_scores ?? []).length > 0 && (
                  <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-xs text-zinc-400 text-center mb-4 uppercase tracking-wider font-semibold">Set Scores</div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {(match.set_scores ?? []).map((s) => (
                        <div
                          key={s.set_number}
                          className={`rounded-xl px-4 py-3 text-center min-w-[80px] border ${
                            s.is_final
                              ? "bg-zva-green/5 border-zva-green/20"
                              : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700"
                          }`}
                        >
                          <div className="text-[10px] text-zinc-400 mb-1">Set {s.set_number}</div>
                          <div className="font-black text-zinc-900 dark:text-white">
                            {s.home_points}
                            <span className="text-zinc-300 font-normal mx-1">–</span>
                            {s.away_points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Venue */}
              {match.venue && (
                <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                  <MapPin size={12} />
                  {match.venue.name}, {match.venue.city}
                  {match.attendance && <span className="ml-auto">{match.attendance.toLocaleString()} spectators</span>}
                </div>
              )}
            </Card>

            {/* Match events feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap size={16} className="text-zva-gold" />
                  Match Events
                  {isLive && <span className="live-dot ml-1" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {events.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    <AnimatePresence initial={false}>
                      {events.map((e, i) => (
                        <motion.div
                          key={e.id}
                          initial={i === 0 ? { opacity: 0, x: -20 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center gap-3 px-5 py-3 text-sm ${
                            e.type.includes("home") ? "border-l-2 border-zva-green" : "border-l-2 border-transparent"
                          }`}
                        >
                          <span className="text-base shrink-0">{eventIcons[e.type] ?? "▶"}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-white capitalize">
                              {e.type.replace(/_/g, " ")}
                            </span>
                            {e.player && (
                              <span className="text-zinc-400 ml-2">— {e.player.first_name} {e.player.last_name}</span>
                            )}
                            {e.description && (
                              <div className="text-xs text-zinc-400 truncate">{e.description}</div>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 shrink-0">Set {e.set_number}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="py-10 text-center text-zinc-400 text-sm">
                    <Zap size={28} className="mx-auto mb-2 opacity-30" />
                    No events recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Match info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Match Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "Date", value: formatMatchDate(match.scheduled_at), icon: <Calendar size={13} /> },
                  { label: "Venue", value: match.venue ? `${match.venue.name}, ${match.venue.city}` : "TBD", icon: <MapPin size={13} /> },
                  { label: "Referee", value: match.referee ?? "TBD", icon: <Users size={13} /> },
                  { label: "Competition", value: match.tournament?.name ?? "Friendly", icon: <Trophy size={13} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <span className="text-zinc-400 mt-0.5 shrink-0">{icon}</span>
                    <div>
                      <div className="text-xs text-zinc-400">{label}</div>
                      <div className="font-medium text-zinc-900 dark:text-white">{value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Match stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp size={15} className="text-zva-green" />
                  Match Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Sets Won", home: match.home_sets, away: match.away_sets, max: 5 },
                  { label: "Current Set Points", home: match.home_score, away: match.away_score, max: 25 },
                ].map(({ label, home, away, max }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                      <span className="font-bold">{home}</span>
                      <span>{label}</span>
                      <span className="font-bold">{away}</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="bg-zva-green rounded-full transition-all duration-500"
                        style={{ width: `${(home / (home + away || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-zinc-400 rounded-full flex-1 transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
