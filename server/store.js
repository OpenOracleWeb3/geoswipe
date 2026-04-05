const CATEGORY_ELO_COLUMN = {
  continents: "elo_continents",
  countries: "elo_countries",
  cities: "elo_cities",
  worldwide: "elo_worldwide"
};

function getRankName(elo) {
  if (elo >= 2000) return "diamond";
  if (elo >= 1600) return "platinum";
  if (elo >= 1200) return "gold";
  if (elo >= 800) return "silver";
  return "bronze";
}

function calculateEloUpdate(summary, currentElo) {
  const accuracyFactor = (summary.accuracy - 0.5) * 60;
  const totalRounds = Math.max(1, summary.difficultyCounts.easy + summary.difficultyCounts.medium + summary.difficultyCounts.hard);
  const hardShare = summary.difficultyCounts.hard / totalRounds;
  const difficultyBonus = hardShare * 20;
  const rivalBonus = summary.playerWon ? 15 : -10;
  const streakBonus = Math.min(summary.maxStreak, 8) * 2;
  const rawDelta = accuracyFactor + difficultyBonus + rivalBonus + streakBonus;
  const kFactor = currentElo < 600 ? 1.4 : currentElo < 1000 ? 1.2 : currentElo < 1500 ? 1.0 : 0.8;
  const delta = Math.round(rawDelta * kFactor);

  return {
    delta,
    newElo: Math.max(0, currentElo + delta)
  };
}

