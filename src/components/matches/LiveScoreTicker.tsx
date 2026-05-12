"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { initials } from "@/lib/utils";
import type { Match } from "@/lib/types";

interface LiveScoreTickerProps {
  initialMatches: Match[];
}

export default function LiveScoreTicker({ initialMatches }: LiveScoreTickerProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [currentIdx, setCurrentIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("live-ticker")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
        setMatches((prev) =>
          prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-scroll through matches
  useEffect(() => {
    if (matches.length <= 1) return;
    const t = setInterval(() => setCurrentIdx((i) => (i + 1) % matches.length), 4000);
    return () => clearInterval(t);
  }, [matches.length]);

  if (matches.length === 0) return null;

  const m = matches[currentIdx];

  return (
    <div className="bg-zinc-950 text-white py-2 overflow-hidden">
      <div className="zva-container flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="live-dot" />
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
        </div>
        <div className="h-4 w-px bg-zinc-700 shrink-0" />
        <AnimatePresence mode="wait">
          <motion.div
            key={m.id + currentIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 text-sm flex-1 min-w-0"
          >
            <Link href={`/scores/${m.id}`} className="flex items-center gap-3 hover:text-zva-gold transition-colors">
              <span className="font-semibold truncate">{m.home_team?.short_name ?? "HOME"}</span>
              <span className="font-black text-base score-number text-zva-gold">{m.home_sets}</span>
              <span className="text-zinc-500">–</span>
              <span className="font-black text-base score-number text-zva-gold">{m.away_sets}</span>
              <span className="font-semibold truncate">{m.away_team?.short_name ?? "AWAY"}</span>
              <span className="text-xs text-zinc-400 shrink-0">Set {m.current_set} · {m.home_score}:{m.away_score}</span>
            </Link>
          </motion.div>
        </AnimatePresence>
        {matches.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            {matches.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? "bg-zva-gold" : "bg-zinc-600"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
