CREATE TABLE IF NOT EXISTS player_identities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  provider_user_id  TEXT NOT NULL,
  email             TEXT,
  display_name      TEXT,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (provider, provider_user_id),
  UNIQUE (player_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_player_identities_player ON player_identities (player_id);

INSERT INTO player_identities (
  player_id,
  provider,
  provider_user_id,
  email,
  display_name,
  avatar_url
)
SELECT
  id,
  auth_provider,
  auth_provider_id,
  email,
  display_name,
  avatar_url
FROM players
WHERE auth_provider IS NOT NULL
  AND auth_provider <> 'anonymous'
  AND auth_provider_id IS NOT NULL
ON CONFLICT (provider, provider_user_id) DO NOTHING;