function createAnonymousName() {
  return `Guest ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function mapHistoryRows(rows) {
  return rows.map((row) => ({
    timestamp: row.completed_at,
    category: row.category,
    playerScore: row.player_score,
    rivalScore: row.rival_score,
    accuracy: Number(row.accuracy),
    eloBefore: row.elo_before,
    eloAfter: row.elo_after,
    eloDelta: row.elo_delta,
    won: row.won
  }));
}

function createStatsFromPlayerRow(row, historyRows) {
  return {
    globalElo: row.global_elo,
    categoryElo: {
      continents: row.elo_continents,
      countries: row.elo_countries,
      cities: row.elo_cities,
      worldwide: row.elo_worldwide
    },
    totalSessions: row.total_sessions,
    totalCorrect: row.total_correct,
    totalRounds: row.total_rounds,
    bestStreak: row.best_streak,
    wins: row.wins,
    losses: row.losses,
    history: mapHistoryRows(historyRows)
  };
}

function createAuthUserFromIdentityRow(row) {
  if (!row || row.provider !== "google" || !row.provider_user_id || !row.email) {
    return null;
  }

  return {
    provider: "google",
    providerId: row.provider_user_id,
    name: row.display_name ?? row.email,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined
  };
}

function createLeaderboardEntries(rows, playerId) {
  return rows.map((row) => ({
    playerId: row.id,
    name: row.display_name,
    elo: row.global_elo,
    rank: row.rank_position,
    isYou: row.id === playerId,
    avatarUrl: row.avatar_url ?? undefined
  }));
}

function getCategoryEloFromPlayerRow(row) {
  return {
    continents: row?.elo_continents ?? 500,
    countries: row?.elo_countries ?? 500,
    cities: row?.elo_cities ?? 500,
    worldwide: row?.elo_worldwide ?? 500
  };
}

async function fetchPlayerById(client, playerId, forUpdate = false) {
  const result = await client.query(
    `SELECT * FROM players WHERE id = $1 ${forUpdate ? "FOR UPDATE" : ""}`,
    [playerId]
  );

  return result.rows[0] ?? null;
}

async function fetchPlayerHistory(client, playerId) {
  const result = await client.query(
    `
      SELECT
        category,
        player_score,
        rival_score,
        accuracy,
        elo_before,
        elo_after,
        elo_delta,
        won,
        completed_at
      FROM sessions
      WHERE player_id = $1
      ORDER BY completed_at DESC
      LIMIT 25
    `,
    [playerId]
  );

  return result.rows;
}

async function fetchIdentityByProvider(client, provider, providerUserId, forUpdate = false) {
  const result = await client.query(
    `SELECT * FROM player_identities WHERE provider = $1 AND provider_user_id = $2 ${forUpdate ? "FOR UPDATE" : ""}`,
    [provider, providerUserId]
  );

  return result.rows[0] ?? null;
}

async function fetchPreferredIdentity(client, playerId) {
  const result = await client.query(
    `
      SELECT *
      FROM player_identities
      WHERE player_id = $1
      ORDER BY CASE provider WHEN 'google' THEN 0 WHEN 'apple' THEN 1 ELSE 2 END, created_at ASC
      LIMIT 1
    `,
    [playerId]
  );

  return result.rows[0] ?? null;
}

async function fetchLeaderboardWindow(client, playerId) {
  const result = await client.query(
    `
      WITH ranked AS (
        SELECT
          id,
          display_name,
          avatar_url,
          global_elo,
          ROW_NUMBER() OVER (ORDER BY global_elo DESC, created_at ASC) AS rank_position
        FROM players
      ),
      me AS (
        SELECT rank_position
        FROM ranked
        WHERE id = $1
      )
      SELECT
        ranked.id,
        ranked.display_name,
        ranked.avatar_url,
        ranked.global_elo,
        ranked.rank_position
      FROM ranked
      CROSS JOIN me
      WHERE ranked.rank_position BETWEEN GREATEST(me.rank_position - 7, 1) AND me.rank_position + 7
      ORDER BY ranked.rank_position ASC
    `,
    [playerId]
  );

  return result.rows;
}

async function recomputePlayerAggregateState(client, playerId, basePlayer = null) {
  const player = basePlayer ?? await fetchPlayerById(client, playerId, true);
  if (!player) {
    throw new Error("Player profile not found for recompute.");
  }

  const sessionTotalsResult = await client.query(
    `
      SELECT
        COUNT(*)::int AS total_sessions,
        COALESCE(SUM(total_rounds), 0)::int AS total_rounds,
        COALESCE(SUM(correct_count), 0)::int AS total_correct,
        COALESCE(MAX(max_streak), 0)::int AS best_streak,
        COALESCE(SUM(CASE WHEN won THEN 1 ELSE 0 END), 0)::int AS wins,
        COALESCE(SUM(CASE WHEN won THEN 0 ELSE 1 END), 0)::int AS losses
      FROM sessions
      WHERE player_id = $1
    `,
    [playerId]
  );

  const roundTotalsResult = await client.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN timed_out THEN 1 ELSE 0 END), 0)::int AS total_timeouts,
        COALESCE(SUM(CASE WHEN NOT correct AND NOT timed_out THEN 1 ELSE 0 END), 0)::int AS total_wrong
      FROM round_outcomes
      WHERE player_id = $1
    `,
    [playerId]
  );

  const latestGlobalResult = await client.query(
    `
      SELECT elo_after
      FROM sessions
      WHERE player_id = $1
      ORDER BY completed_at DESC, started_at DESC
      LIMIT 1
    `,
    [playerId]
  );

  const latestCategoryResult = await client.query(
    `
      SELECT DISTINCT ON (category)
        category,
        cat_elo_after
      FROM sessions
      WHERE player_id = $1
      ORDER BY category, completed_at DESC, started_at DESC
    `,
    [playerId]
  );

  const totals = sessionTotalsResult.rows[0];
  const roundTotals = roundTotalsResult.rows[0];
  const categoryElo = getCategoryEloFromPlayerRow(player);
  for (const row of latestCategoryResult.rows) {
    categoryElo[row.category] = row.cat_elo_after;
  }

  const latestGlobalElo = latestGlobalResult.rows[0]?.elo_after ?? player.global_elo ?? 500;
  const updated = await client.query(
    `
      UPDATE players
      SET global_elo = $1,
          elo_continents = $2,
          elo_countries = $3,
          elo_cities = $4,
          elo_worldwide = $5,
          total_sessions = $6,
          total_rounds = $7,
          total_correct = $8,
          total_wrong = $9,
          total_timeouts = $10,
          best_streak = $11,
          wins = $12,
          losses = $13
      WHERE id = $14
      RETURNING *
    `,
    [
      latestGlobalElo,
      categoryElo.continents,
      categoryElo.countries,
      categoryElo.cities,
      categoryElo.worldwide,
      totals.total_sessions,
      totals.total_rounds,
      totals.total_correct,
      roundTotals.total_wrong,
      roundTotals.total_timeouts,
      totals.best_streak,
      totals.wins,
      totals.losses,
      playerId
    ]
  );

  return updated.rows[0];
}

