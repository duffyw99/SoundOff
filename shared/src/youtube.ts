/**
 * YouTube link parsing (FR-5.1). Pure functions shared by the server and the web client.
 *
 * Accepts the link shapes people actually paste: watch, mobile, music, youtu.be share links,
 * Shorts, embed, live, privacy-enhanced embed, attribution links, links without a scheme, and
 * links buried in surrounding text (for example from a share sheet).
 *
 * Hosts are checked against a strict allowlist, so lookalikes such as `youtube.com.evil.com`
 * or `youtube.com@evil.com` are rejected. A successful parse only means the link has the right
 * shape: the server must still confirm the video exists and can be embedded (`videos.list`).
 */

export const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const MAX_INPUT_LENGTH = 2048;

const ALLOWED_HOSTS: ReadonlySet<string> = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/** Path prefixes of the form /<prefix>/<videoId>. */
const ID_PATH_PREFIXES: readonly string[] = ['shorts', 'embed', 'live', 'v'];

export type YouTubeParseFailure =
  | 'empty' // nothing was entered
  | 'too-long' // longer than any sane link
  | 'invalid-url' // not a usable http(s) link (including a bare video ID)
  | 'unsupported-host' // a link, but not to YouTube
  | 'playlist-without-video' // a playlist link that does not point at one video
  | 'no-video-id' // a YouTube link, but not to a video (channel, home page, ...)
  | 'invalid-id'; // a video position was found but the ID is malformed

export type YouTubeParseResult =
  { ok: true; videoId: string; canonicalUrl: string } | { ok: false; reason: YouTubeParseFailure };

function fail(reason: YouTubeParseFailure): YouTubeParseResult {
  return { ok: false, reason };
}

/** Higher rank wins when several words in the input fail for different reasons. */
const FAILURE_RANK: Record<YouTubeParseFailure, number> = {
  empty: 0,
  'too-long': 0,
  'invalid-url': 1,
  'unsupported-host': 2,
  'no-video-id': 3,
  'invalid-id': 3,
  'playlist-without-video': 3,
};

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function parseCandidate(raw: string, depth = 0): YouTubeParseResult {
  if (!raw) return fail('invalid-url');
  // A bare video ID is not a link (FR-5.1 asks for a pasted link).
  if (YOUTUBE_VIDEO_ID_RE.test(raw)) return fail('invalid-url');

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(raw);
  // Without a scheme, only treat the word as a link if it starts like a host name (has a dot).
  // Otherwise ordinary words ("hello") would be mistaken for hosts.
  if (!hasScheme && !/^[^/?#]*\.[^/?#]+/.test(raw)) return fail('invalid-url');
  let url: URL;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    return fail('invalid-url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return fail('invalid-url');

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!ALLOWED_HOSTS.has(host)) return fail('unsupported-host');

  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  const hasList = url.searchParams.has('list');
  let candidate: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    candidate = first ?? null;
  } else if (first === 'watch') {
    candidate = url.searchParams.get('v');
  } else if (first === 'playlist') {
    return fail(hasList ? 'playlist-without-video' : 'no-video-id');
  } else if (first !== undefined && ID_PATH_PREFIXES.includes(first)) {
    candidate = segments[1] ?? null;
    // "videoseries" is an embeddable playlist, and happens to be 11 characters long.
    if (first === 'embed' && candidate === 'videoseries') return fail('playlist-without-video');
  } else if (first === 'attribution_link' && depth === 0) {
    const inner = url.searchParams.get('u');
    if (!inner) return fail('no-video-id');
    try {
      return parseCandidate(new URL(inner, 'https://www.youtube.com').toString(), depth + 1);
    } catch {
      return fail('invalid-url');
    }
  }

  if (candidate === null || candidate === '') {
    return fail(hasList ? 'playlist-without-video' : 'no-video-id');
  }
  if (!YOUTUBE_VIDEO_ID_RE.test(candidate)) return fail('invalid-id');
  return { ok: true, videoId: candidate, canonicalUrl: youtubeWatchUrl(candidate) };
}

/** Strips wrapping and trailing punctuation that often clings to a link in chat text. */
function cleanToken(token: string): string {
  return token.replace(/^[<("'[]+/, '').replace(/[>)"'\].,;!?]+$/, '');
}

/**
 * Parses a pasted YouTube link. If the input contains several words (for example a share-sheet
 * message such as "Song title https://youtu.be/..."), the first word that parses wins.
 */
export function parseYouTubeUrl(input: string): YouTubeParseResult {
  const trimmed = input.trim();
  if (!trimmed) return fail('empty');
  if (trimmed.length > MAX_INPUT_LENGTH) return fail('too-long');

  let best: YouTubeParseResult | null = null;
  for (const token of trimmed.split(/\s+/)) {
    const result = parseCandidate(cleanToken(token));
    if (result.ok) return result;
    if (best === null || best.ok || FAILURE_RANK[result.reason] > FAILURE_RANK[best.reason]) {
      best = result;
    }
  }
  return best ?? fail('invalid-url');
}

/** Convenience wrapper: the video ID, or null if the input is not a usable YouTube video link. */
export function extractYouTubeVideoId(input: string): string | null {
  const result = parseYouTubeUrl(input);
  return result.ok ? result.videoId : null;
}
