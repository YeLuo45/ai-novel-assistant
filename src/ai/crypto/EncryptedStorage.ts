// V2127 EncryptedStorage - Direction A Iter 12/30
// 加密存储 - 透明加密层
// Source: nanobot (storage abstraction)

import { encrypt, decrypt, generateKey } from '../crypto/AESGCMCipher';

export type StorageBackend = 'memory' | 'localStorage' | 'indexedDB';

export interface EncryptedRecord {
  id: string;
  ciphertext: string;
  aad: string;
  createdAt: number;
  updatedAt: number;
}

export interface EncryptedStorageState {
  records: Map<string, EncryptedRecord>;
  keyHex: string;
  backend: StorageBackend;
}

export function createStorageState(backend: StorageBackend = 'memory'): EncryptedStorageState {
  return { records: new Map(), keyHex: generateKey(), backend };
}

/** Put a plaintext value with id, returning the encrypted record */
export function putRecord(state: EncryptedStorageState, id: string, plaintext: unknown, aad = ''): EncryptedStorageState {
  const serialized = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const ciphertext = encrypt(serialized, state.keyHex, aad);
  const existing = state.records.get(id);
  const record: EncryptedRecord = {
    id,
    ciphertext,
    aad,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  const records = new Map(state.records);
  records.set(id, record);
  return { ...state, records };
}

/** Get a record by id, returning decrypted plaintext (or null) */
export function getRecord(state: EncryptedStorageState, id: string, aad = ''): unknown | null {
  const r = state.records.get(id);
  if (!r) return null;
  try {
    const pt = decrypt(r.ciphertext, state.keyHex, aad || r.aad);
    try {
      return JSON.parse(pt);
    } catch {
      return pt;
    }
  } catch {
    return null;
  }
}

/** Delete a record by id */
export function deleteRecord(state: EncryptedStorageState, id: string): EncryptedStorageState {
  const records = new Map(state.records);
  records.delete(id);
  return { ...state, records };
}

/** List all record ids */
export function listIds(state: EncryptedStorageState): string[] {
  return Array.from(state.records.keys());
}

/** Get record count */
export function recordCount(state: EncryptedStorageState): number {
  return state.records.size;
}

/** Rotate the storage key (re-encrypts all records with new key) */
export function rotateKey(state: EncryptedStorageState, newKeyHex: string): EncryptedStorageState {
  const records = new Map<string, EncryptedRecord>();
  for (const [id, r] of state.records) {
    try {
      const pt = decrypt(r.ciphertext, state.keyHex, r.aad);
      const newCt = encrypt(pt, newKeyHex, r.aad);
      records.set(id, { ...r, ciphertext: newCt, updatedAt: Date.now() });
    } catch {
      // Keep original ciphertext on error
      records.set(id, r);
    }
  }
  return { ...state, records, keyHex: newKeyHex };
}

/** Wipe all records (security purge) */
export function wipeAll(state: EncryptedStorageState): EncryptedStorageState {
  return { ...state, records: new Map() };
}

/** Storage health metrics */
export function storageHealth(state: EncryptedStorageState): {
  recordCount: number;
  backend: StorageBackend;
  oldestRecord: number;
  health: number;
} {
  let oldest = Date.now();
  for (const r of state.records.values()) oldest = Math.min(oldest, r.createdAt);
  const health = state.records.size > 0 ? 1 : 0.5;
  return { recordCount: state.records.size, backend: state.backend, oldestRecord: oldest, health };
}
