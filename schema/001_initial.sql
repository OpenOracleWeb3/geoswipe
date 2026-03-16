-- GeoSwipe Postgres Schema
-- Designed for Render Postgres (or any standard PG 14+)
-- Run with: psql $DATABASE_URL < schema/001_initial.sql

-- ════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════
-- ENUMS
-- ════════════════════════════════════════════════════════════════════

CREATE TYPE category_mode AS ENUM ('continents', 'countries', 'cities', 'worldwide');
CREATE TYPE game_mode AS ENUM ('continent', 'world_region', 'country', 'city');
CREATE TYPE difficulty_band AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE round_modifier AS ENUM ('none', 'rival_surge', 'high_value', 'speed_round');
CREATE TYPE rank_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- ════════════════════════════════════════════════════════════════════
-- PLAYERS
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name    TEXT NOT NULL DEFAULT 'Player',
  avatar_url      TEXT,

  -- Global ranking
  global_elo      INTEGER NOT NULL DEFAULT 500,
  rank            rank_tier NOT NULL DEFAULT 'bronze',

  -- Per-category ELOs
  elo_continents  INTEGER NOT NULL DEFAULT 500,
  elo_countries   INTEGER NOT NULL DEFAULT 500,
  elo_cities      INTEGER NOT NULL DEFAULT 500,
  elo_worldwide   INTEGER NOT NULL DEFAULT 500,

  -- Aggregate stats
  total_sessions  INTEGER NOT NULL DEFAULT 0,
  total_rounds    INTEGER NOT NULL DEFAULT 0,
  total_correct   INTEGER NOT NULL DEFAULT 0,
  total_wrong     INTEGER NOT NULL DEFAULT 0,
  total_timeouts  INTEGER NOT NULL DEFAULT 0,
  best_streak     INTEGER NOT NULL DEFAULT 0,
  wins            INTEGER NOT NULL DEFAULT 0,
  losses          INTEGER NOT NULL DEFAULT 0,

  -- Auth (optional — can start anonymous)
  auth_provider   TEXT,          -- 'google', 'apple', 'anonymous'
  auth_provider_id TEXT,
  email           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_global_elo ON players (global_elo DESC);
CREATE INDEX idx_players_rank ON players (rank);
CREATE UNIQUE INDEX idx_players_auth ON players (auth_provider, auth_provider_id)
  WHERE auth_provider IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════
-- SESSIONS (one per completed game run)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category        category_mode NOT NULL,
  pack_id         TEXT NOT NULL,
  seed            TEXT NOT NULL,

  -- Scores
  player_score    INTEGER NOT NULL,
  rival_score     INTEGER NOT NULL,
  margin          INTEGER NOT NULL,
  won             BOOLEAN NOT NULL,

  -- Performance
  correct_count   INTEGER NOT NULL,
  total_rounds    INTEGER NOT NULL DEFAULT 20,
  accuracy        REAL NOT NULL,        -- 0.0 to 1.0
  max_streak      INTEGER NOT NULL,

  -- Difficulty distribution
  easy_count      INTEGER NOT NULL DEFAULT 0,
  medium_count    INTEGER NOT NULL DEFAULT 0,
  hard_count      INTEGER NOT NULL DEFAULT 0,

  -- ELO at time of session
  elo_before      INTEGER NOT NULL,
  elo_after       INTEGER NOT NULL,
  elo_delta       INTEGER NOT NULL,

  -- Category ELO at time of session
  cat_elo_before  INTEGER NOT NULL,
  cat_elo_after   INTEGER NOT NULL,
  cat_elo_delta   INTEGER NOT NULL,

  duration_ms     INTEGER,              -- total session wall time
  started_at      TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_player ON sessions (player_id, completed_at DESC);
CREATE INDEX idx_sessions_category ON sessions (category, completed_at DESC);
CREATE INDEX idx_sessions_leaderboard ON sessions (category, player_score DESC);

