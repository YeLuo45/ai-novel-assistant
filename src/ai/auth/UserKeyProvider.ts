// V2142 UserKeyProvider - Direction A Iter 27/30
// 用户密钥提供 - 密码派生
// Source: generic-agent (auth primitive)

import { pbkdf2Sync, newSalt, DEFAULT_KDF_PARAMS, type KDFParams } from '../crypto/KDFCore';

export interface UserKeyEntry {
  userId: string;
  derivedKey: string;
  salt: string;
  createdAt: number;
  lastRotated: number;
}

export interface UserKeyState {
  entries: Map<string, UserKeyEntry>;
  defaultParams: KDFParams;
}

export function createUserKeyState(): UserKeyState {
  return { entries: new Map(), defaultParams: { ...DEFAULT_KDF_PARAMS } };
}

export function registerUser(state: UserKeyState, userId: string, password: string, params?: KDFParams): UserKeyState {
  const p = params || state.defaultParams;
  const salt = newSalt(16);
  const derivedKey = pbkdf2Sync(password + salt, p);
  const entry: UserKeyEntry = { userId, derivedKey, salt, createdAt: Date.now(), lastRotated: Date.now() };
  const entries = new Map(state.entries);
  entries.set(userId, entry);
  return { ...state, entries };
}

export function verifyPassword(state: UserKeyState, userId: string, password: string): boolean {
  const entry = state.entries.get(userId);
  if (!entry) return false;
  const candidate = pbkdf2Sync(password + entry.salt, state.defaultParams);
  return candidate === entry.derivedKey;
}

export function rotateKey(state: UserKeyState, userId: string, newPassword: string): UserKeyState {
  const entry = state.entries.get(userId);
  if (!entry) return state;
  const salt = newSalt(16);
  const derivedKey = pbkdf2Sync(newPassword + salt, state.defaultParams);
  const updated: UserKeyEntry = { ...entry, derivedKey, salt, lastRotated: Date.now() };
  const entries = new Map(state.entries);
  entries.set(userId, updated);
  return { ...state, entries };
}

export function removeUser(state: UserKeyState, userId: string): UserKeyState {
  const entries = new Map(state.entries);
  entries.delete(userId);
  return { ...state, entries };
}

export function getEntry(state: UserKeyState, userId: string): UserKeyEntry | undefined {
  return state.entries.get(userId);
}

export function userCount(state: UserKeyState): number {
  return state.entries.size;
}

export function listUsers(state: UserKeyState): string[] {
  return Array.from(state.entries.keys());
}

export function userKeyHealth(state: UserKeyState): { userCount: number; health: number } {
  return { userCount: state.entries.size, health: state.entries.size > 0 ? 1 : 0.5 };
}
