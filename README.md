# SoundOff!

A social music game for friends. Each week a league gets a theme (like "Best
Driving Song" or "Guilty Pleasures"). Everyone anonymously submits a YouTube
track, the app builds a shuffled shared playlist, you listen and spend points
on your favorites, and then it reveals who picked what and who voted for what.

> **Status:** early planning. No application code yet.

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

Setup instructions will be added once the project skeleton exists (Milestone 0).
Copy `.env.example` to `.env` for local configuration. Never commit `.env`.

## License

[GNU General Public License v3.0](LICENSE)
