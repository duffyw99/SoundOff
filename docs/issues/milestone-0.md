# Milestone 0: Spikes and Setup — Issue List

Ready to paste into GitHub Issues (or hand to Claude Code to create with `gh issue create`).
Each issue lists suggested labels, requirement references, dependencies, tasks, and acceptance criteria.
Issue numbers below (M0-1 and so on) are working IDs, not GitHub issue numbers.

**Suggested labels:** `milestone:0`, `type:spike`, `type:chore`, `type:security`, `area:web`, `area:server`, `area:infra`, `area:docs`

**Suggested order:** M0-1 → M0-2 → M0-3 (parallel with M0-4 and M0-5) → M0-6 → M0-7 → M0-8 → M0-9

**Public repo reminder:** never commit keys, project IDs you want private, or real user data in any issue, PR, spike write-up, or log excerpt.

---

## M0-1: Enable repository security settings

**Labels:** `milestone:0`, `type:security`, `area:infra`
**Refs:** NFR-11, R9
**Depends on:** the baseline starter-files PR is merged

Manual GitHub settings checklist (no code).

**Tasks**
- [ ] Settings → Code security: enable **secret scanning** and **push protection**
- [ ] Enable **private vulnerability reporting** (matches `SECURITY.md`)
- [ ] Enable **Dependabot alerts** and **Dependabot security updates**
- [ ] Branch protection (or ruleset) on `main`: require a pull request, require the `CI / checks` status check, block force pushes, require branches to be up to date
- [ ] Settings → Actions → General: require approval for workflows from outside contributors (first-time contributors at minimum); set default workflow token permissions to read-only
- [ ] Confirm no `pull_request_target` workflows exist

