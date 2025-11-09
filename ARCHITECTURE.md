# DAN Architecture (Full Workflow)

This document outlines the end-to-end architecture for the DAN productivity platform. It expands the original MVP design to cover the full workflow: onboarding, extension integration, activity logging, ML pipelines, session scoring, social features, bets, task management with LLM, daily self-reports, leaderboards, monitoring, and privacy.

---

## 1. High-Level Overview

| Layer                | Responsibilities                                                                                | Primary Tech |
|----------------------|--------------------------------------------------------------------------------------------------|--------------|
| Web Client           | Onboarding, dashboard, social feed, bets UI, task scheduling, privacy controls                  | Next.js 14, React, Tailwind, React Query |
| Chrome Extension     | Live activity capture, classification requests, offline queue, privacy toggles                  | Chrome MV3, TypeScript |
| Backend API          | Auth, ingestion, sessions, gamification, social, bets, tasks, notifications, exports            | Node.js/Express (Firebase Functions), Firestore, Firebase Auth |
| ML Services          | Activity classification, productivity scoring, LLM-based task splitting, image generation       | FastAPI (DistilBERT), Node workers, OpenAI APIs |
| Data Processing      | Session aggregation, cron jobs, ML retraining, leaderboards, analytics                           | Firebase Functions, BullMQ/Bull Board, Redis, BigQuery |
| Observability/Security | Monitoring, auditing, rate limiting, privacy enforcement                                      | Prometheus, Grafana, Sentry, ELK, Cloud KMS |

Core data stores:
- **Firestore**: operational data (users, sessions, tasks, bets, social content, settings)
- **Firebase Auth**: identity provider for web and extension tokens
- **Redis**: leaderboards, rate limits, job queues
- **S3 / Cloud Storage**: generated images, model artifacts, data export bundles
- **BigQuery**: analytics warehouse & ML feature store

---

## 2. Component Architecture

### 2.1 Web Application
- Next.js App Router with authenticated client-side routes for dashboard, social, bets, leaderboards, tasks, settings.
- Onboarding wizard after signup:
  1. Welcome & privacy overview
  2. Extension installation instructions
  3. Permissions & data usage explainer
  4. Gamification rules (points, badges, bets)
  5. Preferences setup (domain exclusions, sharing defaults)
  6. Generate extension setup code (short-lived)
- Dashboard highlights: today’s productivity score, task list, focus timer, calendar suggestions, self-report prompt, streak tracker.
- Social features: friend activity feed, kudos, comments, share generated images.
- Bets page: create/accept bets, view escrow balances, history.
- Leaderboards: global, friends, daily/weekly/monthly, per-category.
- Settings: privacy toggles, data export/delete, domain blacklist, notification preferences, OAuth connect (Google Calendar).
- Uses Firebase Auth for identity, but all data access through custom API to enforce token scopes and business logic.

### 2.2 Chrome Extension
- Background service worker monitors:
  - Active tab changes (`chrome.tabs.onActivated`, `onUpdated`)
  - Idle state via `chrome.idle`
  - Interaction via periodic content script pings
- SessionTracker maintains current session state, stores queue in IndexedDB/`chrome.storage.local`.
- Privacy controls:
  - Domain exclusion list synced from backend; local overrides allowed.
  - Incognito logging disabled by default (explicit opt-in).
  - “Local-only mode”: all events stored locally until manual sync.
- Authentication flow:
  1. User enters setup code or completes OAuth redirect.
  2. Extension exchanges code for access + refresh tokens (`POST /api/auth/extension/link`).
  3. Refresh tokens stored encrypted (AES derived key, stored via `chrome.storage.local`).
  4. Access token refreshed via `/api/auth/refresh` before expiry.
- Upload strategy:
  - Debounce to batch N events or every 60 seconds.
  - Retry with exponential backoff; fallback to manual retry in popup if repeated failures.
  - Metrics logged for failure reasons (network vs auth).

### 2.3 Backend API
- Express app exposed via Firebase Cloud Functions `api`.
- Structured routers:
  - `/auth`
  - `/logs`
  - `/classify`
  - `/sessions`
  - `/points`
  - `/badges`
  - `/leaderboard`
  - `/tasks`
  - `/bets`
  - `/feed`
  - `/selfreport`
  - `/privacy`
  - `/admin`
