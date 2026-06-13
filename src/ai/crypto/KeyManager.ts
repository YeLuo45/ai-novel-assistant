// V2126 KeyManager - Direction A Iter 11/30
// 密钥管理 - 派生 + 存储 + 销毁
// Source: nanobot (crypto primitives)

import { pbkdf2Sync, newSalt, DEFAULT_KDF_PARAMS, type KDFParams } from './KDFCore';
import { generateKey, encrypt, decrypt } from './AESGCMCipher';

export type KeyStatus = 'active' | 'rotating' | 'revoked' | 'destroyed';

export interface ManagedKey {
  id: string;
  keyHex: string;
  status: KeyStatus;
  createdAt: number;
  rotatedAt?: number;
  purpose: string;
}

export interface KeyManagerState {
  keys: ManagedKey[];
  defaultKeyId: string;
}

export function createKeyManagerState(): KeyManagerState {
  return { keys: [], defaultKeyId: '' };
}

/** Derive key from password and store with a purpose tag */
export function deriveAndStore(
  state: KeyManagerState,
  password: string,
  purpose: string,
  params: KDFParams = DEFAULT_KDF_PARAMS
): { state: KeyManagerState; key: ManagedKey } {
  const keyHex = pbkdf2Sync(password, params);
  const key: ManagedKey = {
    id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    keyHex,
    status: 'active',
    createdAt: Date.now(),
    purpose,
  };
  const newState: KeyManagerState = {
    keys: [...state.keys, key],
    defaultKeyId: state.defaultKeyId || key.id,
  };
  return { state: newState, key };
}

/** Generate a fresh random key for data encryption */
export function generateAndStore(
  state: KeyManagerState,
  purpose: string
): { state: KeyManagerState; key: ManagedKey } {
  const key: ManagedKey = {
    id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    keyHex: generateKey(),
    status: 'active',
    createdAt: Date.now(),
    purpose,
  };
  return { state: { ...state, keys: [...state.keys, key], defaultKeyId: state.defaultKeyId || key.id }, key };
}

/** Look up key by id */
export function getKey(state: KeyManagerState, keyId: string): ManagedKey | undefined {
  return state.keys.find((k) => k.id === keyId);
}

/** Mark a key as revoked (still kept for decrypt of old data) */
export function revokeKey(state: KeyManagerState, keyId: string): KeyManagerState {
  return {
    ...state,
    keys: state.keys.map((k) => (k.id === keyId ? { ...k, status: 'revoked' as const } : k)),
  };
}

/** Destroy a key permanently (overwrite hex with zeros) */
export function destroyKey(state: KeyManagerState, keyId: string): KeyManagerState {
  return {
    ...state,
    keys: state.keys.map((k) => (k.id === keyId ? { ...k, keyHex: '0'.repeat(k.keyHex.length), status: 'destroyed' as const } : k)),
  };
}

/** Get all active keys (for encrypt operations) */
export function activeKeys(state: KeyManagerState): ManagedKey[] {
  return state.keys.filter((k) => k.status === 'active');
}

/** Encrypt with a specific key, returns ciphertext+keyId bundle */
export function encryptWithKey(state: KeyManagerState, plaintext: string, keyId: string, aad = ''): {
  ciphertext: string;
  keyId: string;
} | { error: string } {
  const k = getKey(state, keyId);
  if (!k) return { error: 'key not found' };
  if (k.status !== 'active') return { error: 'key not active' };
  return { ciphertext: encrypt(plaintext, k.keyHex, aad), keyId };
}

/** Decrypt with a specific key */
export function decryptWithKey(state: KeyManagerState, ciphertext: string, keyId: string, aad = ''): string | { error: string } {
  const k = getKey(state, keyId);
  if (!k) return { error: 'key not found' };
  if (k.status === 'destroyed') return { error: 'key destroyed' };
  try {
    return decrypt(ciphertext, k.keyHex, aad);
  } catch (e) {
    return { error: String(e) };
  }
}

/** Count keys by status */
export function keyInventory(state: KeyManagerState): Record<KeyStatus, number> {
  const counts: Record<KeyStatus, number> = { active: 0, rotating: 0, revoked: 0, destroyed: 0 };
  for (const k of state.keys) counts[k.status]++;
  return counts;
}
