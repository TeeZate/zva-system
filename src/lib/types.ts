export type Division = "premier" | "division_one" | "division_two" | "junior" | "women";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
export type TournamentStatus = "upcoming" | "ongoing" | "completed";
export type PlayerPosition = "setter" | "outside_hitter" | "middle_blocker" | "opposite" | "libero" | "defensive_specialist";
export type NewsCategory = "match_report" | "announcement" | "transfer" | "national_team" | "general";
export type EventType = "point_home" | "point_away" | "set_home" | "set_away" | "timeout_home" | "timeout_away" | "substitution" | "challenge";

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  city: string;
  province: string;
  division: Division;
  coach: string | null;
  founded_year: number | null;
  home_venue_id: string | null;
  colors: string | null;
  wins: number;
  losses: number;
  created_at: string;
}

export interface Player {
  id: string;
  team_id: string | null;
  first_name: string;
  last_name: string;
  number: number | null;
  position: PlayerPosition | null;
  nationality: string;
  date_of_birth: string | null;
  height_cm: number | null;
  photo_url: string | null;
  is_national_team: boolean;
  career_points: number;
  career_aces: number;
  career_blocks: number;
  created_at: string;
  team?: Team;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  province: string;
  address: string | null;
  capacity: number | null;
  photo_url: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  short_name: string;
  season: string;
  division: Division;
  start_date: string;
  end_date: string | null;
  status: TournamentStatus;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string | null;
  home_team_id: string;
  away_team_id: string;
  venue_id: string | null;
  scheduled_at: string;
  status: MatchStatus;
  current_set: number;
  home_sets: number;
  away_sets: number;
  home_score: number;
  away_score: number;
  referee: string | null;
  attendance: number | null;
  notes: string | null;
  created_at: string;
  home_team?: Team;
  away_team?: Team;
  venue?: Venue;
  tournament?: Tournament;
  set_scores?: SetScore[];
}

export interface SetScore {
  id: string;
  match_id: string;
  set_number: number;
  home_points: number;
  away_points: number;
  is_final: boolean;
  duration_minutes: number | null;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  type: EventType;
  team_id: string | null;
  player_id: string | null;
  set_number: number;
  description: string | null;
  created_at: string;
  player?: Player;
}

export interface Standing {
  id: string;
  tournament_id: string;
  team_id: string;
  played: number;
  won: number;
  lost: number;
  sets_won: number;
  sets_lost: number;
  points_won: number;
  points_lost: number;
  league_points: number;
  position: number;
  team?: Team;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  author: string;
  category: NewsCategory;
  published_at: string;
  is_featured: boolean;
  tags: string[];
  created_at: string;
}

export interface Official {
  id: string;
  name: string;
  role: "head_referee" | "line_judge" | "scorer";
  license_number: string | null;
  province: string | null;
}

export type AdminRole = "super_admin" | "team_admin";
export type O2Status = "pending" | "approved" | "rejected";
export type SystemEventSeverity = "info" | "warning" | "error" | "critical";

export interface AdminUser {
  user_id: string;
  role: AdminRole;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  team?: Team;
  email?: string;
}

export interface TeamO2Upload {
  id: string;
  team_id: string;
  season: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  player_count: number | null;
  status: O2Status;
  reviewer_notes: string | null;
  uploaded_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
  team?: Team;
}

export interface SystemEvent {
  id: string;
  type: string;
  severity: SystemEventSeverity;
  source: string;
  message: string;
  details: Record<string, unknown> | null;
  user_email: string | null;
  resolved_at: string | null;
  created_at: string;
}

// Supabase Database type
export type Database = {
  public: {
    Tables: {
      teams: { Row: Team; Insert: Omit<Team, "id" | "created_at" | "wins" | "losses">; Update: Partial<Team>; };
      players: { Row: Player; Insert: Omit<Player, "id" | "created_at">; Update: Partial<Player>; };
      venues: { Row: Venue; Insert: Omit<Venue, "id">; Update: Partial<Venue>; };
      tournaments: { Row: Tournament; Insert: Omit<Tournament, "id" | "created_at">; Update: Partial<Tournament>; };
      matches: { Row: Match; Insert: Omit<Match, "id" | "created_at">; Update: Partial<Match>; };
      set_scores: { Row: SetScore; Insert: Omit<SetScore, "id">; Update: Partial<SetScore>; };
      match_events: { Row: MatchEvent; Insert: Omit<MatchEvent, "id" | "created_at">; Update: Partial<MatchEvent>; };
      standings: { Row: Standing; Insert: Omit<Standing, "id">; Update: Partial<Standing>; };
      news_articles: { Row: NewsArticle; Insert: Omit<NewsArticle, "id" | "created_at">; Update: Partial<NewsArticle>; };
      officials: { Row: Official; Insert: Omit<Official, "id">; Update: Partial<Official>; };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
