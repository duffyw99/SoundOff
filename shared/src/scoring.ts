/**
 * Pure game-scoring helpers shared by the server and the web client.
 * See docs/requirements.md, Section 7 (Scoring Reference).
 */

/**
 * Per-song point cap for one voter (FR-7.3).
 *
 * effectiveCap = max(adminCap, ceil(pool / votableSongs))
 *
 * `votableSongs` is the number of songs this voter is allowed to score,
 * which excludes their own submissions.
 */
export function effectiveCap(adminCap: number, pool: number, votableSongs: number): number {
  if (!Number.isInteger(votableSongs) || votableSongs < 1) {
    throw new RangeError('votableSongs must be a positive integer');
  }
  if (!Number.isInteger(adminCap) || adminCap < 0) {
    throw new RangeError('adminCap must be a non-negative integer');
  }
  if (!Number.isInteger(pool) || pool < 0) {
    throw new RangeError('pool must be a non-negative integer');
  }
  return Math.max(adminCap, Math.ceil(pool / votableSongs));
}

/** A song's round score: upvotes minus downvotes, floored at zero (FR-8.1). */
export function songNetScore(upvotes: number, downvotes: number): number {
  return Math.max(0, upvotes - downvotes);
}
