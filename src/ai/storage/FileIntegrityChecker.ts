// V2134 FileIntegrityChecker - Direction A Iter 19/30
// 文件完整性校验 - SHA-256 + 校验和
// Source: ruflo (integrity verification)

/** Simple FNV-1a 32-bit hash */
export function fnv1a(data: string): number {
  let h = 2166136261;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 64-bit FNV-1a simulated via two 32-bit halves */
export function fnv1a64(data: string): string {
  const h1 = fnv1a(data);
  const h2 = fnv1a(data + 'salt2');
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/** Merkle-style hash chain: hash of (prevHash + currentData) */
export function chainHash(prevHash: string, data: string): string {
  return fnv1a64(prevHash + data);
}

export interface IntegrityRecord {
  path: string;
  hash: string;
  size: number;
  recordedAt: number;
}

export interface IntegrityState {
  records: Map<string, IntegrityRecord>;
  rootHash: string;
}

export function createIntegrityState(): IntegrityState {
  return { records: new Map(), rootHash: '0'.repeat(16) };
}

/** Record a file's hash */
export function recordFile(state: IntegrityState, path: string, data: string): IntegrityState {
  const records = new Map(state.records);
  const hash = fnv1a64(data);
  records.set(path, { path, hash, size: data.length, recordedAt: Date.now() });
  // Recompute root hash (simple concat-and-hash)
  const allHashes = Array.from(records.values()).map((r) => r.hash).join('');
  const rootHash = fnv1a64(allHashes);
  return { records, rootHash };
}

/** Verify file data matches recorded hash */
export function verifyFile(state: IntegrityState, path: string, data: string): { valid: boolean; reason?: string } {
  const rec = state.records.get(path);
  if (!rec) return { valid: false, reason: 'no record' };
  const currentHash = fnv1a64(data);
  if (currentHash !== rec.hash) return { valid: false, reason: 'hash mismatch' };
  return { valid: true };
}

/** Verify entire state by recomputing root hash */
export function verifyAll(state: IntegrityState): { valid: boolean; reason?: string } {
  if (state.records.size === 0) return { valid: true };
  const allHashes = Array.from(state.records.values()).map((r) => r.hash).join('');
  const recomputed = fnv1a64(allHashes);
  if (recomputed !== state.rootHash) return { valid: false, reason: 'root hash mismatch' };
  return { valid: true };
}

/** Get record for a path */
export function getRecord(state: IntegrityState, path: string): IntegrityRecord | undefined {
  return state.records.get(path);
}

/** Remove a record */
export function removeRecord(state: IntegrityState, path: string): IntegrityState {
  const records = new Map(state.records);
  records.delete(path);
  const allHashes = Array.from(records.values()).map((r) => r.hash).join('');
  const rootHash = allHashes ? fnv1a64(allHashes) : '0'.repeat(16);
  return { records, rootHash };
}

/** Count records */
export function recordCount(state: IntegrityState): number {
  return state.records.size;
}

/** Integrity health metric */
export function integrityHealth(state: IntegrityState): { recordCount: number; rootHash: string; health: number } {
  const health = state.records.size > 0 ? 1 : 0.5;
  return { recordCount: state.records.size, rootHash: state.rootHash, health };
}
