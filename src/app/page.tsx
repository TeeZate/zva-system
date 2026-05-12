import React from "react";
import Link from "next/link";
import {
  Trophy, Users, Calendar, ChevronRight, Wifi,
  TrendingUp, Shield, ArrowRight, Star, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MatchCard from "@/components/matches/MatchCard";
import LiveScoreTicker from "@/components/matches/LiveScoreTicker";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatMatchDate, initials } from "@/lib/utils";
import type { Match, Standing, NewsArticle } from "@/lib/types";

async function getData() {
  if (!isSupabaseConfigured()) return { liveMatches: [], upcomingMatches: [], standings: [], news: [] };
  try {
    const supabase = await createServerSupabase();
    const [liveRes, upcomingRes, standingsRes, newsRes] = await Promise.all([
      supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(*), tournament:tournaments(*), set_scores(*)")
        .eq("status", "live")
        .order("scheduled_at", { ascending: true })
        .limit(6),
      supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(*), tournament:tournaments(*)")
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true })
        .limit(6),
      supabase
        .from("standings")
        .select("*, team:teams(*), tournament:tournaments(*)")
        .order("position", { ascending: true })
        .limit(8),
      supabase
        .from("news_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(4),
    ]);
    return {
      liveMatches: (liveRes.data ?? []) as unknown as Match[],
      upcomingMatches: (upcomingRes.data ?? []) as unknown as Match[],
      standings: (standingsRes.data ?? []) as unknown as Standing[],
      news: (newsRes.data ?? []) as unknown as NewsArticle[],
    };
  } catch {
    return { liveMatches: [], upcomingMatches: [], standings: [], news: [] };
  }
}

const stats = [
  { label: "Registered Teams", value: "120+", icon: Shield, color: "text-zva-gold" },
  { label: "Active Players", value: "2,400+", icon: Users, color: "text-zva-gold" },
  { label: "Matches / Season", value: "500+", icon: Calendar, color: "text-zva-gold" },
  { label: "Provinces", value: "10", icon: TrendingUp, color: "text-zva-gold" },
];

export default async function HomePage() {
  const { liveMatches, upcomingMatches, standings, news } = await getData();

  return (
    <>
      {liveMatches.length > 0 && <LiveScoreTicker initialMatches={liveMatches} />}

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 zva-gradient" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='36' stroke='white' stroke-width='2' fill='none'/%3E%3Cpath d='M40 4 Q58 20 76 40 Q58 60 40 76 Q22 60 4 40 Q22 20 40 4Z' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
            backgroundSize: "100px 100px",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 60%, #FFD200 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #EF3340 0%, transparent 45%)",
          }}
        />

        <div className="relative zva-container text-center text-white py-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-sm font-medium mb-10">
            <Star size={14} className="text-zva-gold fill-zva-gold" />
            Official Platform · Zimbabwe Volleyball Association
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.9] mb-6 tracking-tighter">
            Zimbabwe
            <br />
            <span className="text-zva-gold">Volleyball</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-12 leading-relaxed">
            Live scores, real-time standings, team profiles & player stats — the complete source for Zimbabwe volleyball.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
            <Link href="/scores">
              <Button size="xl" variant="gold" className="shadow-2xl shadow-black/40 text-base">
                <Wifi size={20} />
                Live Scores
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button
                size="xl"
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 text-base"
              >
                View Tournaments <ChevronRight size={18} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
              >
                <div className="text-2xl sm:text-3xl font-black text-zva-gold mb-1">{value}</div>
                <div className="text-xs text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── LIVE MATCHES ── */}
      {liveMatches.length > 0 && (
        <section className="py-16 bg-red-50/70 dark:bg-red-950/10 border-y border-red-100 dark:border-red-900/20">
          <div className="zva-container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="live-dot" />
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Happening Now</h2>
              </div>
              <Link
                href="/scores"
                className="text-sm font-semibold text-zva-green hover:underline flex items-center gap-1"
              >
                All scores <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {liveMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── UPCOMING ── */}
      <section className="py-16">
        <div className="zva-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Upcoming Matches</h2>
              <p className="text-sm text-zinc-400 mt-1">Next scheduled fixtures across all competitions</p>
            </div>
            <Link
              href="/fixtures"
              className="text-sm font-semibold text-zva-green hover:underline flex items-center gap-1"
            >
              Full calendar <ArrowRight size={14} />
            </Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No upcoming matches scheduled yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── STANDINGS ── */}
      {standings.length > 0 && (
        <section className="py-16 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="zva-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">League Standings</h2>
                <p className="text-sm text-zinc-400 mt-1">Premier League · 2025 Season</p>
              </div>
              <Link
                href="/tournaments"
                className="text-sm font-semibold text-zva-green hover:underline flex items-center gap-1"
              >
                Full table <ArrowRight size={14} />
              </Link>
            </div>
            <Card className="overflow-hidden max-w-2xl">
              <div className="grid grid-cols-8 gap-2 px-5 py-3 bg-zva-green text-white text-xs font-bold uppercase tracking-wider">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-3">Team</span>
                <span className="text-center">P</span>
                <span className="text-center">W</span>
                <span className="text-center">L</span>
                <span className="text-center">Pts</span>
              </div>
              {standings.map((s, i) => (
                <div
                  key={s.id}
                  className="grid grid-cols-8 gap-2 px-5 py-3.5 text-sm border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <span
                    className={`col-span-1 text-center font-bold ${
                      i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-600" : "text-zinc-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={s.team?.logo_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">{initials(s.team?.name ?? "T")}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-zinc-900 dark:text-white truncate">{s.team?.short_name}</span>
                    {i < 2 && (
                      <Badge variant="primary" className="text-[10px] py-0 px-1.5 shrink-0">
                        Top 2
                      </Badge>
                    )}
                  </div>
                  <span className="text-center text-zinc-500">{s.played}</span>
                  <span className="text-center text-zinc-500">{s.won}</span>
                  <span className="text-center text-zinc-500">{s.lost}</span>
                  <span className="text-center font-black text-zva-green">{s.league_points}</span>
                </div>
              ))}
            </Card>
          </div>
        </section>
      )}

      {/* ── NEWS ── */}
      {news.length > 0 && (
        <section className="py-16">
          <div className="zva-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Latest News</h2>
                <p className="text-sm text-zinc-400 mt-1">Match reports, announcements & more</p>
              </div>
              <Link
                href="/news"
                className="text-sm font-semibold text-zva-green hover:underline flex items-center gap-1"
              >
                All news <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {news.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-md hover:border-zva-green/30 transition-all duration-300">
                    <div className="h-44 bg-gradient-to-br from-zva-green to-zva-green-dark relative overflow-hidden">
                      {article.thumbnail_url ? (
                        <img
                          src={article.thumbnail_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Trophy size={40} className="text-white/20" />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5">
                        <Badge variant="gold" className="text-[10px] capitalize">
                          {article.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 group-hover:text-zva-green transition-colors mb-2 leading-snug">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock size={11} />
                        <span>{formatMatchDate(article.published_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-24 zva-gradient text-white text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, #FFD200 0%, transparent 60%)",
          }}
        />
        <div className="relative zva-container max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
            Follow Every Point,
            <span className="text-zva-gold"> Live.</span>
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Real-time scores, instant event feeds, and complete match statistics — all in one place.
          </p>
          <Link href="/scores">
            <Button size="xl" variant="gold" className="shadow-2xl shadow-black/50">
              <Wifi size={20} />
              Open Live Scores
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
