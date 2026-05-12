# Zimbabwe Volleyball Association — Official Platform

A production-ready, real-time volleyball management system for the Zimbabwe Volleyball Association (ZVA).

## Features

### Public Portal
| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Hero, live matches, standings, news |
| Live Scores | `/scores` | Real-time filtered match feed |
| Match Detail | `/scores/[id]` | Live score + set breakdown + event feed |
| Teams | `/teams` | All clubs by division |
| Team Profile | `/teams/[id]` | Roster, record, recent results |
| Players | `/players` | Directory with national team section |
| Player Profile | `/players/[id]` | Stats, position, club |
| Tournaments | `/tournaments` | Standings tables for all competitions |
| News | `/news` | Articles by category |
| TV Scoreboard | `/scoreboard/[id]` | Fullscreen, dark, TV-optimised display |

### Admin Dashboard `/admin`
- Dashboard with live match overview and quick actions
- Match scheduling and management
- Live Score Entry — one-click point awarding, automatic set tracking, event recording
- Real-time propagation: score updates reach all viewers in under 100ms

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + ZVA custom theme |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime WebSockets |
| Deployment | Vercel |

## Getting Started

### 1. Create Supabase Project
1. Go to supabase.com → New Project
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Realtime for `matches`, `set_scores`, `match_events`, `standings` tables

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Fill in your Supabase URL, anon key, and service role key.

### 3. Run Locally
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
Add the three environment variables in the Vercel dashboard and connect your repo.

## Real-time Architecture

```
Admin Score Entry → Supabase UPDATE → Supabase Realtime broadcast
                                              ↓
                         Live Scores / Match Detail / TV Scoreboard
                         (all update via WebSocket — no polling)
```

## Color System

| Token | Hex | Use |
|-------|-----|-----|
| `--color-zva-green` | `#006400` | Primary brand, CTA |
| `--color-zva-gold` | `#FFD200` | Accents, live scores |
| `--color-zva-red` | `#EF3340` | Live indicators |

Defined in `src/app/globals.css` via Tailwind v4 `@theme`.

## Structure

```
src/
  app/                 # All pages (App Router)
    scores/            # Live scores + match detail
    teams/             # Teams directory + profiles
    players/           # Player directory + profiles
    tournaments/       # Standings + competitions
    news/              # News articles
    scoreboard/[id]/   # TV scoreboard
    admin/             # Admin dashboard + score entry
  components/
    layout/            # Navbar, Footer
    matches/           # MatchCard, LiveScoreTicker
    ui/                # Button, Badge, Card, Avatar
  lib/
    supabase.ts        # Browser Supabase client
    supabase-server.ts # Server Supabase client
    types.ts           # TypeScript types
    utils.ts           # Formatting utilities
  proxy.ts             # Next.js 16 session proxy

supabase/
  schema.sql           # Full schema + seed data
```
