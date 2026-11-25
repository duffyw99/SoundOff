import { effectiveCap } from '@soundoff/shared';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app';

describe('GET /healthz', () => {
  it('returns ok', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});

describe('workspace wiring', () => {
  it('can import @soundoff/shared', () => {
    expect(effectiveCap(5, 100, 10)).toBe(10);
  });
});
