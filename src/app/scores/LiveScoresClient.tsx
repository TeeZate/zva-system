"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, CheckCircle, Calendar } from "lucide-react";
import MatchCard from "@/components/matches/MatchCard";
import { supabase } from "@/lib/supabase";
import type { Match, MatchStatus } from "@/lib/types";

const TABS: { label: string; status: MatchStatus | "all"; icon: React.ReactNode }[] = [
  { label: "All", status: "all", icon: <Trophy size={14} /> },
  { label: "Live", status: "live", icon: <span className="live-dot" /> },
  { label: "Upcoming", status: "scheduled", icon: <Calendar size={14} /> },
  { label: "Finished", status: "finished", icon: <CheckCircle size={14} /> },
];

export default function LiveScoresClient({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [activeTab, setActiveTab] = useState<MatchStatus | "all">("live");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("scores-page")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
          setLastUpdate(new Date());
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        async (payload) => {
          // Fetch full match with relations
          const { data } = await supabase
            .from("matches")
            .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(*), tournament:tournaments(*), set_scores(*)")
            .eq("id", payload.new.id)
            .single();
          if (data) setMatches((prev) => [data as unknown as Match, ...prev]);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = activeTab === "all"
    ? matches
    : matches.filter((m) => m.status === activeTab);

  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="zva-container py-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {TABS.map(({ label, status, icon }) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 ${
              activeTab === status
                ? "bg-zva-green text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zva-green hover:text-zva-green"
            }`}
          >
            {icon}
            {label}
            {status === "live" && liveCount > 0 && (
              <span className={`text-xs font-black rounded-full w-5 h-5 flex items-center justify-center ${activeTab === "live" ? "bg-white text-zva-green" : "bg-red-100 text-red-600"}`}>
                {liveCount}
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto shrink-0 flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock size={12} />
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filtered.map((match) => (
              <motion.div
                key={match.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-zinc-400"
          >
            <Trophy size={48} className="mx-auto mb-4 opacity-25" />
            <p className="font-semibold text-lg mb-2">
              {activeTab === "live" ? "No live matches right now" : `No ${activeTab} matches`}
            </p>
            <p className="text-sm">Check back soon or explore other tabs.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
