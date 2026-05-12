"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save, Trash2 } from "lucide-react";
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

export default function EditPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    team_id: "",
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
    async function load() {
      const [pRes, tRes] = await Promise.all([
        supabase.from("players").select("*").eq("id", id).single(),
        supabase.from("teams").select("*").order("name"),
      ]);
      if (pRes.data) {
        const p = pRes.data;
        setForm({
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          team_id: p.team_id ?? "",
          number: p.number != null ? String(p.number) : "",
          position: p.position ?? "",
          date_of_birth: p.date_of_birth ?? "",
          height_cm: p.height_cm != null ? String(p.height_cm) : "",
          nationality: p.nationality ?? "Zimbabwean",
          is_national_team: p.is_national_team ?? false,
          photo_url: p.photo_url ?? "",
          career_points: String(p.career_points ?? 0),
          career_aces: String(p.career_aces ?? 0),
          career_blocks: String(p.career_blocks ?? 0),
        });
      }
      setTeams((tRes.data ?? []) as Team[]);
      setLoading(false);
    }
    load();
  }, [id]);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("players").update({
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
    }).eq("id", id);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Player updated!");
      router.push("/admin/players");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this player? This cannot be undone.")) return;
    const { error } = await adminSupabase.from("players").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Player deleted");
      router.push("/admin/players");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/players" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Players
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Edit Player</h1>
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
                <label className="text-sm font-medium text-zinc-300">Jersey Number</label>
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

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                  <Save size={15} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Link href="/admin/players">
                  <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>
                </Link>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2"
              >
                <Trash2 size={15} />
                Delete Player
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
