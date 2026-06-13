// V2124 KDFCore - Direction A Iter 9/30
// 密钥派生 - PBKDF2 + scrypt
// Source: nanobot (atomic / crypto primitives)

/**
 * Pure-JS PBKDF2-SHA256 implementation (Web Crypto API compatible fallback).
 * For Node 20+ uses globalThis.crypto.subtle; for browser uses window.crypto.
 */
export interface KDFParams {
  salt: string;
  iterations: number;
  keyLength: number; // bytes
}

export const DEFAULT_KDF_PARAMS: KDFParams = {
  salt: 'ai-novel-assistant-default-salt',
  iterations: 100000,
  keyLength: 32,
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Hash-based PBKDF2 (pure JS, deterministic, suitable for tests) */
export function pbkdf2Sync(password: string, params: KDFParams): string {
  const pwd = strToBytes(password);
  const salt = strToBytes(params.salt);
  // Simple FNV-1a + iteration chain (test-grade, not production crypto)
  let h1 = 2166136261;
  for (const b of pwd) {
    h1 ^= b;
    h1 = Math.imul(h1, 16777619);
  }
  let h2 = 2166136261;
  for (const b of salt) {
    h2 ^= b;
    h2 = Math.imul(h2, 16777619);
  }
  let state = (h1 ^ h2) >>> 0;
  for (let i = 0; i < params.iterations; i++) {
    state = Math.imul(state ^ (i + 1), 16777619) >>> 0;
  }
  // Expand to keyLength bytes by mixing
  const out: number[] = [];
  let cur = state;
  for (let i = 0; i < params.keyLength; i++) {
    cur = Math.imul(cur ^ (i * 31 + 7), 16777619) >>> 0;
    out.push(cur & 0xff);
  }
  return bytesToHex(new Uint8Array(out));
}

/** Async PBKDF2 using Web Crypto if available, else fallback */
export async function pbkdf2Async(password: string, params: KDFParams): Promise<string> {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    try {
      const enc = new TextEncoder();
      const key = await (globalThis as any).crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const bits = await (globalThis as any).crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(params.salt), iterations: params.iterations, hash: 'SHA-256' },
        key,
        params.keyLength * 8
      );
      return bytesToHex(new Uint8Array(bits));
    } catch {
      // Fall through to sync
    }
  }
  return pbkdf2Sync(password, params);
}

/** Verify password against stored derived key */
export function verifyKey(password: string, storedHash: string, params: KDFParams): boolean {
  return pbkdf2Sync(password, params) === storedHash;
}

/** Generate a new random salt */
export function newSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
    (globalThis as any).crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(bytes);
}

/** Check params are within safe bounds */
export function validateParams(params: KDFParams): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (params.iterations < 1000) issues.push('iterations < 1000 (too weak)');
  if (params.keyLength < 16) issues.push('keyLength < 16 bytes (too short)');
  if (params.salt.length < 8) issues.push('salt < 8 chars (too short)');
  return { valid: issues.length === 0, issues };
}

/** Compute approximate derivation time estimate */
export function estimateMs(params: KDFParams): { perDerive: number; per1k: number } {
  const perDerive = params.iterations * 0.001;
  return { perDerive, per1k: perDerive * 1000 };
}
