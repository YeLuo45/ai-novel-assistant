/**
 * V1426 NarrativeThemeLoveEngine — Direction L Iter 1/30 (Round 5)
 * Theme love engine: love as narrative theme
 * Sources: nanobot love + thunderbolt + ruflo
 */

export type ThemeLoveType = 'romantic' | 'familial' | 'platonic' | 'self' | 'universal' | 'divine' | 'transcendent';
export type ThemeLoveExpression = 'implicit' | 'emerging' | 'declared' | 'consummate' | 'transcendent' | 'absolute' | 'infinite';
export type ThemeLoveObstacle = 'none' | 'internal' | 'external' | 'circumstantial' | 'tragic' | 'cosmic' | 'transcendent';

export interface ThemeLoveEntry {
  entryId: string;
  type: ThemeLoveType;
  expression: ThemeLoveExpression;
  obstacle: ThemeLoveObstacle;
  description: string;
  resonance: number;
  transformation: number;
  chapter: number;
}

export interface ThemeLovePattern {
  patternId: string,
  entryIds: string[],
  cumulativeResonance: number,
  depth: number,
}

export interface NarrativeThemeLoveEngineState {
  entries: Map<string, ThemeLoveEntry>;
  patterns: Map<string, ThemeLovePattern>;
  totalEntries: number;
  totalPatterns: number;
  averageResonance: number;
  averageTransformation: number;
  patternDepth: number;
  themeLoveMastery: number;
}

export function createNarrativeThemeLoveEngineState(): NarrativeThemeLoveEngineState {
  return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageTransformation: 0.5, patternDepth: 0.5, themeLoveMastery: 0.5 };
}

export function addThemeLoveEntry(state: NarrativeThemeLoveEngineState, entryId: string, type: ThemeLoveType, expression: ThemeLoveExpression, obstacle: ThemeLoveObstacle, description: string, resonance: number, transformation: number, chapter: number): NarrativeThemeLoveEngineState {
  const entry: ThemeLoveEntry = { entryId, type, expression, obstacle, description, resonance, transformation, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addThemeLovePattern(state: NarrativeThemeLoveEngineState, patternId: string, entryIds: string[]): NarrativeThemeLoveEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeLoveEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const depth = Math.min(1, typeSet.size / 7);
  const pattern: ThemeLovePattern = { patternId, entryIds, cumulativeResonance, depth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}

export function getThemeLoveEntriesByType(state: NarrativeThemeLoveEngineState, type: ThemeLoveType): ThemeLoveEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getThemeLoveReport(state: NarrativeThemeLoveEngineState): { totalEntries: number; totalPatterns: number; averageResonance: number; averageTransformation: number; themeLoveMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme love entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeLoveMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageTransformation: Math.round(state.averageTransformation * 100) / 100, themeLoveMastery: Math.round(state.themeLoveMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeThemeLoveEngineState): NarrativeThemeLoveEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageTransformation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.transformation, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternDepth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.depth, 0) / patterns.length;
  const themeLoveMastery = (averageResonance * 0.4 + averageTransformation * 0.3 + patternDepth * 0.3);
  return { ...state, averageResonance, averageTransformation, patternDepth, themeLoveMastery };
}

export function resetNarrativeThemeLoveEngineState(): NarrativeThemeLoveEngineState {
  return createNarrativeThemeLoveEngineState();
}