"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { getPositionLabel, initials } from "@/lib/utils";
import type { Player } from "@/lib/types";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  useEffect(() => {
    supabase
      .from("players")
      .select("*, team:teams(id,name,short_name)")
      .order("last_name")
      .then(({ data }) => {
        setPlayers((data ?? []) as Player[]);
        setLoading(false);
      });
  }, []);

  const teams = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of players) {
      if (p.team_id && p.team?.name) seen.set(p.team_id, p.team.name);
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return players.filter((p) => {
      const name = `${p.first_name} ${p.last_name}`.toLowerCase();
      const matchSearch = !q || name.includes(q);
      const matchTeam = !teamFilter || p.team_id === teamFilter;
      return matchSearch && matchTeam;
    });
  }, [players, search, teamFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Players</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{players.length} registered players</p>
        </div>
        <Link href="/admin/players/new">
          <Button variant="primary" className="gap-2">
            <Plus size={16} />
            Add Player
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
          />
        </div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
        >
          <option value="">All teams</option>
          {teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
          <p className="font-medium text-zinc-400">{search || teamFilter ? "No players match your filters" : "No players yet"}</p>
          {!search && !teamFilter && (
            <Link href="/admin/players/new" className="mt-4">
              <Button variant="primary" className="gap-2"><Plus size={15} />Add Player</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Player</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Team</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Position</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">Height</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">Nat'l</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {p.photo_url ? <AvatarImage src={p.photo_url} alt={p.first_name} /> : null}
                        <AvatarFallback className="bg-zinc-700 text-white text-xs">
                          {initials(`${p.first_name} ${p.last_name}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{p.first_name} {p.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono">
                    {p.number != null ? `#${p.number}` : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-400">
                    {p.team?.name ?? <span className="text-zinc-600">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.position ? (
                      <Badge variant="outline" className="text-xs">{getPositionLabel(p.position)}</Badge>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-400">
                    {p.height_cm ? `${p.height_cm} cm` : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {p.is_national_team && (
                      <Badge variant="gold" className="text-xs gap-1">
                        <Star size={10} />NT
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/players/${p.id}`}
                      className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                    >
                      Edit
                    </Link>
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
