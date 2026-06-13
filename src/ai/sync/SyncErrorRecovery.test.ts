import { describe, it, expect } from 'vitest';
import {
  createRecoveryState,
  computeBackoff,
  recordSuccess,
  recordFailure,
  canAttempt,
  transitionCircuit,
  canRetry,
  recoveryHealth,
} from './SyncErrorRecovery';

describe('V2123 SyncErrorRecovery', () => {
  it('should initialize with closed circuit', () => {
    const s = createRecoveryState();
    expect(s.circuit).toBe('closed');
    expect(s.consecutiveFailures).toBe(0);
  });

  it('should compute exponential backoff with jitter', () => {
    const s = createRecoveryState();
    const delay = computeBackoff(s, 1);
    expect(delay).toBeGreaterThanOrEqual(100);
    expect(delay).toBeLessThanOrEqual(200);
  });

  it('should cap backoff at maxBackoffMs', () => {
    const s = createRecoveryState();
    const huge = computeBackoff(s, 100);
    expect(huge).toBeLessThanOrEqual(30000);
  });

  it('should record success and reset circuit', () => {
    let s = createRecoveryState();
    s = recordFailure(s);
    s = recordFailure(s);
    s = recordSuccess(s);
    expect(s.circuit).toBe('closed');
    expect(s.consecutiveFailures).toBe(0);
  });

  it('should open circuit after threshold failures', () => {
    let s = createRecoveryState();
    s = recordFailure(s);
    s = recordFailure(s);
    s = recordFailure(s);
    expect(s.circuit).toBe('open');
  });

  it('should allow attempt when circuit is closed', () => {
    const s = createRecoveryState();
    expect(canAttempt(s)).toBe(true);
  });

  it('should not allow attempt when circuit is open within cooldown', () => {
    let s = createRecoveryState();
    s = recordFailure(s);
    s = recordFailure(s);
    s = recordFailure(s);
    expect(canAttempt(s)).toBe(false);
  });

  it('should transition circuit after cooldown', () => {
    let s = createRecoveryState();
    s = { ...s, lastFailureAt: Date.now() - 11000, circuit: 'open' as const };
    s = transitionCircuit(s);
    expect(s.circuit).toBe('half_open');
  });

  it('should check retry attempt limit', () => {
    const s = createRecoveryState();
    expect(canRetry(s, 3)).toBe(true);
    expect(canRetry(s, 6)).toBe(false);
  });

  it('should compute recovery health', () => {
    let s = createRecoveryState();
    s = recordFailure(s);
    s = recordFailure(s);
    s = recordFailure(s);
    const h = recoveryHealth(s);
    expect(h.circuit).toBe('open');
    expect(h.health).toBe(0);
  });
});
