"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase, supabase } from "@/lib/supabase";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East",
  "Mashonaland West","Matabeleland North","Matabeleland South","Midlands","Masvingo",
];

export default function EditOfficialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "head_referee",
    license_number: "",
    province: "",
  });

  useEffect(() => {
    supabase.from("officials").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? "",
          role: data.role ?? "head_referee",
          license_number: data.license_number ?? "",
          province: data.province ?? "",
        });
      }
      setLoading(false);
    });
  }, [id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("officials").update({
      name: form.name,
      role: form.role,
      license_number: form.license_number || null,
      province: form.province || null,
    }).eq("id", id);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Official updated!");
      router.push("/admin/officials");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this official?")) return;
    const { error } = await adminSupabase.from("officials").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Official deleted");
      router.push("/admin/officials");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-lg">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/admin/officials" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Officials
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Edit Official</h1>
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

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button type="submit" variant="primary" disabled={saving} className="gap-2">
                  <Save size={15} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Link href="/admin/officials">
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
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
