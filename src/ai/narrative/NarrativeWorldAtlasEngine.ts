/**
 * V1306 NarrativeWorldAtlasEngine — Direction J Iter 1/30 (Round 5)
 * World atlas engine: atlas of narrative world
 * Sources: nanobot atlas + thunderbolt + ruflo
 */

export type WorldAtlasRegion = 'kingdom' | 'empire' | 'wilderness' | 'ocean' | 'mountain' | 'underground' | 'celestial';
export type WorldAtlasScale = 'local' | 'regional' | 'continental' | 'planetary' | 'cosmic';
export type WorldAtlasDetail = 'minimal' | 'basic' | 'rich' | 'lush' | 'immersive';

export interface WorldAtlasEntry {
  entryId: string;
  region: WorldAtlasRegion;
  scale: WorldAtlasScale;
  detail: WorldAtlasDetail;
  description: string;
  reach: number;
  vividness: number;
  chapter: number;
}

export interface WorldAtlasSection {
  sectionId: string,
  entryIds: string[],
  cumulativeReach: number,
  coverage: number,
}

export interface NarrativeWorldAtlasEngineState {
  entries: Map<string, WorldAtlasEntry>;
  sections: Map<string, WorldAtlasSection>;
  totalEntries: number;
  totalSections: number;
  averageReach: number;
  averageVividness: number;
  sectionCoverage: number;
  worldAtlasMastery: number;
}

// Factory
export function createNarrativeWorldAtlasEngineState(): NarrativeWorldAtlasEngineState {
  return {
    entries: new Map(),
    sections: new Map(),
    totalEntries: 0,
    totalSections: 0,
    averageReach: 0.5,
    averageVividness: 0.5,
    sectionCoverage: 0.5,
    worldAtlasMastery: 0.5,
  };
}

// Add entry
export function addWorldAtlasEntry(
  state: NarrativeWorldAtlasEngineState,
  entryId: string,
  region: WorldAtlasRegion,
  scale: WorldAtlasScale,
  detail: WorldAtlasDetail,
  description: string,
  reach: number,
  vividness: number,
  chapter: number
): NarrativeWorldAtlasEngineState {
  const entry: WorldAtlasEntry = { entryId, region, scale, detail, description, reach, vividness, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldAtlas({ ...state, entries, totalEntries: entries.size });
}

// Add section
export function addWorldAtlasSection(
  state: NarrativeWorldAtlasEngineState,
  sectionId: string,
  entryIds: string[]
): NarrativeWorldAtlasEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldAtlasEntry => e !== undefined);
  const cumulativeReach = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.reach, 0) / entries.length;
  const regionSet = new Set(entries.map(e => e.region));
  const coverage = Math.min(1, regionSet.size / 7);
  const section: WorldAtlasSection = { sectionId, entryIds, cumulativeReach, coverage };
  const sections = new Map(state.sections).set(sectionId, section);
  return recomputeWorldAtlas({ ...state, sections, totalSections: sections.size });
}

// Get entries by region
export function getWorldAtlasEntriesByRegion(state: NarrativeWorldAtlasEngineState, region: WorldAtlasRegion): WorldAtlasEntry[] {
  return Array.from(state.entries.values()).filter(e => e.region === region);
}

// Get world atlas report
export function getWorldAtlasReport(state: NarrativeWorldAtlasEngineState): {
  totalEntries: number;
  totalSections: number;
  averageReach: number;
  averageVividness: number;
  worldAtlasMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world atlas entries');
  if (state.averageReach < 0.5) recommendations.push('Low reach — strengthen');
  if (state.worldAtlasMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSections: state.totalSections,
    averageReach: Math.round(state.averageReach * 100) / 100,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    worldAtlasMastery: Math.round(state.worldAtlasMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldAtlas(state: NarrativeWorldAtlasEngineState): NarrativeWorldAtlasEngineState {
  const entries = Array.from(state.entries.values());
  const averageReach = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.reach, 0) / entries.length;
  const averageVividness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.vividness, 0) / entries.length;

  const sections = Array.from(state.sections.values());
  const sectionCoverage = sections.length === 0 ? 0.5
    : sections.reduce((s, sec) => s + sec.coverage, 0) / sections.length;

  const worldAtlasMastery = (averageReach * 0.4 + averageVividness * 0.3 + sectionCoverage * 0.3);

  return { ...state, averageReach, averageVividness, sectionCoverage, worldAtlasMastery };
}

// Reset
export function resetNarrativeWorldAtlasEngineState(): NarrativeWorldAtlasEngineState {
  return createNarrativeWorldAtlasEngineState();
}