// V2289 ContextDelegate - Direction J Iter 24/30
// Context access delegation
// Source: chatdev
export interface ContextDelegation {
  delId: string;
  from: string;
  to: string;
  key: string;
  scope: 'read' | 'write' | 'all';
  expiresAt: number;
}

export interface ContextDelegateState {
  delegations: Map<string, ContextDelegation>;
}

export function createContextDelegateState(): ContextDelegateState {
  return { delegations: new Map() };
}

export function delegateContext(state: ContextDelegateState, from: string, to: string, key: string, scope: 'read' | 'write' | 'all', ttlMs = 0): ContextDelegateState {
  const delId = `cxdel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const del: ContextDelegation = { delId, from, to, key, scope, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const delegations = new Map(state.delegations);
  delegations.set(delId, del);
  return { ...state, delegations };
}

export function revokeContextDelegation(state: ContextDelegateState, delId: string): ContextDelegateState {
  const delegations = new Map(state.delegations);
  delegations.delete(delId);
  return { ...state, delegations };
}

export function contextDelegationsTo(state: ContextDelegateState, to: string): ContextDelegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.to === to);
}

export function canDelegateContext(state: ContextDelegateState, to: string, key: string, scope: 'read' | 'write', now = Date.now()): boolean {
  return contextDelegationsTo(state, to).some((d) => d.key === key && (d.scope === 'all' || d.scope === scope) && (d.expiresAt === 0 || d.expiresAt > now));
}

export function contextDelegateCount(state: ContextDelegateState): number {
  return state.delegations.size;
}

export function contextDelegateHealth(state: ContextDelegateState): { count: number; health: number } {
  return { count: state.delegations.size, health: state.delegations.size > 0 ? 1 : 0.5 };
}