-- ════════════════════════════════════════════════════════════════════
-- ROUND OUTCOMES (one per swipe within a session)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE round_outcomes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  round_number    SMALLINT NOT NULL,    -- 1-20
  round_id        TEXT NOT NULL,        -- e.g. "canada-vs-jamaica-americas-1"
  mode            game_mode NOT NULL,
  difficulty      difficulty_band NOT NULL,
  modifier        round_modifier NOT NULL DEFAULT 'none',

  -- The pair
  left_option     TEXT NOT NULL,
  right_option    TEXT NOT NULL,
  correct_answer  TEXT NOT NULL,
  media_country   TEXT NOT NULL,

  -- Player action
  selected_answer TEXT,                 -- null if timed out
  correct         BOOLEAN NOT NULL,
  timed_out       BOOLEAN NOT NULL DEFAULT false,
  time_remaining  REAL,                 -- seconds left when swiped

  -- Scoring
  score_delta     INTEGER NOT NULL,
  streak_after    INTEGER NOT NULL,

  -- Per-swipe ELO
  elo_delta       INTEGER NOT NULL DEFAULT 0,
  elo_after       INTEGER NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rounds_session ON round_outcomes (session_id, round_number);
CREATE INDEX idx_rounds_player ON round_outcomes (player_id, created_at DESC);
CREATE INDEX idx_rounds_country ON round_outcomes (media_country);

-- ════════════════════════════════════════════════════════════════════
-- ELO HISTORY (track rating over time for graphs)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE elo_history (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category        category_mode,        -- null = global
  elo_before      INTEGER NOT NULL,
  elo_after       INTEGER NOT NULL,
  delta           INTEGER NOT NULL,
  session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_elo_history_player ON elo_history (player_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════
-- DAILY RUMBLE (daily challenge with fixed seed)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE daily_rumbles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rumble_date     DATE NOT NULL UNIQUE,
  category        category_mode NOT NULL,
  seed            TEXT NOT NULL,
  pack_id         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE daily_rumble_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rumble_id       UUID NOT NULL REFERENCES daily_rumbles(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,

  player_score    INTEGER NOT NULL,
  accuracy        REAL NOT NULL,
  max_streak      INTEGER NOT NULL,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (rumble_id, player_id)
);

CREATE INDEX idx_rumble_entries_score ON daily_rumble_entries (rumble_id, player_score DESC);

-- ════════════════════════════════════════════════════════════════════
-- LEADERBOARDS (materialized for fast reads)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE leaderboard_snapshots (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope           TEXT NOT NULL,        -- 'global', 'continents', 'countries', 'cities', 'worldwide'
  period          TEXT NOT NULL,        -- 'alltime', 'weekly', 'daily'
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  elo             INTEGER NOT NULL,
  rank_position   INTEGER NOT NULL,
  snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaderboard_scope ON leaderboard_snapshots (scope, period, rank_position);

-- ════════════════════════════════════════════════════════════════════
-- COUNTRY STATS (per-player geography knowledge tracking)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE country_stats (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  country         TEXT NOT NULL,

  times_shown     INTEGER NOT NULL DEFAULT 0,
  times_correct   INTEGER NOT NULL DEFAULT 0,
  times_wrong     INTEGER NOT NULL DEFAULT 0,
  times_timed_out INTEGER NOT NULL DEFAULT 0,
  accuracy        REAL GENERATED ALWAYS AS (
    CASE WHEN times_shown > 0
      THEN times_correct::REAL / times_shown
      ELSE 0
    END
  ) STORED,

  last_seen_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (player_id, country)
);

CREATE INDEX idx_country_stats_player ON country_stats (player_id, accuracy);
CREATE INDEX idx_country_stats_weak ON country_stats (player_id, accuracy ASC)
  WHERE times_shown >= 3;

-- ════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════════════

-- Auto-update rank tier based on global ELO
CREATE OR REPLACE FUNCTION update_player_rank()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rank := CASE
    WHEN NEW.global_elo >= 2000 THEN 'diamond'::rank_tier
    WHEN NEW.global_elo >= 1600 THEN 'platinum'::rank_tier
    WHEN NEW.global_elo >= 1200 THEN 'gold'::rank_tier
    WHEN NEW.global_elo >= 800  THEN 'silver'::rank_tier
    ELSE 'bronze'::rank_tier
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_player_rank
  BEFORE UPDATE OF global_elo ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_player_rank();

-- Auto-update updated_at on country_stats
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_country_stats_updated
  BEFORE UPDATE ON country_stats
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();
