# SoundOff! — Requirements & Development Plan (v1 Baseline)

*Status: Draft 1, November 21, 2026. Supersedes the original requirements outline. Reflects decisions made during baseline planning. License: GPL v3 (see `LICENSE`).*

## 1. Overview

SoundOff! is a private, small-scale social music game. Friends join a league, receive a themed round (for example "Best Driving Song" or "Guilty Pleasures"), anonymously submit a YouTube track, listen to a shuffled playlist inside the app, distribute points to the other players' picks, and then see a reveal of who picked what and who voted for what. Points accumulate into a league leaderboard.

**Scale target:** about 10 to 20 players per league, several leagues, a handful of active rounds at any time. Free-tier hosting is a hard goal.

**Primary platform:** a mobile-first Progressive Web App (PWA), usable on desktop browsers.

## 2. Decisions Locked for v1

| Area | Decision |
|---|---|
| Music source | YouTube only. Other providers are deferred behind a `MusicProvider` interface. |
| Playback | In-app playback with the YouTube IFrame Player API. No YouTube OAuth and no Data API playlists in v1. |
| Submission | Paste a YouTube link. No in-app catalog search in v1. |
| Identity | Invite link plus display name. No passwords. Long-lived device token plus a personal recovery link. |
| Tenancy | Multiple leagues from day one. A user can belong to many leagues. |
| Language | TypeScript for front end and back end. |
| Front end | React + Vite, mobile-first PWA. |
| Back end | Node.js (Fastify) in a single container on Google Cloud Run, serving both the API and the static front end. |
| Database | Firestore, accessed only through the server API. |
| Scheduling | Cloud Scheduler calling an internal `/tick` endpoint. |
| Hosting | Cloud Run with minimum instances 0, plus a billing budget alert. |
| Repository | Public GitHub repo, GPL v3. No secrets or real user data in the repo. |

## 3. Scope

### 3.1 In scope for v1

- Leagues, invite links, members, and admins
- Preset and custom themes, with admin-set themes for every round
- Rounds with a submission phase, a voting phase, and a reveal
- Submission by pasted YouTube link, with optional comment, multiple songs per player (1 to 10, admin-configured)
- Fixed randomized tracklist and in-app IFrame player
- Ballots with upvotes, optional downvotes, comments, drafts, and auto-submit
- Round results, reveal, and cumulative league leaderboard
- Steady pacing, with manual admin extension and manual phase advance
- Duplicate-video blocking, plus soft warnings for similar titles and for artists
- In-app status plus a "copy reminder text" button for sharing to a group chat

### 3.2 Planned after v1 (design the data model to allow it)

- Accelerated and Speedy pacing
- Competitive Mode
- Theme-as-you-go (previous winner sets the next theme)
- "Previously played" warnings across rounds and leagues
- Hard artist-duplicate blocking
- Optional host-only "Export to YouTube playlist" (requires OAuth; see Section 9)
- Email reminders and web push
- Live running tally for leagues of 6 or more players
- Spotify and Apple Music providers

### 3.3 Out of scope

- Public leagues and public discovery
- Native iOS/Android apps
- In-app audio streaming of any source other than the YouTube embed
- Payments, ads, and monetization

## 4. Functional Requirements

Requirements are labeled for traceability: **FR** (functional), **NFR** (non-functional). Priority: **M** (must for v1), **S** (should), **L** (later).

### 4.1 Identity and Access

| ID | Requirement | Pri |
|---|---|---|
| FR-1.1 | A league admin can generate an invite link containing an unguessable token. Opening the link lets a new person join by entering a display name. | M |
| FR-1.2 | Joining creates a global user record and stores a long-lived device token in a secure cookie and in `localStorage`. | M |
| FR-1.3 | Each user has a personal recovery link that restores their account on a new device. The recovery link is shown once and can be regenerated, which invalidates the old one. | M |
| FR-1.4 | A user belongs to any number of leagues with one global identity. A display name can be overridden per league. | M |
| FR-1.5 | Admins can regenerate or revoke a league invite link, and can remove members. | M |
| FR-1.6 | Removed members keep their historical submissions and votes in completed rounds, shown under their last display name. | S |

### 4.2 Leagues

