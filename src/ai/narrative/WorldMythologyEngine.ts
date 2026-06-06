/**
 * V1026 WorldMythologyEngine — Direction C Iter 1/20 (Round 5)
 * World mythology engine: myths, legends, cosmology stories
 * Sources: nanobot mythology + ruflo + chatdev
 */

export type MythType = 'creation' | 'flood' | 'hero' | 'trickster' | 'afterlife' | 'founding';
export type MythPower = 'regional' | 'national' | 'civilizational' | 'universal' | 'transcendent';
export type MythStatus = 'oral' | 'scripture' | 'folklore' | 'lost' | 'forbidden';

export interface Myth {
  mythId: string;
  type: MythType;
  power: MythPower;
  status: MythStatus;
  name: string;
  description: string;
  beliefStrength: number;
  influence: number;
  era: number;
}

export interface MythicEra {
  eraId: string,
  name: string,
  mythIds: string[],
  centrality: number,
}

export interface WorldMythologyEngineState {
  myths: Map<string, Myth>;
  eras: Map<string, MythicEra>;
  totalMyths: number;
  totalEras: number;
  averageBelief: number;
  averageInfluence: number;
  mythicCohesion: number;
  mythologyMastery: number;
}

// Factory
export function createWorldMythologyEngineState(): WorldMythologyEngineState {
  return {
    myths: new Map(),
    eras: new Map(),
    totalMyths: 0,
    totalEras: 0,
    averageBelief: 0.5,
    averageInfluence: 0.5,
    mythicCohesion: 0.5,
    mythologyMastery: 0.5,
  };
}

// Add myth
export function addMyth(
  state: WorldMythologyEngineState,
  mythId: string,
  type: MythType,
  power: MythPower,
  status: MythStatus,
  name: string,
  description: string,
  beliefStrength: number,
  influence: number,
  era: number
): WorldMythologyEngineState {
  const myth: Myth = { mythId, type, power, status, name, description, beliefStrength, influence, era };
  const myths = new Map(state.myths).set(mythId, myth);
  return recomputeMythology({ ...state, myths, totalMyths: myths.size });
}

// Add era
export function addMythicEra(
  state: WorldMythologyEngineState,
  eraId: string,
  name: string,
  mythIds: string[]
): WorldMythologyEngineState {
  const myths = mythIds.map(id => state.myths.get(id)).filter((m): m is Myth => m !== undefined);
  const centrality = myths.length === 0 ? 0
    : myths.reduce((s, m) => s + m.beliefStrength, 0) / myths.length;
  const era: MythicEra = { eraId, name, mythIds, centrality };
  const eras = new Map(state.eras).set(eraId, era);
  return recomputeMythology({ ...state, eras, totalEras: eras.size });
}

// Get myths by type
export function getMythsByType(state: WorldMythologyEngineState, type: MythType): Myth[] {
  return Array.from(state.myths.values()).filter(m => m.type === type);
}

// Get mythology report
export function getMythologyReport(state: WorldMythologyEngineState): {
  totalMyths: number;
  totalEras: number;
  averageBelief: number;
  averageInfluence: number;
  mythologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMyths === 0) recommendations.push('No myths — add myths');
  if (state.averageBelief < 0.5) recommendations.push('Low belief — strengthen');
  if (state.mythologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalMyths: state.totalMyths,
    totalEras: state.totalEras,
    averageBelief: Math.round(state.averageBelief * 100) / 100,
    averageInfluence: Math.round(state.averageInfluence * 100) / 100,
    mythologyMastery: Math.round(state.mythologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMythology(state: WorldMythologyEngineState): WorldMythologyEngineState {
  const myths = Array.from(state.myths.values());
  const averageBelief = myths.length === 0 ? 0.5
    : myths.reduce((s, m) => s + m.beliefStrength, 0) / myths.length;
  const averageInfluence = myths.length === 0 ? 0.5
    : myths.reduce((s, m) => s + m.influence, 0) / myths.length;

  const eras = Array.from(state.eras.values());
  const mythicCohesion = eras.length === 0 ? 0.5
    : eras.reduce((s, e) => s + e.centrality, 0) / eras.length;

  const mythologyMastery = (averageBelief * 0.4 + averageInfluence * 0.3 + mythicCohesion * 0.3);

  return { ...state, averageBelief, averageInfluence, mythicCohesion, mythologyMastery };
}

// Reset
export function resetWorldMythologyEngineState(): WorldMythologyEngineState {
  return createWorldMythologyEngineState();
}