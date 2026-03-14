-- NBA Skins Betting - Schéma Supabase
-- Exécuter dans l’éditeur SQL du projet Supabase

-- Joueurs fixes (Carlito, Papa, Vincent, Tonio)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  draft_order_position INTEGER, -- 0=A, 1=B, 2=C, 3=D pour le mois courant
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO players (slug, name) VALUES
  ('carlito', 'Carlito'),
  ('papa', 'Papa'),
  ('vincent', 'Vincent'),
  ('tonio', 'Tonio')
ON CONFLICT (slug) DO NOTHING;

-- Drafts mensuelles
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  draft_order INTEGER[] NOT NULL, -- [player_index_0, 1, 2, 3] ordre A,B,C,D
  draft_mode TEXT NOT NULL CHECK (draft_mode IN ('snake', 'regular')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(year, month)
);

-- Picks d’une draft (équipe + pari W/L)
CREATE TABLE IF NOT EXISTS draft_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  nba_team_id INTEGER NOT NULL,
  nba_team_abbreviation TEXT,
  nba_team_name TEXT,
  prediction TEXT NOT NULL CHECK (prediction IN ('W', 'L')),
  pick_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draft_id, nba_team_id),
  UNIQUE(draft_id, player_id, pick_order)
);

CREATE INDEX IF NOT EXISTS idx_draft_picks_draft ON draft_picks(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_player ON draft_picks(player_id);

-- Cache des équipes NBA (id, abbreviation, full_name, etc.)
CREATE TABLE IF NOT EXISTS nba_teams_cache (
  id INTEGER PRIMARY KEY,
  abbreviation TEXT,
  city TEXT,
  name TEXT,
  full_name TEXT,
  conference TEXT,
  division TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Résultats de matchs (pour scoring)
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  nba_game_id INTEGER NOT NULL,
  game_date DATE NOT NULL,
  home_team_id INTEGER NOT NULL,
  visitor_team_id INTEGER NOT NULL,
  home_team_abbreviation TEXT,
  visitor_team_abbreviation TEXT,
  home_score INTEGER,
  visitor_score INTEGER,
  winner_team_id INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draft_id, nba_game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_results_draft_date ON game_results(draft_id, game_date);

-- Points mensuels par joueur (après égalisation X)
CREATE TABLE IF NOT EXISTS monthly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  raw_correct_count INTEGER NOT NULL DEFAULT 0,
  x_match_count INTEGER NOT NULL DEFAULT 0,
  score_count INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  season_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draft_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_monthly_scores_draft ON monthly_scores(draft_id);

-- RLS (optionnel : tout en anon pour écran partagé)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nba_teams_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON draft_picks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON nba_teams_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON game_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_scores FOR ALL USING (true) WITH CHECK (true);
