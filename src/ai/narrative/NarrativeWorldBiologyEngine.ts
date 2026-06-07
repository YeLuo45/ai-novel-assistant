/**
 * V1340 NarrativeWorldBiologyEngine — Direction J Iter 18/30 (Round 5)
 * World biology engine: biology of narrative world
 * Sources: ruflo biology + nanobot + thunderbolt
 */

export type WorldBiologyLifeform = 'plant' | 'animal' | 'fungus' | 'microbe' | 'magical' | 'sentient' | 'transcendent';
export type WorldBiologyComplexity = 'simple' | 'moderate' | 'complex' | 'highly_complex' | 'incomprehensible' | 'transcendent' | 'infinite';
export type WorldBiologyIntelligence = 'instinctual' | 'reactive' | 'learned' | 'analytical' | 'creative' | 'transcendent' | 'omniscient';

export interface WorldBiologyEntry {
  entryId: string;
  lifeform: WorldBiologyLifeform;
  complexity: WorldBiologyComplexity;
  intelligence: WorldBiologyIntelligence;
  description: string;
  vitality: number;
  uniqueness: number;
  chapter: number;
}

export interface WorldBiologyTaxonomy {
  taxonomyId: string,
  entryIds: string[],
  cumulativeVitality: number,
  breadth: number,
}

export interface NarrativeWorldBiologyEngineState {
  entries: Map<string, WorldBiologyEntry>;
  taxonomies: Map<string, WorldBiologyTaxonomy>;
  totalEntries: number;
  totalTaxonomies: number;
  averageVitality: number;
  averageUniqueness: number;
  taxonomyBreadth: number;
  worldBiologyMastery: number;
}

// Factory
export function createNarrativeWorldBiologyEngineState(): NarrativeWorldBiologyEngineState {
  return {
    entries: new Map(),
    taxonomies: new Map(),
    totalEntries: 0,
    totalTaxonomies: 0,
    averageVitality: 0.5,
    averageUniqueness: 0.5,
    taxonomyBreadth: 0.5,
    worldBiologyMastery: 0.5,
  };
}

// Add entry
export function addWorldBiologyEntry(
  state: NarrativeWorldBiologyEngineState,
  entryId: string,
  lifeform: WorldBiologyLifeform,
  complexity: WorldBiologyComplexity,
  intelligence: WorldBiologyIntelligence,
  description: string,
  vitality: number,
  uniqueness: number,
  chapter: number
): NarrativeWorldBiologyEngineState {
  const entry: WorldBiologyEntry = { entryId, lifeform, complexity, intelligence, description, vitality, uniqueness, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldBiology({ ...state, entries, totalEntries: entries.size });
}

// Add taxonomy
export function addWorldBiologyTaxonomy(
  state: NarrativeWorldBiologyEngineState,
  taxonomyId: string,
  entryIds: string[]
): NarrativeWorldBiologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldBiologyEntry => e !== undefined);
  const cumulativeVitality = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.vitality, 0) / entries.length;
  const lifeformSet = new Set(entries.map(e => e.lifeform));
  const breadth = Math.min(1, lifeformSet.size / 7);
  const taxonomy: WorldBiologyTaxonomy = { taxonomyId, entryIds, cumulativeVitality, breadth };
  const taxonomies = new Map(state.taxonomies).set(taxonomyId, taxonomy);
  return recomputeWorldBiology({ ...state, taxonomies, totalTaxonomies: taxonomies.size });
}

// Get entries by lifeform
export function getWorldBiologyEntriesByLifeform(state: NarrativeWorldBiologyEngineState, lifeform: WorldBiologyLifeform): WorldBiologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.lifeform === lifeform);
}

// Get world biology report
export function getWorldBiologyReport(state: NarrativeWorldBiologyEngineState): {
  totalEntries: number;
  totalTaxonomies: number;
  averageVitality: number;
  averageUniqueness: number;
  worldBiologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world biology entries');
  if (state.averageVitality < 0.5) recommendations.push('Low vitality — strengthen');
  if (state.worldBiologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalTaxonomies: state.totalTaxonomies,
    averageVitality: Math.round(state.averageVitality * 100) / 100,
    averageUniqueness: Math.round(state.averageUniqueness * 100) / 100,
    worldBiologyMastery: Math.round(state.worldBiologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldBiology(state: NarrativeWorldBiologyEngineState): NarrativeWorldBiologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageVitality = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.vitality, 0) / entries.length;
  const averageUniqueness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.uniqueness, 0) / entries.length;

  const taxonomies = Array.from(state.taxonomies.values());
  const taxonomyBreadth = taxonomies.length === 0 ? 0.5
    : taxonomies.reduce((s, t) => s + t.breadth, 0) / taxonomies.length;

  const worldBiologyMastery = (averageVitality * 0.4 + averageUniqueness * 0.3 + taxonomyBreadth * 0.3);

  return { ...state, averageVitality, averageUniqueness, taxonomyBreadth, worldBiologyMastery };
}

// Reset
export function resetNarrativeWorldBiologyEngineState(): NarrativeWorldBiologyEngineState {
  return createNarrativeWorldBiologyEngineState();
}