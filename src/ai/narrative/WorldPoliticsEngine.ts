/**
 * V1058 WorldPoliticsEngine — Direction C Iter 17/20 (Round 5)
 * World politics engine: political systems + power dynamics
 * Sources: nanobot politics + thunderbolt + ruflo
 */

export type PoliticalSystem = 'monarchy' | 'democracy' | 'oligarchy' | 'theocracy' | 'anarchy' | 'federal';
export type PowerDynamic = 'dominance' | 'negotiation' | 'alliance' | 'rivalry' | 'subversion' | 'balance';
export type PoliticalScope = 'local' | 'regional' | 'national' | 'imperial' | 'global';

export interface PoliticalElement {
  elementId: string;
  system: PoliticalSystem;
  dynamic: PowerDynamic;
  scope: PoliticalScope;
  description: string;
  stability: number;
  legitimacy: number;
  era: number;
}

export interface PoliticalFaction {
  factionId: string,
  name: string,
  elementIds: string[],
  power: number,
  cohesion: number,
}

export interface WorldPoliticsEngineState {
  elements: Map<string, PoliticalElement>;
  factions: Map<string, PoliticalFaction>;
  totalElements: number;
  totalFactions: number;
  averageStability: number;
  averageLegitimacy: number;
  factionPower: number;
  politicsMastery: number;
}

// Factory
export function createWorldPoliticsEngineState(): WorldPoliticsEngineState {
  return {
    elements: new Map(),
    factions: new Map(),
    totalElements: 0,
    totalFactions: 0,
    averageStability: 0.5,
    averageLegitimacy: 0.5,
    factionPower: 0.5,
    politicsMastery: 0.5,
  };
}

// Add element
export function addPoliticalElement(
  state: WorldPoliticsEngineState,
  elementId: string,
  system: PoliticalSystem,
  dynamic: PowerDynamic,
  scope: PoliticalScope,
  description: string,
  stability: number,
  legitimacy: number,
  era: number
): WorldPoliticsEngineState {
  const element: PoliticalElement = { elementId, system, dynamic, scope, description, stability, legitimacy, era };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputePolitics({ ...state, elements, totalElements: elements.size });
}

// Add faction
export function addPoliticalFaction(
  state: WorldPoliticsEngineState,
  factionId: string,
  name: string,
  elementIds: string[]
): WorldPoliticsEngineState {
  const elements = elementIds.map(id => state.elements.get(id)).filter((e): e is PoliticalElement => e !== undefined);
  const power = elements.length === 0 ? 0
    : elements.reduce((s, e) => s + e.stability, 0) / elements.length;
  const dynamicSet = new Set(elements.map(e => e.dynamic));
  const cohesion = Math.min(1, dynamicSet.size / 6);
  const faction: PoliticalFaction = { factionId, name, elementIds, power, cohesion };
  const factions = new Map(state.factions).set(factionId, faction);
  return recomputePolitics({ ...state, factions, totalFactions: factions.size });
}

// Get elements by system
export function getElementsBySystem(state: WorldPoliticsEngineState, system: PoliticalSystem): PoliticalElement[] {
  return Array.from(state.elements.values()).filter(e => e.system === system);
}

// Get politics report
export function getPoliticsReport(state: WorldPoliticsEngineState): {
  totalElements: number;
  totalFactions: number;
  averageStability: number;
  averageLegitimacy: number;
  politicsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add political elements');
  if (state.averageStability < 0.5) recommendations.push('Low stability — strengthen');
  if (state.politicsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalElements: state.totalElements,
    totalFactions: state.totalFactions,
    averageStability: Math.round(state.averageStability * 100) / 100,
    averageLegitimacy: Math.round(state.averageLegitimacy * 100) / 100,
    politicsMastery: Math.round(state.politicsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePolitics(state: WorldPoliticsEngineState): WorldPoliticsEngineState {
  const elements = Array.from(state.elements.values());
  const averageStability = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.stability, 0) / elements.length;
  const averageLegitimacy = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.legitimacy, 0) / elements.length;

  const factions = Array.from(state.factions.values());
  const factionPower = factions.length === 0 ? 0.5
    : factions.reduce((s, f) => s + f.power, 0) / factions.length;

  const politicsMastery = (averageStability * 0.4 + averageLegitimacy * 0.3 + factionPower * 0.3);

  return { ...state, averageStability, averageLegitimacy, factionPower, politicsMastery };
}

// Reset
export function resetWorldPoliticsEngineState(): WorldPoliticsEngineState {
  return createWorldPoliticsEngineState();
}