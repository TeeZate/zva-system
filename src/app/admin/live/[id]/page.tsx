import React from "react";
import { notFound } from "next/navigation";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import type { Match } from "@/lib/types";
import LiveScoringClient from "./LiveScoringClient";

export const revalidate = 0;

export default async function LiveScoringMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*, players(*)), away_team:teams!matches_away_team_id_fkey(*, players(*)), venue:venues(*), tournament:tournaments(*), set_scores(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  return <LiveScoringClient initialMatch={data as unknown as Match} />;
}
