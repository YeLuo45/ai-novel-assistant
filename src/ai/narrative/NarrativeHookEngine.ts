/**
 * V1006 NarrativeHookEngine — Direction B Iter 6/15 (Round 5)
 * Hook engine: narrative hooks that capture attention
 * Sources: thunderbolt hook + nanobot + chatdev
 */

export type HookType = 'opening_line' | 'opening_scene' | 'mystery' | 'question' | 'action' | 'revelation';
export type HookStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'unforgettable';
export type HookTiming = 'chapter_start' | 'mid_chapter' | 'chapter_end' | 'section_break' | 'climax';

export interface Hook {
  hookId: string;
  type: HookType;
  strength: HookStrength;
  timing: HookTiming;
  content: string;
  pull: number;
  retention: number;
  chapter: number;
}

export interface HookSequence {
  sequenceId: string,
  hookIds: string[],
  escalation: number,
  effectiveness: number,
}

export interface NarrativeHookEngineState {
  hooks: Map<string, Hook>;
  sequences: Map<string, HookSequence>;
  totalHooks: number;
  totalSequences: number;
  averagePull: number;
  averageRetention: number;
  sequenceEscalation: number;
  hookMastery: number;
}

// Factory
export function createNarrativeHookEngineState(): NarrativeHookEngineState {
  return {
    hooks: new Map(),
    sequences: new Map(),
    totalHooks: 0,
    totalSequences: 0,
    averagePull: 0.5,
    averageRetention: 0.5,
    sequenceEscalation: 0.5,
    hookMastery: 0.5,
  };
}

// Add hook
export function addHook(
  state: NarrativeHookEngineState,
  hookId: string,
  type: HookType,
  strength: HookStrength,
  timing: HookTiming,
  content: string,
  pull: number,
  retention: number,
  chapter: number
): NarrativeHookEngineState {
  const hook: Hook = { hookId, type, strength, timing, content, pull, retention, chapter };
  const hooks = new Map(state.hooks).set(hookId, hook);
  return recomputeHook({ ...state, hooks, totalHooks: hooks.size });
}

// Create sequence
export function createHookSequence(
  state: NarrativeHookEngineState,
  sequenceId: string,
  hookIds: string[]
): NarrativeHookEngineState {
  const hooks = hookIds.map(id => state.hooks.get(id)).filter((h): h is Hook => h !== undefined);
  const pulls = hooks.map(h => h.pull);
  const escalation = pulls.length < 2 ? 0.5
    : (pulls[pulls.length - 1] - pulls[0] + 1) / 2;
  const effectiveness = hooks.length === 0 ? 0.5
    : hooks.reduce((s, h) => s + h.pull * h.retention, 0) / hooks.length;
  const sequence: HookSequence = { sequenceId, hookIds, escalation, effectiveness };
  const sequences = new Map(state.sequences).set(sequenceId, sequence);
  return recomputeHook({ ...state, sequences, totalSequences: sequences.size });
}

// Get hooks by type
export function getHooksByType(state: NarrativeHookEngineState, type: HookType): Hook[] {
  return Array.from(state.hooks.values()).filter(h => h.type === type);
}

// Get hook report
export function getHookReport(state: NarrativeHookEngineState): {
  totalHooks: number;
  totalSequences: number;
  averagePull: number;
  averageRetention: number;
  hookMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalHooks === 0) recommendations.push('No hooks — add hooks');
  if (state.averagePull < 0.5) recommendations.push('Low pull — strengthen');
  if (state.hookMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalHooks: state.totalHooks,
    totalSequences: state.totalSequences,
    averagePull: Math.round(state.averagePull * 100) / 100,
    averageRetention: Math.round(state.averageRetention * 100) / 100,
    hookMastery: Math.round(state.hookMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeHook(state: NarrativeHookEngineState): NarrativeHookEngineState {
  const hooks = Array.from(state.hooks.values());
  const averagePull = hooks.length === 0 ? 0.5
    : hooks.reduce((s, h) => s + h.pull, 0) / hooks.length;
  const averageRetention = hooks.length === 0 ? 0.5
    : hooks.reduce((s, h) => s + h.retention, 0) / hooks.length;

  const sequences = Array.from(state.sequences.values());
  const sequenceEscalation = sequences.length === 0 ? 0.5
    : sequences.reduce((s, sq) => s + sq.escalation, 0) / sequences.length;
  const avgEffectiveness = sequences.length === 0 ? 0.5
    : sequences.reduce((s, sq) => s + sq.effectiveness, 0) / sequences.length;

  const hookMastery = (averagePull * 0.3 + averageRetention * 0.3 + sequenceEscalation * 0.2 + avgEffectiveness * 0.2);

  return { ...state, averagePull, averageRetention, sequenceEscalation, hookMastery };
}

// Reset
export function resetNarrativeHookEngineState(): NarrativeHookEngineState {
  return createNarrativeHookEngineState();
}