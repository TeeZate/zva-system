"use client";

import { useState } from "react";
import { Activity, ExternalLink, Monitor, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/types";

interface Props {
  matches: Match[];
}

function formatMatchDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScoutClient({ matches }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const live      = matches.filter((m) => m.status === "live");
  const scheduled = matches.filter((m) => m.status === "scheduled");

  const filteredScheduled = scheduled.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.home_team?.name?.toLowerCase().includes(q) ||
      m.away_team?.name?.toLowerCase().includes(q) ||
      m.tournament?.name?.toLowerCase().includes(q)
    );
  });

  const scoutUrl = selectedMatch
    ? `/court/index.html?zva_match=${selectedMatch.id}`
    : null;

  if (fullscreen && scoutUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-zva-gold" />
            <span className="text-sm font-bold text-white">
              {selectedMatch?.home_team?.short_name} vs {selectedMatch?.away_team?.short_name}
            </span>
            <Badge variant="live">SCOUT MODE</Badge>
          </div>
          <div className="flex items-center gap-2">
            <a href={scoutUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <ExternalLink size={13} />
                Open Tab
              </Button>
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFullscreen(false)}
            >
              ✕ Exit
            </Button>
          </div>
        </div>
        <iframe
          src={scoutUrl}
          className="flex-1 w-full border-0"
          allow="fullscreen"
          title="COURT Scout"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Activity size={22} className="text-zva-gold" />
            COURT Scout
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Select a match to open the COURT scouting app — stat events sync live to the ZVA scoreboard.
          </p>
        </div>
        {selectedMatch && scoutUrl && (
          <div className="flex items-center gap-2">
            <a href={scoutUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <ExternalLink size={13} />
                New Tab
              </Button>
            </a>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFullscreen(true)}
              className="gap-1.5"
            >
              <Monitor size={13} />
              Full Screen
            </Button>
          </div>
        )}
      </div>

      {/* Live matches — always at top */}
      {live.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Now</h2>
          {live.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              selected={selectedMatch?.id === m.id}
              onSelect={setSelectedMatch}
            />
          ))}
        </div>
      )}

      {/* Selected match preview */}
      {selectedMatch && scoutUrl && (
        <Card className="bg-zinc-900 border-zva-gold/30">
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="text-sm font-bold text-white">
                  {selectedMatch.home_team?.short_name} vs {selectedMatch.away_team?.short_name}
                </span>
                <span className="text-xs text-zinc-500">
                  · {selectedMatch.tournament?.short_name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)} className="text-zinc-500 hover:text-white">
                ✕
              </Button>
            </div>
            <iframe
              src={scoutUrl}
              className="w-full border-0"
              style={{ height: "70vh" }}
              allow="fullscreen"
              title="COURT Scout"
            />
          </CardContent>
        </Card>
      )}

      {/* Scheduled matches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Scheduled Matches
          </h2>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-44"
            />
          </div>
        </div>

        {filteredScheduled.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center text-zinc-600">
              <Activity size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No scheduled matches found.</p>
            </CardContent>
          </Card>
        )}

        {filteredScheduled.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            selected={selectedMatch?.id === m.id}
            onSelect={setSelectedMatch}
          />
        ))}
      </div>

      {/* How it works */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-500">
            <div className="flex items-start gap-2">
              <span className="text-zva-gold font-bold">1.</span>
              <span>Select a scheduled or live match above — the COURT app opens below with the roster pre-loaded from ZVA.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zva-gold font-bold">2.</span>
              <span>Click <strong className="text-zinc-400">LOAD ROSTER</strong> in the COURT app then tap <strong className="text-zinc-400">Start Match</strong> to begin recording stats.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zva-gold font-bold">3.</span>
              <span>Every point and action syncs instantly to the ZVA live scoreboard — no manual entry needed.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({
  match,
  selected,
  onSelect,
}: {
  match: Match;
  selected: boolean;
  onSelect: (m: Match) => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? "bg-zinc-800 border-zva-gold/50 ring-1 ring-zva-gold/30"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
      }`}
      onClick={() => onSelect(match)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {match.status === "live" && <Badge variant="live">LIVE</Badge>}
              {match.tournament && (
                <span className="text-xs text-zinc-500">{match.tournament.short_name}</span>
              )}
              <span className="text-xs text-zinc-600">{formatMatchDate(match.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-white truncate">
              <span>{match.home_team?.name ?? "Home"}</span>
              {match.status === "live" ? (
                <span className="text-zva-gold font-black text-base">
                  {match.home_sets}–{match.away_sets}
                </span>
              ) : (
                <span className="text-zinc-600">vs</span>
              )}
              <span>{match.away_team?.name ?? "Away"}</span>
            </div>
          </div>
          <ChevronRight
            size={16}
            className={`flex-shrink-0 transition-transform ${selected ? "text-zva-gold rotate-90" : "text-zinc-600"}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
