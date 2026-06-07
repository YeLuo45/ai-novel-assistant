/**
 * V1434 NarrativeThemeIdentityEngine2 — Direction L Iter 5/30 (Round 5)
 * Theme identity v2: identity as narrative theme
 * Sources: thunderbolt identity + nanobot + ruflo
 */

export type ThemeIdentityType = 'self' | 'cultural' | 'national' | 'gender' | 'spiritual' | 'transcendent' | 'absolute';
export type ThemeIdentityCrisis = 'mild' | 'moderate' | 'severe' | 'existential' | 'transformative' | 'transcendent' | 'infinite';
export type ThemeIdentityResolution = 'abandoned' | 'delayed' | 'partial' | 'complete' | 'transcendent' | 'infinite' | 'absolute';

export interface ThemeIdentityEntry {
  entryId: string;
  type: ThemeIdentityType;
  crisis: ThemeIdentityCrisis;
  resolution: ThemeIdentityResolution;
  description: string;
  discovery: number;
  acceptance: number;
  chapter: number;
}

export interface ThemeIdentityJourney {
  journeyId: string,
  entryIds: string[],
  cumulativeDiscovery: number,
  depth: number,
}

export interface NarrativeThemeIdentity2EngineState {
  entries: Map<string, ThemeIdentityEntry>;
  journeys: Map<string, ThemeIdentityJourney>;
  totalEntries: number;
  totalJourneys: number;
  averageDiscovery: number;
  averageAcceptance: number;
  journeyDepth: number;
  themeIdentityMastery: number;
}

export function createNarrativeThemeIdentity2EngineState(): NarrativeThemeIdentity2EngineState {
  return { entries: new Map(), journeys: new Map(), totalEntries: 0, totalJourneys: 0, averageDiscovery: 0.5, averageAcceptance: 0.5, journeyDepth: 0.5, themeIdentityMastery: 0.5 };
}

export function addThemeIdentityEntry(state: NarrativeThemeIdentity2EngineState, entryId: string, type: ThemeIdentityType, crisis: ThemeIdentityCrisis, resolution: ThemeIdentityResolution, description: string, discovery: number, acceptance: number, chapter: number): NarrativeThemeIdentity2EngineState {
  const entry: ThemeIdentityEntry = { entryId, type, crisis, resolution, description, discovery, acceptance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addThemeIdentityJourney(state: NarrativeThemeIdentity2EngineState, journeyId: string, entryIds: string[]): NarrativeThemeIdentity2EngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeIdentityEntry => e !== undefined);
  const cumulativeDiscovery = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.discovery, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const depth = Math.min(1, typeSet.size / 7);
  const journey: ThemeIdentityJourney = { journeyId, entryIds, cumulativeDiscovery, depth };
  return recompute({ ...state, journeys: new Map(state.journeys).set(journeyId, journey), totalJourneys: state.journeys.size + 1 });
}

export function getThemeIdentityEntriesByType(state: NarrativeThemeIdentity2EngineState, type: ThemeIdentityType): ThemeIdentityEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getThemeIdentityReport(state: NarrativeThemeIdentity2EngineState): { totalEntries: number; totalJourneys: number; averageDiscovery: number; averageAcceptance: number; themeIdentityMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme identity entries');
  if (state.averageDiscovery < 0.5) recommendations.push('Low discovery — strengthen');
  if (state.themeIdentityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalJourneys: state.totalJourneys, averageDiscovery: Math.round(state.averageDiscovery * 100) / 100, averageAcceptance: Math.round(state.averageAcceptance * 100) / 100, themeIdentityMastery: Math.round(state.themeIdentityMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeThemeIdentity2EngineState): NarrativeThemeIdentity2EngineState {
  const entries = Array.from(state.entries.values());
  const averageDiscovery = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.discovery, 0) / entries.length;
  const averageAcceptance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.acceptance, 0) / entries.length;
  const journeys = Array.from(state.journeys.values());
  const journeyDepth = journeys.length === 0 ? 0.5 : journeys.reduce((s, j) => s + j.depth, 0) / journeys.length;
  const themeIdentityMastery = (averageDiscovery * 0.4 + averageAcceptance * 0.3 + journeyDepth * 0.3);
  return { ...state, averageDiscovery, averageAcceptance, journeyDepth, themeIdentityMastery };
}

export function resetNarrativeThemeIdentity2EngineState(): NarrativeThemeIdentity2EngineState {
  return createNarrativeThemeIdentity2EngineState();
}