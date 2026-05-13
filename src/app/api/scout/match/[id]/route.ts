import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminClient();
  const { id: matchId } = await params;

  // Fetch match with both teams and tournament
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, short_name, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, short_name, logo_url),
      tournament:tournaments(id, name, short_name)
    `)
    .eq("id", matchId)
    .single();

  if (matchErr || !match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Fetch home players
  const { data: homePlayers } = await supabase
    .from("players")
    .select("id, first_name, last_name, number, position")
    .eq("team_id", match.home_team_id)
    .order("number", { ascending: true });

  // Fetch away players
  const { data: awayPlayers } = await supabase
    .from("players")
    .select("id, first_name, last_name, number, position")
    .eq("team_id", match.away_team_id)
    .order("number", { ascending: true });

  return NextResponse.json({
    match,
    home_team:    match.home_team,
    away_team:    match.away_team,
    home_players: homePlayers ?? [],
    away_players: awayPlayers ?? [],
  });
}
