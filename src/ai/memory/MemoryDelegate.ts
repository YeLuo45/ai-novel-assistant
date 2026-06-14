// V2169 MemoryDelegate - Direction F Iter 24/30
// Memory access delegation
// Source: chatdev
export interface Delegation {
  delId: string;
  from: string;
  to: string;
  memId: string;
  scope: 'read' | 'write' | 'all';
  grantedAt: number;
  expiresAt: number;
}

export interface MemoryDelegateState {
  delegations: Map<string, Delegation>;
}

export function createMemoryDelegateState(): MemoryDelegateState {
  return { delegations: new Map() };
}

export function delegate(state: MemoryDelegateState, from: string, to: string, memId: string, scope: 'read' | 'write' | 'all', ttlMs = 0): MemoryDelegateState {
  const delId = `del-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const del: Delegation = { delId, from, to, memId, scope, grantedAt: Date.now(), expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const delegations = new Map(state.delegations);
  delegations.set(delId, del);
  return { ...state, delegations };
}

export function revokeDelegation(state: MemoryDelegateState, delId: string): MemoryDelegateState {
  const delegations = new Map(state.delegations);
  delegations.delete(delId);
  return { ...state, delegations };
}

export function delegationsTo(state: MemoryDelegateState, to: string): Delegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.to === to);
}

export function delegationsFrom(state: MemoryDelegateState, from: string): Delegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.from === from);
}

export function canDelegate(state: MemoryDelegateState, to: string, memId: string, scope: 'read' | 'write', now = Date.now()): boolean {
  return delegationsTo(state, to).some((d) => d.memId === memId && (d.scope === 'all' || d.scope === scope) && (d.expiresAt === 0 || d.expiresAt > now));
}

export function delegationCount(state: MemoryDelegateState): number {
  return state.delegations.size;
}

export function memoryDelegateHealth(state: MemoryDelegateState): { count: number; health: number } {
  return { count: state.delegations.size, health: state.delegations.size > 0 ? 1 : 0.5 };
}
