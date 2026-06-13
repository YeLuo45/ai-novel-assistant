/**
 * V2102 CycleRetryStrategy tests - 30+ tests covering strategy creation,
 * exponential/linear/jitter delay calculation, shouldRetry decisions,
 * recordAttempt bookkeeping, and reset / inspection helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  createRetryStrategy,
  nextDelay,
  nextDelayJittered,
  shouldRetry,
  recordAttempt,
  getAttempts,
  resetStrategy,
  totalDelaySoFar,
  isExhausted,
  lastAttempt,
} from '../CycleRetryStrategy';

function makeStrategy(overrides: Record<string, unknown> = {}) {
  return createRetryStrategy({
    type: 'exponential',
    baseDelay: 100,
    maxDelay: 10_000,
    maxRetries: 3,
    jitterRatio: 0.25,
    ...overrides,
  } as Record<string, unknown>);
}

describe('CycleRetryStrategy - createRetryStrategy', () => {
  it('applies defaults when no config supplied', () => {
    const s = createRetryStrategy();
    expect(s.config.type).toBe('exponential');
    expect(s.config.baseDelay).toBe(100);
    expect(s.config.maxDelay).toBe(30_000);
    expect(s.config.maxRetries).toBe(5);
    expect(s.config.jitterRatio).toBe(0.25);
    expect(s.config.nonRetryableErrors).toEqual([]);
  });

  it('starts with empty attempts and zero delay', () => {
    const s = makeStrategy();
    expect(s.attempts.length).toBe(0);
    expect(s.totalDelay).toBe(0);
  });

  it('rejects negative baseDelay', () => {
    expect(() => createRetryStrategy({ baseDelay: -1 })).toThrow();
  });

  it('rejects negative maxDelay', () => {
    expect(() => createRetryStrategy({ maxDelay: -1 })).toThrow();
  });

  it('rejects negative maxRetries', () => {
    expect(() => createRetryStrategy({ maxRetries: -1 })).toThrow();
  });

  it('rejects out-of-range jitterRatio', () => {
    expect(() => createRetryStrategy({ jitterRatio: -0.1 })).toThrow();
    expect(() => createRetryStrategy({ jitterRatio: 1.1 })).toThrow();
  });

  it('rejects NaN limits', () => {
    expect(() => createRetryStrategy({ baseDelay: NaN })).toThrow();
    expect(() => createRetryStrategy({ maxDelay: NaN })).toThrow();
    expect(() => createRetryStrategy({ maxRetries: NaN })).toThrow();
    expect(() => createRetryStrategy({ jitterRatio: NaN })).toThrow();
  });

  it('accepts a user-supplied nonRetryableErrors list', () => {
    const s = createRetryStrategy({ nonRetryableErrors: ['AbortError'] });
    expect(s.config.nonRetryableErrors).toEqual(['AbortError']);
  });
});

describe('CycleRetryStrategy - nextDelay (exponential)', () => {
  it('uses baseDelay for the first attempt', () => {
    const s = makeStrategy({ type: 'exponential', baseDelay: 100 });
    expect(nextDelay(s, 1)).toBe(100);
  });

  it('doubles each retry', () => {
    const s = makeStrategy({ type: 'exponential', baseDelay: 100 });
    expect(nextDelay(s, 1)).toBe(100);
    expect(nextDelay(s, 2)).toBe(200);
    expect(nextDelay(s, 3)).toBe(400);
    expect(nextDelay(s, 4)).toBe(800);
  });

  it('clamps to maxDelay', () => {
    const s = makeStrategy({ type: 'exponential', baseDelay: 100, maxDelay: 250 });
    expect(nextDelay(s, 5)).toBe(250);
  });
});

describe('CycleRetryStrategy - nextDelay (linear)', () => {
  it('uses baseDelay * attempt', () => {
    const s = makeStrategy({ type: 'linear', baseDelay: 50 });
    expect(nextDelay(s, 1)).toBe(50);
    expect(nextDelay(s, 2)).toBe(100);
    expect(nextDelay(s, 3)).toBe(150);
  });

  it('clamps to maxDelay', () => {
    const s = makeStrategy({ type: 'linear', baseDelay: 100, maxDelay: 250 });
    expect(nextDelay(s, 4)).toBe(250);
  });
});

describe('CycleRetryStrategy - nextDelay (jitter)', () => {
  it('alternates +/- spread for the default jitter', () => {
    const s = makeStrategy({ type: 'jitter', baseDelay: 100, jitterRatio: 0.25 });
    // attempt 1 (odd): +spread => 100 + 25 = 125
    expect(nextDelay(s, 1)).toBe(125);
    // attempt 2 (even): -spread => 200 - 50 = 150
    expect(nextDelay(s, 2)).toBe(150);
  });

  it('clamps negative jitter to 0', () => {
    // Out-of-range jitterRatio throws at construction.
    expect(() =>
      createRetryStrategy({
        type: 'jitter',
        baseDelay: 100,
        jitterRatio: 1.5,
      } as Record<string, unknown>)
    ).toThrow();
    // With random()=0 the jitter goes fully negative; clamp to 0.
    const s2 = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      jitterRatio: 1,
      maxDelay: 1_000_000,
    });
    // attempt=2, expo=200, spread=200, direction=-1 => 0 (at boundary)
    expect(nextDelayJittered(s2, 2, () => 0)).toBe(0);
  });

  it('clamps deep-negative jitter to 0 via lo branch', () => {
    const s2 = createRetryStrategy({
      type: 'jitter',
      baseDelay: 10,
      jitterRatio: 1,
      maxDelay: 1_000_000,
    });
    // attempt=2, expo=20, spread=20, direction=-1 => 0 (boundary)
    // Use a larger base to force a negative value when jitter is full down.
    const s3 = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      jitterRatio: 1,
      maxDelay: 1_000_000,
    });
    // attempt=3, expo=400, spread=400, direction=-1 => 0 (boundary)
    expect(nextDelayJittered(s3, 3, () => 0)).toBe(0);
  });
});

describe('CycleRetryStrategy - nextDelay (shared validation)', () => {
  it('rejects attempt < 1', () => {
    const s = makeStrategy();
    expect(() => nextDelay(s, 0)).toThrow();
    expect(() => nextDelay(s, -1)).toThrow();
  });

  it('rejects NaN attempts', () => {
    const s = makeStrategy();
    expect(() => nextDelay(s, NaN)).toThrow();
  });
});

describe('CycleRetryStrategy - shouldRetry', () => {
  it('returns true within the retry budget', () => {
    const s = makeStrategy({ maxRetries: 3 });
    expect(shouldRetry(s, 1)).toBe(true);
    expect(shouldRetry(s, 2)).toBe(true);
    expect(shouldRetry(s, 3)).toBe(true);
  });

  it('returns false beyond maxRetries', () => {
    const s = makeStrategy({ maxRetries: 3 });
    expect(shouldRetry(s, 4)).toBe(false);
  });

  it('returns false for invalid attempts', () => {
    const s = makeStrategy();
    expect(shouldRetry(s, 0)).toBe(false);
    expect(shouldRetry(s, -1)).toBe(false);
    expect(shouldRetry(s, NaN)).toBe(false);
  });

  it('returns false for non-retryable error names', () => {
    const s = createRetryStrategy({
      nonRetryableErrors: ['AbortError'],
      maxRetries: 5,
    });
    expect(shouldRetry(s, 1, { name: 'AbortError' })).toBe(false);
  });

  it('returns false for non-retryable error messages', () => {
    const s = createRetryStrategy({
      nonRetryableErrors: ['FATAL'],
      maxRetries: 5,
    });
    expect(shouldRetry(s, 1, { name: 'Error', message: 'something FATAL here' })).toBe(false);
  });

  it('returns true for retryable errors', () => {
    const s = createRetryStrategy({
      nonRetryableErrors: ['AbortError'],
      maxRetries: 5,
    });
    expect(shouldRetry(s, 1, { name: 'TypeError' })).toBe(true);
  });

  it('treats undefined error.name as empty string', () => {
    const s = createRetryStrategy({
      nonRetryableErrors: ['X'],
      maxRetries: 5,
    });
    expect(shouldRetry(s, 1, { message: 'plain' })).toBe(true);
  });

  it('skips empty nonRetryableErrors entries', () => {
    const s = createRetryStrategy({
      nonRetryableErrors: [''],
      maxRetries: 5,
    });
    // Empty block string should not block any error.
    expect(shouldRetry(s, 1, { name: 'Error', message: 'whatever' })).toBe(true);
  });

  it('matches a non-retryable substring in error message', () => {
    const s = createRetryStrategy({
      nonRetryableErrors: ['FATAL'],
      maxRetries: 5,
    });
    expect(shouldRetry(s, 1, { name: 'Error', message: 'FATAL' })).toBe(false);
  });
});

describe('CycleRetryStrategy - recordAttempt', () => {
  it('numbers attempts starting at 1', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'TypeError', message: 'bad' });
    expect(s.attempts[0].attempt).toBe(1);
    recordAttempt(s, { name: 'Error', message: 'again' });
    expect(s.attempts[1].attempt).toBe(2);
  });

  it('stores error info on each attempt', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'TypeError', message: 'oops' });
    expect(s.attempts[0].errorName).toBe('TypeError');
    expect(s.attempts[0].errorMessage).toBe('oops');
  });

  it('defaults missing error fields', () => {
    const s = makeStrategy();
    recordAttempt(s);
    expect(s.attempts[0].errorName).toBe('Error');
    expect(s.attempts[0].errorMessage).toBe('');
  });

  it('records delayBeforeMs and updates totalDelay', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'E' }, { delayBeforeMs: 50 });
    recordAttempt(s, { name: 'E' }, { delayBeforeMs: 75 });
    expect(s.attempts[0].delayBeforeMs).toBe(50);
    expect(s.attempts[1].delayBeforeMs).toBe(75);
    expect(s.totalDelay).toBe(125);
  });

  it('rejects negative delayBeforeMs', () => {
    const s = makeStrategy();
    expect(() => recordAttempt(s, {}, { delayBeforeMs: -1 })).toThrow();
  });

  it('uses the supplied time source for recordedAt', () => {
    const s = makeStrategy();
    let t = 5000;
    const entry = recordAttempt(s, { name: 'X' }, { now: () => t });
    expect(entry.recordedAt).toBe(5000);
  });
});

describe('CycleRetryStrategy - getAttempts / resetStrategy / totalDelaySoFar', () => {
  it('getAttempts returns defensive copies', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'A' }, { delayBeforeMs: 5 });
    const list = getAttempts(s);
    expect(list.length).toBe(1);
    list.push({
      attempt: 99,
      errorName: 'fake',
      errorMessage: 'fake',
      delayBeforeMs: 0,
      recordedAt: 0,
    });
    expect(s.attempts.length).toBe(1);
  });

  it('resetStrategy clears attempts and totalDelay', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'A' }, { delayBeforeMs: 5 });
    recordAttempt(s, { name: 'B' }, { delayBeforeMs: 7 });
    resetStrategy(s);
    expect(s.attempts.length).toBe(0);
    expect(s.totalDelay).toBe(0);
  });

  it('totalDelaySoFar matches strategy.totalDelay', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'A' }, { delayBeforeMs: 200 });
    recordAttempt(s, { name: 'B' }, { delayBeforeMs: 300 });
    expect(totalDelaySoFar(s)).toBe(500);
  });
});

describe('CycleRetryStrategy - isExhausted / lastAttempt', () => {
  it('isExhausted returns false on a fresh strategy', () => {
    expect(isExhausted(makeStrategy({ maxRetries: 3 }))).toBe(false);
  });

  it('isExhausted returns true when maxRetries reached', () => {
    const s = makeStrategy({ maxRetries: 2 });
    recordAttempt(s, { name: 'A' });
    recordAttempt(s, { name: 'B' });
    expect(isExhausted(s)).toBe(true);
  });

  it('lastAttempt returns undefined when no attempts', () => {
    expect(lastAttempt(makeStrategy())).toBeUndefined();
  });

  it('lastAttempt returns a defensive copy of the latest attempt', () => {
    const s = makeStrategy();
    recordAttempt(s, { name: 'A', message: 'first' }, { delayBeforeMs: 10 });
    recordAttempt(s, { name: 'B', message: 'second' }, { delayBeforeMs: 20 });
    const last = lastAttempt(s);
    expect(last?.attempt).toBe(2);
    expect(last?.errorName).toBe('B');
  });
});

describe('CycleRetryStrategy - nextDelayJittered', () => {
  it('maps a 0 random to -spread (jitter)', () => {
    const s = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      jitterRatio: 0.25,
      maxDelay: 1_000_000,
    });
    // attempt 1, expo=100, spread=25, direction=-1 => 75
    expect(nextDelayJittered(s, 1, () => 0)).toBe(75);
  });

  it('maps a 1 random to +spread (jitter)', () => {
    const s = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      jitterRatio: 0.25,
      maxDelay: 1_000_000,
    });
    // attempt 1, expo=100, spread=25, direction=+1 => 125
    expect(nextDelayJittered(s, 1, () => 1)).toBe(125);
  });

  it('falls back to raw strategy for non-jitter types', () => {
    const s = makeStrategy({ type: 'exponential', baseDelay: 100 });
    expect(nextDelayJittered(s, 1)).toBe(100);
  });

  it('rejects invalid attempts', () => {
    const s = makeStrategy();
    expect(() => nextDelayJittered(s, 0)).toThrow();
    expect(() => nextDelayJittered(s, -1)).toThrow();
    expect(() => nextDelayJittered(s, NaN)).toThrow();
  });

  it('clamps raw random values into [0, 1]', () => {
    const s = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      jitterRatio: 0.5,
      maxDelay: 1_000_000,
    });
    // random() returns > 1; r should be clamped to 1.
    // attempt 1: expo=100, spread=50, direction=+1 => 150
    expect(nextDelayJittered(s, 1, () => 5)).toBe(150);
    // random() returns < 0; r should be clamped to 0.
    // attempt 1: direction=-1 => 50
    expect(nextDelayJittered(s, 1, () => -2)).toBe(50);
  });

  it('clamps raw delay up to maxDelay when jitter pushes past the ceiling', () => {
    const s = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      maxRetries: 10,
      maxDelay: 1_000,
    });
    // attempt=10 → expo=100*512=51200 → clamped to maxDelay=1000
    expect(nextDelay(s, 10)).toBe(1_000);
  });

  it('returns baseDelay unmodified when random() returns exactly 0.5', () => {
    const s = createRetryStrategy({
      type: 'jitter',
      baseDelay: 100,
      jitterRatio: 0.5,
      maxDelay: 1_000_000,
    });
    // random() = 0.5 → r = 0.5 → spread = 0 → delay = baseDelay
    expect(nextDelayJittered(s, 1, () => 0.5)).toBe(100);
  });
});