- Middleware stack:
  - CORS with dynamic origin allowlist (web app + extension).
  - Auth middleware verifying Firebase ID token or DAN-issued OAuth token.
  - Scope checks (extension tokens limited to logging APIs, web tokens full scope).
  - Rate limiting via Redis (per IP + per user).
  - Request validation (zod schemas) and sanitisation.
  - Error handler logging to Sentry + structured logs.
- WebSockets / push:
  - Firebase Cloud Messaging for mobile/web push notifications.
  - Optional Socket.IO channel hosted in Cloud Run for session_complete, leaderboard_update, bet_status.

### 2.4 ML & Async Workers
- **Classification Service** (FastAPI):
  - DistilBERT fine-tuned on tab titles + URLs.
  - Input: `title`, `url`, `domain`, `language`.
  - Output: `{ category, productive, confidence, probabilities }`.
  - Heuristic overlay (regex for known domains, manual overrides) implemented in backend before/after ML call.
  - If confidence < threshold, mark as `unknown`, flag for manual labeling.
  - Deployed on Cloud Run with autoscaling, using GPU optional.
- **Task Splitter Worker**:
  - Node worker in Cloud Run.
  - Uses OpenAI GPT models with constrained JSON schema.
  - Validates response, handles retries, caches per task hash.
- **Image Generator Worker**:
  - Generates celebratory images (OpenAI Images, Stability AI, or Midjourney API).
  - Uses Sharp to overlay user stats, watermark, badges.
  - Stores in S3, returns signed URL.
- **Productivity Score Service**:
  - Hosts latest regression model (XGBoost or LightGBM) predicting productivity from session metrics.
  - Provides `/score` endpoint; includes model version, calibration info.
- **Cron/Queue Workers**:
  - BullMQ queue on Redis, processed by Cloud Run workers.
  - Jobs: activity backfill, session compute, bet settlement, notifications, weekly summaries, ML retraining, data exports.

---

## 3. Identity & Token Flow

### 3.1 Web Auth
1. User signs up/logs in via Firebase Auth (email/password, Google OAuth, optional 2FA).
2. Backend exchanges Firebase ID token for DAN access token (JWT) with 1 hour TTL, stored in secure HTTP-only cookie (`__Host-dan-token`).
3. Refresh token remains with Firebase; silent refresh using `/api/auth/refresh`.
4. Tokens include scopes (e.g., `user.read`, `sessions.write`, `bets.manage`).

### 3.2 Extension Auth
1. Web onboarding generates `extensionSetupCode` (Firestore doc with TTL 10 minutes).
2. Extension calls `/api/auth/extension/link`:
   - Validates code + device fingerprint (hash of extension install ID + user agent).
   - Returns access token (15 min) + refresh token (7 days) scoped to extension operations.
   - Refresh token hashed and stored in Firestore/Redis; actual token encrypted locally.
3. Extension auto-refreshes via `/api/auth/refresh` when TTL < 2 minutes.
4. Logout clears local storage and revokes refresh token via `/api/auth/extension/logout`.

### 3.3 Token Validation
- Middleware checks signature (RS256), issuer (`web` vs `extension`), audience, expiry.
- Revocation list stored in Redis for O(1) lookup.
- Sensitive operations (points transfer, bet resolution) require short MFA challenge or re-auth.

---

## 4. Data Model (Firestore Collections)

| Collection              | Purpose | Highlights / TTL |
|-------------------------|---------|------------------|
| `users/{uid}`           | Core profile, gamification state | xp, level, streak, privacy flags, balance, badges summary |
| `userSettings/{uid}`    | Preferences | domain blacklist, sharing defaults, notification prefs |
| `authTokens/{hash}`     | Extension refresh token metadata | hashed token, userId, deviceId, expiresAt |
| `activityLogs/{doc}`    | Raw activity events | url, title, domain, startedAt, endedAt, interactionSeconds, classification, confidence (TTL 90 days) |
| `sessions/{id}`         | Session aggregates | computed metrics, scores, tasks summary, badge triggers |
| `sessionMetrics/{id}`   | Feature vectors for ML | normalized metrics, modelVersion, label |
| `tasks/{id}`            | User tasks | severity, weight, dueDate, status, llmSplitStatus |
| `subtasks/{id}`         | LLM-generated subtasks | parentTaskId, suggestedSchedule |
| `calendarBlocks/{id}`   | Suggested scheduling blocks | start, end, status |
| `bets/{id}`             | Bet lifecycle | creatorId, opponentId, wager, status, conditions, escrows |
| `betTransactions/{id}`  | Ledger entries | betId, userId, type, delta, balanceAfter |
| `pointsLedger/{id}`     | All points transactions | reason, delta, balanceAfter, referenceId |
| `userBadges/{id}`       | Earned badges | badgeId, earnedAt, metadata |
| `badgeDefinitions/{id}` | Badge catalog | rule type, thresholds, rarity, icon |
| `feed/{id}`             | Social posts | type, payload (session/badge/bet), privacy scope, imageUrl |
| `kudos/{id}`            | Reactions / short messages | feedId, fromUserId, emoji/message |
| `leaderboardSnapshots/{id}` | Cached leaderboard entries | period, scope, entries, generatedAt |
| `notifications/{id}`    | In-app notifications | type, payload, readAt |
| `selfReports/{id}`      | Daily productivity label | score 0–100, mood, note, linkedSessionId |
| `mlArtifacts/{id}`      | Model metadata | version, registryPath, metrics, deployedAt |
| `privacyAudits/{id}`    | Audit logs | actor, action, timestamp, details |
| `systemMetrics/{id}`    | Aggregated operational metrics | ingestionRate, failureCounts |