| ID | Requirement | Pri |
|---|---|---|
| FR-2.1 | Any user can create a league and becomes its owner and admin. The owner can promote other members to admin. | M |
| FR-2.2 | League settings: name, number of rounds (1 to 100), songs per player per round (1 to 10), upvote pool (up to 100), per-song cap, downvotes on or off with a downvote pool, comment visibility during voting (anonymous or hidden until reveal), duplicate-artist mode (off, warn, block), pacing style, default phase lengths. | M |
| FR-2.3 | Scoring settings lock when the first round opens. Theme, title, description, and deadlines remain editable by admins. | M |
| FR-2.4 | A league has a minimum of 3 active players for a round to be scoreable. A round with fewer than 2 submitted songs is voided and the admin is notified. | M |
| FR-2.5 | A league home screen shows the current round, its phase and deadline, the leaderboard, and past rounds. | M |

### 4.3 Rounds and Phases

Each round moves through a state machine: **Scheduled → Submission → Voting → Revealed** (and **Voided** from Submission or Voting).

| ID | Requirement | Pri |
|---|---|---|
| FR-3.1 | Each phase length is configurable from 1 to 14 days. A popular default is 3 days for submission and 4 days for voting. | M |
| FR-3.2 | Steady pacing: phases advance only at their scheduled deadline. | M |
| FR-3.3 | Admins can extend a deadline or advance a phase manually at any time. | M |
| FR-3.4 | Phase transitions are idempotent and safe if triggered more than once, by both the scheduler and by manual action. | M |
| FR-3.5 | Players who miss the submission deadline cannot vote in that round, but can listen to the playlist. | M |
| FR-3.6 | Accelerated pacing: voting opens early when the last active player submits, and the reveal happens early when the last vote is cast. Next round start time is unchanged. | L |
| FR-3.7 | Speedy pacing: both transitions are immediate, and the next round opens immediately after the reveal. | L |

### 4.4 Themes

| ID | Requirement | Pri |
|---|---|---|
| FR-4.1 | A theme has a title and an optional description. Admins can write custom themes. | M |
| FR-4.2 | The app ships a library of preset themes in categories (rules and constraints, vibe and situation, personal and storytelling, challenge and niche), which admins can use as a starting point. | S |
| FR-4.3 | Themes can be set in advance for all rounds, or edited any time before their round opens. | M |
| FR-4.4 | Theme-as-you-go: the previous round's winner sets the next theme, seeded by two admin-set starting themes, with an admin override after a timeout. | L |
| FR-4.5 | The app does not automatically enforce theme compliance. Players self-police through votes. | M |

### 4.5 Submissions

| ID | Requirement | Pri |
|---|---|---|
| FR-5.1 | During the Submission phase, a player can submit up to the league's songs-per-player limit by pasting a YouTube link (watch, short link, `music.youtube.com`, or mobile share forms). | M |
| FR-5.2 | On submission, the server extracts the video ID and fetches metadata via `videos.list` (title, channel, thumbnail, duration, embeddable status, region restrictions). | M |
| FR-5.3 | A video that is not embeddable is rejected with a clear message asking the player to choose another upload. | M |
| FR-5.4 | The same video ID cannot be submitted twice in the same round (hard block). | M |
| FR-5.5 | A soft warning appears when a normalized title or artist matches another submission in the round. The player can continue. | S |
| FR-5.6 | An editable "artist" field defaults from the channel name (with " - Topic" and "VEVO" cleaned). It is used for duplicate-artist warnings. | S |
| FR-5.7 | A player can add an optional comment, and can swap the song or edit the comment until the submission deadline. | M |
| FR-5.8 | Submissions and their submitters are never visible to other players before the reveal. A player sees only their own submissions. | M |
| FR-5.9 | Songs longer than an admin-set maximum duration (default 10 minutes) are rejected, to keep listening time reasonable. | S |
| FR-5.10 | A "previously played" tag with the earlier round and score. | L |

### 4.6 Playlist and Playback

| ID | Requirement | Pri |
|---|---|---|
| FR-6.1 | When Voting opens, the server creates one fixed random order for the round (a seeded shuffle, stored on the round). Every player sees the same order. | M |
| FR-6.2 | The listening and voting screen shows the YouTube IFrame player and, below it, the tracklist. Each row shows only the title, artist, and duration. | M |
| FR-6.3 | The player plays the queue in order, supports next and previous, and tapping a row jumps to that track. | M |
| FR-6.4 | The YouTube video stays visible in the player at all times. The app does not hide the player to simulate an audio-only experience. | M |
| FR-6.5 | If a video fails at playback (embedding disabled, removed, or region-blocked), the player skips to the next track, shows a notice, and offers an "Open on YouTube" link for that track. | M |
| FR-6.6 | The player remembers the current track and position within the session. | S |
| FR-6.7 | Optional host-only export of the round to a real YouTube playlist. | L |