async function mergePlayerDataIntoTarget(client, sourcePlayer, targetPlayer) {
  if (!sourcePlayer || !targetPlayer || sourcePlayer.id === targetPlayer.id) {
    return targetPlayer;
  }

  await client.query(
    `
      INSERT INTO country_stats (
        player_id,
        country,
        times_shown,
        times_correct,
        times_wrong,
        times_timed_out,
        last_seen_at
      )
      SELECT
        $1,
        country,
        times_shown,
        times_correct,
        times_wrong,
        times_timed_out,
        last_seen_at
      FROM country_stats
      WHERE player_id = $2
      ON CONFLICT (player_id, country)
      DO UPDATE
      SET times_shown = country_stats.times_shown + EXCLUDED.times_shown,
          times_correct = country_stats.times_correct + EXCLUDED.times_correct,
          times_wrong = country_stats.times_wrong + EXCLUDED.times_wrong,
          times_timed_out = country_stats.times_timed_out + EXCLUDED.times_timed_out,
          last_seen_at = GREATEST(country_stats.last_seen_at, EXCLUDED.last_seen_at)
    `,
    [targetPlayer.id, sourcePlayer.id]
  );

  await client.query(
    `
      INSERT INTO daily_rumble_entries (
        rumble_id,
        player_id,
        session_id,
        player_score,
        accuracy,
        max_streak,
        completed_at
      )
      SELECT
        rumble_id,
        $1,
        session_id,
        player_score,
        accuracy,
        max_streak,
        completed_at
      FROM daily_rumble_entries
      WHERE player_id = $2
      ON CONFLICT (rumble_id, player_id)
      DO UPDATE
      SET player_score = GREATEST(daily_rumble_entries.player_score, EXCLUDED.player_score),
          accuracy = GREATEST(daily_rumble_entries.accuracy, EXCLUDED.accuracy),
          max_streak = GREATEST(daily_rumble_entries.max_streak, EXCLUDED.max_streak),
          completed_at = LEAST(daily_rumble_entries.completed_at, EXCLUDED.completed_at)
    `,
    [targetPlayer.id, sourcePlayer.id]
  );

  await client.query("UPDATE sessions SET player_id = $1 WHERE player_id = $2", [targetPlayer.id, sourcePlayer.id]);
  await client.query("UPDATE round_outcomes SET player_id = $1 WHERE player_id = $2", [targetPlayer.id, sourcePlayer.id]);
  await client.query("UPDATE elo_history SET player_id = $1 WHERE player_id = $2", [targetPlayer.id, sourcePlayer.id]);
  await client.query(
    `
      UPDATE player_identities
      SET player_id = $1,
          updated_at = now()
      WHERE player_id = $2
        AND provider NOT IN (
          SELECT provider
          FROM player_identities
          WHERE player_id = $1
        )
    `,
    [targetPlayer.id, sourcePlayer.id]
  );
  await client.query("DELETE FROM player_identities WHERE player_id = $1", [sourcePlayer.id]);
  await client.query("DELETE FROM leaderboard_snapshots WHERE player_id = ANY($1::uuid[])", [[sourcePlayer.id, targetPlayer.id]]);
  await client.query("DELETE FROM country_stats WHERE player_id = $1", [sourcePlayer.id]);
  await client.query("DELETE FROM daily_rumble_entries WHERE player_id = $1", [sourcePlayer.id]);

  const recomputedTarget = await recomputePlayerAggregateState(client, targetPlayer.id, targetPlayer);
  await client.query("DELETE FROM players WHERE id = $1", [sourcePlayer.id]);

  return recomputedTarget;
}

