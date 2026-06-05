/**
 * V730 NarrativePatternEngine — Direction E Iter 6/9 (Round 2)
 * Narrative pattern engine: pattern recognition + motif detection
 * Sources: nanobot pattern + thunderbolt + ruflo
 */

export type PatternType = 'motif' | 'archetype' | 'trope' | 'symbol' | 'structure' | 'rhythm';
export type PatternScope = 'global' | 'local' | 'scene' | 'paragraph';
export type PatternStrength = 'weak' | 'moderate' | 'strong' | 'dominant';

export interface Pattern {
  patternId: string;
  type: PatternType;
  name: string;
  description: string;
  scope: PatternScope;
  strength: PatternStrength;
  occurrences: number;
  positions: number[];
}

export interface PatternMatch {
  matchId: string;
  patternId: string;
  text: string;
  position: number;
  confidence: number;
  context: string;
}

export interface NarrativePatternEngineState {
  patterns: Map<string, Pattern>;
  matches: Map<string, PatternMatch>;
  typeDistribution: Map<PatternType, number>;
  totalPatterns: number;
  totalMatches: number;
  patternCoverage: number;
  averageStrength: number;
  dominantPattern: string | null;
}

// Factory
export function createNarrativePatternEngineState(): NarrativePatternEngineState {
  return {
    patterns: new Map(),
    matches: new Map(),
    typeDistribution: new Map(),
    totalPatterns: 0,
    totalMatches: 0,
    patternCoverage: 0,
    averageStrength: 0.5,
    dominantPattern: null,
  };
}

// Add pattern
export function addPattern(
  state: NarrativePatternEngineState,
  patternId: string,
  type: PatternType,
  name: string,
  description: string,
  scope: PatternScope = 'global',
  strength: PatternStrength = 'moderate'
): NarrativePatternEngineState {
  const pattern: Pattern = {
    patternId,
    type,
    name,
    description,
    scope,
    strength,
    occurrences: 0,
    positions: [],
  };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputePattern({ ...state, patterns, typeDistribution, totalPatterns: patterns.size });
}

// Record match
export function recordMatch(
  state: NarrativePatternEngineState,
  matchId: string,
  patternId: string,
  text: string,
  position: number,
  confidence: number = 0.5,
  context: string = ''
): NarrativePatternEngineState {
  const match: PatternMatch = { matchId, patternId, text, position, confidence, context };
  const matches = new Map(state.matches).set(matchId, match);

  // Increment pattern occurrences
  const pattern = state.patterns.get(patternId);
  let patterns = state.patterns;
  if (pattern) {
    const updated: Pattern = { ...pattern, occurrences: pattern.occurrences + 1, positions: [...pattern.positions, position] };
    patterns = new Map(state.patterns).set(patternId, updated);
  }

  return recomputePattern({ ...state, patterns, matches, totalMatches: matches.size });
}

// Get patterns by type
export function getPatternsByType(state: NarrativePatternEngineState, type: PatternType): Pattern[] {
  return Array.from(state.patterns.values()).filter(p => p.type === type);
}

// Get matches for pattern
export function getMatchesForPattern(state: NarrativePatternEngineState, patternId: string): PatternMatch[] {
  return Array.from(state.matches.values()).filter(m => m.patternId === patternId);
}

// Get dominant pattern
export function getDominantPattern(state: NarrativePatternEngineState): Pattern | null {
  const patterns = Array.from(state.patterns.values());
  if (patterns.length === 0) return null;
  return patterns.reduce((best, current) => current.occurrences > best.occurrences ? current : best);
}

// Get pattern report
export function getPatternReport(state: NarrativePatternEngineState): {
  totalPatterns: number;
  totalMatches: number;
  patternCoverage: number;
  averageStrength: number;
  dominantPattern: string | null;
  typeDistribution: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPatterns < 3) recommendations.push('Few patterns — identify more');
  if (state.patternCoverage < 0.4) recommendations.push('Low coverage — match more patterns');
  if (state.averageStrength < 0.5) recommendations.push('Weak patterns — strengthen');

  const typeDistribution: Record<string, number> = {};
  state.typeDistribution.forEach((count, type) => {
    typeDistribution[type] = count;
  });

  return {
    totalPatterns: state.totalPatterns,
    totalMatches: state.totalMatches,
    patternCoverage: Math.round(state.patternCoverage * 100) / 100,
    averageStrength: Math.round(state.averageStrength * 100) / 100,
    dominantPattern: state.dominantPattern,
    typeDistribution,
    recommendations,
  };
}

// Recompute metrics
function recomputePattern(state: NarrativePatternEngineState): NarrativePatternEngineState {
  const patterns = Array.from(state.patterns.values());

  const strengthMap: Record<PatternStrength, number> = {
    weak: 0.25,
    moderate: 0.5,
    strong: 0.75,
    dominant: 1.0,
  };
  const averageStrength = patterns.length > 0
    ? patterns.reduce((s, p) => s + strengthMap[p.strength], 0) / patterns.length
    : 0.5;

  const patternCoverage = state.totalMatches > 0 && state.totalPatterns > 0
    ? Math.min(1, state.totalMatches / (state.totalPatterns * 3))
    : 0;

  const dominant = getDominantPattern(state);

  return { ...state, averageStrength, patternCoverage, dominantPattern: dominant?.name ?? null };
}

// Reset pattern state
export function resetNarrativePatternEngineState(): NarrativePatternEngineState {
  return createNarrativePatternEngineState();
}