// V2319 SkillDelegate - Direction K Iter 24/30
// Skill access delegation
// Source: chatdev
export interface SkillDelegation {
  delId: string;
  from: string;
  to: string;
  key: string;
  scope: 'read' | 'write' | 'all';
  expiresAt: number;
}

export interface SkillDelegateState {
  delegations: Map<string, SkillDelegation>;
}

export function createSkillDelegateState(): SkillDelegateState {
  return { delegations: new Map() };
}

export function delegateSkill(state: SkillDelegateState, from: string, to: string, key: string, scope: 'read' | 'write' | 'all', ttlMs = 0): SkillDelegateState {
  const delId = `skdel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const del: SkillDelegation = { delId, from, to, key, scope, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const delegations = new Map(state.delegations);
  delegations.set(delId, del);
  return { ...state, delegations };
}

export function revokeSkillDelegation(state: SkillDelegateState, delId: string): SkillDelegateState {
  const delegations = new Map(state.delegations);
  delegations.delete(delId);
  return { ...state, delegations };
}

export function skillDelegationsTo(state: SkillDelegateState, to: string): SkillDelegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.to === to);
}

export function canDelegateSkill(state: SkillDelegateState, to: string, key: string, scope: 'read' | 'write', now = Date.now()): boolean {
  return skillDelegationsTo(state, to).some((d) => d.key === key && (d.scope === 'all' || d.scope === scope) && (d.expiresAt === 0 || d.expiresAt > now));
}

export function skillDelegateCount(state: SkillDelegateState): number {
  return state.delegations.size;
}

export function skillDelegateHealth(state: SkillDelegateState): { count: number; health: number } {
  return { count: state.delegations.size, health: state.delegations.size > 0 ? 1 : 0.5 };
}