async function upsertPlayerIdentity(client, playerId, { provider, providerId, email, name, avatarUrl }) {
  await client.query(
    `
      DELETE FROM player_identities
      WHERE player_id = $1
        AND provider = $2
        AND provider_user_id <> $3
    `,
    [playerId, provider, providerId]
  );

  await client.query(
    `
      INSERT INTO player_identities (
        player_id,
        provider,
        provider_user_id,
        email,
        display_name,
        avatar_url
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (provider, provider_user_id)
      DO UPDATE
      SET player_id = EXCLUDED.player_id,
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = now()
    `,
    [playerId, provider, providerId, email, name, avatarUrl ?? null]
  );
}

export async function createAnonymousPlayer(client) {
  const result = await client.query(
    `
      INSERT INTO players (display_name, auth_provider)
      VALUES ($1, 'anonymous')
      RETURNING *
    `,
    [createAnonymousName()]
  );

  return result.rows[0];
}

export async function getOrCreateSessionPlayer(client, playerId) {
  if (playerId) {
    const existing = await fetchPlayerById(client, playerId);
    if (existing) {
      return existing;
    }
  }

  return createAnonymousPlayer(client);
}

export async function buildPlayerSnapshot(client, playerId) {
  const player = await fetchPlayerById(client, playerId);
  if (!player) {
    throw new Error("Player profile not found.");
  }

  const historyRows = await fetchPlayerHistory(client, playerId);
  const leaderboardRows = await fetchLeaderboardWindow(client, playerId);
  const identityRow = await fetchPreferredIdentity(client, playerId);

  return {
    player: {
      id: player.id,
      displayName: player.display_name,
      email: identityRow?.email ?? player.email,
      avatarUrl: player.avatar_url,
      authProvider: identityRow?.provider ?? player.auth_provider ?? "anonymous",
      rank: getRankName(player.global_elo)
    },
    authUser: createAuthUserFromIdentityRow(identityRow),
    stats: createStatsFromPlayerRow(player, historyRows),
    leaderboard: createLeaderboardEntries(leaderboardRows, playerId)
  };
}

export async function signInWithGooglePlayer(client, currentPlayerId, googleUser) {
  const currentPlayer = currentPlayerId ? await fetchPlayerById(client, currentPlayerId, true) : null;
  const googleIdentity = await fetchIdentityByProvider(client, "google", googleUser.providerId, true);

  if (googleIdentity) {
    const googlePlayer = await fetchPlayerById(client, googleIdentity.player_id, true);
    if (!googlePlayer) {
      throw new Error("Linked Google player profile was not found.");
    }

    const updatedGoogleResult = await client.query(
      `
        UPDATE players
        SET display_name = $1,
            avatar_url = $2,
            auth_provider = 'google',
            auth_provider_id = $3,
            email = $4,
            updated_at = now()
        WHERE id = $5
        RETURNING *
      `,
      [googleUser.name, googleUser.avatarUrl ?? null, googleUser.providerId, googleUser.email, googlePlayer.id]
    );
    const updatedGooglePlayer = updatedGoogleResult.rows[0];

    await upsertPlayerIdentity(client, updatedGooglePlayer.id, {
      provider: "google",
      providerId: googleUser.providerId,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.avatarUrl
    });

    if (currentPlayer && currentPlayer.id !== googlePlayer.id) {
      return mergePlayerDataIntoTarget(client, currentPlayer, updatedGooglePlayer);
    }

    return updatedGooglePlayer;
  }

  if (currentPlayer) {
    const result = await client.query(
      `
        UPDATE players
        SET display_name = $1,
            avatar_url = $2,
            auth_provider = 'google',
            auth_provider_id = $3,
            email = $4,
            updated_at = now()
        WHERE id = $5
        RETURNING *
      `,
      [googleUser.name, googleUser.avatarUrl ?? null, googleUser.providerId, googleUser.email, currentPlayer.id]
    );

    await upsertPlayerIdentity(client, currentPlayer.id, {
      provider: "google",
      providerId: googleUser.providerId,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.avatarUrl
    });

    return result.rows[0];
  }

  const result = await client.query(
    `
      INSERT INTO players (display_name, avatar_url, auth_provider, auth_provider_id, email)
      VALUES ($1, $2, 'google', $3, $4)
      RETURNING *
    `,
    [googleUser.name, googleUser.avatarUrl ?? null, googleUser.providerId, googleUser.email]
  );

  await upsertPlayerIdentity(client, result.rows[0].id, {
    provider: "google",
    providerId: googleUser.providerId,
    email: googleUser.email,
    name: googleUser.name,
    avatarUrl: googleUser.avatarUrl
  });

  return result.rows[0];
}

function validateSessionPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing session payload.");
  }

  if (!payload.summary || !payload.category || !payload.startedAtIso || !payload.session) {
    throw new Error("Session payload is missing required fields.");
  }

  if (!Array.isArray(payload.outcomes) || !Array.isArray(payload.session.rounds)) {
    throw new Error("Session payload must include rounds and outcomes arrays.");
  }
}

function buildCountryStatsMap(outcomes, roundsById) {
  const counts = new Map();

  for (const outcome of outcomes) {
    const round = roundsById.get(outcome.roundId);
    if (!round?.mediaCountry) {
      continue;
    }

    const entry = counts.get(round.mediaCountry) ?? {
      shown: 0,
      correct: 0,
      wrong: 0,
      timedOut: 0
    };

    entry.shown += 1;
    if (outcome.timedOut) {
      entry.timedOut += 1;
    } else if (outcome.correct) {
      entry.correct += 1;
    } else {
      entry.wrong += 1;
    }

    counts.set(round.mediaCountry, entry);
  }

  return counts;
}

export async function recordCompletedSession(client, playerId, payload) {
  validateSessionPayload(payload);

  const player = await fetchPlayerById(client, playerId, true);
  if (!player) {
    throw new Error("Cannot record a session without a player.");
  }

  const categoryColumn = CATEGORY_ELO_COLUMN[payload.category];
  if (!categoryColumn) {
    throw new Error(`Unsupported category: ${payload.category}`);
  }

  const summary = payload.summary;
  const outcomes = payload.outcomes;
  const rounds = payload.session.rounds;
  const roundsById = new Map(rounds.map((round) => [round.id, round]));
  const currentCategoryElo = player[categoryColumn];
  const globalUpdate = calculateEloUpdate(summary, player.global_elo);
  const categoryUpdate = calculateEloUpdate(summary, currentCategoryElo);

  const correctCount = outcomes.filter((outcome) => outcome.correct).length;
  const timeoutCount = outcomes.filter((outcome) => outcome.timedOut).length;
  const wrongCount = outcomes.length - correctCount - timeoutCount;
  const startedAt = new Date(payload.startedAtIso);
  const completedAt = payload.completedAtIso ? new Date(payload.completedAtIso) : new Date();
  const durationMs = Number.isFinite(startedAt.getTime()) && Number.isFinite(completedAt.getTime())
    ? Math.max(0, completedAt.getTime() - startedAt.getTime())
    : null;

  const sessionInsert = await client.query(
    `
      INSERT INTO sessions (
        player_id,
        category,
        pack_id,
        seed,
        player_score,
        rival_score,
        margin,
        won,
        correct_count,
        total_rounds,
        accuracy,
        max_streak,
        easy_count,
        medium_count,
        hard_count,
        elo_before,
        elo_after,
        elo_delta,
        cat_elo_before,
        cat_elo_after,
        cat_elo_delta,
        duration_ms,
        started_at,
        completed_at
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24
      )
      RETURNING id
    `,
    [
      player.id,
      payload.category,
      payload.session.packId,
      payload.session.seed,
      summary.playerScore,
      summary.rivalScore,
      summary.margin,
      summary.playerWon,
      summary.correctCount,
      rounds.length,
      summary.accuracy,
      summary.maxStreak,
      summary.difficultyCounts.easy,
      summary.difficultyCounts.medium,
      summary.difficultyCounts.hard,
      player.global_elo,
      globalUpdate.newElo,
      globalUpdate.delta,
      currentCategoryElo,
      categoryUpdate.newElo,
      categoryUpdate.delta,
      durationMs,
      payload.startedAtIso,
      completedAt.toISOString()
    ]
  );

  const sessionId = sessionInsert.rows[0].id;
  let runningElo = player.global_elo;

  for (const outcome of outcomes) {
    const round = roundsById.get(outcome.roundId);
    if (!round) {
      continue;
    }

    const eloDelta = Number.isFinite(outcome.eloDelta) ? outcome.eloDelta : 0;
    runningElo = Number.isFinite(outcome.eloAfter) ? outcome.eloAfter : Math.max(0, runningElo + eloDelta);

    await client.query(
      `
        INSERT INTO round_outcomes (
          session_id,
          player_id,
          round_number,
          round_id,
          mode,
          difficulty,
          modifier,
          left_option,
          right_option,
          correct_answer,
          media_country,
          selected_answer,
          correct,
          timed_out,
          time_remaining,
          score_delta,
          streak_after,
          elo_delta,
          elo_after
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19
        )
      `,
      [
        sessionId,
        player.id,
        round.roundNumber,
        round.id,
        round.mode,
        round.difficulty,
        round.modifier,
        round.leftOption,
        round.rightOption,
        round.correctAnswer,
        round.mediaCountry,
        outcome.selectedAnswer,
        outcome.correct,
        outcome.timedOut,
        Number.isFinite(outcome.timeRemainingSec) ? outcome.timeRemainingSec : null,
        outcome.scoreBreakdown.delta,
        outcome.streakAfter,
        eloDelta,
        runningElo
      ]
    );
  }

  await client.query(
    `
      INSERT INTO elo_history (player_id, category, elo_before, elo_after, delta, session_id)
      VALUES
        ($1, NULL, $2, $3, $4, $5),
        ($1, $6, $7, $8, $9, $5)
    `,
    [
      player.id,
      player.global_elo,
      globalUpdate.newElo,
      globalUpdate.delta,
      sessionId,
      payload.category,
      currentCategoryElo,
      categoryUpdate.newElo,
      categoryUpdate.delta
    ]
  );

  const updatedPlayer = await client.query(
    `
      UPDATE players
      SET global_elo = $1,
          ${categoryColumn} = $2,
          total_sessions = total_sessions + 1,
          total_rounds = total_rounds + $3,
          total_correct = total_correct + $4,
          total_wrong = total_wrong + $5,
          total_timeouts = total_timeouts + $6,
          best_streak = GREATEST(best_streak, $7),
          wins = wins + $8,
          losses = losses + $9
      WHERE id = $10
      RETURNING *
    `,
    [
      globalUpdate.newElo,
      categoryUpdate.newElo,
      outcomes.length,
      correctCount,
      wrongCount,
      timeoutCount,
      summary.maxStreak,
      summary.playerWon ? 1 : 0,
      summary.playerWon ? 0 : 1,
      player.id
    ]
  );

  const countryStats = buildCountryStatsMap(outcomes, roundsById);
  for (const [country, counts] of countryStats.entries()) {
    await client.query(
      `
        INSERT INTO country_stats (
          player_id,
          country,
          times_shown,
          times_correct,
          times_wrong,
          times_timed_out,
          last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, now())
        ON CONFLICT (player_id, country)
        DO UPDATE
        SET times_shown = country_stats.times_shown + EXCLUDED.times_shown,
            times_correct = country_stats.times_correct + EXCLUDED.times_correct,
            times_wrong = country_stats.times_wrong + EXCLUDED.times_wrong,
            times_timed_out = country_stats.times_timed_out + EXCLUDED.times_timed_out,
            last_seen_at = now()
      `,
      [player.id, country, counts.shown, counts.correct, counts.wrong, counts.timedOut]
    );
  }

  const snapshot = await buildPlayerSnapshot(client, player.id);

  return {
    snapshot: {
      ...snapshot,
      player: {
        ...snapshot.player,
        id: updatedPlayer.rows[0].id
      }
    },
    globalDelta: globalUpdate.delta,
    categoryDelta: categoryUpdate.delta,
    sessionId
  };
}
