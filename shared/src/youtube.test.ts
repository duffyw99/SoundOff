import { describe, expect, it } from 'vitest';
import {
  YOUTUBE_VIDEO_ID_RE,
  extractYouTubeVideoId,
  parseYouTubeUrl,
  youtubeWatchUrl,
  type YouTubeParseFailure,
} from './index';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeUrl: accepted link shapes', () => {
  const accepted: [string, string][] = [
    ['standard watch link', `https://www.youtube.com/watch?v=${ID}`],
    ['http scheme', `http://www.youtube.com/watch?v=${ID}`],
    ['no www', `https://youtube.com/watch?v=${ID}`],
    ['mobile host', `https://m.youtube.com/watch?v=${ID}`],
    ['music host', `https://music.youtube.com/watch?v=${ID}`],
    ['music link with radio list', `https://music.youtube.com/watch?v=${ID}&list=RDAMVM${ID}`],
    ['timestamp', `https://www.youtube.com/watch?v=${ID}&t=43s`],
    ['v is not the first parameter', `https://www.youtube.com/watch?feature=share&v=${ID}`],
    ['video inside a playlist', `https://www.youtube.com/watch?v=${ID}&list=PLabc123&index=3`],
    ['fragment', `https://www.youtube.com/watch?v=${ID}#t=30`],
    ['youtu.be share link', `https://youtu.be/${ID}`],
    ['youtu.be with si and t', `https://youtu.be/${ID}?si=abcDEF123&t=10`],
    ['youtu.be with trailing slash', `https://youtu.be/${ID}/`],
    ['shorts', `https://www.youtube.com/shorts/${ID}`],
    ['shorts with query', `https://www.youtube.com/shorts/${ID}?feature=share`],
    ['embed', `https://www.youtube.com/embed/${ID}`],
    ['privacy-enhanced embed', `https://www.youtube-nocookie.com/embed/${ID}`],
    ['live', `https://www.youtube.com/live/${ID}?si=x`],
    ['legacy /v/ link', `https://www.youtube.com/v/${ID}`],
    ['no scheme: youtube.com', `youtube.com/watch?v=${ID}`],
    ['no scheme: www', `www.youtube.com/watch?v=${ID}`],
    ['no scheme: youtu.be', `youtu.be/${ID}`],
    ['no scheme: mobile', `m.youtube.com/watch?v=${ID}`],
    ['uppercase scheme and host', `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`],
    ['trailing dot on host', `https://www.youtube.com./watch?v=${ID}`],
    ['surrounding whitespace', `   https://youtu.be/${ID}  \n`],
    ['angle brackets', `<https://youtu.be/${ID}>`],
    ['share text before the link', `Check this out https://youtu.be/${ID}?si=x`],
    ['song title before the link', `Rick Astley - Never Gonna Give You Up https://youtu.be/${ID}`],
    ['link in parentheses with a full stop', `(https://youtu.be/${ID}).`],
    [
      'attribution link',
      `https://www.youtube.com/attribution_link?a=abc&u=%2Fwatch%3Fv%3D${ID}%26feature%3Dem-share`,
    ],
  ];

  it.each(accepted)('%s', (_name, input) => {
    const result = parseYouTubeUrl(input);
    expect(result).toEqual({ ok: true, videoId: ID, canonicalUrl: youtubeWatchUrl(ID) });
  });

  it('accepts IDs containing hyphens and underscores, including a leading hyphen', () => {
    expect(extractYouTubeVideoId('https://youtu.be/a-b_c-d_e-f')).toBe('a-b_c-d_e-f');
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=-abcdefghij')).toBe(
      '-abcdefghij',
    );
  });

  it('keeps the case of the ID', () => {
    expect(extractYouTubeVideoId('https://youtu.be/AbCdEfGhIjK')).toBe('AbCdEfGhIjK');
  });

  it('returns a canonical URL that parses back to the same ID', () => {
    const first = parseYouTubeUrl(`https://youtu.be/${ID}?t=9`);
    expect(first.ok).toBe(true);
    if (first.ok) expect(parseYouTubeUrl(first.canonicalUrl)).toEqual(first);
  });
});

