// V2130 KeyRotation - Direction A Iter 15/30
// 密钥轮换 - 周期性重加密
// Source: nanobot (key lifecycle)

import { generateKey } from '../crypto/AESGCMCipher';

export type RotationTrigger = 'time' | 'count' | 'manual' | 'compromise';

export interface RotationPolicy {
  trigger: RotationTrigger;
  intervalMs: number;
  maxOps: number;
  retainOldKeys: number;
}

export const DEFAULT_POLICY: RotationPolicy = {
  trigger: 'time',
  intervalMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxOps: 10000,
  retainOldKeys: 2,
};

export interface RotationEvent {
  id: string;
  oldKeyId: string;
  newKeyId: string;
  trigger: RotationTrigger;
  rotatedAt: number;
}

export interface KeyRotationState {
  currentKeyId: string;
  currentKeyHex: string;
  oldKeys: Map<string, string>; // id → hex
  policy: RotationPolicy;
  lastRotationAt: number;
  opCount: number;
  history: RotationEvent[];
}

export function createRotationState(policy: RotationPolicy = DEFAULT_POLICY): KeyRotationState {
  const k = generateKey();
  return {
    currentKeyId: `key-${Date.now()}`,
    currentKeyHex: k,
    oldKeys: new Map(),
    policy,
    lastRotationAt: Date.now(),
    opCount: 0,
    history: [],
  };
}

/** Increment op counter and check if rotation needed */
export function recordOp(state: KeyRotationState): KeyRotationState {
  return { ...state, opCount: state.opCount + 1 };
}

/** Check if time-based rotation is due */
export function shouldRotateTime(state: KeyRotationState, now = Date.now()): boolean {
  return now - state.lastRotationAt >= state.policy.intervalMs;
}

/** Check if op-count-based rotation is due */
export function shouldRotateCount(state: KeyRotationState): boolean {
  return state.opCount >= state.policy.maxOps;
}

/** Determine if rotation is needed based on policy */
export function needsRotation(state: KeyRotationState, now = Date.now()): boolean {
  if (state.policy.trigger === 'time') return shouldRotateTime(state, now);
  if (state.policy.trigger === 'count') return shouldRotateCount(state);
  return false;
}

/** Perform key rotation */
export function rotate(state: KeyRotationState, trigger: RotationTrigger = 'manual'): KeyRotationState {
  const newKeyHex = generateKey();
  const oldKeys = new Map(state.oldKeys);
  // Keep only last N old keys
  if (oldKeys.size >= state.policy.retainOldKeys) {
    const firstKey = oldKeys.keys().next().value;
    if (firstKey) oldKeys.delete(firstKey);
  }
  oldKeys.set(state.currentKeyId, state.currentKeyHex);
  const event: RotationEvent = {
    id: `rot-${Date.now()}`,
    oldKeyId: state.currentKeyId,
    newKeyId: `key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    trigger,
    rotatedAt: Date.now(),
  };
  return {
    currentKeyId: event.newKeyId,
    currentKeyHex: newKeyHex,
    oldKeys,
    policy: state.policy,
    lastRotationAt: Date.now(),
    opCount: 0,
    history: [...state.history, event],
  };
}

/** Get the current key hex (for encryption) */
export function getCurrentKey(state: KeyRotationState): string {
  return state.currentKeyHex;
}

/** Look up an old key for decryption of legacy data */
export function getOldKey(state: KeyRotationState, keyId: string): string | undefined {
  return state.oldKeys.get(keyId);
}

/** Force immediate rotation (e.g. on suspected compromise) */
export function emergencyRotate(state: KeyRotationState): KeyRotationState {
  return rotate({ ...state, policy: { ...state.policy, trigger: 'compromise' } }, 'compromise');
}

/** Time until next scheduled rotation in ms */
export function msUntilNextRotation(state: KeyRotationState, now = Date.now()): number {
  return Math.max(0, state.policy.intervalMs - (now - state.lastRotationAt));
}

/** Rotation master metric */
export function rotationHealth(state: KeyRotationState): {
  currentKeyId: string;
  oldKeyCount: number;
  rotationCount: number;
  msUntilNext: number;
  health: number;
} {
  const health = state.opCount / state.policy.maxOps < 0.9 ? 1 : 0.5;
  return {
    currentKeyId: state.currentKeyId,
    oldKeyCount: state.oldKeys.size,
    rotationCount: state.history.length,
    msUntilNext: msUntilNextRotation(state),
    health,
  };
}
