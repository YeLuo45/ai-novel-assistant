/**
 * V764 PlotTwistEngine — Direction B Iter 5/9 (Round 3)
 * Plot twist engine: twist generation + foreshadowing + payoff
 * Sources: thunderbolt twist + chatdev surprise + nanobot
 */

export type TwistType = 'revelation' | 'betrayal' | 'identity' | 'situation' | 'motivation' | 'reversal' | 'deus_ex_machina';
export type TwistPhase = 'seeded' | 'foreshadowed' | 'set_up' | 'revealed' | 'payoff' | 'aftermath';
export type TwistImpact = 'low' | 'moderate' | 'high' | 'shocking';

export interface Foreshadowing {
  foreshadowingId: string;
  twistId: string;
  description: string;
  plantedChapter: number;
  payOffChapter: number;
  subtlety: number;
  effectiveness: number;
}

export interface PlotTwist {
  twistId: string;
  type: TwistType;
  phase: TwistPhase;
  impact: TwistImpact;
  description: string;
  revealChapter: number;
  foreshadowingIds: string[];
  audienceSuspects: number;
  satisfaction: number;
}

export interface PlotTwistEngineState {
  twists: Map<string, PlotTwist>;
  foreshadowings: Map<string, Foreshadowing>;
  totalTwists: number;
  totalForeshadowings: number;
  revealedTwists: number;
  averageSatisfaction: number;
  averageEffectiveness: number;
  twistDensity: number;
}

// Factory
export function createPlotTwistEngineState(): PlotTwistEngineState {
  return {
    twists: new Map(),
    foreshadowings: new Map(),
    totalTwists: 0,
    totalForeshadowings: 0,
    revealedTwists: 0,
    averageSatisfaction: 0,
    averageEffectiveness: 0,
    twistDensity: 0,
  };
}

// Create twist
export function createPlotTwist(
  state: PlotTwistEngineState,
  twistId: string,
  type: TwistType,
  description: string,
  revealChapter: number,
  impact: TwistImpact = 'moderate'
): PlotTwistEngineState {
  const twist: PlotTwist = {
    twistId,
    type,
    phase: 'seeded',
    impact,
    description,
    revealChapter,
    foreshadowingIds: [],
    audienceSuspects: 0,
    satisfaction: 0,
  };
  const twists = new Map(state.twists).set(twistId, twist);
  return recomputeTwist({ ...state, twists, totalTwists: twists.size });
}

// Add foreshadowing
export function addForeshadowing(
  state: PlotTwistEngineState,
  foreshadowingId: string,
  twistId: string,
  description: string,
  plantedChapter: number,
  payOffChapter: number,
  subtlety: number = 0.5
): PlotTwistEngineState {
  const foreshadowing: Foreshadowing = {
    foreshadowingId,
    twistId,
    description,
    plantedChapter,
    payOffChapter,
    subtlety: Math.min(1, Math.max(0, subtlety)),
    effectiveness: 0,
  };
  const foreshadowings = new Map(state.foreshadowings).set(foreshadowingId, foreshadowing);

  // Update twist
  const twist = state.twists.get(twistId);
  let twists = state.twists;
  if (twist) {
    const updated: PlotTwist = { ...twist, foreshadowingIds: [...twist.foreshadowingIds, foreshadowingId], phase: 'foreshadowed' };
    twists = new Map(state.twists).set(twistId, updated);
  }

  return recomputeTwist({ ...state, twists, foreshadowings, totalForeshadowings: foreshadowings.size });
}

// Reveal twist
export function revealTwist(state: PlotTwistEngineState, twistId: string, satisfaction: number): PlotTwistEngineState {
  const twist = state.twists.get(twistId);
  if (!twist) return state;

  const updated: PlotTwist = { ...twist, phase: 'revealed', satisfaction: Math.min(1, Math.max(0, satisfaction)) };
  const twists = new Map(state.twists).set(twistId, updated);
  return recomputeTwist({ ...state, twists, revealedTwists: state.revealedTwists + 1 });
}

// Mark as payoff
export function markPayoff(state: PlotTwistEngineState, twistId: string): PlotTwistEngineState {
  const twist = state.twists.get(twistId);
  if (!twist) return state;

  const updated: PlotTwist = { ...twist, phase: 'payoff' };
  const twists = new Map(state.twists).set(twistId, updated);
  return recomputeTwist({ ...state, twists });
}

// Update audience suspects
export function updateAudienceSuspects(state: PlotTwistEngineState, twistId: string, suspects: number): PlotTwistEngineState {
  const twist = state.twists.get(twistId);
  if (!twist) return state;

  const updated: PlotTwist = { ...twist, audienceSuspects: Math.min(1, Math.max(0, suspects)) };
  const twists = new Map(state.twists).set(twistId, updated);
  return recomputeTwist({ ...state, twists });
}

// Get twists by type
export function getTwistsByType(state: PlotTwistEngineState, type: TwistType): PlotTwist[] {
  return Array.from(state.twists.values()).filter(t => t.type === type);
}

// Get foreshadowings for twist
export function getForeshadowingsForTwist(state: PlotTwistEngineState, twistId: string): Foreshadowing[] {
  return Array.from(state.foreshadowings.values()).filter(f => f.twistId === twistId);
}

// Get twist report
export function getTwistReport(state: PlotTwistEngineState): {
  totalTwists: number;
  totalForeshadowings: number;
  revealedTwists: number;
  averageSatisfaction: number;
  averageEffectiveness: number;
  twistDensity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTwists === 0) recommendations.push('No twists — create plot twists');
  if (state.totalForeshadowings < state.totalTwists) recommendations.push('Add foreshadowing for twists');
  if (state.averageSatisfaction < 0.5) recommendations.push('Low satisfaction — improve twists');

  return {
    totalTwists: state.totalTwists,
    totalForeshadowings: state.totalForeshadowings,
    revealedTwists: state.revealedTwists,
    averageSatisfaction: Math.round(state.averageSatisfaction * 100) / 100,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    twistDensity: Math.round(state.twistDensity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTwist(state: PlotTwistEngineState): PlotTwistEngineState {
  const twists = Array.from(state.twists.values());
  const revealed = twists.filter(t => t.phase === 'revealed' || t.phase === 'payoff');
  const averageSatisfaction = revealed.length === 0 ? 0
    : revealed.reduce((s, t) => s + t.satisfaction, 0) / revealed.length;

  const foreshadowings = Array.from(state.foreshadowings.values());
  const averageEffectiveness = foreshadowings.length === 0 ? 0
    : foreshadowings.reduce((s, f) => s + f.effectiveness, 0) / foreshadowings.length;

  const twistDensity = state.totalTwists === 0 ? 0 : Math.min(1, state.totalForeshadowings / state.totalTwists);

  return { ...state, averageSatisfaction, averageEffectiveness, twistDensity };
}

// Reset twist state
export function resetPlotTwistEngineState(): PlotTwistEngineState {
  return createPlotTwistEngineState();
}