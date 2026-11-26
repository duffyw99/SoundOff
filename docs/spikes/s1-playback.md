# Spike S1: YouTube IFrame playback on real devices

**Issue:** M0-4 (#5) **Refs:** FR-6.2 to FR-6.5, R1, R2
**Status:** embed-origin question answered; background-playback results not yet recorded.

## Goal

Find out whether in-app playback with the YouTube IFrame Player API is good enough for a
listening game, especially when the phone is locked or the app is in the background.

## Findings so far

### Embed origin (first test round)

The first runs failed with error 150 on most videos, which looked like "embedding disabled by
owner". Further testing showed the cause was the **page origin**, not the videos or the device:

| Origin the page was served from | Control video | Five well-known music videos |
| --- | --- | --- |
| `http://localhost:5173` (desktop Firefox) | plays | play |
| `http://127.0.0.1:5173` (desktop) | plays | error 150 |
| `http://<LAN IP>:5173` (desktop Firefox, Android Firefox, Android Chrome) | plays | error 150 |
| `https://<user>.github.io/SoundOff/` (HTTPS hostname) | plays | all play |

Conclusions:

- YouTube accepted embeds from hostname-based origins (`localhost`, an HTTPS domain) and rejected
  them from bare IP addresses. The exact rule inside YouTube is not documented here.
- Mainstream music videos **do** embed from a real HTTPS hostname, so risk R2 is smaller than
  feared. Individual videos can still be non-embeddable, so the `videos.list` check in M0-5 and the
  playback-time skip are still needed.
- Error 150's usual label ("embedding disabled by owner") is misleading when the origin is the
  cause. The page now says so.
- Never test playback from an IP-address origin. Develop on `localhost`.

## The test page

`web/spikes/s1-playback.html` is a throwaway page. It plays a queue of videos, advances tracks,
skips tracks that fail to play (showing an "Open on YouTube" link), and writes a timestamped log.

The log is the evidence. When the page becomes visible again after being hidden, it prints how
long it was hidden and how far the video position moved. If the position kept pace with the clock,
playback continued in the background. It prints a verdict line for each return.

The page has two modes:

- **Our queue:** the app loads one video at a time and advances itself (how the real app is
  planned to work).
- **Native playlist:** hands the whole list to the YouTube player (`loadPlaylist`). Worth
  comparing, because background behavior can differ.

## Running it on your phones

**Use an HTTPS hostname.** Phones on a LAN IP address (`http://192.168...`) will fail to embed music
videos (see Findings). Two options:

1. **GitHub Pages (used for this spike):** publish `web/spikes/s1-playback.html` as `index.html`
   on a throwaway branch (for example `spike-pages`), then in the repo go to Settings, Pages, and
   deploy from that branch. The page contains no secrets. Delete the branch and turn Pages off when
   finished.
2. **The deployed dev service** once M0-7 is done (a real HTTPS hostname).

For desktop checks, `npm run dev -w web` and open `http://localhost:5173/spikes/s1-playback.html`
(use the name `localhost`, not `127.0.0.1`). The `dev:lan` script is not useful for music embeds.

**Home-screen/installed testing:** use the HTTPS page. On Android, use "Add to Home screen" or
"Install app" and open it from the icon. The page shows "Display mode" at the top, so you can see
what you actually got. If you cannot get standalone mode on a platform, record that.

## Test procedure (repeat for each platform row)

Use the default queue unless noted. Tap **Markers** just before and just after each action.

1. **Start:** tap **Load queue**, then **Play**. Record whether the first track starts from that tap.
2. **Auto-advance:** let a track end (or seek near the end). Record whether the next track starts.
3. **Screen lock:** play, tap "Locking screen", press the lock button, wait 30 seconds, unlock, tap
   "Unlocked". Record what you heard while locked, and read the verdict line in the log.
4. **Switch app:** play, tap "Switching app", go to another app for 30 seconds, return.
5. **Switch tab / minimize:** play, switch to another browser tab (or minimize the browser on
   desktop) for 30 seconds, return.
6. **Skip on error:** add a video that cannot be embedded or is region-blocked, if you know one.
   Record whether the page skipped it and showed the notice with the link.
7. **Bluetooth or car audio** (if available): start playback, then lock the screen. Record whether
   audio continues and whether lock-screen or car controls work.
8. Repeat steps 3 and 4 in **Native playlist** mode on the platforms where Our queue failed.
9. **Visibility:** confirm the video is visible and unobscured whenever playing (FR-6.4).

## Results matrix

Fill each cell with **PASS**, **FAIL**, or **N/A**, plus a short note. "Continues" means audio kept
playing and the log verdict says so.

| Platform | Starts on tap | Auto-advance | Screen lock continues | Switch app continues | Switch tab continues | Error skip | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iOS Safari (browser tab) | TBD | TBD | TBD | TBD | TBD | TBD | |
| iOS home-screen app | TBD | TBD | TBD | TBD | TBD | TBD | |
| Android Chrome (browser tab) | TBD | TBD | TBD | TBD | TBD | TBD | |
| Android installed app | TBD | TBD | TBD | TBD | TBD | TBD | |
| Desktop Chrome | TBD | TBD | N/A | N/A | TBD | TBD | |
| Desktop Safari | TBD | TBD | N/A | N/A | TBD | TBD | |

Record for each device: OS version, browser version, and the "Display mode" line from the page.
Do not include personal information.

## Raw logs

Paste the copied logs here, one fenced block per platform. Trim to the relevant lines.

```
(none yet)
```

## Conclusions

_To be completed after testing._

- Does in-app playback survive screen lock and app switching on iOS? On Android?
- Is Our queue or Native playlist more reliable?
- Do non-embeddable tracks degrade gracefully (skip plus link)?

## Decision guide for M0-9

| Finding | Suggested decision |
| --- | --- |
| Playback continues on lock and app switch on both iOS and Android | Ship in-app playback as planned. |
| Works on Android only | Ship in-app playback. Tell iPhone players to keep the screen on and the app open, and offer the per-track "Open on YouTube" link. Consider moving the host-only YouTube playlist export into v1. |
| Fails on both when locked, works while the screen is on | Same as above. Position the game as "listen with the screen on", and prioritise the playlist export for people who want background listening. |
| Fails or is unreliable even with the screen on | Re-plan playback before Milestone 1. Options: playlist export as the primary path, or a different approach. |

Embedding itself is no longer the main concern (see Findings). The decision now rests mainly on
background and screen-lock behavior.

Record the final decision in `docs/spikes/m0-decision.md` (M0-9).
