"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Save, ChevronLeft } from "lucide-react";
import { adminSupabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type { Team, Tournament, Venue } from "@/lib/types";

export default function NewMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    home_team_id: "",
    away_team_id: "",
    tournament_id: "",
    venue_id: "",
    scheduled_at: "",
    referee: "",
  });

  useEffect(() => {
    async function load() {
      const [t, tour, v] = await Promise.all([
        supabase.from("teams").select("*").order("name"),
        supabase.from("tournaments").select("*").eq("status", "ongoing").order("name"),
        supabase.from("venues").select("*").order("name"),
      ]);
      setTeams((t.data ?? []) as Team[]);
      setTournaments((tour.data ?? []) as Tournament[]);
      setVenues((v.data ?? []) as Venue[]);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.home_team_id === form.away_team_id) {
      toast.error("Home and away teams must be different");
      return;
    }
    if (!form.scheduled_at) { toast.error("Please set a date and time"); return; }

    setSaving(true);
    const { data, error } = await adminSupabase.from("matches").insert({
      home_team_id: form.home_team_id,
      away_team_id: form.away_team_id,
      tournament_id: form.tournament_id || null,
      venue_id: form.venue_id || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      referee: form.referee || null,
      status: "scheduled",
      current_set: 1,
      home_sets: 0,
      away_sets: 0,
      home_score: 0,
      away_score: 0,
    }).select().single();

    if (error) {
      toast.error("Failed to create match: " + error.message);
    } else {
      toast.success("Match scheduled!");
      router.push("/admin/matches");
    }
    setSaving(false);
  }

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/matches" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Matches
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Schedule New Match</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Calendar size={16} />Match Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Home Team *</label>
                <select
                  required
                  value={form.home_team_id}
                  onChange={(e) => set("home_team_id", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Away Team *</label>
                <select
                  required
                  value={form.away_team_id}
                  onChange={(e) => set("away_team_id", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">Select team...</option>
                  {teams.filter((t) => t.id !== form.home_team_id).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={form.scheduled_at}
                onChange={(e) => set("scheduled_at", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Tournament</label>
                <select
                  value={form.tournament_id}
                  onChange={(e) => set("tournament_id", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">No tournament (Friendly)</option>
                  {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Venue</label>
                <select
                  value={form.venue_id}
                  onChange={(e) => set("venue_id", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">TBD</option>
                  {venues.map((v) => <option key={v.id} value={v.id}>{v.name}, {v.city}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Referee</label>
              <input
                type="text"
                placeholder="Referee name..."
                value={form.referee}
                onChange={(e) => set("referee", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                <Save size={15} />
                {saving ? "Scheduling..." : "Schedule Match"}
              </Button>
              <Link href="/admin/matches">
                <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
