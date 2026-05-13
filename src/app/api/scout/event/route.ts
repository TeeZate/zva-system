import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

interface StatEvent {
  match_id:      string;
  type:          "action" | "substitution";
  team:          "home" | "away";
  player_num:    string | number;
  player_name:   string;
  player_pos:    string;
  player_zva_id: string | null;
  action:        string;
  outcome:       "good" | "ok" | "bad";
  detail:        string | null;
  set:           number;
  score_home:    number;
  score_away:    number;
  ts:            string;
}

export async function POST(req: NextRequest) {
  let body: StatEvent;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.match_id || !body.action) {
    return NextResponse.json({ error: "match_id and action required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Map action → ZVA match_events type  (best-effort)
  const typeMap: Record<string, string> = {
    point:  body.team === "home" ? "point_home" : "point_away",
    ace:    body.team === "home" ? "point_home" : "point_away",
    kill:   body.team === "home" ? "point_home" : "point_away",
    attack: "point_home", // generic
    block:  body.team === "home" ? "point_home" : "point_away",
  };
  const eventType = typeMap[body.action] ?? (body.team === "home" ? "point_home" : "point_away");

  // Save to scout_stat_events (granular stat store)
  const { error: statError } = await supabase.from("scout_stat_events").insert({
    match_id:    body.match_id,
    player_id:   body.player_zva_id ?? null,
    team:        body.team,
    player_num:  String(body.player_num),
    player_name: body.player_name,
    player_pos:  body.player_pos,
    action:      body.action,
    outcome:     body.outcome,
    detail:      body.detail ?? null,
    set_number:  body.set,
    score_home:  body.score_home,
    score_away:  body.score_away,
  });

  if (statError) {
    console.error("[scout/event] stat insert:", statError.message);
  }

  // Also insert into match_events so scoreboard / logs see it
  const { error } = await supabase.from("match_events").insert({
    match_id:    body.match_id,
    type:        eventType,
    team_id:     null,
    player_id:   body.player_zva_id ?? null,
    set_number:  body.set,
    description: `${body.player_name} #${body.player_num} — ${body.action.toUpperCase()} (${body.outcome})${body.detail ? ` [${body.detail}]` : ""}`,
  });

  if (error) {
    console.error("[scout/event] match_events insert:", error.message);
    return NextResponse.json({ ok: true, warn: error.message });
  }

  return NextResponse.json({ ok: true });
}
