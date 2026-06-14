// V2306 SkillStream - Direction K Iter 11/30
// Skill change stream
// Source: nanobot
export interface SkillStreamEvent {
  id: string;
  topic: string;
  key: string;
  ts: number;
}

export interface SkillStreamSub {
  subId: string;
  topic: string;
}

export interface SkillStreamState {
  events: SkillStreamEvent[];
  subs: Map<string, SkillStreamSub>;
  delivered: Map<string, number>;
}

export function createSkillStreamState(): SkillStreamState {
  return { events: [], subs: new Map(), delivered: new Map() };
}

export function publishSkillEvent(state: SkillStreamState, topic: string, key: string): SkillStreamState {
  const event: SkillStreamEvent = { id: `skevt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, topic, key, ts: Date.now() };
  const events = [...state.events, event];
  const delivered = new Map(state.delivered);
  for (const sub of state.subs.values()) {
    if (sub.topic === topic || sub.topic === '*') delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
  }
  return { ...state, events, delivered };
}

export function subscribeSkill(state: SkillStreamState, subId: string, topic: string): SkillStreamState {
  const subs = new Map(state.subs);
  subs.set(subId, { subId, topic });
  return { ...state, subs };
}

export function unsubscribeSkill(state: SkillStreamState, subId: string): SkillStreamState {
  const subs = new Map(state.subs);
  subs.delete(subId);
  const delivered = new Map(state.delivered);
  delivered.delete(subId);
  return { ...state, subs, delivered };
}

export function skillEventsForTopic(state: SkillStreamState, topic: string): SkillStreamEvent[] {
  return state.events.filter((e) => e.topic === topic);
}

export function skillStreamHealth(state: SkillStreamState): { events: number; subs: number; health: number } {
  return { events: state.events.length, subs: state.subs.size, health: state.events.length > 0 ? 1 : 0.5 };
}