### 4.7 Voting and Ballots

| ID | Requirement | Pri |
|---|---|---|
| FR-7.1 | Each player receives an upvote pool (and optional downvote pool) per round, and distributes points across other players' songs using + and − controls. | M |
| FR-7.2 | A player cannot vote on their own songs. Their own songs are visibly marked "yours" and have no vote controls. | M |
| FR-7.3 | A per-song cap limits the points on any single track. If there are fewer votable songs than expected, the cap rises automatically: `cap = max(adminCap, ceil(pool / votableSongs))`, where `votableSongs` is the number of songs that voter is allowed to score. | M |
| FR-7.4 | A player can leave a comment on each song. Comments are visible only to the song's submitter and others after the reveal, or anonymously during voting, according to the league setting. | M |
| FR-7.5 | A ballot can be saved as a draft any number of times and submitted as final. A final ballot is editable until the voting deadline unless the league disallows it. | M |
| FR-7.6 | At the voting deadline, a saved draft is automatically submitted as the final ballot. | M |
| FR-7.7 | The ballot shows remaining points in each pool and warns if points are unspent. | M |
| FR-7.8 | Default: missing the voting deadline or leaving points unspent has no scoring penalty. | M |
| FR-7.9 | Competitive Mode: a player who has not spent all required upvotes and downvotes forfeits all upvotes their own songs earned that round. Downvotes against them still count. | L |

### 4.8 Scoring and Standings

| ID | Requirement | Pri |
|---|---|---|
| FR-8.1 | A song's round score is `max(0, upvotes − downvotes)`. | M |
| FR-8.2 | With multiple songs per player, each song is scored individually and a player's round score is the sum. | M |
| FR-8.3 | Score percentage for a song is its net score divided by its maximum possible score. Maximum possible is `eligibleVoters × effectiveCap`, where `eligibleVoters` excludes the submitter and `effectiveCap` is the cap after auto-adjust. *(Assumption to confirm.)* | S |
| FR-8.4 | The league leaderboard ranks players by cumulative net points. It also displays an overall percentage: cumulative net points divided by the sum of per-song maximums across completed rounds. | M |
| FR-8.5 | Tiebreakers, in order: total gross upvotes received, number of unique voters who awarded points, highest single-voter award. Further ties are shared ranks. | M |
| FR-8.6 | The round winner is the submitter with the highest round score, using the same tiebreakers. | M |
| FR-8.7 | The league champion is the leaderboard leader after the final round closes. | M |

### 4.9 Reveal

| ID | Requirement | Pri |
|---|---|---|
| FR-9.1 | When voting closes, the round becomes Revealed and shows, for each song: submitter, submitter comment, points received, percentage, and each voter's points and comment. | M |
| FR-9.2 | Reveal is presented as a guided walkthrough (one song at a time) with an option to jump to a full results table. | S |
| FR-9.3 | The leaderboard updates atomically with the reveal. | M |
| FR-9.4 | A revealed round stays permanently playable in-app as an archive. | M |
| FR-9.5 | Live running tally after submitting your own ballot, for leagues of 6 or more players, admin-enabled. | L |

### 4.10 Notifications and Sharing

