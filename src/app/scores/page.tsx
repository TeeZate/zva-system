import React from "react";
import { Wifi } from "lucide-react";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import type { Match } from "@/lib/types";
import LiveScoresClient from "./LiveScoresClient";

export const metadata = { title: "Live Scores" };
export const revalidate = 0;

async function getMatches() {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(*), tournament:tournaments(*), set_scores(*)")
      .in("status", ["live", "scheduled", "finished"])
      .order("scheduled_at", { ascending: false })
      .limit(50);
    return (data ?? []) as unknown as Match[];
  } catch {
    return [];
  }
}

export default async function ScoresPage() {
  const matches = await getMatches();
  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <Wifi size={20} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Live Scores</h1>
            <span className="live-dot" />
          </div>
          <p className="text-sm text-zinc-500">Real-time scores and match updates — synced automatically</p>
        </div>
      </div>
      <LiveScoresClient initialMatches={matches} />
    </div>
  );
}