describe('parseYouTubeUrl: rejected input', () => {
  const rejected: [string, string, YouTubeParseFailure][] = [
    ['empty string', '', 'empty'],
    ['only whitespace', '   \n\t ', 'empty'],
    ['very long input', 'a'.repeat(3000), 'too-long'],
    ['plain words', 'hello world', 'invalid-url'],
    ['a single plain word', 'hello', 'invalid-url'],
    ['a word with a path but no dot', 'hello/world', 'invalid-url'],
    ['a scheme-less non-YouTube host', 'example.com/watch?v=dQw4w9WgXcQ', 'unsupported-host'],
    ['a bare video ID', ID, 'invalid-url'],
    ['javascript: URL', 'javascript:alert(1)', 'invalid-url'],
    ['ftp: URL', `ftp://youtu.be/${ID}`, 'invalid-url'],
    ['data: URL', 'data:text/html,<script>alert(1)</script>', 'invalid-url'],
    ['another video site', 'https://vimeo.com/12345678', 'unsupported-host'],
    ['Spotify link', 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', 'unsupported-host'],
    [
      'lookalike: subdomain of another site',
      `https://youtube.com.evil.com/watch?v=${ID}`,
      'unsupported-host',
    ],
    ['lookalike: prefixed domain', `https://evilyoutube.com/watch?v=${ID}`, 'unsupported-host'],
    ['lookalike: youtu.be subdomain', `https://youtu.be.evil.com/${ID}`, 'unsupported-host'],
    ['lookalike: not youtu.be', `https://notyoutu.be/${ID}`, 'unsupported-host'],
    ['userinfo trick', `https://youtube.com@evil.com/watch?v=${ID}`, 'unsupported-host'],
    ['playlist page', 'https://www.youtube.com/playlist?list=PLabc123', 'playlist-without-video'],
    [
      'embedded playlist',
      'https://www.youtube.com/embed/videoseries?list=PLabc123',
      'playlist-without-video',
    ],
    [
      'watch link with only a list',
      'https://www.youtube.com/watch?list=PLabc123',
      'playlist-without-video',
    ],
    ['watch page with no video', 'https://www.youtube.com/watch', 'no-video-id'],
    ['watch with an empty v', 'https://www.youtube.com/watch?v=', 'no-video-id'],
    ['home page', 'https://www.youtube.com/', 'no-video-id'],
    ['channel handle', 'https://www.youtube.com/@RickAstleyYT', 'no-video-id'],
    ['channel page', 'https://www.youtube.com/channel/UC1234567890', 'no-video-id'],
    ['youtu.be without an ID', 'https://youtu.be/', 'no-video-id'],
    ['ID too short', 'https://www.youtube.com/watch?v=short', 'invalid-id'],
    ['ID too long', `https://www.youtube.com/watch?v=${ID}extra`, 'invalid-id'],
    ['ID with a bad character', 'https://www.youtube.com/watch?v=dQw4w9WgXc!', 'invalid-id'],
    ['youtu.be ID too short', 'https://youtu.be/dQw4w9WgXc', 'invalid-id'],
    [
      'attribution link pointing at a channel',
      'https://www.youtube.com/attribution_link?u=%2Fchannel%2FUC123',
      'no-video-id',
    ],
    [
      'attribution link nested in another attribution link',
      `https://www.youtube.com/attribution_link?u=${encodeURIComponent(
        `/attribution_link?u=${encodeURIComponent(`/watch?v=${ID}`)}`,
      )}`,
      'no-video-id',
    ],
  ];

  it.each(rejected)('%s', (_name, input, reason) => {
    expect(parseYouTubeUrl(input)).toEqual({ ok: false, reason });
  });

  it('reports the most informative failure when several words fail differently', () => {
    expect(parseYouTubeUrl('listen to https://www.youtube.com/@someone')).toEqual({
      ok: false,
      reason: 'no-video-id',
    });
    expect(parseYouTubeUrl('see https://vimeo.com/123 please')).toEqual({
      ok: false,
      reason: 'unsupported-host',
    });
  });

  it('prefers a good link even when an earlier word is a different link', () => {
    expect(extractYouTubeVideoId(`https://vimeo.com/123 or https://youtu.be/${ID}`)).toBe(ID);
  });
});

describe('extractYouTubeVideoId', () => {
  it('returns the ID for a good link and null otherwise', () => {
    expect(extractYouTubeVideoId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(extractYouTubeVideoId('https://vimeo.com/1')).toBeNull();
    expect(extractYouTubeVideoId('')).toBeNull();
  });
});

describe('round trip over many generated IDs', () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  // Small deterministic generator so failures are reproducible.
  let seed = 123456789;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed;
  };
  const randomId = () =>
    Array.from({ length: 11 }, () => alphabet[next() % alphabet.length]).join('');

  const templates: ((id: string) => string)[] = [
    (id) => `https://www.youtube.com/watch?v=${id}`,
    (id) => `https://m.youtube.com/watch?v=${id}&t=5s`,
    (id) => `https://music.youtube.com/watch?v=${id}&list=RD${id}`,
    (id) => `https://youtu.be/${id}?si=xyz`,
    (id) => `https://www.youtube.com/shorts/${id}`,
    (id) => `https://www.youtube.com/embed/${id}`,
    (id) => `youtu.be/${id}`,
    (id) => `Great song https://youtu.be/${id}`,
  ];

  it('recovers the ID for every template', () => {
    for (let i = 0; i < 200; i++) {
      const id = randomId();
      expect(id).toMatch(YOUTUBE_VIDEO_ID_RE);
      for (const template of templates) {
        expect(extractYouTubeVideoId(template(id)), template(id)).toBe(id);
      }
    }
  });
});

describe('robustness', () => {
  it('never throws on arbitrary input and always returns a well-formed result', () => {
    const pieces = [
      'http://',
      'https://',
      '//',
      ':',
      '@',
      '%',
      '%zz',
      '#',
      '?',
      '&',
      '=',
      '/',
      '\\',
      '.',
      ' ',
      'youtube.com',
      'youtu.be',
      'watch',
      'v=',
      'shorts',
      'embed',
      'list=',
      '\u0000',
      '\u202e',
      'é',
      '😀',
      '[',
      ']',
      '<',
      '>',
      ID,
      'attribution_link',
      'u=',
    ];
    let seed = 42;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed;
    };
    for (let i = 0; i < 2000; i++) {
      const length = 1 + (next() % 12);
      const input = Array.from({ length }, () => pieces[next() % pieces.length]).join('');
      const result = parseYouTubeUrl(input);
      if (result.ok) {
        expect(result.videoId).toMatch(YOUTUBE_VIDEO_ID_RE);
      } else {
        expect(typeof result.reason).toBe('string');
      }
    }
  });
});
