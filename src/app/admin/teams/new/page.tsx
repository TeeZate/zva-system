"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase, supabase } from "@/lib/supabase";
import FileUpload from "@/components/admin/FileUpload";
import type { Venue } from "@/lib/types";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East",
  "Mashonaland West","Matabeleland North","Matabeleland South","Midlands","Masvingo",
];

export default function NewTeamPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    city: "",
    province: "",
    division: "premier",
    coach: "",
    founded_year: "",
    color1: "#006400",
    color2: "#FFD700",
    logo_url: "",
    home_venue_id: "",
  });

  useEffect(() => {
    supabase.from("venues").select("*").order("name").then(({ data }) => {
      setVenues((data ?? []) as Venue[]);
    });
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("teams").insert({
      name: form.name,
      short_name: form.short_name,
      city: form.city,
      province: form.province,
      division: form.division,
      coach: form.coach || null,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      colors: `${form.color1},${form.color2}`,
      logo_url: form.logo_url || null,
      home_venue_id: form.home_venue_id || null,
      wins: 0,
      losses: 0,
    });
    if (error) {
      toast.error("Failed to create team: " + error.message);
    } else {
      toast.success("Team created!");
      router.push("/admin/teams");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/teams" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Teams
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">New Team</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Team Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Team Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Harare City Volleyball Club"
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
                  placeholder="e.g. HCV"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">City *</label>
                <input
                  required
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Harare"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Province *</label>
                <select
                  required
                  value={form.province}
                  onChange={(e) => set("province", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                >
                  <option value="">Select province...</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Founded Year</label>
                <input
                  type="number"
                  value={form.founded_year}
                  onChange={(e) => set("founded_year", e.target.value)}
                  placeholder="e.g. 1985"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Head Coach</label>
              <input
                type="text"
                value={form.coach}
                onChange={(e) => set("coach", e.target.value)}
                placeholder="Coach name..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Home Venue</label>
              <select
                value={form.home_venue_id}
                onChange={(e) => set("home_venue_id", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
              >
                <option value="">No venue selected</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}, {v.city}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Team Colors</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color1}
                    onChange={(e) => set("color1", e.target.value)}
                    className="h-9 w-16 rounded bg-zinc-800 border border-zinc-700 cursor-pointer p-0.5"
                  />
                  <span className="text-xs text-zinc-500">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color2}
                    onChange={(e) => set("color2", e.target.value)}
                    className="h-9 w-16 rounded bg-zinc-800 border border-zinc-700 cursor-pointer p-0.5"
                  />
                  <span className="text-xs text-zinc-500">Secondary</span>
                </div>
                <div
                  className="flex-1 h-9 rounded-lg border border-zinc-700"
                  style={{ background: `linear-gradient(to right, ${form.color1}, ${form.color2})` }}
                />
              </div>
            </div>

            <FileUpload
              folder="logos"
              onUpload={(url) => set("logo_url", url)}
              currentUrl={form.logo_url}
              label="Team Logo"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                <Save size={15} />
                {saving ? "Creating..." : "Create Team"}
              </Button>
              <Link href="/admin/teams">
                <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
