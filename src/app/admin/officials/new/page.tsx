"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase } from "@/lib/supabase";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East",
  "Mashonaland West","Matabeleland North","Matabeleland South","Midlands","Masvingo",
];

export default function NewOfficialPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "head_referee",
    license_number: "",
    province: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("officials").insert({
      name: form.name,
      role: form.role,
      license_number: form.license_number || null,
      province: form.province || null,
    });
    if (error) {
      toast.error("Failed to add official: " + error.message);
    } else {
      toast.success("Official added!");
      router.push("/admin/officials");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/admin/officials" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Officials
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Add Official</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Official Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Full Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Official's full name"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Role *</label>
              <select
                required
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
              >
                <option value="head_referee">Head Referee</option>
                <option value="line_judge">Line Judge</option>
                <option value="scorer">Scorer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">License Number</label>
              <input
                type="text"
                value={form.license_number}
                onChange={(e) => set("license_number", e.target.value)}
                placeholder="e.g. ZVA-2024-001"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Province</label>
              <select
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
              >
                <option value="">Select province...</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                <Save size={15} />
                {saving ? "Saving..." : "Add Official"}
              </Button>
              <Link href="/admin/officials">
                <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
