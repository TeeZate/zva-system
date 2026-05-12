"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatMatchDate, getStatusColor, getStatusLabel, initials } from "@/lib/utils";
import type { Match } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const [flashing, setFlashing] = useState(false);
  const isLive = match.status === "live";

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setFlashing(true);
        setTimeout(() => setFlashing(false), 800);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <Link href={`/scores/${match.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-zva-green/40 cursor-pointer",
          isLive && "border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900"
        )}
      >
        {/* Top bar */}
        <div className={cn(
          "px-4 py-2 flex items-center justify-between text-xs",
          isLive ? "bg-red-50 dark:bg-red-950/30" : "bg-zinc-50 dark:bg-zinc-800/50"
        )}>
          <div className="flex items-center gap-2">
            {isLive && <span className="live-dot" />}
            <span className={cn("font-semibold", isLive ? "text-red-600 dark:text-red-400" : "text-zinc-500")}>
              {getStatusLabel(match.status)}
            </span>
            {match.status === "live" && (
              <span className="text-zinc-500">Set {match.current_set}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            {match.tournament && (
              <>
                <Trophy size={11} />
                <span>{match.tournament.short_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Match content */}
        <div className="p-4">
          <div className={cn("grid gap-3", compact ? "grid-cols-3 items-center" : "grid-cols-1 gap-4")}>
            {/* Home team */}
            <div className={cn("flex items-center gap-3", !compact && "justify-between")}>
              <div className="flex items-center gap-3">
                <Avatar className={compact ? "w-9 h-9" : "w-12 h-12"}>
                  <AvatarImage src={match.home_team?.logo_url ?? undefined} alt={match.home_team?.name} />
                  <AvatarFallback className="text-xs">{initials(match.home_team?.name ?? "HT")}</AvatarFallback>
                </Avatar>
                <div>
                  <div className={cn("font-bold text-zinc-900 dark:text-white leading-tight", compact ? "text-sm" : "text-base")}>
                    {compact ? match.home_team?.short_name : match.home_team?.name}
                  </div>
                  {!compact && <div className="text-xs text-zinc-400">{match.home_team?.city}</div>}
                </div>
              </div>
              {!compact && (
                <div className={cn("text-3xl font-black score-number text-zinc-900 dark:text-white", flashing && "score-flash rounded-lg px-2")}>
                  {match.home_sets}
                </div>
              )}
            </div>

            {/* Center (compact: scores; full: VS) */}
            {compact ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black score-number text-zinc-900 dark:text-white">{match.home_sets}</span>
                <span className="text-zinc-300 dark:text-zinc-600 font-bold">–</span>
                <span className="text-2xl font-black score-number text-zinc-900 dark:text-white">{match.away_sets}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                {isLive ? (
                  <div className="text-center">
                    <div className="text-xs text-zinc-400 mb-1">Current set</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black score-number text-zinc-900 dark:text-white">{match.home_score}</span>
                      <span className="text-zinc-300">:</span>
                      <span className="text-2xl font-black score-number text-zinc-900 dark:text-white">{match.away_score}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-zinc-400 px-3">VS</span>
                )}
                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
              </div>
            )}

            {/* Away team */}
            <div className={cn("flex items-center gap-3", !compact && "justify-between flex-row-reverse")}>
              <div className={cn("flex items-center gap-3", !compact && "flex-row-reverse")}>
                <Avatar className={compact ? "w-9 h-9" : "w-12 h-12"}>
                  <AvatarImage src={match.away_team?.logo_url ?? undefined} alt={match.away_team?.name} />
                  <AvatarFallback className="text-xs">{initials(match.away_team?.name ?? "AT")}</AvatarFallback>
                </Avatar>
                <div className={compact ? "" : "text-right"}>
                  <div className={cn("font-bold text-zinc-900 dark:text-white leading-tight", compact ? "text-sm" : "text-base")}>
                    {compact ? match.away_team?.short_name : match.away_team?.name}
                  </div>
                  {!compact && <div className="text-xs text-zinc-400">{match.away_team?.city}</div>}
                </div>
              </div>
              {!compact && (
                <div className={cn("text-3xl font-black score-number text-zinc-900 dark:text-white", flashing && "score-flash rounded-lg px-2")}>
                  {match.away_sets}
                </div>
              )}
            </div>
          </div>

          {/* Set scores (when finished/live) */}
          {!compact && match.set_scores && match.set_scores.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-2">
              {match.set_scores.map((s) => (
                <div key={s.set_number} className="text-center">
                  <div className="text-xs text-zinc-400 mb-0.5">Set {s.set_number}</div>
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {s.home_points}–{s.away_points}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Clock size={11} />
              <span>{formatMatchDate(match.scheduled_at)}</span>
            </div>
            {match.venue && (
              <div className="flex items-center gap-1.5">
                <MapPin size={11} />
                <span>{match.venue.name}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
