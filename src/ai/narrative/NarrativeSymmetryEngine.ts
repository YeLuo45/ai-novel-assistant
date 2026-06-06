/**
 * V1022 NarrativeSymmetryEngine — Direction B Iter 14/15 (Round 5)
 * Symmetry engine: narrative symmetry + echo + mirror
 * Sources: ruflo symmetry + thunderbolt + nanobot
 */

export type SymmetryType = 'mirror' | 'echo' | 'parallel' | 'inversion' | 'circular' | 'chiastic';
export type SymmetryStrength = 'subtle' | 'moderate' | 'strong' | 'powerful' | 'transcendent';
export type SymmetryScope = 'local' | 'sectional' | 'chapter' | 'arc' | 'narrative';

export interface Symmetry {
  symmetryId: string;
  type: SymmetryType;
  strength: SymmetryStrength;
  scope: SymmetryScope;
  element1: string;
  element2: string;
  description: string;
  resonance: number;
  chapter: number;
}

export interface SymmetryPattern {
  patternId: string,
  symmetryIds: string[],
  coherence: number,
  power: number,
}

export interface NarrativeSymmetryEngineState {
  symmetries: Map<string, Symmetry>;
  patterns: Map<string, SymmetryPattern>;
  totalSymmetries: number;
  totalPatterns: number;
  averageResonance: number;
  scopeCoverage: number;
  patternCoherence: number;
  symmetryMastery: number;
}

// Factory
export function createNarrativeSymmetryEngineState(): NarrativeSymmetryEngineState {
  return {
    symmetries: new Map(),
    patterns: new Map(),
    totalSymmetries: 0,
    totalPatterns: 0,
    averageResonance: 0.5,
    scopeCoverage: 0,
    patternCoherence: 0.5,
    symmetryMastery: 0.5,
  };
}

// Add symmetry
export function addSymmetry(
  state: NarrativeSymmetryEngineState,
  symmetryId: string,
  type: SymmetryType,
  strength: SymmetryStrength,
  scope: SymmetryScope,
  element1: string,
  element2: string,
  description: string,
  resonance: number,
  chapter: number
): NarrativeSymmetryEngineState {
  const symmetry: Symmetry = { symmetryId, type, strength, scope, element1, element2, description, resonance, chapter };
  const symmetries = new Map(state.symmetries).set(symmetryId, symmetry);
  return recomputeSymmetry({ ...state, symmetries, totalSymmetries: symmetries.size });
}

// Add pattern
export function addSymmetryPattern(
  state: NarrativeSymmetryEngineState,
  patternId: string,
  symmetryIds: string[]
): NarrativeSymmetryEngineState {
  const symmetries = symmetryIds.map(id => state.symmetries.get(id)).filter((s): s is Symmetry => s !== undefined);
  const power = symmetries.length === 0 ? 0
    : symmetries.reduce((s, sym) => s + sym.resonance, 0) / symmetries.length;
  const coherence = symmetries.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(symmetries[0].resonance - symmetries[symmetries.length - 1].resonance));
  const pattern: SymmetryPattern = { patternId, symmetryIds, coherence, power };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeSymmetry({ ...state, patterns, totalPatterns: patterns.size });
}

// Get symmetries by type
export function getSymmetriesByType(state: NarrativeSymmetryEngineState, type: SymmetryType): Symmetry[] {
  return Array.from(state.symmetries.values()).filter(s => s.type === type);
}

// Get symmetry report
export function getSymmetryReport(state: NarrativeSymmetryEngineState): {
  totalSymmetries: number;
  totalPatterns: number;
  averageResonance: number;
  scopeCoverage: number;
  symmetryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSymmetries === 0) recommendations.push('No symmetries — add symmetries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.symmetryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSymmetries: state.totalSymmetries,
    totalPatterns: state.totalPatterns,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    scopeCoverage: Math.round(state.scopeCoverage * 100) / 100,
    symmetryMastery: Math.round(state.symmetryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSymmetry(state: NarrativeSymmetryEngineState): NarrativeSymmetryEngineState {
  const symmetries = Array.from(state.symmetries.values());
  const averageResonance = symmetries.length === 0 ? 0.5
    : symmetries.reduce((s, sym) => s + sym.resonance, 0) / symmetries.length;
  const scopeSet = new Set(symmetries.map(s => s.scope));
  const scopeCoverage = Math.min(1, scopeSet.size / 5);

  const patterns = Array.from(state.patterns.values());
  const patternCoherence = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.coherence, 0) / patterns.length;

  const symmetryMastery = (averageResonance * 0.4 + scopeCoverage * 0.3 + patternCoherence * 0.3);

  return { ...state, averageResonance, scopeCoverage, patternCoherence, symmetryMastery };
}

// Reset
export function resetNarrativeSymmetryEngineState(): NarrativeSymmetryEngineState {
  return createNarrativeSymmetryEngineState();
}