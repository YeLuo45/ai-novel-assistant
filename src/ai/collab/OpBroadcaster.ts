// V2208 OpBroadcaster - Direction H Iter 3/30
// Broadcast operations to all subscribers
// Source: thunderbolt
export interface BroadcastSub {
  subId: string;
  filter: { authorId?: string; opKind?: string } | null;
}

export interface BroadcasterState {
  subs: Map<string, BroadcastSub>;
  delivered: Map<string, number>;
  totalBroadcasts: number;
}

export function createBroadcasterState(): BroadcasterState {
  return { subs: new Map(), delivered: new Map(), totalBroadcasts: 0 };
}

export function subscribeOp(state: BroadcasterState, subId: string, filter: { authorId?: string; opKind?: string } | null): BroadcasterState {
  const subs = new Map(state.subs);
  subs.set(subId, { subId, filter });
  return { ...state, subs };
}

export function unsubscribeOp(state: BroadcasterState, subId: string): BroadcasterState {
  const subs = new Map(state.subs);
  subs.delete(subId);
  const delivered = new Map(state.delivered);
  delivered.delete(subId);
  return { ...state, subs, delivered };
}

export function broadcastOp(state: BroadcasterState, authorId: string, opKind: string): BroadcasterState {
  const delivered = new Map(state.delivered);
  for (const sub of state.subs.values()) {
    if (!sub.filter) {
      delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
    } else {
      const a = sub.filter.authorId === undefined || sub.filter.authorId === authorId;
      const k = sub.filter.opKind === undefined || sub.filter.opKind === opKind;
      if (a && k) delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
    }
  }
  return { ...state, delivered, totalBroadcasts: state.totalBroadcasts + 1 };
}

export function broadcasterSubCount(state: BroadcasterState): number {
  return state.subs.size;
}

export function deliveredCount(state: BroadcasterState, subId: string): number {
  return state.delivered.get(subId) || 0;
}

export function broadcasterHealth(state: BroadcasterState): { subs: number; broadcasts: number; health: number } {
  return { subs: state.subs.size, broadcasts: state.totalBroadcasts, health: state.totalBroadcasts > 0 ? 1 : 0.5 };
}
