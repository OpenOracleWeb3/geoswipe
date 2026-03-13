# GeoSwipe Massive Plan

## 1. Product Vision
GeoSwipe should feel like a fast, addictive, thumb-first geography duel:
- You never type answers.
- You make rapid visual choices.
- The game alternates between confidence and doubt.

Core promise:
- "Can you identify a place from visual texture alone, under time pressure?"

## 2. Game Pillars
1. **Pace**
- One image, two choices, one swipe.
- Round resolution under 1.5s after input.

2. **Tension**
- Streak and timer pressure are visible at all times.
- Misses hurt enough to matter.

3. **Learnability**
- Repeated pair families teach pattern recognition.
- Post-round reveal explains why the pair was confusing.

4. **Fairness**
- Difficulty is deterministic by hour deck and auditable.
- Image source quality checks prevent impossible rounds.

5. **Mobile-first feel**
- Everything reachable by thumb.
- Gestures work first; taps are fallback.

## 3. Difficulty Engine (65/35 Requirement)
### Rule
Per hourly deck:
- **65% hard rounds**
- **35% easy rounds**

Implemented in code:
- `buildHourlyDifficultyDeck(hourKey, roundsPerHour = 20, hardShare = 0.65)`
- Exact mix in a 20-round deck = 13 hard, 7 easy.
- Deck is seeded from hour key and shuffled deterministically.

### Why hourly decks
- Predictable quality for analytics and balancing.
- Easy to audit if users report "too hard" sessions.
- Allows regional A/B by changing only deck seed + pools.

### Run smoothing
Deck smoothing prevents 3+ identical difficulty rounds in sequence unless unavoidable.

## 4. Pair Selection Strategy
## Hard pool design
Hard pool should emphasize visually similar environments:
- Czech Republic vs Russia
- Serbia vs Bulgaria
- Latvia vs Lithuania
- Croatia vs Montenegro
- Japan vs South Korea

Signals used to make hard pairs fair:
- Similar climate family
- Similar architecture era
- Similar road/urban texture
- Shared script family where possible

## Easy pool design
Easy pool should be obvious contrast:
- Jamaica vs Russia
- Maldives vs Hungary
- Greenland vs Dominican Republic
- Egypt vs Finland

Easy rounds serve two goals:
- Confidence recovery after hard streaks
- Broad user retention for casual play sessions

## 5. Round Generation Pipeline
1. Resolve difficulty from hourly deck
2. Pick pair from corresponding pool
3. Randomize left/right option positions
4. Choose one correct location
5. Request image for the correct location
6. Render card and start timer

Round data structure (`GeoRound`):
- `difficulty`
- `pair`
- `leftOption` / `rightOption`
- `correctCountry`
- `correctDirection`

## 6. Image Provider Architecture
### Primary mode
- **Google Street View Static API** when key exists
- Pros: realistic, geolocation-rich, consistent
- Cons: quota/cost/key management

### Fallback mode (no key)
1. Wikimedia Commons API search
2. Unsplash source URL fallback

In code:
- `buildGoogleStreetViewUrl(country)`
- `fetchWikimediaImage(country)`
- `buildUnsplashFallback(country)`

## 7. Scoring + Progression Dynamics
Current formula:
- Correct base:
  - Hard: 180
  - Easy: 100
- Speed bonus:
  - Hard: `secondsLeft * 8`
  - Easy: `secondsLeft * 5`
- Streak bonus:
  - Up to 75% of base
- Miss penalty:
  - Increases with streak and timeout

Why this works:
- Hard rounds are materially more rewarding.
- Speed matters but does not dominate.
- Streaks are meaningful and breakable.

Leveling:
- Score-to-level curve via sqrt progression (`getLevelFromScore`)
- Keeps early levels fast and later levels meaningful.

## 8. Session Design
Current default:
- 20 rounds
- 9 seconds per round

Recommended modes:
1. **Sprint**: 12 rounds / 7 sec
2. **Core**: 20 rounds / 9 sec
3. **Endurance**: 40 rounds / 10 sec

## 9. UX Components to Keep Evolving
1. **GeoChoiceCard**
- Swipe left/right
- Direction hints
- Pair rationale line

2. **GameHud**
- Score, streak, round, timer, level

3. **GeoOnboarding**
- Bottom-sheet tutorial
- One-screen explanation for difficulty mix + controls

4. **ThinLoadingBar**
- Per-round image fetch feedback

5. **GeoBottomNav**
- Play / Learn / Session