| ID | Requirement | Pri |
|---|---|---|
| FR-10.1 | The league home screen shows who has and has not submitted and voted (names only for status, not content), and the time remaining. Admin-configurable: show only counts. | M |
| FR-10.2 | A "copy reminder" button generates a ready-to-paste message for a group chat, with a deep link to the round. | M |
| FR-10.3 | Email reminders via a free-tier email sender for new round, 24 hours before deadline, and results ready. | S |
| FR-10.4 | Web push for installed PWAs. Note that iOS supports it only when the PWA is added to the home screen. | L |

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Anonymity enforced server-side.** The API must never return submitter IDs, comments (when hidden), or other players' ballots for a round before its reveal. This is tested explicitly. The client never reads Firestore directly. |
| NFR-2 | **Cost.** Steady-state cost is zero within free tiers. Cloud Run is configured with min instances 0 and a conservative max instances value (for example 2), plus a billing budget alert. |
| NFR-3 | **YouTube compliance.** Use the official IFrame Player and Data API only. Keep the player visible. Cache metadata only as the API terms allow, and display YouTube branding and links as required. Verify the current YouTube API Services Terms before launch. |
| NFR-4 | **Quota.** Metadata lookups cost about 1 unit each against the default 10,000-unit daily quota. Avoid `search.list`, which has its own 100-call daily bucket. |
| NFR-5 | **Performance.** Pages load in under 3 seconds on a mid-range phone on 4G. A cold start of a few seconds on first request is acceptable. |
| NFR-6 | **Security.** HTTPS only. Unguessable tokens (at least 128 bits). Hashed storage of device and recovery tokens. Rate limiting on join, submit, and vote endpoints. |
| NFR-7 | **Privacy.** Store only display names and, if email reminders are enabled, an email address. Provide a way to delete a user and their data on request. |
| NFR-8 | **Accessibility.** Keyboard operable, sufficient color contrast, labeled controls, and respect for reduced-motion settings. |
| NFR-9 | **Reliability.** Phase transitions, ballot submission, and score computation use Firestore transactions. Scores are recomputable from raw votes. |
| NFR-10 | **Portability.** All provider-specific code (YouTube) sits behind the `MusicProvider` interface. |
| NFR-11 | **Public repository hygiene.** No secrets, real user data, or real cloud identifiers are committed. Secret scanning and push protection are enabled. CI uses `pull_request` triggers only. |

## 6. Architecture

### 6.1 Components

- **Web client:** React + Vite PWA. Talks only to the SoundOff API.
- **API server:** Node.js with Fastify on Cloud Run. Handles auth, league logic, YouTube metadata lookups, anonymity filtering, and scoring.
- **Firestore:** the system of record, reachable only from the server.
- **Cloud Scheduler:** calls `POST /internal/tick` every 5 minutes with an OIDC-authenticated request. The tick advances due phases, auto-submits saved ballots, and queues reminders.
- **YouTube Data API:** `videos.list` for metadata and embeddability.
- **YouTube IFrame Player API:** client-side playback.

### 6.2 MusicProvider interface

```ts
interface MusicProvider {
  id: 'youtube';
  parseUrl(input: string): { trackId: string } | null;
  getMetadata(trackId: string): Promise<TrackMeta>;      // title, artist, duration, thumbnail, embeddable
  isPlayable(meta: TrackMeta, region?: string): boolean;
  playbackAdapter: 'youtube-iframe';                     // client-side adapter key
}
```

Each submission stores `provider` and `trackId`. In v1 a league's rounds all use YouTube.

### 6.3 Data Model

| Collection | Key fields |
|---|---|
| `users` | id, displayName, deviceTokenHash, recoveryTokenHash, createdAt |
| `leagues` | id, name, ownerId, settings (locked after start), inviteTokenHash, status |
| `memberships` | leagueId, userId, role (owner/admin/member), displayNameOverride, joinedAt, removedAt |
| `rounds` | id, leagueId, index, theme {title, description}, themeSetBy, phase, deadlines {submissionEnd, votingEnd}, playlistOrder (array of submission IDs, set at voting open), voidedReason |
| `submissions` | id, roundId, userId, provider, trackId, meta, artist, comment, createdAt |
| `ballots` | id, roundId, userId, status (draft/final), updatedAt, finalizedAt |
| `votes` | ballotId, submissionId, upPoints, downPoints, comment |
| `results` | roundId, per-submission totals, percentages, per-player round scores (derived, recomputable) |
| `standings` | leagueId, per-player cumulative stats (derived, recomputable) |

Submissions store the `userId` server-side, but the API serializes submissions through a visibility filter keyed on the round phase and the requester.

### 6.4 Core API surface (v1)

- `POST /leagues`, `GET /leagues/:id`, `PATCH /leagues/:id`
- `POST /invites/:token/join`, `POST /leagues/:id/invite/regenerate`
- `POST /recover/:token`
- `GET/POST/PATCH /leagues/:id/rounds`, `POST /rounds/:id/advance`, `POST /rounds/:id/extend`
- `POST /rounds/:id/submissions`, `PUT/DELETE /submissions/:id`
- `GET /rounds/:id/playlist` (phase-gated)
- `PUT /rounds/:id/ballot` (draft), `POST /rounds/:id/ballot/submit`
- `GET /rounds/:id/results` (revealed only), `GET /leagues/:id/standings`
- `POST /internal/tick` (scheduler only)

