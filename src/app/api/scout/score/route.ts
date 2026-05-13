import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logSystemEvent } from "@/lib/supabase-admin";

export const runtime = "nodejs";

interface ScorePayload {
  match_id: string;
  home_score: number;
  away_score: number;
  current_set: number;
  home_sets?: number;
  away_sets?: number;
  set_ended?: { set: number; home: number; away: number };
}

export async function POST(req: NextRequest) {
  let body: ScorePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { match_id, home_score, away_score, current_set, home_sets, away_sets, set_ended } = body;

  if (!match_id) {
    return NextResponse.json({ error: "match_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Build update payload
  const update: Record<string, unknown> = {
    home_score,
    away_score,
    current_set,
    status: "live",
  };
  if (home_sets !== undefined) update.home_sets = home_sets;
  if (away_sets !== undefined) update.away_sets = away_sets;

  const { error: updateErr } = await supabase
    .from("matches")
    .update(update)
    .eq("id", match_id);

  if (updateErr) {
    await logSystemEvent({
      type: "scout_score_error",
      severity: "error",
      source: "scout_score_api",
      message: updateErr.message,
      details: { match_id, body },
    });
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // If a set just ended, persist the set score
  if (set_ended) {
    await supabase.from("set_scores").upsert(
      {
        match_id,
        set_number:  set_ended.set,
        home_points: set_ended.home,
        away_points: set_ended.away,
        is_final:    true,
      },
      { onConflict: "match_id,set_number" }
    );
  }

  return NextResponse.json({ ok: true });
}
