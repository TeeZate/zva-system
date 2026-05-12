"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronLeft, Wifi, Monitor, Minus, Plus, RotateCcw, ChevronRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, adminSupabase } from "@/lib/supabase";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Match, EventType } from "@/lib/types";

export default function LiveScoringClient({ initialMatch }: { initialMatch: Match }) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  // Real-time sync
  useEffect(() => {
    const ch = supabase
      .channel(`admin-match-${match.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (p) => setMatch((prev) => ({ ...prev, ...p.new }))
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [match.id]);

  const isLive = match.status === "live";

  async function updateScore(field: "home_score" | "away_score" | "home_sets" | "away_sets" | "current_set", delta: number) {
    const current = (match[field] as number) ?? 0;
    const newVal = Math.max(0, current + delta);
    setSaving(true);
    const patch: Record<string, number> = { [field]: newVal };
    const { error } = await adminSupabase.from("matches").update(patch).eq("id", match.id);
    if (error) toast.error("Failed to update score");
    else setMatch((prev) => ({ ...prev, [field]: newVal }));
    setSaving(false);
  }

  async function setMatchStatus(status: string) {
    setSaving(true);
    const updates: Record<string, unknown> = { status };
    if (status === "live" && match.status === "scheduled") {
      updates.current_set = 1;
      updates.home_sets = 0;
      updates.away_sets = 0;
      updates.home_score = 0;
      updates.away_score = 0;
    }
    const { error } = await adminSupabase.from("matches").update(updates).eq("id", match.id);
    if (error) toast.error("Update failed");
    else {
      setMatch((prev) => ({ ...prev, ...updates }));
      toast.success(`Match ${status === "live" ? "started" : status}`);
    }
    setSaving(false);
  }

  async function awardPoint(team: "home" | "away") {
    setSaving(true);
    const scoreField = team === "home" ? "home_score" : "away_score";
    const setsField = team === "home" ? "home_sets" : "away_sets";
    const newScore = (match[scoreField] as number) + 1;

    // Check if set is won (first to 25, or 15 in set 5, with 2-point lead)
    const opponentScore = team === "home" ? match.away_score : match.home_score;
    const setWon = (newScore >= 25 || (match.current_set === 5 && newScore >= 15)) && (newScore - opponentScore >= 2);

    let updates: Record<string, unknown> = { [scoreField]: newScore };
    const event: EventType = team === "home" ? "point_home" : "point_away";

    if (setWon) {
      const newSets = (match[setsField] as number) + 1;
      const matchWon = newSets >= 3;
      updates = {
        [setsField]: newSets,
        home_score: 0,
        away_score: 0,
        current_set: matchWon ? match.current_set : match.current_set + 1,
        status: matchWon ? "finished" : "live",
      };
      // Save set score
      await adminSupabase.from("set_scores").upsert({
        match_id: match.id,
        set_number: match.current_set,
        home_points: team === "home" ? newScore : match.home_score,
        away_points: team === "away" ? newScore : match.away_score,
        is_final: true,
      });
      toast.success(matchWon ? `Match won by ${team === "home" ? match.home_team?.name : match.away_team?.name}! 🏆` : `Set ${match.current_set} won!`);
    }

    await adminSupabase.from("match_events").insert({
      match_id: match.id,
      type: event,
      set_number: match.current_set,
      description: `Point awarded to ${team === "home" ? match.home_team?.name : match.away_team?.name}`,
    });

    const { error } = await adminSupabase.from("matches").update(updates).eq("id", match.id);
    if (error) toast.error("Update failed");
    else setMatch((prev) => ({ ...prev, ...updates }));
    setSaving(false);
  }

  async function recordEvent(type: EventType) {
    const { error } = await adminSupabase.from("match_events").insert({
      match_id: match.id,
      type,
      set_number: match.current_set,
    });
    if (error) toast.error("Failed to record event");
    else { toast.success("Event recorded"); setSelectedEvent(null); }
  }

  const EVENTS: { type: EventType; label: string; icon: string }[] = [
    { type: "timeout_home", label: `${match.home_team?.short_name} Timeout`, icon: "⏸️" },
    { type: "timeout_away", label: `${match.away_team?.short_name} Timeout`, icon: "⏸️" },
    { type: "substitution", label: "Substitution", icon: "🔄" },
    { type: "challenge", label: "Challenge", icon: "⚡" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/live" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={16} /> Live Scoring
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-300">{match.home_team?.short_name} vs {match.away_team?.short_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/scoreboard/${match.id}`} target="_blank">
            <Button variant="secondary" size="sm" className="gap-1.5 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              <Monitor size={14} /> TV View
            </Button>
          </Link>
          <Link href={`/scores/${match.id}`} target="_blank">
            <Button variant="secondary" size="sm" className="gap-1.5 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Public View
            </Button>
          </Link>
        </div>
      </div>

      {/* Match status controls */}
      {!isLive && (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-5 flex items-center gap-4 flex-wrap">
            <div className="text-sm text-zinc-400">Match Status: <Badge variant={match.status === "scheduled" ? "default" : "success"}>{match.status}</Badge></div>
            {match.status === "scheduled" && (
              <Button variant="gold" size="sm" onClick={() => setMatchStatus("live")} disabled={saving}>
                <Wifi size={14} />
                Start Match
              </Button>
            )}
            {match.status === "finished" && (
              <span className="text-sm text-zinc-500">Match has ended. <Link href="/admin/matches" className="text-zva-green hover:underline">Back to matches</Link></span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Score entry */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              {isLive && <span className="live-dot" />}
              {isLive ? `Live · Set ${match.current_set}` : "Score Entry"}
              {saving && <span className="ml-auto text-xs text-zinc-500 animate-pulse">Saving...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Set score display */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="text-center">
                <Avatar className="w-14 h-14 mx-auto mb-2">
                  <AvatarImage src={match.home_team?.logo_url ?? undefined} />
                  <AvatarFallback>{initials(match.home_team?.name ?? "H")}</AvatarFallback>
                </Avatar>
                <div className="font-bold text-white text-sm">{match.home_team?.short_name}</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black score-number text-white mb-1">
                  {match.home_sets} – {match.away_sets}
                </div>
                <div className="text-xs text-zinc-500">Sets</div>
              </div>
              <div className="text-center">
                <Avatar className="w-14 h-14 mx-auto mb-2">
                  <AvatarImage src={match.away_team?.logo_url ?? undefined} />
                  <AvatarFallback>{initials(match.away_team?.name ?? "A")}</AvatarFallback>
                </Avatar>
                <div className="font-bold text-white text-sm">{match.away_team?.short_name}</div>
              </div>
            </div>

            {/* Point buttons */}
            {isLive && (
              <div className="grid grid-cols-2 gap-6">
                {/* Home */}
                <div className="space-y-3">
                  <div className="text-center text-zva-gold font-black text-6xl score-number">{match.home_score}</div>
                  <div className="text-center text-xs text-zinc-500">{match.home_team?.name}</div>
                  <Button
                    onClick={() => awardPoint("home")}
                    disabled={saving}
                    size="lg"
                    className="w-full h-16 text-lg font-black bg-zva-green hover:bg-zva-green-dark gap-2"
                  >
                    <Plus size={22} />
                    Point
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={() => updateScore("home_score", -1)} disabled={saving} variant="secondary" size="sm" className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Minus size={14} /> Undo
                    </Button>
                    <Button onClick={() => updateScore("home_sets", 1)} disabled={saving} variant="secondary" size="sm" className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      +Set
                    </Button>
                  </div>
                </div>

                {/* Away */}
                <div className="space-y-3">
                  <div className="text-center text-zva-gold font-black text-6xl score-number">{match.away_score}</div>
                  <div className="text-center text-xs text-zinc-500">{match.away_team?.name}</div>
                  <Button
                    onClick={() => awardPoint("away")}
                    disabled={saving}
                    size="lg"
                    className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Plus size={22} />
                    Point
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={() => updateScore("away_score", -1)} disabled={saving} variant="secondary" size="sm" className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Minus size={14} /> Undo
                    </Button>
                    <Button onClick={() => updateScore("away_sets", 1)} disabled={saving} variant="secondary" size="sm" className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      +Set
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Set controls */}
            {isLive && (
              <div className="mt-6 pt-5 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 mb-3 font-semibold uppercase tracking-wider">Match Controls</div>
                <div className="flex flex-wrap gap-2">
                  {EVENTS.map(({ type, label, icon }) => (
                    <Button
                      key={type}
                      onClick={() => recordEvent(type)}
                      variant="secondary"
                      size="sm"
                      className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      disabled={saving}
                    >
                      {icon} {label}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setMatchStatus("finished")}
                    variant="destructive"
                    size="sm"
                    disabled={saving}
                    className="ml-auto"
                  >
                    <Check size={14} /> End Match
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
