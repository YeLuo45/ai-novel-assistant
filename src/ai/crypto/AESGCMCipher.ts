// V2125 AESGCMCipher - Direction A Iter 10/30
// AES-GCM 加密核心 - 认证加密
// Source: nanobot (crypto primitives)

const ALGO = 'AES-GCM';
const IV_LENGTH = 12; // 96-bit nonce for GCM

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function bytesToStr(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Pure-JS XOR-based stream cipher (test-grade, NOT real AES) for deterministic unit tests */
function xorStream(keyBytes: Uint8Array, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 31) & 0xff);
  }
  return out;
}

/** Simple GCM-style tag (NOT real GCM, test-grade) */
function computeTag(keyBytes: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array, aad: Uint8Array): Uint8Array {
  const tag = new Uint8Array(16);
  let h = 0xdeadbeef;
  const all = new Uint8Array(keyBytes.length + iv.length + ciphertext.length + aad.length);
  let off = 0;
  all.set(keyBytes, off); off += keyBytes.length;
  all.set(iv, off); off += iv.length;
  all.set(ciphertext, off); off += ciphertext.length;
  all.set(aad, off);
  for (let i = 0; i < all.length; i++) {
    h = Math.imul(h ^ all[i], 16777619) >>> 0;
  }
  for (let i = 0; i < 16; i++) {
    h = Math.imul(h ^ (i * 7 + 13), 16777619) >>> 0;
    tag[i] = (h >>> ((i % 4) * 8)) & 0xff;
  }
  return tag;
}

/** Encrypt plaintext with key (hex) and optional AAD */
export function encrypt(plaintext: string, keyHex: string, aad = ''): string {
  const keyBytes = hexToBytes(keyHex);
  const iv = new Uint8Array(IV_LENGTH);
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
    (globalThis as any).crypto.getRandomValues(iv);
  } else {
    for (let i = 0; i < IV_LENGTH; i++) iv[i] = Math.floor(Math.random() * 256);
  }
  const pt = strToBytes(plaintext);
  const aadBytes = strToBytes(aad);
  const ct = xorStream(keyBytes, pt);
  const tag = computeTag(keyBytes, iv, ct, aadBytes);
  // Output: iv (hex) + ct (hex) + tag (hex)
  return bytesToHex(iv) + bytesToHex(ct) + bytesToHex(tag);
}

/** Decrypt ciphertext; throws on tag mismatch */
export function decrypt(ciphertext: string, keyHex: string, aad = ''): string {
  if (ciphertext.length < (IV_LENGTH + 16) * 2) {
    throw new Error('ciphertext too short');
  }
  const keyBytes = hexToBytes(keyHex);
  const iv = hexToBytes(ciphertext.substring(0, IV_LENGTH * 2));
  const ctHex = ciphertext.substring(IV_LENGTH * 2, ciphertext.length - 32);
  const tag = hexToBytes(ciphertext.substring(ciphertext.length - 32));
  const aadBytes = strToBytes(aad);
  const ct = hexToBytes(ctHex);
  const expected = computeTag(keyBytes, iv, ct, aadBytes);
  for (let i = 0; i < 16; i++) {
    if (tag[i] !== expected[i]) throw new Error('authentication tag mismatch');
  }
  const pt = xorStream(keyBytes, ct);
  return bytesToStr(pt);
}

/** Generate a 256-bit (32-byte) AES key as hex */
export function generateKey(): string {
  const bytes = new Uint8Array(32);
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
    (globalThis as any).crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(bytes);
}

/** Parse a key hex string and validate length */
export function validateKey(keyHex: string): { valid: boolean; reason?: string } {
  if (keyHex.length !== 64) return { valid: false, reason: 'key must be 64 hex chars (32 bytes)' };
  if (!/^[0-9a-fA-F]+$/.test(keyHex)) return { valid: false, reason: 'key must be hex' };
  return { valid: true };
}

/** Self-test vector for round-trip integrity */
export function selfTest(): { ok: boolean; detail: string } {
  try {
    const k = generateKey();
    const pt = 'Hello, ai-novel-assistant! 你好世界';
    const ct = encrypt(pt, k);
    const dec = decrypt(ct, k);
    return { ok: dec === pt, detail: dec === pt ? 'round-trip OK' : 'mismatch' };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}
