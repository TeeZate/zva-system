"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { initials, getStatusLabel } from "@/lib/utils";
import type { Match } from "@/lib/types";

export default function ScoreboardClient({ initialMatch }: { initialMatch: Match }) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [flash, setFlash] = useState<"home" | "away" | null>(null);
  const [prevSets, setPrevSets] = useState({ home: initialMatch.home_sets, away: initialMatch.away_sets });
  const [time, setTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Real-time
  useEffect(() => {
    const channel = supabase
      .channel(`scoreboard-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (payload) => {
          const u = payload.new as Match;
          if (u.home_sets > prevSets.home) { setFlash("home"); setTimeout(() => setFlash(null), 2500); }
          else if (u.away_sets > prevSets.away) { setFlash("away"); setTimeout(() => setFlash(null), 2500); }
          setPrevSets({ home: u.home_sets, away: u.away_sets });
          setMatch((prev) => ({ ...prev, ...u }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [match.id, prevSets]);

  const isLive = match.status === "live";
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zva-green flex items-center justify-center">
            <span className="text-white font-black text-xs">ZVA</span>
          </div>
          <span className="text-sm font-semibold text-zinc-400">Zimbabwe Volleyball Association</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {match.tournament && (
            <span className="text-zinc-400">{match.tournament.name}</span>
          )}
          {isLive && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1.5 rounded-full">
              <span className="live-dot" />
              <span className="font-bold text-red-400">LIVE · SET {match.current_set}</span>
            </div>
          )}
        </div>
        <div className="text-xl font-mono font-black text-zinc-300">
          {time.toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Main scoreboard */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-3 gap-8 items-center">
            {/* Home team */}
            <motion.div
              className={`text-center transition-all duration-500 ${flash === "home" ? "scale-105" : ""}`}
            >
              <div className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center text-4xl md:text-5xl font-black border-4 border-white/10">
                {homeTeam?.logo_url ? (
                  <img src={homeTeam.logo_url} alt={homeTeam.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{initials(homeTeam?.name ?? "H")}</span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1">{homeTeam?.name}</h2>
              <p className="text-zinc-500 text-sm">{homeTeam?.city}</p>
            </motion.div>

            {/* Score center */}
            <div className="text-center">
              {/* Set score */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={match.home_sets}
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-8xl md:text-9xl font-black score-number transition-colors duration-300 ${flash === "home" ? "text-zva-gold" : "text-white"}`}
                  >
                    {match.home_sets}
                  </motion.div>
                </AnimatePresence>
                <div className="text-4xl md:text-6xl font-thin text-zinc-600">–</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={match.away_sets}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-8xl md:text-9xl font-black score-number transition-colors duration-300 ${flash === "away" ? "text-zva-gold" : "text-white"}`}
                  >
                    {match.away_sets}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Current set score */}
              {isLive && (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 inline-block">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Set {match.current_set}</div>
                  <div className="text-3xl md:text-4xl font-black score-number text-zva-gold">
                    {match.home_score} – {match.away_score}
                  </div>
                </div>
              )}

              {/* Set breakdown */}
              {(match.set_scores ?? []).length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  {(match.set_scores ?? []).map((s) => (
                    <div key={s.set_number} className="bg-white/5 rounded-lg px-3 py-2 text-center border border-white/10">
                      <div className="text-[10px] text-zinc-500 mb-1">S{s.set_number}</div>
                      <div className="text-sm font-bold">{s.home_points}–{s.away_points}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Away team */}
            <motion.div
              className={`text-center transition-all duration-500 ${flash === "away" ? "scale-105" : ""}`}
            >
              <div className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center text-4xl md:text-5xl font-black border-4 border-white/10">
                {awayTeam?.logo_url ? (
                  <img src={awayTeam.logo_url} alt={awayTeam.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{initials(awayTeam?.name ?? "A")}</span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1">{awayTeam?.name}</h2>
              <p className="text-zinc-500 text-sm">{awayTeam?.city}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Score flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="bg-zva-gold text-black text-4xl font-black rounded-3xl px-10 py-6 shadow-2xl"
            >
              POINT! {flash === "home" ? homeTeam?.short_name : awayTeam?.short_name}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-8 py-3 bg-black/30 border-t border-white/5 text-xs text-zinc-600">
        {match.venue && <span>{match.venue.name} · {match.venue.city}</span>}
        <span>zva.co.zw</span>
        <span className={match.status === "live" ? "text-red-400" : ""}>{getStatusLabel(match.status)}</span>
      </div>
    </div>
  );
}
