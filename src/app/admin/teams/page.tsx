import { isSupabaseConfigured, createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";
import { getDivisionLabel, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users } from "lucide-react";

export default async function TeamsAdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Users size={40} className="mb-3 opacity-40" />
        <p className="font-medium">Supabase not configured</p>
        <p className="text-sm mt-1">Add your environment variables to get started.</p>
      </div>
    );
  }

  const db = await createServerSupabase();
  const { data: teams } = await db
    .from("teams")
    .select("*")
    .order("division")
    .order("name");

  const allTeams = teams ?? [];

  // Division counts
  const divisionCounts: Record<string, number> = {};
  for (const t of allTeams) {
    divisionCounts[t.division] = (divisionCounts[t.division] ?? 0) + 1;
  }

  const divisions = ["premier", "division_one", "division_two", "women", "junior"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Teams</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{allTeams.length} teams registered</p>
        </div>
        <Link href="/admin/teams/new">
          <Button variant="primary" className="gap-2">
            <Plus size={16} />
            Add Team
          </Button>
        </Link>
      </div>

      {/* Division summary */}
      {allTeams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {divisions
            .filter((d) => divisionCounts[d])
            .map((d) => (
              <div
                key={d}
                className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-xs text-zinc-300"
              >
                <span>{getDivisionLabel(d as any)}</span>
                <span className="bg-zinc-700 text-zinc-200 rounded-full px-1.5 py-0.5 font-semibold">
                  {divisionCounts[d]}
                </span>
              </div>
            ))}
        </div>
      )}

      {allTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-zinc-400">No teams yet</p>
          <p className="text-sm mt-1">Add your first team to get started.</p>
          <Link href="/admin/teams/new" className="mt-4">
            <Button variant="primary" className="gap-2">
              <Plus size={15} />
              Add Team
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Team</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Division</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">Coach</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">W–L</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {allTeams.map((team) => (
                <tr key={team.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {team.logo_url ? (
                          <AvatarImage src={team.logo_url} alt={team.name} />
                        ) : null}
                        <AvatarFallback className="bg-zinc-700 text-white text-xs">
                          {initials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-semibold">{team.name}</p>
                        <p className="text-zinc-500 text-xs">{team.short_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {getDivisionLabel(team.division)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-400">
                    {[team.city, team.province].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-400">
                    {team.coach ?? <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 font-mono">
                    {team.wins}–{team.losses}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/teams/${team.id}`}
                        className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/teams/${team.id}/roster`}
                        className="text-xs text-zva-green hover:text-green-300 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                      >
                        Roster
                      </Link>
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
