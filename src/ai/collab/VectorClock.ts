// V2211 VectorClock - Direction H Iter 6/30
// Vector clock for distributed ordering
// Source: thunderbolt
export interface VectorClockState {
  clocks: Map<string, Map<string, number>>; // ownerId → { processId → counter }
}

export function createVectorClockState(): VectorClockState {
  return { clocks: new Map() };
}

export function tickClock(state: VectorClockState, ownerId: string, processId: string): VectorClockState {
  const clocks = new Map(state.clocks);
  const ownerMap = new Map(clocks.get(ownerId) || new Map());
  ownerMap.set(processId, (ownerMap.get(processId) || 0) + 1);
  clocks.set(ownerId, ownerMap);
  return { ...state, clocks };
}

export function mergeClocks(state: VectorClockState, a: string, b: string, merged: string): VectorClockState {
  const ca = state.clocks.get(a);
  const cb = state.clocks.get(b);
  if (!ca || !cb) return state;
  const result = new Map<string, number>();
  for (const [k, v] of ca) result.set(k, Math.max(v, cb.get(k) || 0));
  for (const [k, v] of cb) result.set(k, Math.max(v, result.get(k) || 0));
  const clocks = new Map(state.clocks);
  clocks.set(merged, result);
  return { ...state, clocks };
}

export function compareClocks(state: VectorClockState, a: string, b: string): 'before' | 'after' | 'equal' | 'concurrent' {
  const ca = state.clocks.get(a);
  const cb = state.clocks.get(b);
  if (!ca || !cb) return 'equal';
  let aBeforeB = true, bBeforeA = true;
  const allKeys = new Set([...ca.keys(), ...cb.keys()]);
  for (const k of allKeys) {
    const va = ca.get(k) || 0;
    const vb = cb.get(k) || 0;
    if (va > vb) aBeforeB = false;
    if (va < vb) bBeforeA = false;
  }
  if (aBeforeB && bBeforeA) return 'equal';
  if (aBeforeB) return 'before';
  if (bBeforeA) return 'after';
  return 'concurrent';
}

export function getClock(state: VectorClockState, ownerId: string): Map<string, number> {
  return state.clocks.get(ownerId) || new Map();
}

export function ownerCount(state: VectorClockState): number {
  return state.clocks.size;
}

export function vectorClockHealth(state: VectorClockState): { owners: number; health: number } {
  return { owners: state.clocks.size, health: state.clocks.size > 0 ? 1 : 0.5 };
}