**Acceptance criteria**
- Pushing a fake test token on a throwaway branch is blocked or flagged by push protection (use an obviously fake, provider-format sample from GitHub's docs; do not use a real credential)
- A direct push to `main` is rejected
- A PR cannot merge until CI passes

---

## M0-2: Pre-commit secret scanning

**Labels:** `milestone:0`, `type:security`, `area:infra`
**Refs:** NFR-11, R9
**Depends on:** none (best done before M0-3 adds lots of files)

**Tasks**
- [ ] Add `gitleaks` as a pre-commit hook (via the `pre-commit` framework or Husky, whichever fits the Node monorepo)
- [ ] Add a `.gitleaks.toml` only if needed for false positives (keep allowlists minimal and documented)
- [ ] Add a CI job that runs gitleaks on the full history of the PR branch
- [ ] Document setup in the README (one command to install hooks)
- [ ] Update `CLAUDE.md` with the "run before commit" expectation

**Acceptance criteria**
- Committing a file containing a fake credential-shaped string is blocked locally
- CI fails on a PR that contains one
- `.env.example` placeholders do not trigger false positives

---

## M0-3: Monorepo skeleton and tooling

**Labels:** `milestone:0`, `type:chore`, `area:web`, `area:server`
**Refs:** Section 2 (stack), 6.1
**Depends on:** none

**Tasks**
- [ ] Root `package.json` using npm workspaces: `web/`, `server/`, `shared/`
- [ ] TypeScript strict config with a shared base `tsconfig`
- [ ] ESLint and Prettier, shared config
- [ ] Vitest for unit tests (all three packages)
- [ ] `shared/`: placeholder export and one passing unit test (proves cross-package imports work)
- [ ] `server/`: Fastify "hello" app with `GET /healthz`, one test
- [ ] `web/`: Vite + React + PWA plugin placeholder page
- [ ] Root scripts: `lint`, `typecheck`, `test`, `dev` (runs web and server together)
- [ ] Commit `package-lock.json` so CI's `npm ci` works
- [ ] Enable the npm block in `.github/dependabot.yml`
- [ ] Update `CLAUDE.md` Commands section and README local-development section

**Acceptance criteria**
- Fresh clone, `npm ci`, then `npm run lint`, `npm run typecheck`, `npm test` all pass
- The CI workflow now runs the real steps (no longer skipped) and passes
- `npm run dev` serves the web page and `GET /healthz` locally

---

## M0-4: Spike S1 — YouTube IFrame playback on real devices

**Labels:** `milestone:0`, `type:spike`, `area:web`
**Refs:** FR-6.2 to FR-6.5, R1, R2
**Depends on:** M0-3 (or a standalone static page if you want to start early)

Goal: find out whether in-app IFrame playback is good enough for a listening game, especially when the phone is locked or the app is backgrounded.

**Tasks**
- [ ] Build a throwaway page that loads the IFrame Player API and plays a queue of 5 video IDs in order, with next, previous, and tap-to-jump
- [ ] Handle `onError` and `onStateChange`; on an error, skip to the next track and show a notice with an "Open on YouTube" link
- [ ] Use a mix of test videos: at least one with embedding disabled and one region-restricted, if you can find them
- [ ] Test matrix (record pass/fail and notes for each): iOS Safari tab, iOS home-screen PWA, Android Chrome, Android installed PWA, desktop Chrome and Safari
- [ ] For each platform, test: autoplay of the first track after a tap; auto-advance to the next track; **screen lock**; **switching to another app**; **switching tabs**; returning to the page; Bluetooth/car audio behavior if available
- [ ] Confirm the player remains visible and unobscured (FR-6.4)
- [ ] Write results to `docs/spikes/s1-playback.md` (a table plus conclusions; no personal info)

**Acceptance criteria**
- A completed test matrix exists in the repo
- The write-up states clearly whether background and locked-screen playback works on each platform, and recommends a fallback if not
- Findings feed directly into M0-9

---

## M0-5: Spike S2 — Embeddability and metadata via `videos.list`

**Labels:** `milestone:0`, `type:spike`, `area:server`
**Refs:** FR-5.2, FR-5.3, FR-5.9, NFR-4, R2, R3
**Depends on:** a Google Cloud project with an API key (see M0-6)

Goal: measure how often typical user-submitted links are rejected, and confirm quota use.

**Tasks**
- [ ] Create a restricted API key (restricted to YouTube Data API v3). Store it only in local `.env` or Secret Manager. Never commit it.
- [ ] Write a script that parses YouTube URL forms (watch, `youtu.be`, `music.youtube.com`, Shorts, timestamps, playlist params) and extracts the video ID; add unit tests for every form
- [ ] Choose about 30 varied songs yourself: official videos, lyric videos, "Topic" auto-generated channels, live performances, covers, region-sensitive content, very long tracks. Keep the list of IDs in the spike write-up only if it is non-sensitive.
- [ ] Call `videos.list` (parts: `snippet`, `contentDetails`, `status`) in batches; record `embeddable`, `regionRestriction`, `duration`, channel name
- [ ] Measure the rejection rate and check the quota used
- [ ] Draft the artist-cleaning rules (strip " - Topic", "VEVO") and test them on the sample
- [ ] Write results to `docs/spikes/s2-embeddability.md`

**Acceptance criteria**
- Unit tests for URL parsing pass
- The write-up reports the embeddable percentage, examples of failure patterns, and confirms the per-lookup quota cost
- Recommendation for how the UI should guide users who hit a non-embeddable link

---

## M0-6: Spike S3a — Google Cloud project, environments, and cost guardrails

**Labels:** `milestone:0`, `type:chore`, `area:infra`
**Refs:** NFR-2, R8, Section 6.5
**Depends on:** none

**Tasks**
- [ ] Create `dev` and `prod` Google Cloud projects (or one project with clearly separated services and databases, if you prefer; document the choice)
- [ ] Attach billing and create a **budget alert** at a small threshold (for example a few dollars) with email notifications
- [ ] Enable required APIs: Cloud Run, Firestore, Secret Manager, Cloud Scheduler, Artifact Registry, YouTube Data API v3
- [ ] Create Firestore databases (Native mode) in one region; note that location cannot be changed later
- [ ] Set Cloud Run limits: min instances 0, max instances 2
- [ ] Create Secret Manager entries for the YouTube key, token hash pepper, and signing secret (values created by you and never shared in chat or committed)
- [ ] Record the non-sensitive setup steps in `docs/infra.md` using placeholders for IDs

**Acceptance criteria**
- Budget alert is configured and test-verified (or its threshold and recipients are confirmed in the console)
- Secrets exist in Secret Manager and nothing sensitive appears in the repo
- `docs/infra.md` lets you rebuild the setup from scratch

---

## M0-7: Spike S3b — Hello-world Cloud Run deploy via GitHub Actions

**Labels:** `milestone:0`, `type:spike`, `area:infra`, `area:server`
**Refs:** NFR-2, NFR-11, Section 6.5
**Depends on:** M0-3, M0-6

**Tasks**
- [ ] Add a `Dockerfile` (multi-stage; builds shared, server, and web; serves the web build from Fastify)
- [ ] Add a `.dockerignore` excluding `.env*`, `.git`, `node_modules`, and local state
- [ ] Set up **Workload Identity Federation** between GitHub and Google Cloud, restricted to this repository and the `main` branch (no JSON key in GitHub)
- [ ] Add `.github/workflows/deploy.yml`: triggers only on push to `main`, minimal permissions (`id-token: write`, `contents: read`), deploys to the `dev` service
- [ ] Enable the Docker block in `.github/dependabot.yml`
- [ ] Verify cold start time and that min instances is 0
- [ ] Document in `docs/infra.md`

**Acceptance criteria**
- Merging to `main` deploys automatically and `GET /healthz` works at the Cloud Run URL
- No long-lived Google credentials exist in GitHub secrets
- A workflow run from a fork or a non-`main` branch cannot deploy

---

## M0-8: Spike S3c — Firestore access and authenticated scheduler tick

**Labels:** `milestone:0`, `type:spike`, `area:server`, `area:infra`
**Refs:** FR-3.4, NFR-9, Section 6.1, R6
**Depends on:** M0-6, M0-7

**Tasks**
- [ ] Set up the Firestore emulator for local dev and tests (via `firebase-tools` as a dev dependency or the gcloud emulator); add an npm script and document it
- [ ] Server: a tiny repository layer with one transactional read-modify-write example (a counter), plus a test against the emulator
- [ ] `POST /internal/tick`: verify the Google-signed OIDC token (audience and service-account email checked); reject everything else. The `ALLOW_UNAUTHENTICATED_TICK` flag may bypass this only when `NODE_ENV=development`.
- [ ] Create a Cloud Scheduler job (every 5 minutes) that calls `/tick` using a dedicated service account with only the permissions it needs
- [ ] Demonstrate idempotency: two concurrent ticks produce one state change

**Acceptance criteria**
- Unauthenticated calls to `/internal/tick` return 401 or 403, and the Scheduler call succeeds
- The concurrency test passes against the emulator
- Document how to run the emulator locally in the README

---

## M0-9: Go/no-go write-up and v1 playback decision

**Labels:** `milestone:0`, `type:spike`, `area:docs`
**Refs:** R1, R2, R3, Section 12
**Depends on:** M0-4, M0-5, M0-8

**Tasks**
- [ ] Summarize S1, S2, and S3 outcomes in `docs/spikes/m0-decision.md`
- [ ] Decide: is IFrame playback acceptable for v1? What fallback ships (link-out per track, and whether the host-only YouTube playlist export moves into v1)?
- [ ] Decide the UX copy and rules for non-embeddable submissions
- [ ] Revisit open questions in `docs/requirements.md` Section 12 and resolve those that block Milestone 1
- [ ] Update risk register (R1, R2, R3) and the plan estimates in `docs/requirements.md`
- [ ] Update `CLAUDE.md` if any architecture rule changed

**Acceptance criteria**
- A clear go/no-go decision is recorded with evidence
- `docs/requirements.md` and `CLAUDE.md` reflect any changes
- Milestone 1 can start with no unresolved blockers

---

## Definition of done (all M0 issues)

- Merged through a PR with passing CI
- No secrets, real user data, or private identifiers committed
- Relevant docs updated in the same PR (`README.md`, `CLAUDE.md`, `docs/`)
- Spike issues end with a written result in `docs/spikes/`, not just code