Retention policies:
- `activityLogs`: TTL index 90 days (adjustable per user).
- `notifications`: TTL 30 days.
- `feed`: default TTL 365 days (user-configurable).
- Deletion pipeline ensures cascading removal (bets, ledger, ML features, S3 assets).

---

## 5. API Surface

### 5.1 Auth (`/api/auth`)
- `POST /signup`, `POST /login`
- `POST /refresh` (web + extension)
- `POST /logout`
- `POST /extension/link`, `POST /extension/refresh`, `POST /extension/logout`
- Responses include tokens, user profile, scopes.

### 5.2 Activity & Classification (`/api/logs`, `/api/classify`)
- `POST /logs/activity` – single event (extension fallback)
- `POST /logs/batch` – bulk payload `{ events: ActivityEvent[] }`
- `POST /classify` – proxied to ML service; returns classification object
- `GET /logs` – paginated fetch for user (for privacy review)
- `DELETE /logs/:id` – delete specific event (propagates to session recompute queue)

### 5.3 Sessions & Scoring (`/api/sessions`)
- `POST /sessions/compute` – compute session for interval (manual or cron triggered)
- `GET /sessions` – list with filters (date range, minScore, type)
- `GET /sessions/:id`
- `POST /sessions/:id/share` – update sharing options or initiate social post
- `POST /sessions/self-report-link` – link self-report to session

### 5.4 Points & Badges (`/api/points`, `/api/badges`, `/api/leaderboard`)
- `GET /points/ledger` – transaction history
- `POST /points/transfer` – admin/automated point movements
- `GET /badges` – earned + available badges
- `POST /badges/claim` – manual claim flows
- `GET /leaderboard` – query by scope=global|friends, period=daily|weekly|monthly|all-time, category=points|productiveSec|streak|topic
- `GET /leaderboard/me` – fetch user rank snapshot quickly via Redis

