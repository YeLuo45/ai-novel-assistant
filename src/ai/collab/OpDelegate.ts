// V2229 OpDelegate - Direction H Iter 24/30
// Operation delegation
// Source: chatdev
export interface OpDelegation {
  delId: string;
  from: string;
  to: string;
  opId: string;
  scope: 'read' | 'write' | 'all';
  expiresAt: number;
}

export interface OpDelegateState {
  delegations: Map<string, OpDelegation>;
}

export function createOpDelegateState(): OpDelegateState {
  return { delegations: new Map() };
}

export function delegateOp(state: OpDelegateState, from: string, to: string, opId: string, scope: 'read' | 'write' | 'all', ttlMs = 0): OpDelegateState {
  const delId = `odel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const del: OpDelegation = { delId, from, to, opId, scope, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const delegations = new Map(state.delegations);
  delegations.set(delId, del);
  return { ...state, delegations };
}

export function revokeOpDelegation(state: OpDelegateState, delId: string): OpDelegateState {
  const delegations = new Map(state.delegations);
  delegations.delete(delId);
  return { ...state, delegations };
}

export function opDelegationsTo(state: OpDelegateState, to: string): OpDelegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.to === to);
}

export function canDelegateOp(state: OpDelegateState, to: string, opId: string, scope: 'read' | 'write', now = Date.now()): boolean {
  return opDelegationsTo(state, to).some((d) => d.opId === opId && (d.scope === 'all' || d.scope === scope) && (d.expiresAt === 0 || d.expiresAt > now));
}

export function opDelegateCount(state: OpDelegateState): number {
  return state.delegations.size;
}

export function opDelegateHealth(state: OpDelegateState): { count: number; health: number } {
  return { count: state.delegations.size, health: state.delegations.size > 0 ? 1 : 0.5 };
}