### 6.5 Environments and Delivery

- Two Google Cloud projects or two Cloud Run services: `dev` and `prod`, separate Firestore databases.
- Source in a public GitHub repo. CI (GitHub Actions) runs lint, type check, and tests. Deployment to Cloud Run happens from `main` only, using Workload Identity Federation (no stored Google keys).
- Secrets (YouTube API key, token signing keys) in Secret Manager. Local development uses a git-ignored `.env` based on `.env.example`.
- Firestore emulator for local development and automated tests.

## 7. Scoring Reference

Let `P` be the upvote pool, `D` the downvote pool (optional), and `C` the admin per-song cap.

1. For each voter, `votableSongs` is the number of submissions in the round not belonging to them.
2. `effectiveCap = max(C, ceil(P / votableSongs))`. If downvotes are enabled, the same rule applies to the downvote cap.
3. A voter's allocations must satisfy: sum of up points is at most `P`, sum of down points is at most `D`, and each song receives at most `effectiveCap` up points.
4. Song net score is `max(0, sum(up) − sum(down))`.
5. Round score for a player is the sum of net scores of their songs.
6. Leaderboard total is the sum of round scores over revealed rounds.

**Edge cases to test:** a round with exactly 3 players; a player with several songs (their votable count differs from other voters'); a voter who submits an empty ballot; a draft auto-submitted at the deadline; a member removed mid-league; a tie for first place.

## 8. Risk Register

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Embedded YouTube playback pauses when the phone locks or the browser is backgrounded (especially on iOS). | High: hurts the "listen on a drive" use case. | Spike S1 tests this on real devices. Fallback: "Open on YouTube" per track, and the later host-only playlist export. |
| R2 | Embedding disabled or region-blocked for popular music videos. | Medium | Check `embeddable` and region restrictions at submission. Handle runtime errors by skipping and linking out. |
| R3 | YouTube API terms or quota changes. | Medium | Keep usage to `videos.list`. Re-verify terms before launch. Cache metadata for the life of the round. |
| R4 | Identity loss (cleared cookies) without a recovery path. | Medium | Recovery link (FR-1.3). Admins can re-issue access by removing and re-inviting, with manual merge deferred. |
| R5 | Anonymity leak through an API response or a debug endpoint. | High: breaks the core game. | Central visibility filter, automated tests for every endpoint across all phases. |
| R6 | Double-firing of transitions (scheduler plus manual). | Medium | Idempotent, transactional transitions using a phase version field. |
| R7 | Friends forget to play, and the game dies. | High (social) | Reminders (FR-10), clear status view, sensible default deadlines, admin tools. |
| R8 | Accidental cloud cost. | Low | Max instances cap, budget alert, no paid APIs. |
| R9 | Secret or real user data committed to the public repo. | High | `.gitignore`, secret scanning and push protection, pre-commit scanner, rules in `CLAUDE.md`, rotate on leak. |

## 9. Notes on the Deferred YouTube Export

Creating real YouTube playlists needs OAuth and sensitive scopes. Creating a playlist costs about 50 quota units plus about 50 per item, which fits the default daily quota easily. The harder part is OAuth: apps left in Google's "Testing" status may have refresh tokens that expire after a short period (reported as about 7 days), which would break unattended automation. If we build the export, it should be a manual, host-initiated action, performed while the host is signed in, and the playlist's ownership and visibility on YouTube should be documented to players. Verify current OAuth policy before building.

## 10. Development Plan

Estimates assume one developer working part-time (roughly 8 to 10 hours per week). Adjust as needed.

### Milestone 0: Spikes and Setup (about 1 week)

- **S1 Playback spike:** a static page playing a queue of 5 video IDs with the IFrame API. Test on iOS Safari, iOS home-screen PWA, Android Chrome, and desktop. Record what happens on screen lock, tab switch, and app switch. Test autoplay and queue advance.
- **S2 Embeddability spike:** call `videos.list` for about 30 varied tracks (official videos, lyric videos, Topic channels, live versions, region-blocked ones) and measure how many are embeddable and playable.
- **S3 Deploy spike:** "hello world" container on Cloud Run with a Firestore read and write, plus a Cloud Scheduler call to a protected endpoint.
- Repository hygiene: secret scanning and push protection on, branch protection on `main`, pre-commit secret scanner, `CLAUDE.md`, CI skeleton, two environments.
- Monorepo skeleton (`web/`, `server/`, `shared/`), TypeScript project structure, linting, formatting.
- **Exit criteria:** a written go/no-go on R1 and R2 and the chosen fallback behavior.

### Milestone 1: Foundations (about 2 weeks)

- Data layer and Firestore emulator tests.
- Users, device tokens, recovery links.
- Leagues, settings, memberships, roles, invite create/regenerate/revoke, join flow.
- App shell: PWA manifest, routing, league list and league home.
- **Exit criteria:** two browsers can create a league, join by invite link, and recover an account.

### Milestone 2: Rounds and Submissions (about 2 weeks)

- Round CRUD, theme editor, preset theme library, deadlines.
- Phase state machine with manual advance and extend, and tests for idempotency.
- `MusicProvider` (YouTube): URL parsing, metadata, embeddability, duration rule.
- Submission screen with validation, hard duplicate block, soft warnings, comment, edit and swap.
- Visibility filter v1 and the first anonymity tests.
- **Exit criteria:** a full submission phase works for 5 test users, and no endpoint leaks submitter identity.

### Milestone 3: Playlist and Voting (about 2 to 3 weeks)

- Seeded shuffle persisted at voting open.
- Listening and voting screen: IFrame player, tracklist, error skipping, link-out fallback.
- Ballot UI with pools, caps (including auto-adjust), comments, draft and final states.
- Ballot validation on the server, with auto-submit logic.
- **Exit criteria:** 5 test users complete a voting phase on phones, with correct validation and no ability to vote on their own songs.

### Milestone 4: Scoring, Reveal, Leaderboard (about 2 weeks)

- Results computation and the scoring reference in Section 7, with unit tests for every listed edge case.
- Reveal walkthrough and full results table.
- Leaderboard, tiebreakers, percentages, round archive.
- Recompute tool (admin-only) to rebuild results and standings from raw votes.
- **Exit criteria:** a simulated 12-player, 6-round league produces results matching a hand-calculated spreadsheet.

### Milestone 5: Scheduler, Status, Reminders (about 1 to 2 weeks)

- `/internal/tick`, auto phase advance, auto-submit of ballots, void handling.
- Participation status view and the "copy reminder" button.
- Email reminders if included (FR-10.3).
- Cost guardrails: max instances, budget alert, rate limits.
- **Exit criteria:** a league with short deadlines runs unattended through a whole round.

### Milestone 6: Hardening and Private Beta (about 2 weeks)

- Full anonymity test matrix across all endpoints and phases.
- Accessibility pass and mobile polish.
- Error monitoring and structured logging (Cloud Logging).
- Real-world beta with one friend group over 2 to 3 rounds. Collect feedback and fix issues.
- Verify YouTube API Services Terms compliance and finalize the privacy note.
- **Exit criteria:** a complete real round played end to end by friends, with no data corrections needed.

**Total:** about 12 to 14 weeks part-time to a beta-ready v1.

### Post-v1 Backlog (priority order, tentative)

1. Accelerated and Speedy pacing
2. Theme-as-you-go
3. Competitive Mode
4. "Previously played" warnings
5. Web push notifications
6. Host-only YouTube playlist export
7. Hard artist-duplicate blocking
8. Live running tally
9. Spotify and Apple Music providers (one provider per round)

## 11. Testing Strategy

- **Unit tests:** scoring, cap auto-adjust, tiebreakers, URL parsing, state machine.
- **Integration tests:** API against the Firestore emulator, including the anonymity matrix (every endpoint, every phase, every role).
- **End-to-end tests:** Playwright flows for join, submit, vote, and reveal, using a stubbed YouTube Data API.
- **Device testing:** manual checks of playback on real phones at the end of M0 and M3.
- **Simulation:** a script that generates a multi-round league with random votes to compare against an independent calculation.

## 12. Open Questions

1. Confirm the score percentage definition (FR-8.3).
2. Should a final ballot remain editable until the deadline, or lock on submit? (Default in this document: editable.)
3. What is the default maximum song duration? (Proposed: 10 minutes.)
4. Should the participation view show names of who has not yet submitted or voted, or counts only? (Default: names, with an admin option for counts only.)
5. Is email reminder support wanted in v1, or is the copy-to-group-chat button enough to start?
6. Do you want a single global display name or per-league display names by default? (Proposed: global with optional per-league override.)
7. How long should a league's invite link remain valid by default? (Proposed: until revoked.)