## 10. Fairness + Quality Guardrails
1. **Image validation**
- Reject low-resolution, map screenshots, flags, logos, and text-heavy images.

2. **Round validity checks**
- If image fetch fails, repick image before showing round.
- If both options become too obvious from textual sign clues, mark for retraining.

3. **Telemetry quality score per round**
Track:
- Correct rate
- Time-to-answer
- Skip/timeout rate
- Confidence spread by option side

Auto-reclassify rounds:
- If hard round accuracy > 75% over enough samples -> downgrade to medium/easy pool candidate.
- If easy round accuracy < 55% -> promote for review.

## 11. Gamified Algorithm v2 (Planned)
Add adaptive personalization while preserving global 65/35 baseline.

### Baseline distribution
- Keep global 65 hard / 35 easy per hour.

### Personalized substitution layer
- If user misses 4 of last 6 hard rounds:
  - inject one easy recovery round next slot.
- If user hits 8+ streak:
  - inject higher confusion hard pair variant.

### Dynamic confidence model
Per pair and user:
- Track rolling success probability.
- Sample pairs where predicted win chance is 45-70% (flow zone), except intentional easy boosters.

## 12. Content Expansion Plan
### Phase A
- Country-level only (what scaffold already supports).

### Phase B
- City-level ambiguity (e.g., Prague vs Krakow, Seoul vs Tokyo).

### Phase C
- Region-level and landmark-level modes.

### Phase D
- Temporal mode:
  - same place, different decades.
  - weather/season confusion rounds.

## 13. Retention Mechanics
1. Daily seed challenge
- Same deck globally for leaderboard fairness.

2. Streak insurance
- One miss forgiveness token per session milestone.

3. Weekly themes
- "Eastern Europe week", "Nordic confusion week", etc.

4. Quest system
- "Get 5 hard rounds right in a row"
- "Perfect 3 easy rounds under 4s each"

5. Friend duels
- Share a seeded deck link and compare outcomes.

## 14. Leaderboard + Anti-cheat
Leaderboard dimensions:
- Daily score
- Hard-round accuracy
- Best streak
- Average decision speed

Anti-cheat basics:
- Signed round payload (server-issued round IDs)
- Input timing sanity checks
- Repeated impossible timing pattern detection
- Device fingerprint + soft trust score

## 15. Backend Plan (after frontend scaffold)
### API endpoints
1. `POST /api/geoswipe/session/start`
2. `POST /api/geoswipe/session/:id/round/:roundId/answer`
3. `GET /api/geoswipe/session/:id/next`
4. `GET /api/geoswipe/leaderboard?window=daily`

### Data model
- `sessions`
- `round_attempts`
- `pair_stats`
- `user_skill_profile`
- `image_assets`

## 16. Metrics to Track from Day 1
- D1 retention
- Session completion rate
- Hard round accuracy
- Easy round accuracy
- Median answer latency
- Timeout rate
- Streak depth distribution
- Quit-on-loss events

## 17. API Decision Matrix
### Google Street View
- Best realism, highest relevance for location game.
- Requires key + quota.

### Wikimedia Commons
- Free, broad coverage, variable quality.

### Unsplash Source fallback
- Great aesthetics, weaker geolocation reliability.

Recommended production stack:
1. Street View primary
2. Wikimedia backup
3. Curated local image cache fallback

## 18. Roadmap
### Week 1
- Stabilize game loop
- Add pair/content admin JSON tooling
- Add round analytics events

### Week 2
- Add session API backend
- Persist scores
- Add daily challenge seed

### Week 3
- Leaderboard + profile
- Replay/analysis screen
- Pair difficulty auto-reclass pipeline

### Week 4
- Social sharing + friend duels
- Push notifications for streaks
- A/B testing for timer and penalties

## 19. Immediate Next Engineering Tasks
1. Add round-source attribution (Google/Wikimedia/Unsplash) to UI and analytics.
2. Add "report bad round" CTA for dataset hygiene.
3. Prefetch next-round image while current round is active.
4. Add medium difficulty tier (optional), but keep hourly mix constrained around hard/easy target.
5. Add server verification before public leaderboard launch.

## 20. What “good game dynamics” means here
- Rounds alternate emotion: uncertainty -> confidence -> pressure.
- Hard rounds are rewarding enough to chase.
- Easy rounds prevent churn spikes.
- Losses hurt but don’t end momentum.
- Players feel improvement through pattern memory, not trivia memorization.
