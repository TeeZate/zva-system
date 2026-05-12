"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trophy, Image, BarChart2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { getDivisionLabel } from "@/lib/utils";
import type { Tournament } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setTournaments((data ?? []) as Tournament[]);
        setLoading(false);
      });
  }, []);

  function fmt(d: string | null) {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Tournaments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{tournaments.length} tournaments</p>
        </div>
        <Link href="/admin/tournaments/new">
          <Button variant="primary" className="gap-2">
            <Plus size={16} />
            New Tournament
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-48 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
          <Trophy size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-zinc-400">No tournaments yet</p>
          <Link href="/admin/tournaments/new" className="mt-4">
            <Button variant="primary" className="gap-2"><Plus size={15} />New Tournament</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate">{t.name}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{t.season}</p>
                </div>
                {t.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo_url} alt={t.name} className="h-10 w-10 object-contain rounded" />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">{getDivisionLabel(t.division)}</Badge>
                <span
                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLES[t.status] ?? STATUS_STYLES.completed}`}
                >
                  {t.status}
                </span>
              </div>

              <p className="text-xs text-zinc-500">
                {fmt(t.start_date)}{t.end_date ? ` — ${fmt(t.end_date)}` : ""}
              </p>

              <div className="flex gap-2 pt-1">
                <Link href={`/admin/tournaments/${t.id}`} className="flex-1">
                  <Button variant="ghost" className="w-full text-xs gap-1.5 text-zinc-400 hover:text-white">
                    <Pencil size={12} />Edit
                  </Button>
                </Link>
                <Link href={`/admin/tournaments/${t.id}/gallery`} className="flex-1">
                  <Button variant="ghost" className="w-full text-xs gap-1.5 text-zinc-400 hover:text-white">
                    <Image size={12} />Gallery
                  </Button>
                </Link>
                <Link href={`/standings?tournament=${t.id}`} className="flex-1">
                  <Button variant="ghost" className="w-full text-xs gap-1.5 text-zinc-400 hover:text-white">
                    <BarChart2 size={12} />Standings
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
