# Spike S1: YouTube IFrame playback on real devices

**Issue:** M0-4 (#5) **Refs:** FR-6.2 to FR-6.5, R1, R2
**Status:** test page built; results not yet recorded.

## Goal

Find out whether in-app playback with the YouTube IFrame Player API is good enough for a
listening game, especially when the phone is locked or the app is in the background.

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

The page must be reachable from the phone. On a home network the easiest way is the Vite dev server
in LAN mode:

1. From the repo root: `npm run dev:lan -w web`
2. On the PC, run `ipconfig` and note the **IPv4 Address** (for example `192.168.1.23`).
3. If Windows Firewall prompts for Node.js, allow it on **Private** networks.
4. On the phone (same Wi-Fi), open `http://<that address>:5173/spikes/s1-playback.html`.
5. Stop the server (Ctrl+C) when finished. Only do this on a network you trust, since the dev
   server is open to everything on the LAN while it runs.

**Home-screen/installed testing:** over plain `http://` on a LAN address, "Add to Home Screen" may
not give a true standalone app (this differs by platform). The page shows "Display mode" at the
top so you can see what you actually got. If you cannot get standalone mode, record the browser-tab
results now and repeat the standalone rows once a real HTTPS URL exists (after M0-7).

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

Record the final decision in `docs/spikes/m0-decision.md` (M0-9).
