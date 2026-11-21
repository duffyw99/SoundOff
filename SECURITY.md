# Security Policy

SoundOff! is a small, private-use hobby project whose source code is public.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting instead: go to the repository's
**Security** tab and choose **Report a vulnerability**.

You can expect an acknowledgement within a few days. This is a spare-time
project, so fixes are best-effort.

## Scope

Of particular interest:

- Anything that reveals who submitted a song, or how someone voted, before a
  round's reveal (the app's core anonymity guarantee).
- Invite-link or recovery-link guessing, token leakage, or account takeover.
- Any way to read or write another league's data.
- Secrets or credentials accidentally committed to this repository.

## Secrets policy

This repository is public. No secrets, keys, credentials, real user data, or
database exports belong in it, ever. See `CLAUDE.md` for the rules contributors
and AI coding assistants must follow. If you spot a leaked secret, report it
privately as described above so it can be rotated.
