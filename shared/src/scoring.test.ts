import { describe, expect, it } from 'vitest';
import { effectiveCap, songNetScore } from './index';

describe('effectiveCap', () => {
  it('uses the admin cap when it is already large enough', () => {
    expect(effectiveCap(10, 100, 20)).toBe(10);
  });

  it('raises the cap so the whole pool can be spent', () => {
    expect(effectiveCap(5, 100, 10)).toBe(10);
  });

  it('rounds up when the pool does not divide evenly', () => {
    expect(effectiveCap(5, 100, 3)).toBe(34);
  });

  it('handles the smallest scoreable round (one votable song)', () => {
    expect(effectiveCap(5, 100, 1)).toBe(100);
  });

  it('rejects invalid inputs', () => {
    expect(() => effectiveCap(5, 100, 0)).toThrow(RangeError);
    expect(() => effectiveCap(5, 100, 1.5)).toThrow(RangeError);
    expect(() => effectiveCap(-1, 100, 3)).toThrow(RangeError);
    expect(() => effectiveCap(5, -1, 3)).toThrow(RangeError);
  });
});

describe('songNetScore', () => {
  it('subtracts downvotes from upvotes', () => {
    expect(songNetScore(30, 10)).toBe(20);
  });

  it('never goes below zero', () => {
    expect(songNetScore(5, 20)).toBe(0);
  });
});
