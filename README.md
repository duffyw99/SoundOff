# SoundOff!

A social music game for friends. Each week a league gets a theme (like "Best
Driving Song" or "Guilty Pleasures"). Everyone anonymously submits a YouTube
track, the app builds a shuffled shared playlist, you listen and spend points
on your favorites, and then it reveals who picked what and who voted for what.

> **Status:** early development (Milestone 0). The monorepo skeleton exists; game features are not built yet.

## Planned stack

- TypeScript throughout
- React + Vite mobile-first PWA (`web/`)
- Node.js + Fastify API on Google Cloud Run (`server/`)
- Firestore (accessed only through the server)
- Shared types and scoring logic (`shared/`)
- YouTube IFrame Player API for playback; YouTube Data API for metadata

Designed to run on free-tier hosting for small private leagues (10 to 20 players).

## Documentation

- [Requirements and development plan](docs/requirements.md)
- [Contributor and AI-assistant guide](CLAUDE.md)
- [Security policy](SECURITY.md)

## Local development

Requires Node 22 (see `.nvmrc`).

```sh
npm ci
npm run dev      # server: http://localhost:8080/healthz, web: http://localhost:5173
npm run lint && npm run typecheck && npm test
```

The server reads `PORT` (default 8080). Copy `.env.example` to `.env` for future
configuration; never commit `.env`. See `CLAUDE.md` for all commands and conventions.

## Secret scanning

This is a public repository, so secrets must never be committed. Install the
pre-commit hook once per clone:

```sh
pip install pre-commit    # or: brew install pre-commit
pre-commit install
```

CI also scans the full history of every pull request with gitleaks. If a secret
is ever committed, rotate it immediately. See `CLAUDE.md` and `SECURITY.md`.

## License

[GNU General Public License v3.0](LICENSE)
