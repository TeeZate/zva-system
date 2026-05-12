"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, adminSupabase } from "@/lib/supabase";
import type { Official } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  head_referee: "Head Referee",
  line_judge: "Line Judge",
  scorer: "Scorer",
};

export default function OfficialsPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("officials").select("*").order("name");
    setOfficials((data ?? []) as Official[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete official "${name}"?`)) return;
    const { error } = await adminSupabase.from("officials").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Official removed");
      setOfficials((prev) => prev.filter((o) => o.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Officials</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{officials.length} registered officials</p>
        </div>
        <Link href="/admin/officials/new">
          <Button variant="primary" className="gap-2">
            <Plus size={16} />
            Add Official
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : officials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
          <UserCheck size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-zinc-400">No officials registered</p>
          <Link href="/admin/officials/new" className="mt-4">
            <Button variant="primary" className="gap-2">
              <Plus size={15} />
              Add Official
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">License #</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Province</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {officials.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{o.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[o.role] ?? o.role}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-400 font-mono">
                    {o.license_number ?? <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-400">
                    {o.province ?? <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/officials/${o.id}`}
                        className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(o.id, o.name)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
