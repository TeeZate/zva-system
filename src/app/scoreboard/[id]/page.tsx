import React from "react";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Match } from "@/lib/types";
import ScoreboardClient from "./ScoreboardClient";

export const revalidate = 0;

export default async function ScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(*), tournament:tournaments(*), set_scores(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  return <ScoreboardClient initialMatch={data as unknown as Match} />;
}
