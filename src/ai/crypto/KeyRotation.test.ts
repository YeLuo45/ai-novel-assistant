import { describe, it, expect } from 'vitest';
import {
  createRotationState,
  recordOp,
  shouldRotateTime,
  shouldRotateCount,
  needsRotation,
  rotate,
  getCurrentKey,
  getOldKey,
  emergencyRotate,
  msUntilNextRotation,
  rotationHealth,
  DEFAULT_POLICY,
} from './KeyRotation';

describe('V2130 KeyRotation', () => {
  it('should create rotation state with current key', () => {
    const s = createRotationState();
    expect(s.currentKeyHex.length).toBe(64);
    expect(s.opCount).toBe(0);
  });

  it('should record op and increment counter', () => {
    let s = createRotationState();
    s = recordOp(s);
    s = recordOp(s);
    expect(s.opCount).toBe(2);
  });

  it('should not rotate when time interval not reached', () => {
    const s = createRotationState();
    expect(shouldRotateTime(s)).toBe(false);
  });

  it('should rotate when time interval reached', () => {
    const s = createRotationState({ ...DEFAULT_POLICY, intervalMs: 1 });
    // Sleep briefly to ensure timestamp advances
    const start = Date.now();
    while (Date.now() - start < 5) {}
    expect(shouldRotateTime(s)).toBe(true);
  });

  it('should rotate when op count reaches max', () => {
    const s = createRotationState({ ...DEFAULT_POLICY, maxOps: 2 });
    let r = recordOp(s);
    r = recordOp(r);
    expect(shouldRotateCount(r)).toBe(true);
  });

  it('should determine needs rotation by policy trigger', () => {
    const s = createRotationState({ ...DEFAULT_POLICY, trigger: 'count', maxOps: 1 });
    expect(needsRotation(s)).toBe(false);
    const after = recordOp(s);
    expect(needsRotation(after)).toBe(true);
  });

  it('should rotate and keep old key', () => {
    const s = createRotationState();
    const oldKeyId = s.currentKeyId;
    const oldHex = s.currentKeyHex;
    const r = rotate(s);
    expect(r.currentKeyId).not.toBe(oldKeyId);
    expect(r.currentKeyHex).not.toBe(oldHex);
    expect(getOldKey(r, oldKeyId)).toBe(oldHex);
  });

  it('should get current key', () => {
    const s = createRotationState();
    expect(getCurrentKey(s)).toBe(s.currentKeyHex);
  });

  it('should emergency rotate and add to history with compromise trigger', () => {
    const s = createRotationState();
    const r = emergencyRotate(s);
    expect(r.history).toHaveLength(1);
    expect(r.history[0].trigger).toBe('compromise');
  });

  it('should compute ms until next rotation', () => {
    const s = createRotationState();
    const ms = msUntilNextRotation(s);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(DEFAULT_POLICY.intervalMs);
  });

  it('should compute rotation health', () => {
    const s = createRotationState();
    const h = rotationHealth(s);
    expect(h.rotationCount).toBe(0);
    expect(h.health).toBe(1);
  });
});
