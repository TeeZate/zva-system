"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase, supabase } from "@/lib/supabase";
import FileUpload from "@/components/admin/FileUpload";
import type { Team } from "@/lib/types";

const POSITIONS = [
  { value: "setter", label: "Setter" },
  { value: "outside_hitter", label: "Outside Hitter" },
  { value: "middle_blocker", label: "Middle Blocker" },
  { value: "opposite", label: "Opposite" },
  { value: "libero", label: "Libero" },
  { value: "defensive_specialist", label: "Defensive Specialist" },
];

export default function NewPlayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preTeamId = searchParams.get("team_id") ?? "";

  const [teams, setTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    team_id: preTeamId,
    number: "",
    position: "",
    date_of_birth: "",
    height_cm: "",
    nationality: "Zimbabwean",
    is_national_team: false,
    photo_url: "",
    career_points: "0",
    career_aces: "0",
    career_blocks: "0",
  });

  useEffect(() => {
    supabase.from("teams").select("*").order("name").then(({ data }) => {
      setTeams((data ?? []) as Team[]);
    });
  }, []);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("players").insert({
      first_name: form.first_name,
      last_name: form.last_name,
      team_id: form.team_id || null,
      number: form.number ? parseInt(form.number) : null,
      position: form.position || null,
      date_of_birth: form.date_of_birth || null,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      nationality: form.nationality,
      is_national_team: form.is_national_team,
      photo_url: form.photo_url || null,
      career_points: parseInt(form.career_points) || 0,
      career_aces: parseInt(form.career_aces) || 0,
      career_blocks: parseInt(form.career_blocks) || 0,
    });
    if (error) {
      toast.error("Failed to create player: " + error.message);
    } else {
      toast.success("Player added!");
      router.push("/admin/players");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/players" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Players
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Add Player</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Player Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">First Name *</label>
                <input
                  required
                  type="text"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Last Name *</label>
                <input
                  required
                  type="text"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Team</label>
                <select
                  value={form.team_id}
                  onChange={(e) => set("team_id", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Jersey Number (1–99)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Position</label>
                <select
                  value={form.position}
                  onChange={(e) => set("position", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">Select position...</option>
                  {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={form.height_cm}
                  onChange={(e) => set("height_cm", e.target.value)}
                  placeholder="e.g. 185"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Date of Birth</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Nationality</label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="national_team"
                checked={form.is_national_team}
                onChange={(e) => set("is_national_team", e.target.checked)}
                className="w-4 h-4 accent-zva-green"
              />
              <label htmlFor="national_team" className="text-sm text-zinc-300">National Team Player</label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Career Points</label>
                <input
                  type="number"
                  min="0"
                  value={form.career_points}
                  onChange={(e) => set("career_points", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Career Aces</label>
                <input
                  type="number"
                  min="0"
                  value={form.career_aces}
                  onChange={(e) => set("career_aces", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Career Blocks</label>
                <input
                  type="number"
                  min="0"
                  value={form.career_blocks}
                  onChange={(e) => set("career_blocks", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                />
              </div>
            </div>

            <FileUpload
              folder="players"
              onUpload={(url) => set("photo_url", url)}
              currentUrl={form.photo_url}
              label="Player Photo"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                <Save size={15} />
                {saving ? "Saving..." : "Add Player"}
              </Button>
              <Link href="/admin/players">
                <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
