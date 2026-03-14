import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  slug: string;
  name: string;
  draft_order_position: number | null;
  created_at: string;
  updated_at: string;
};

export type Draft = {
  id: string;
  year: number;
  month: number;
  draft_order: number[];
  draft_mode: "snake" | "regular";
  status: "draft" | "completed";
  created_at: string;
  updated_at: string;
};

export type DraftPick = {
  id: string;
  draft_id: string;
  player_id: string;
  nba_team_id: number;
  nba_team_abbreviation: string | null;
  nba_team_name: string | null;
  prediction: "W" | "L";
  pick_order: number;
  created_at: string;
};

export type GameResult = {
  id: string;
  draft_id: string;
  nba_game_id: number;
  game_date: string;
  home_team_id: number;
  visitor_team_id: number;
  home_team_abbreviation: string | null;
  visitor_team_abbreviation: string | null;
  home_score: number | null;
  visitor_score: number | null;
  winner_team_id: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyScore = {
  id: string;
  draft_id: string;
  player_id: string;
  raw_correct_count: number;
  x_match_count: number;
  score_count: number;
  rank: number | null;
  season_points: number;
  updated_at: string;
};

export type NbaTeamsCache = {
  id: number;
  abbreviation: string | null;
  city: string | null;
  name: string | null;
  full_name: string | null;
  conference: string | null;
  division: string | null;
  updated_at: string;
};
