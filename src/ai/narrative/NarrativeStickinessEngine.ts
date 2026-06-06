/**
 * V1134 NarrativeStickinessEngine — Direction E Iter 15/20 (Round 5)
 * Stickiness engine: how narrative sticks in reader's mind
 * Sources: nanobot stickiness + thunderbolt + ruflo
 */

export type StickinessType = 'image' | 'sound' | 'phrase' | 'scene' | 'character' | 'concept';
export type StickinessStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'irrepressible';
export type StickinessTrigger = 'novelty' | 'emotion' | 'humor' | 'pattern' | 'shock' | 'meaning';

export interface Stickiness {
  stickinessId: string;
  type: StickinessType;
  strength: StickinessStrength;
  trigger: StickinessTrigger;
  description: string;
  stick: number;
  longevity: number;
  chapter: number;
}

export interface StickinessHook {
  hookId: string,
  stickinessIds: string[],
  cumulativeStick: number,
  compulsion: number,
}

export interface NarrativeStickinessEngineState {
  stickinesses: Map<string, Stickiness>;
  hooks: Map<string, StickinessHook>;
  totalStickinesses: number;
  totalHooks: number;
  averageStick: number;
  averageLongevity: number;
  hookCompulsion: number;
  stickinessMastery: number;
}

// Factory
export function createNarrativeStickinessEngineState(): NarrativeStickinessEngineState {
  return {
    stickinesses: new Map(),
    hooks: new Map(),
    totalStickinesses: 0,
    totalHooks: 0,
    averageStick: 0.5,
    averageLongevity: 0.5,
    hookCompulsion: 0.5,
    stickinessMastery: 0.5,
  };
}

// Add stickiness
export function addStickiness(
  state: NarrativeStickinessEngineState,
  stickinessId: string,
  type: StickinessType,
  strength: StickinessStrength,
  trigger: StickinessTrigger,
  description: string,
  stick: number,
  longevity: number,
  chapter: number
): NarrativeStickinessEngineState {
  const stickiness: Stickiness = { stickinessId, type, strength, trigger, description, stick, longevity, chapter };
  const stickinesses = new Map(state.stickinesses).set(stickinessId, stickiness);
  return recomputeStickiness({ ...state, stickinesses, totalStickinesses: stickinesses.size });
}

// Add hook
export function addStickinessHook(
  state: NarrativeStickinessEngineState,
  hookId: string,
  stickinessIds: string[]
): NarrativeStickinessEngineState {
  const stickinesses = stickinessIds.map(id => state.stickinesses.get(id)).filter((s): s is Stickiness => s !== undefined);
  const cumulativeStick = stickinesses.length === 0 ? 0
    : stickinesses.reduce((s, st) => s + st.stick, 0) / stickinesses.length;
  const compulsion = stickinesses.length === 0 ? 0.5
    : stickinesses.reduce((s, st) => s + (st.strength === 'irrepressible' ? 1 : st.strength === 'compelling' ? 0.85 : st.strength === 'strong' ? 0.7 : st.strength === 'moderate' ? 0.5 : 0.3), 0) / stickinesses.length;
  const hook: StickinessHook = { hookId, stickinessIds, cumulativeStick, compulsion };
  const hooks = new Map(state.hooks).set(hookId, hook);
  return recomputeStickiness({ ...state, hooks, totalHooks: hooks.size });
}

// Get stickinesses by type
export function getStickinessesByType(state: NarrativeStickinessEngineState, type: StickinessType): Stickiness[] {
  return Array.from(state.stickinesses.values()).filter(s => s.type === type);
}

// Get stickiness report
export function getStickinessReport(state: NarrativeStickinessEngineState): {
  totalStickinesses: number;
  totalHooks: number;
  averageStick: number;
  hookCompulsion: number;
  stickinessMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalStickinesses === 0) recommendations.push('No stickinesses — add stickinesses');
  if (state.averageStick < 0.5) recommendations.push('Low stick — strengthen');
  if (state.stickinessMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalStickinesses: state.totalStickinesses,
    totalHooks: state.totalHooks,
    averageStick: Math.round(state.averageStick * 100) / 100,
    hookCompulsion: Math.round(state.hookCompulsion * 100) / 100,
    stickinessMastery: Math.round(state.stickinessMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStickiness(state: NarrativeStickinessEngineState): NarrativeStickinessEngineState {
  const stickinesses = Array.from(state.stickinesses.values());
  const averageStick = stickinesses.length === 0 ? 0.5
    : stickinesses.reduce((s, st) => s + st.stick, 0) / stickinesses.length;
  const averageLongevity = stickinesses.length === 0 ? 0.5
    : stickinesses.reduce((s, st) => s + st.longevity, 0) / stickinesses.length;

  const hooks = Array.from(state.hooks.values());
  const hookCompulsion = hooks.length === 0 ? 0.5
    : hooks.reduce((s, h) => s + h.compulsion, 0) / hooks.length;

  const stickinessMastery = (averageStick * 0.4 + averageLongevity * 0.3 + hookCompulsion * 0.3);

  return { ...state, averageStick, averageLongevity, hookCompulsion, stickinessMastery };
}

// Reset
export function resetNarrativeStickinessEngineState(): NarrativeStickinessEngineState {
  return createNarrativeStickinessEngineState();
}