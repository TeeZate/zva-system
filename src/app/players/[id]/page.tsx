import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Ruler, Flag, Hash, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { initials, getPositionLabel, formatFullDate } from "@/lib/utils";
import type { Player } from "@/lib/types";

export const revalidate = 3600;

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("players")
    .select("*, team:teams(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const player = data as unknown as Player;

  const stats = [
    { label: "Career Points", value: player.career_points, icon: "🏐", color: "text-zva-green" },
    { label: "Career Aces", value: player.career_aces, icon: "⚡", color: "text-zva-gold" },
    { label: "Career Blocks", value: player.career_blocks, icon: "🛡️", color: "text-blue-500" },
  ];

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-4">
          <Link href="/players" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zva-green transition-colors">
            <ChevronLeft size={16} /> Players
          </Link>
        </div>
        <div className="zva-gradient h-56 relative" />
        <div className="zva-container pb-8 -mt-20 relative">
          <div className="flex items-end gap-6">
            <Avatar className="w-28 h-28 border-4 border-white dark:border-zinc-900 shadow-xl shrink-0">
              <AvatarImage src={player.photo_url ?? undefined} />
              <AvatarFallback className="text-2xl font-black">{initials(`${player.first_name} ${player.last_name}`)}</AvatarFallback>
            </Avatar>
            <div className="pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white">
                  {player.first_name} {player.last_name}
                </h1>
                {player.is_national_team && <Badge variant="gold">🇿🇼 National Team</Badge>}
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-zinc-500">
                {player.position && <span className="flex items-center gap-1"><Trophy size={13} className="text-zva-green" />{getPositionLabel(player.position)}</span>}
                {player.number && <span className="flex items-center gap-1"><Hash size={13} />#{player.number}</span>}
                {player.team && (
                  <Link href={`/teams/${player.team.id}`} className="flex items-center gap-2 hover:text-zva-green transition-colors">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={player.team.logo_url ?? undefined} />
                      <AvatarFallback className="text-[8px]">{initials(player.team.name)}</AvatarFallback>
                    </Avatar>
                    {player.team.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="zva-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Career stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map(({ label, value, icon, color }) => (
                <Card key={label} className="text-center">
                  <CardContent className="p-6">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className={`text-4xl font-black ${color}`}>{value}</div>
                    <div className="text-xs text-zinc-400 mt-2">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info sidebar */}
          <Card>
            <CardHeader><CardTitle className="text-base">Player Info</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { label: "Nationality", value: player.nationality, icon: <Flag size={13} /> },
                { label: "Date of Birth", value: player.date_of_birth ? formatFullDate(player.date_of_birth) : "N/A", icon: <Calendar size={13} /> },
                { label: "Height", value: player.height_cm ? `${player.height_cm} cm` : "N/A", icon: <Ruler size={13} /> },
                { label: "Jersey Number", value: player.number ? `#${player.number}` : "N/A", icon: <Hash size={13} /> },
                { label: "Position", value: player.position ? getPositionLabel(player.position) : "N/A", icon: <Trophy size={13} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <span className="text-zinc-400 mt-0.5 shrink-0">{icon}</span>
                  <div>
                    <div className="text-xs text-zinc-400">{label}</div>
                    <div className="font-medium text-zinc-900 dark:text-white">{value}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
