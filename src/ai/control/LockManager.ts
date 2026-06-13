// V2137 LockManager - Direction A Iter 22/30
// 锁管理器 - 读写锁 + 死锁检测
// Source: chatdev (collaboration primitives)

export type LockMode = 'read' | 'write';
export type LockState = 'granted' | 'waiting' | 'denied';

export interface Lock {
  lockId: string;
  resourceId: string;
  mode: LockMode;
  holderId: string;
  acquiredAt: number;
  state: LockState;
}

export interface LockManagerState {
  locks: Lock[];
  waitQueue: Map<string, string[]>; // resourceId → holderIds
}

export function createLockManager(): LockManagerState {
  return { locks: [], waitQueue: new Map() };
}

export function acquireLock(state: LockManagerState, resourceId: string, mode: LockMode, holderId: string): { state: LockManagerState; lock: Lock | { error: string } } {
  const existing = state.locks.filter((l) => l.resourceId === resourceId);
  // Write lock requires no other locks
  if (mode === 'write') {
    if (existing.length > 0 && !existing.every((l) => l.holderId === holderId)) {
      const lock: Lock = { lockId: `lk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, resourceId, mode, holderId, acquiredAt: Date.now(), state: 'waiting' };
      const waitQueue = new Map(state.waitQueue);
      const q = waitQueue.get(resourceId) || [];
      waitQueue.set(resourceId, [...q, holderId]);
      return { state: { ...state, waitQueue }, lock };
    }
  } else {
    // Read lock requires no write lock from other holders
    const otherWrite = existing.find((l) => l.mode === 'write' && l.holderId !== holderId);
    if (otherWrite) {
      const lock: Lock = { lockId: `lk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, resourceId, mode, holderId, acquiredAt: Date.now(), state: 'waiting' };
      const waitQueue = new Map(state.waitQueue);
      const q = waitQueue.get(resourceId) || [];
      waitQueue.set(resourceId, [...q, holderId]);
      return { state: { ...state, waitQueue }, lock };
    }
  }
  const lock: Lock = { lockId: `lk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, resourceId, mode, holderId, acquiredAt: Date.now(), state: 'granted' };
  return { state: { ...state, locks: [...state.locks, lock] }, lock };
}

export function releaseLock(state: LockManagerState, lockId: string): LockManagerState {
  return { ...state, locks: state.locks.filter((l) => l.lockId !== lockId) };
}

export function detectDeadlock(state: LockManagerState): string[][] {
  // Simple detection: find cycles in wait graph
  const waits: Map<string, Set<string>> = new Map();
  for (const [res, holders] of state.waitQueue) {
    const held = state.locks.filter((l) => l.resourceId === res && l.state === 'granted');
    for (const h of holders) {
      if (!waits.has(h)) waits.set(h, new Set());
      for (const hl of held) if (hl.holderId !== h) waits.get(h)!.add(hl.holderId);
    }
  }
  const cycles: string[][] = [];
  const visited = new Set<string>();
  for (const start of waits.keys()) {
    if (visited.has(start)) continue;
    const path: string[] = [start];
    const seen = new Set<string>([start]);
    let current = start;
    while (waits.has(current)) {
      const next = Array.from(waits.get(current)!)[0];
      if (!next) break;
      if (next === start) { cycles.push([...path, start]); break; }
      if (seen.has(next)) break;
      seen.add(next);
      path.push(next);
      current = next;
    }
    for (const p of path) visited.add(p);
  }
  return cycles;
}

export function listHolders(state: LockManagerState, resourceId: string): string[] {
  return state.locks.filter((l) => l.resourceId === resourceId && l.state === 'granted').map((l) => l.holderId);
}

export function isLocked(state: LockManagerState, resourceId: string): boolean {
  return state.locks.some((l) => l.resourceId === resourceId && l.state === 'granted');
}

export function lockCount(state: LockManagerState): number {
  return state.locks.length;
}

export function lockHealth(state: LockManagerState): { granted: number; waiting: number; cycles: number; health: number } {
  const granted = state.locks.filter((l) => l.state === 'granted').length;
  const waiting = state.locks.filter((l) => l.state === 'waiting').length;
  const cycles = detectDeadlock(state).length;
  const health = cycles === 0 ? 1 : 0;
  return { granted, waiting, cycles, health };
}
