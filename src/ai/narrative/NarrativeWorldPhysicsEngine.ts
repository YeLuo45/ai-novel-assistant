/**
 * V1336 NarrativeWorldPhysicsEngine — Direction J Iter 16/30 (Round 5)
 * World physics engine: physics of narrative world
 * Sources: nanobot physics + thunderbolt + ruflo
 */

export type WorldPhysicsLaw = 'classical' | 'relativistic' | 'quantum' | 'magical' | 'narrative' | 'metaphysical' | 'transcendent';
export type WorldPhysicsConsistency = 'inconsistent' | 'loose' | 'moderate' | 'tight' | 'rigorous' | 'absolute' | 'transcendent';
export type WorldPhysicsBreakability = 'rigid' | 'mostly_rigid' | 'flexible' | 'very_flexible' | 'malleable' | 'infinite' | 'transcendent';

export interface WorldPhysicsEntry {
  entryId: string;
  law: WorldPhysicsLaw;
  consistency: WorldPhysicsConsistency;
  breakability: WorldPhysicsBreakability;
  description: string;
  elegance: number;
  mystery: number;
  chapter: number;
}

export interface WorldPhysicsSystem {
  systemId: string,
  entryIds: string[],
  cumulativeElegance: number,
  coherence: number,
}

export interface NarrativeWorldPhysicsEngineState {
  entries: Map<string, WorldPhysicsEntry>;
  systems: Map<string, WorldPhysicsSystem>;
  totalEntries: number;
  totalSystems: number;
  averageElegance: number;
  averageMystery: number;
  systemCoherence: number;
  worldPhysicsMastery: number;
}

// Factory
export function createNarrativeWorldPhysicsEngineState(): NarrativeWorldPhysicsEngineState {
  return {
    entries: new Map(),
    systems: new Map(),
    totalEntries: 0,
    totalSystems: 0,
    averageElegance: 0.5,
    averageMystery: 0.5,
    systemCoherence: 0.5,
    worldPhysicsMastery: 0.5,
  };
}

// Add entry
export function addWorldPhysicsEntry(
  state: NarrativeWorldPhysicsEngineState,
  entryId: string,
  law: WorldPhysicsLaw,
  consistency: WorldPhysicsConsistency,
  breakability: WorldPhysicsBreakability,
  description: string,
  elegance: number,
  mystery: number,
  chapter: number
): NarrativeWorldPhysicsEngineState {
  const entry: WorldPhysicsEntry = { entryId, law, consistency, breakability, description, elegance, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldPhysics({ ...state, entries, totalEntries: entries.size });
}

// Add system
export function addWorldPhysicsSystem(
  state: NarrativeWorldPhysicsEngineState,
  systemId: string,
  entryIds: string[]
): NarrativeWorldPhysicsEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldPhysicsEntry => e !== undefined);
  const cumulativeElegance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.elegance, 0) / entries.length;
  const lawSet = new Set(entries.map(e => e.law));
  const coherence = Math.min(1, lawSet.size / 7);
  const system: WorldPhysicsSystem = { systemId, entryIds, cumulativeElegance, coherence };
  const systems = new Map(state.systems).set(systemId, system);
  return recomputeWorldPhysics({ ...state, systems, totalSystems: systems.size });
}

// Get entries by law
export function getWorldPhysicsEntriesByLaw(state: NarrativeWorldPhysicsEngineState, law: WorldPhysicsLaw): WorldPhysicsEntry[] {
  return Array.from(state.entries.values()).filter(e => e.law === law);
}

// Get world physics report
export function getWorldPhysicsReport(state: NarrativeWorldPhysicsEngineState): {
  totalEntries: number;
  totalSystems: number;
  averageElegance: number;
  averageMystery: number;
  worldPhysicsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world physics entries');
  if (state.averageElegance < 0.5) recommendations.push('Low elegance — strengthen');
  if (state.worldPhysicsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSystems: state.totalSystems,
    averageElegance: Math.round(state.averageElegance * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    worldPhysicsMastery: Math.round(state.worldPhysicsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldPhysics(state: NarrativeWorldPhysicsEngineState): NarrativeWorldPhysicsEngineState {
  const entries = Array.from(state.entries.values());
  const averageElegance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.elegance, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const systems = Array.from(state.systems.values());
  const systemCoherence = systems.length === 0 ? 0.5
    : systems.reduce((s, sy) => s + sy.coherence, 0) / systems.length;

  const worldPhysicsMastery = (averageElegance * 0.4 + averageMystery * 0.3 + systemCoherence * 0.3);

  return { ...state, averageElegance, averageMystery, systemCoherence, worldPhysicsMastery };
}

// Reset
export function resetNarrativeWorldPhysicsEngineState(): NarrativeWorldPhysicsEngineState {
  return createNarrativeWorldPhysicsEngineState();
}