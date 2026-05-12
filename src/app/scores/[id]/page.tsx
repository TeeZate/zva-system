import React from "react";
import { notFound } from "next/navigation";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import type { Match } from "@/lib/types";
import MatchDetailClient from "./MatchDetailClient";

export const revalidate = 0;

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createServerSupabase();

  const { data: match } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*, players(*)), away_team:teams!matches_away_team_id_fkey(*, players(*)), venue:venues(*), tournament:tournaments(*), set_scores(*)")
    .eq("id", id)
    .single();

  if (!match) notFound();

  const { data: events } = await supabase
    .from("match_events")
    .select("*, player:players(*)")
    .eq("match_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <MatchDetailClient
      initialMatch={match as unknown as Match}
      initialEvents={(events ?? []) as any}
    />
  );
}