### 5.5 Tasks & LLM (`/api/tasks`)
- `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- `POST /tasks/:id/split` – immediate LLM call (also triggered automatically by cron)
- `GET /tasks/:id/subtasks`
- `POST /tasks/:id/schedule` – accept suggested calendar plan
- `POST /tasks/bulk` – import tasks (CSV, API)
- `POST /tasks/:id/complete` – mark completion, update points

### 5.6 Bets (`/api/bets`)
- `POST /bets/create`, `POST /bets/:id/accept`, `POST /bets/:id/decline`
- `POST /bets/:id/resolve` – manual resolution with winnerId
- `POST /bets/:id/dispute`
- `POST /bets/:id/auto-check` – evaluate condition (used by cron)
- `GET /bets` – list (filters by status)
- `GET /bets/:id` – detail with ledger entries

### 5.7 Social & Sharing (`/api/feed`, `/api/share`, `/api/notifications`)
- `POST /feed` – create post (text + optional generated image reference)
- `GET /feed` – filtered by scope (friends/public)
- `POST /feed/:id/kudos` – add kudos/reaction/comment
- `POST /share/generate` – asynchronous image generation request; returns jobId followed by callback or polling
- `GET /notifications` / `POST /notifications/mark-read`

### 5.8 Self Report (`/api/selfreport`)
- `POST /selfreport` – daily rating, optional note, context (mood, obstacles)
- `GET /selfreport` – list of submissions

### 5.9 Privacy & Data Control (`/api/privacy`)
- `GET /privacy/settings`, `PUT /privacy/settings`
- `POST /privacy/export` – schedules export job; returns jobId and, upon completion, signed URL to download zipped JSON/CSV bundle.
- `DELETE /privacy/delete-account` – triggers full deletion workflow with confirmation window.

### 5.10 Admin (`/api/admin`)
- Protected via role-based claims.
- Endpoints for metrics, manual retraining, badge management, bet dispute resolution, feed moderation.

All endpoints respond with consistent envelope `{ data, meta, errors? }`. Errors include code, message, details (for debugging) and correlationId.

---

## 6. Key Workflows

### 6.1 Onboarding & Extension Setup
1. User completes signup.
2. Onboarding wizard collects preferences, explains privacy, requests extension install.
3. Backend creates `extensionSetupCode` (random string, 10 min TTL) stored under `userSettings`.
4. Extension prompts for code → calls `/api/auth/extension/link`.
5. Backend validates and returns tokens + user profile (domain exclusions, toggles).
6. Extension registers listeners, starts capturing events per privacy configuration.
7. Web dashboard shows completion checklist (extension connected, first session, etc.).

### 6.2 Activity Capture & Classification
1. Extension observes tab change or idle boundary -> updates local session.
2. When tab focus lost or N events collected:
   - Build payload with url, title, domain, startedAt, endedAt, interactionSeconds.
   - Request classification:
     - Backend checks domain heuristics (e.g., docs.google.com)
     - If needed, call ML microservice `/predict`.
     - Combine ML output with heuristics & user overrides.
   - Store event in local queue.
3. Batch upload to `/api/logs/batch`.
4. Backend verifies token, persists to `activityLogs`.
5. If session boundary detected (long idle, manual stop), enqueue session computation job.

### 6.3 Session Aggregation & Scoring
Triggered by:
- Extension manual stop (`popup` -> `STOP_SESSION`)
- Backend cron (every 5 min per user) for auto sessionization
- Manual `/sessions/compute` request

Steps:
1. Fetch raw logs for user/time window.
2. Aggregate metrics: totalSeconds, productiveSeconds (classification productive), interaction ratios, tab switches, domain distribution.
3. Fetch relevant tasks/subtasks completions, self-report, streak context.
4. Compute:
   - `focusIndex = productiveSeconds / totalSeconds`
   - `taskScore = Σ weight * completion_fraction`
   - `consistencyScore`, `engagementScore`, etc.
5. Run productivity scoring model → predicted score 0–100.
6. Normalize final session score: `raw = α*productiveMinutes + β*taskScore + γ*(focusIndex*100)` → clamp 0–100.
7. Persist session record; update `sessionMetrics` for ML with features & label placeholder.
8. Update points ledger (transaction entry with delta, reason `session_score`).
9. Update user streak, xp, total study time using Firestore transaction.
10. Run badge evaluators (streak, cumulative, high focus, marathon).
11. Publish events:
    - WebSocket/FCM `session_complete`
    - Feed item if user opted-in
    - Leaderboard update (Redis ZADD)

### 6.4 Task Management & LLM Split (48h cadence)
1. Cron job selects tasks with severity `project/midterm`, due within 14 days, `llmSplitStatus = pending` or `lastSplit > 48h`.
2. For each task:
   - Compose strict JSON prompt (function call style) with task details, user availability summary.
   - Call LLM worker; if fails, queue retry; escalate after 3 failures.
   - Validate JSON structure with zod; on success, create `subtasks`.
   - Determine scheduling suggestions: fit into upcoming free slots (using `calendarBlocks` or Google Calendar if connected).
3. Notify user (in-app, email) to review decomposed plan.
4. Accepting schedule creates `calendarBlocks`, optionally syncs to Google Calendar via OAuth.

### 6.5 Bets Lifecycle
1. Creator calls `POST /bets/create` with `opponentId`, `wager`, `condition`.
2. Backend transaction:
   - Check creator points balance (from `users.balance`).
   - Deduct wager → create ledger entry `pointsLedger` (type `bet_escrow`).
   - Create bet document status `pending`.
3. Opponent receives notification; acceptance triggers same escrow deduction.
4. Condition evaluation:
   - Manual: `POST /bets/:id/resolve` by moderator or participants.
   - Automatic: Cron uses condition DSL to evaluate (e.g., tasks completed, sessions score).
   - Result updates bet status `won`/`lost`/`void`, closes escrow:
     - Winner receives `2*wager - fee` (configurable), ledger entry `bet_win`.
     - Loser ledger entry `bet_loss`.
5. Feed event + badge evaluation (e.g., `bet_champion`, `first_bet`).
6. Dispute flow: `POST /bets/:id/dispute` -> status `disputed`, freeze points until admin resolves.
7. Audit logs store evidence snapshot (session stats, task completions).

### 6.6 Social Sharing & Image Generation
1. User opts to share session/badge → `POST /share/generate`.
2. Backend enqueues job:
   - Gather stats (score, productive time, streak, badges).
   - Compose prompt for image generation service.
   - Generate image, overlay stats with Sharp, upload to S3, generate signed URL.
3. Once ready, backend updates job status & returns `imageUrl`, `shareCopy`.
4. `POST /feed` stores post with image reference; respect privacy scope (private/friends/public).
5. Kudos/reactions update `kudos` collection; rate limited to prevent spam.

### 6.7 Daily Self-Report
1. Cron (per-user time zone) triggers push/email with self-report link (0–100 slider).
2. Submission stored in `selfReports`, linked to nearest session for label.
3. If user misses report, follow-up reminder next morning (optional).
4. Data ingested into ML training pipeline; also displayed in dashboard trends.

### 6.8 ML Training & Calibration Loop
1. Daily/weekly job checks if enough new labeled sessions (self-report > threshold).
2. ETL pipeline:
   - Export sessions + features to BigQuery.
   - Join with selfReports, bet outcomes, social signals (optional).
   - Feature engineering: rolling averages (7d/30d), domain mix, streak metrics, classification entropy.
3. Train baseline (XGBoost) + evaluate (RMSE, MAE, calibration curves, fairness by user segments).
4. If metrics pass guardrails:
   - Register new model in Artifact Registry with version tag.
   - Deploy to Productivity Score service (blue/green).
   - Update `mlArtifacts` document with metrics, feature list.
5. Generate drift report; if drift detected, alert ML team.

---

## 7. Background Jobs & Schedules

| Frequency | Job | Description |
|-----------|-----|-------------|
| Every 5 minutes | Sessionization | Aggregate raw logs into sessions for passive users; update points/badges |
| Every 10 minutes | Log retry | Process failed uploads from extension queue (if flagged) |
| Hourly | Bet auto-resolve | Evaluate time-bound bet conditions |
| Hourly | Notification digest | Batch push notifications to avoid spam |
| Daily (user local evening) | Self-report prompt | Send reminders for productivity rating |
| Every 2 days | Task split & scheduling | Run LLM on large tasks, update suggestions |
| Daily (00:05 UTC) | Leaderboard rebuild | Refresh leaderboard snapshots (daily/weekly/monthly, global/friends/category) |
| Daily (07:00 local) | Weekly summary (Sunday) | Generate AI weekly digest, email summary |
| Daily | ML retraining check | Trigger training if enough labeled data |
| Daily | Data retention cleanup | Remove expired activity logs, notifications |
| On-demand | Data export | Produce user export bundle (zip, signed URL) |
| Continuous | Worker queue | BullMQ workers for asynchronous tasks (image generation, email, long-running operations) |

All cron jobs orchestrated via Cloud Scheduler or BullMQ repeatable jobs, with status logging in `systemMetrics`.

---

## 8. Points, Badges, and Leaderboards

- **Points Policy**:
  - Base: `points = floor(productiveSeconds / 600)`
  - Task completion bonus: `floor(taskScore) * taskMultiplier (severity-based)`
  - Bet wins/losses adjust points via ledger.
  - Manual adjustments permitted via admin API with audit logging.

- **Badges Lifecycle**:
  - `badgeDefinitions` store metadata & rule configuration (types: `streak`, `cumulative`, `one_time`, `time_of_day`, `event_trigger`).
  - Badge evaluator runs after session compute, task completion, bet resolution.
  - Awards stored in `userBadges`; duplicate prevention via transactions.
  - Badge awarding emits feed event & optional notification.

- **Leaderboards**:
  - Redis sorted sets per leaderboard (e.g., `leaderboard:global:points:all_time`).
  - On points change, update relevant sorted sets.
  - Firestore snapshots stored in `leaderboardSnapshots` for historical view & offline access.
  - API returns top N + requesting user rank (with neighbors).
  - Daily/weekly resets handled by storing per-period key and TTL/archiving to Firestore.

---

## 9. Observability, Monitoring & Alerts

- **Metrics** (Prometheus exporters / Firestore aggregated metrics):
  - `ingestion_rate` (activity logs/hour per region)
  - `classification_latency` & confidence distribution
  - `session_compute_latency`, `session_compute_failures`
  - `model_rmse`, `drift_score`
  - `bet_disputes_rate`, `negative_balance_count`
  - `extension_upload_failures`
- **Dashboards**: Grafana for ops, BigQuery dashboards for product analytics (DAU/WAU, productive time trends).
- **Logging**: Structured JSON logs to ELK; PII scrubbing (hash user IDs if not required).
- **Error Tracking**: Sentry for web, extension, backend; integrates with PagerDuty.
- **Alerts**:
  - Ingestion drop >30% vs baseline.
  - Classification confidence < threshold for >20% events.
  - ML drift detection / significant RMSE increase.
  - Spike in bet disputes / negative balances.
  - High rate of extension upload failures (per user).
  - Data export/del requests failing.

---

## 10. Privacy, Security & Compliance

- **User Controls**:
  - Extension privacy toggle (pause logging).
  - Domain blacklist (from user or organization).
  - Incognito opt-out default (no logging).
  - Local-only mode (store events locally until manual upload).
  - Manual session deletion and redaction.
  - Sharing settings (auto-share sessions/badges off by default).

- **Retention & Deletion**:
  - Activity logs TTL 90 days; sessions 2 years (configurable).
  - Delete account pipeline: mark user as pending deletion, queue job to purge Firestore docs, Redis entries, S3 assets, ML datasets.
  - Exports: zipped JSON/CSV with all user data, stored for 7 days before expiration.

- **Security Measures**:
  - HTTPS enforced, HSTS headers.
  - Access tokens short-lived; refresh tokens stored securely.
  - Firestore security rules enforcing per-user access; server-side only writes for leaderboards, badges, points ledger.
  - Input validation & sanitization everywhere (zod + DOMPurify for posts).
  - Rate limiting and WAF (Cloud Armor) for critical endpoints.
  - Transactions for points/bets to avoid race conditions; ledger ensures auditability.
  - Audit logging for all financial actions, admin operations, privacy actions.
  - Secrets managed via Google Secret Manager; extension uses secure storage APIs.
  - Privacy policy and consent stored with version; onboarding records user consent timestamp.

---

## 11. Deployment & Environments

| Component | Environments | Deployment Strategy |
|-----------|--------------|---------------------|
| Web (Next.js) | Preview per PR, Staging, Production | Vercel deployments via GitHub Actions |
| Backend API (Firebase Functions) | Staging, Production | CI triggered `firebase deploy --only functions:api,...` |
| Cloud Run Services (ML, Workers) | Dev, Staging, Production | Terraform-managed; blue/green deploy |
| Redis/BullMQ | Managed (Upstash/Redis Enterprise) | Provisioned via Terraform |
| ML Models | Dev/Staging/Prod registries | Deployed after automated evaluation |
| Chrome Extension | Dev (side-load), Beta, Production | Chrome Web Store channels |

Environment secrets synced via CI/CD; feature flags managed via Firebase Remote Config or LaunchDarkly (stretch goal).

---

## 12. Performance & Capacity Targets

- Web app FCP < 2s on 4G; Dashboard interactive < 1s.
- Extension CPU usage < 1% idle, memory < 5 MB.
- Activity ingestion latency < 500 ms (p95).
- Session compute within 2 minutes of session end.
- Leaderboard update propagation < 30 seconds for affected users.
- Classification service latency < 150 ms (p95).
- ML scoring service uptime 99.5%, fallback heuristics if unavailable.

---

## 13. Open Questions & Next Steps

1. Finalize domain governance: user-managed vs centrally curated lists.
2. Define bet condition DSL scope (simple templates vs custom scripts).
3. Decide on calendar integration depth (Google Calendar read/write scopes, offline access).
4. Select image generation provider balancing cost and latency.
5. Validate privacy policy and consent flows with legal counsel.
6. Determine long-term analytics strategy (BigQuery cost management, aggregation windows).
7. Confirm monitoring stack (self-hosted Grafana vs managed) and integration with incident response tools.

This architecture blueprint guides the implementation of the full DAN workflow and ensures scalability, privacy, and feature alignment across web, extension, backend, and ML services.
