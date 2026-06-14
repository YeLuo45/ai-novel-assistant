// V2209 OpReplay - Direction H Iter 4/30
// Replay operations to reconstruct state
// Source: thunderbolt
import type { CRDTOperation, OpKind } from './OperationEncoder';

export interface ReplayState {
  state: Map<string, unknown>;
  applied: Set<string>;
  skipped: Set<string>;
}

export function createReplayState(): ReplayState {
  return { state: new Map(), applied: new Set(), skipped: new Set() };
}

function applyOp(state: ReplayState, op: CRDTOperation): ReplayState {
  if (state.applied.has(op.id)) return state;
  const newState = new Map(state.state);
  switch (op.kind) {
    case 'set':
      newState.set(op.target, op.value);
      break;
    case 'add':
    case 'append':
      newState.set(op.target, op.value);
      break;
    case 'remove':
    case 'delete':
      newState.delete(op.target);
      break;
    case 'increment': {
      const current = newState.get(op.target) as number | undefined;
      newState.set(op.target, (current || 0) + (op.value as number || 1));
      break;
    }
  }
  const applied = new Set(state.applied);
  applied.add(op.id);
  return { ...state, state: newState, applied };
}

export function replayOps(state: ReplayState, ops: CRDTOperation[]): ReplayState {
  // Apply in lamport order
  const sorted = [...ops].sort((a, b) => a.lamport - b.lamport);
  let s = state;
  for (const op of sorted) s = applyOp(s, op);
  return s;
}

export function replayFrom(state: ReplayState, ops: CRDTOperation[], fromLamport: number): ReplayState {
  return replayOps(state, ops.filter((op) => op.lamport >= fromLamport));
}

export function getValue(state: ReplayState, target: string): unknown {
  return state.state.get(target);
}

export function appliedCount(state: ReplayState): number {
  return state.applied.size;
}

export function opReplayHealth(state: ReplayState): { keys: number; applied: number; health: number } {
  return { keys: state.state.size, applied: state.applied.size, health: state.state.size > 0 ? 1 : 0.5 };
}
