// V2215 OpMerger - Direction H Iter 10/30
// Merge concurrent operations
// Source: nanobot
import type { CRDTOperation } from './OperationEncoder';

export interface MergeState {
  merged: CRDTOperation[];
  conflicts: { a: CRDTOperation; b: CRDTOperation }[];
}

export function createMergeState(): MergeState {
  return { merged: [], conflicts: [] };
}

export function mergeByLamport(ops: CRDTOperation[]): CRDTOperation[] {
  return [...ops].sort((a, b) => a.lamport - b.lamport);
}

export function mergeByAuthorThenTime(ops: CRDTOperation[]): CRDTOperation[] {
  return [...ops].sort((a, b) => a.authorId.localeCompare(b.authorId) || a.ts - b.ts);
}

export function detectConcurrentPairs(ops: CRDTOperation[]): { a: CRDTOperation; b: CRDTOperation }[] {
  const conflicts: { a: CRDTOperation; b: CRDTOperation }[] = [];
  for (let i = 0; i < ops.length; i++) {
    for (let j = i + 1; j < ops.length; j++) {
      if (ops[i].target === ops[j].target && ops[i].authorId !== ops[j].authorId && ops[i].kind === 'set' && ops[j].kind === 'set') {
        conflicts.push({ a: ops[i], b: ops[j] });
      }
    }
  }
  return conflicts;
}

export function mergeWithLWW(a: CRDTOperation, b: CRDTOperation): CRDTOperation {
  return a.ts >= b.ts ? a : b;
}

export function mergeOps(state: MergeState, ops: CRDTOperation[]): MergeState {
  const merged = mergeByLamport(ops);
  const conflicts = detectConcurrentPairs(ops);
  return { merged, conflicts: [...state.conflicts, ...conflicts] };
}

export function mergeHealth(state: MergeState): { merged: number; conflicts: number; health: number } {
  return { merged: state.merged.length, conflicts: state.conflicts.length, health: state.merged.length > 0 ? 1 : 0.5 };
}
