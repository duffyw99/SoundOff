# CLAUDE.md

Guidance for Claude Code (and any other AI or human contributor) working in this repository.
Read this file at the start of every session.

## Project in one paragraph

SoundOff! is a private social music game. Friends join a **league**, get a themed **round**,
anonymously submit YouTube tracks, listen to a shuffled in-app playlist, distribute points to
other players' picks, then see a **reveal** of who picked what. Scale: 10 to 20 players per league,
several leagues, free-tier hosting. Full spec: `docs/requirements.md` (requirement IDs like FR-7.3).

## THIS IS A PUBLIC REPOSITORY

Everything committed, including history, is visible to the world. Therefore:

1. **Never commit secrets.** No API keys, tokens, passwords, service-account JSON, OAuth client
   secrets, signing keys, or `.env` files. Use `.env.example` with fake placeholders only.
2. **Never commit real user data.** No real names, emails, invite links, recovery links, database
   exports, or Firestore emulator dumps. Test data must be obviously fake.
3. **Never commit real cloud identifiers** (project IDs, service URLs, billing info) if avoidable.
   Use environment variables.
4. Before every commit, check `git diff --staged` for anything that looks like a credential.
5. If a secret is ever committed, treat it as compromised: **rotate it immediately**. Rewriting
   history does not make it safe.
6. Anything prefixed `VITE_` is bundled into the public client. Never put secrets there.
7. Do not weaken `.gitignore`. Do not use `git add -f` on ignored files.
8. CI workflows must use `pull_request`, never `pull_request_target`, and must not echo secrets.

## Stack

- TypeScript everywhere (strict mode)
- `web/`: React + Vite, mobile-first PWA
- `server/`: Node.js + Fastify, deployed as one container on Google Cloud Run (serves API and static web build)
- `shared/`: types and pure game logic (scoring, cap auto-adjust, tiebreakers, state machine) used by both
- Firestore as the database, **accessed only from the server**
- Cloud Scheduler calls `POST /internal/tick` to advance phases and auto-submit ballots
- YouTube IFrame Player API (client playback), YouTube Data API `videos.list` (server metadata)

Layout:

```
web/      React PWA
server/   Fastify API
shared/   shared types + pure logic
docs/     requirements and design docs
```

## Commands

Requires Node 22 (see `.nvmrc`). Run from the repository root (npm workspaces):

```sh
npm ci                  # install exactly what package-lock.json specifies
npm run dev             # server on :8080 and web on :5173 (web proxies /healthz and /api to the server)
npm run lint            # ESLint in every workspace
npm run typecheck       # tsc --noEmit in every workspace
npm test                # Vitest in every workspace
npm run format:check    # Prettier check (use `npm run format` to fix)
npm run build           # production build of the web app
```

Run one workspace with `-w`, for example `npm test -w shared`. CI runs format check, lint,
typecheck, and test on every PR. The server currently runs with `tsx`; a production bundle and
Dockerfile arrive in M0-7.

## Non-negotiable rules (architecture)

1. **Anonymity is enforced on the server.** Before a round is Revealed, no API response may include
   submitter IDs, comments hidden by league settings, or anyone else's ballot. All submission and
   ballot reads go through one central visibility filter keyed on (round phase, requester). Every
   new endpoint needs tests that prove it does not leak, across all phases and roles.
2. **The client never talks to Firestore directly.** Only the server does.
3. **Scoring and game logic live in `shared/` as pure functions with unit tests.** Do not
   duplicate scoring logic in the client or server handlers.
4. **Phase transitions are idempotent and transactional.** Scheduler and manual admin actions may
   fire at the same time. Use Firestore transactions and a phase version field.
5. **Results and standings are derived data.** They must be recomputable from raw votes.
6. **The YouTube player stays visible.** Do not hide or obscure the embed to fake an audio-only UI.
7. **Provider-specific code stays behind the `MusicProvider` interface.** v1 implements YouTube only.
8. **Avoid `search.list`.** Submissions are by pasted link; metadata comes from `videos.list`.
9. **Stay within free tiers.** Cloud Run min instances 0, a small max-instances cap, no paid APIs.
10. **Tokens (invite, device, recovery) are unguessable (128+ bits) and stored hashed.**

## Scoring quick reference

- Song round score = `max(0, upvotes - downvotes)`. A player's round score is the sum over their songs.
- Voters cannot vote on their own songs.
- `effectiveCap = max(adminCap, ceil(pool / votableSongs))`, where `votableSongs` excludes the voter's own songs.
- Tiebreakers: gross upvotes received, then unique voters who awarded points, then highest single-voter award.
- Full detail: `docs/requirements.md`, Section 7.

## Working style

- Reference requirement IDs (for example "implement FR-7.3 and FR-7.4") in commits and PRs.
- Keep PRs small and focused: one issue, one PR. Branch from `main`; never push directly to `main`.
- Write tests first for scoring, state machine, URL parsing, and anything touching anonymity.
- Make sure the pre-commit gitleaks hook is installed (`pre-commit install`) and run `pre-commit run --all-files` before pushing.
- Run lint, typecheck, and tests before declaring work done. Do not claim something works without running it.
- Use the Firestore emulator for local and test runs, never a real project's data.
- Prefer boring, readable code over clever code. Comment the "why", not the "what".
- If a requirement is ambiguous, check `docs/requirements.md` Section 12 (Open Questions), then ask rather than guess.
- When behavior or structure changes, update `docs/requirements.md` and this file in the same PR.

## Commit and PR conventions

- Conventional-style messages are encouraged (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- PR description: what changed, which requirement IDs, how it was tested, and any anonymity impact.

## License

GNU GPL v3 (see `LICENSE`). Do not add code or dependencies whose licenses are incompatible with GPL v3.
