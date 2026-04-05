ALTER TABLE players
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_players_onboarding_completed_at
ON players (onboarding_completed_at);
