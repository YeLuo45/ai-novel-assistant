// V2313 SkillWatcher - Direction K Iter 18/30
// Skill subscription feed
// Source: ruflo
export type SkillWatchEvent = 'create' | 'update' | 'review' | 'publish' | 'retire';

export interface SkillWatch {
  watchId: string;
  key: string;
  events: Set<SkillWatchEvent>;
}

export interface SkillWatcherState {
  watches: Map<string, SkillWatch>;
  fired: Map<string, number>;
}

export function createSkillWatcherState(): SkillWatcherState {
  return { watches: new Map(), fired: new Map() };
}

export function addSkillWatch(state: SkillWatcherState, watchId: string, key: string, events: SkillWatchEvent[]): SkillWatcherState {
  const watches = new Map(state.watches);
  watches.set(watchId, { watchId, key, events: new Set(events) });
  return { ...state, watches };
}

export function removeSkillWatch(state: SkillWatcherState, watchId: string): SkillWatcherState {
  const watches = new Map(state.watches);
  watches.delete(watchId);
  const fired = new Map(state.fired);
  fired.delete(watchId);
  return { ...state, watches, fired };
}

export function fireSkillWatch(state: SkillWatcherState, event: SkillWatchEvent, key: string): SkillWatcherState {
  const fired = new Map(state.fired);
  for (const w of state.watches.values()) {
    if (w.key === key && w.events.has(event)) {
      fired.set(w.watchId, (fired.get(w.watchId) || 0) + 1);
    }
  }
  return { ...state, fired };
}

export function skillWatchCount(state: SkillWatcherState): number {
  return state.watches.size;
}

export function skillWatchFireCount(state: SkillWatcherState, watchId: string): number {
  return state.fired.get(watchId) || 0;
}

export function skillWatcherHealth(state: SkillWatcherState): { watches: number; fired: number; health: number } {
  const fired = Array.from(state.fired.values()).reduce((s, n) => s + n, 0);
  return { watches: state.watches.size, fired, health: state.watches.size > 0 ? 1 : 0.5 };
}
