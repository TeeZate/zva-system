"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase } from "@/lib/supabase";
import FileUpload from "@/components/admin/FileUpload";

export default function NewTournamentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    season: "",
    division: "premier",
    start_date: "",
    end_date: "",
    status: "upcoming",
    description: "",
    logo_url: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("tournaments").insert({
      name: form.name,
      short_name: form.short_name,
      season: form.season,
      division: form.division,
      start_date: form.start_date,
      end_date: form.end_date || null,
      status: form.status,
      description: form.description || null,
      logo_url: form.logo_url || null,
    });
    if (error) {
      toast.error("Failed to create tournament: " + error.message);
    } else {
      toast.success("Tournament created!");
      router.push("/admin/tournaments");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/tournaments" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Tournaments
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">New Tournament</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Tournament Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Tournament Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. ZVA Premier League 2026"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Short Name *</label>
                <input
                  required
                  type="text"
                  value={form.short_name}
                  onChange={(e) => set("short_name", e.target.value)}
                  placeholder="e.g. ZPL-26"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Season *</label>
                <input
                  required
                  type="text"
                  value={form.season}
                  onChange={(e) => set("season", e.target.value)}
                  placeholder="e.g. 2025/26"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Division</label>
                <select
                  value={form.division}
                  onChange={(e) => set("division", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="premier">Premier League</option>
                  <option value="division_one">Division One</option>
                  <option value="division_two">Division Two</option>
                  <option value="women">Women&apos;s League</option>
                  <option value="junior">Junior League</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Start Date *</label>
                <input
                  required
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tournament description..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600 resize-none"
              />
            </div>

            <FileUpload
              folder="logos"
              onUpload={(url) => set("logo_url", url)}
              currentUrl={form.logo_url}
              label="Tournament Logo"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                <Save size={15} />
                {saving ? "Creating..." : "Create Tournament"}
              </Button>
              <Link href="/admin/tournaments">
                <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
