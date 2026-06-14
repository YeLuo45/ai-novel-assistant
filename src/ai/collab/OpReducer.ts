// V2216 OpReducer - Direction H Iter 11/30
// Reduce op log to final state
// Source: nanobot
import type { CRDTOperation } from './OperationEncoder';

export interface OpReducerState {
  state: Map<string, unknown>;
  applied: number;
  skipped: number;
}

export function createOpReducerState(): OpReducerState {
  return { state: new Map(), applied: 0, skipped: 0 };
}

export function reduceOps(state: OpReducerState, ops: CRDTOperation[]): OpReducerState {
  const sorted = [...ops].sort((a, b) => a.lamport - b.lamport);
  const newState = new Map(state.state);
  let applied = state.applied, skipped = state.skipped;
  for (const op of sorted) {
    if (op.kind === 'delete') { newState.delete(op.target); applied++; continue; }
    if (op.kind === 'set' || op.kind === 'add' || op.kind === 'append') {
      newState.set(op.target, op.value);
      applied++;
      continue;
    }
    if (op.kind === 'increment') {
      const current = newState.get(op.target) as number || 0;
      newState.set(op.target, current + (op.value as number || 1));
      applied++;
      continue;
    }
    skipped++;
  }
  return { state: newState, applied, skipped };
}

export function reduceFromLamport(state: OpReducerState, ops: CRDTOperation[], fromLamport: number): OpReducerState {
  return reduceOps(state, ops.filter((op) => op.lamport >= fromLamport));
}

export function getReducedValue(state: OpReducerState, key: string): unknown {
  return state.state.get(key);
}

export function opReducerHealth(state: OpReducerState): { keys: number; applied: number; skipped: number; health: number } {
  return { keys: state.state.size, applied: state.applied, skipped: state.skipped, health: state.state.size > 0 ? 1 : 0.5 };
}
