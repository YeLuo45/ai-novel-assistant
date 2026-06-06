/**
 * V896 CharacterSemanticEngine — Direction C Iter 11/15 (Round 4)
 * Character semantic engine: character meaning + symbolic roles
 * Sources: nanobot semantics + chatdev + thunderbolt
 */

export type CharacterArchetype = 'hero' | 'mentor' | 'threshold_guardian' | 'herald' | 'shapeshifter' | 'shadow' | 'ally' | 'trickster';
export type SymbolicFunction = 'representational' | 'compensatory' | 'exemplary' | 'archetypal' | 'personal' | 'cultural';
export type SemanticDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'abyssal';

export interface CharacterSymbol {
  symbolId: string;
  characterId: string;
  archetype: CharacterArchetype;
  symbolicFunction: SymbolicFunction;
  depth: SemanticDepth;
  meaning: string;
  resonance: number;
  universality: number;
}

export interface ArchetypePattern {
  patternId: string;
  name: string;
  symbolIds: string[];
  frequency: number;
  effectiveness: number;
}

export interface CharacterSemanticEngineState {
  symbols: Map<string, CharacterSymbol>;
  patterns: Map<string, ArchetypePattern>;
  totalSymbols: number;
  totalPatterns: number;
  averageResonance: number;
  archetypeCoverage: number;
  semanticDepth: number;
  symbolicRichness: number;
}

// Factory
export function createCharacterSemanticEngineState(): CharacterSemanticEngineState {
  return {
    symbols: new Map(),
    patterns: new Map(),
    totalSymbols: 0,
    totalPatterns: 0,
    averageResonance: 0.5,
    archetypeCoverage: 0,
    semanticDepth: 0.5,
    symbolicRichness: 0.5,
  };
}

// Add character symbol
export function addCharacterSymbol(
  state: CharacterSemanticEngineState,
  symbolId: string,
  characterId: string,
  archetype: CharacterArchetype,
  symbolicFunction: SymbolicFunction,
  meaning: string,
  depth: SemanticDepth = 'moderate',
  resonance: number = 0.5,
  universality: number = 0.5
): CharacterSemanticEngineState {
  const symbol: CharacterSymbol = {
    symbolId, characterId, archetype, symbolicFunction, meaning, depth,
    resonance: Math.min(1, Math.max(0, resonance)),
    universality: Math.min(1, Math.max(0, universality)),
  };
  const symbols = new Map(state.symbols).set(symbolId, symbol);
  return recomputeCharacterSem({ ...state, symbols, totalSymbols: symbols.size });
}

// Add pattern
export function addArchetypePattern(
  state: CharacterSemanticEngineState,
  patternId: string,
  name: string,
  symbolIds: string[],
  effectiveness: number = 0.5
): CharacterSemanticEngineState {
  const pattern: ArchetypePattern = { patternId, name, symbolIds, frequency: symbolIds.length, effectiveness };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeCharacterSem({ ...state, patterns, totalPatterns: patterns.size });
}

// Get symbols by archetype
export function getSymbolsByArchetype(state: CharacterSemanticEngineState, archetype: CharacterArchetype): CharacterSymbol[] {
  return Array.from(state.symbols.values()).filter(s => s.archetype === archetype);
}

// Get character semantic report
export function getCharacterSemanticReport(state: CharacterSemanticEngineState): {
  totalSymbols: number;
  totalPatterns: number;
  averageResonance: number;
  archetypeCoverage: number;
  semanticDepth: number;
  symbolicRichness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSymbols === 0) recommendations.push('No symbols — add symbols');
  if (state.archetypeCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.semanticDepth < 0.4) recommendations.push('Low depth — deepen');

  return {
    totalSymbols: state.totalSymbols,
    totalPatterns: state.totalPatterns,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    archetypeCoverage: Math.round(state.archetypeCoverage * 100) / 100,
    semanticDepth: Math.round(state.semanticDepth * 100) / 100,
    symbolicRichness: Math.round(state.symbolicRichness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterSem(state: CharacterSemanticEngineState): CharacterSemanticEngineState {
  const symbols = Array.from(state.symbols.values());
  const averageResonance = symbols.length === 0 ? 0.5
    : symbols.reduce((s, sy) => s + sy.resonance, 0) / symbols.length;

  const archetypeSet = new Set(symbols.map(s => s.archetype));
  const archetypeCoverage = Math.min(1, archetypeSet.size / 6);

  const depthMap: Record<SemanticDepth, number> = { surface: 0.2, shallow: 0.4, moderate: 0.6, deep: 0.8, abyssal: 1.0 };
  const semanticDepth = symbols.length === 0 ? 0.5
    : symbols.reduce((s, sy) => s + depthMap[sy.depth], 0) / symbols.length;

  const symbolicRichness = (averageResonance * 0.4 + archetypeCoverage * 0.3 + semanticDepth * 0.3);

  return { ...state, averageResonance, archetypeCoverage, semanticDepth, symbolicRichness };
}

// Reset character semantic state
export function resetCharacterSemanticEngineState(): CharacterSemanticEngineState {
  return createCharacterSemanticEngineState();
}