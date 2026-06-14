// V2213 PresenceSync - Direction H Iter 8/30
// Real-time presence/awareness sync
// Source: thunderbolt
export interface Presence {
  userId: string;
  cursor: { x: number; y: number } | null;
  selection: string;
  status: 'online' | 'idle' | 'offline';
  lastSeen: number;
}

export interface PresenceState {
  presences: Map<string, Presence>;
  totalUpdates: number;
}

export function createPresenceState(): PresenceState {
  return { presences: new Map(), totalUpdates: 0 };
}

export function updatePresence(state: PresenceState, userId: string, updates: Partial<Omit<Presence, 'userId' | 'lastSeen'>>): PresenceState {
  const existing = state.presences.get(userId);
  const presence: Presence = { ...(existing || { userId, cursor: null, selection: '', status: 'online', lastSeen: 0 }), ...updates, lastSeen: Date.now() };
  const presences = new Map(state.presences);
  presences.set(userId, presence);
  return { ...state, presences, totalUpdates: state.totalUpdates + 1 };
}

export function setCursor(state: PresenceState, userId: string, x: number, y: number): PresenceState {
  return updatePresence(state, userId, { cursor: { x, y } });
}

export function setSelection(state: PresenceState, userId: string, selection: string): PresenceState {
  return updatePresence(state, userId, { selection });
}

export function setStatus(state: PresenceState, userId: string, status: 'online' | 'idle' | 'offline'): PresenceState {
  return updatePresence(state, userId, { status });
}

export function getPresence(state: PresenceState, userId: string): Presence | undefined {
  return state.presences.get(userId);
}

export function onlineUsers(state: PresenceState): Presence[] {
  return Array.from(state.presences.values()).filter((p) => p.status === 'online');
}

export function presenceHealth(state: PresenceState): { users: number; online: number; health: number } {
  const online = onlineUsers(state).length;
  return { users: state.presences.size, online, health: state.presences.size > 0 ? 1 : 0.5 };
}
