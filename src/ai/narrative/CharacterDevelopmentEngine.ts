/**
 * V686 CharacterDevelopmentEngine — Direction B Iter 2/9 (Round 2)
 * Character development engine: arc + growth + transformation
 * Sources: chatdev role + ruflo hierarchical + nanobot
 */

export type DevelopmentStage = 'introduction' | 'inciting' | 'struggle' | 'transformation' | 'mastery';
export type GrowthType = 'positive' | 'negative' | 'flat' | 'circular';
export type ArcShape = 'ascending' | 'descending' | 'U_shaped' | 'inverted_U' | 'W_shaped';

export interface CharacterGrowth {
  growthId: string;
  characterId: string;
  stage: DevelopmentStage;
  growthType: GrowthType;
  arcShape: ArcShape;
  startState: string;
  endState: string;
  progress: number;
}

export interface CharacterDevelopmentState {
  developments: Map<string, CharacterGrowth>;
  activeCharacters: Set<string>;
  totalGrowths: number;
  completedGrowths: number;
  averageProgress: number;
  arcComplexity: number;
  positiveGrowths: number;
  negativeGrowths: number;
}

// Factory
export function createCharacterDevelopmentState(): CharacterDevelopmentState {
  return {
    developments: new Map(),
    activeCharacters: new Set(),
    totalGrowths: 0,
    completedGrowths: 0,
    averageProgress: 0,
    arcComplexity: 0.5,
    positiveGrowths: 0,
    negativeGrowths: 0,
  };
}

// Start development
export function startDevelopment(
  state: CharacterDevelopmentState,
  growthId: string,
  characterId: string,
  growthType: GrowthType,
  arcShape: ArcShape,
  startState: string
): CharacterDevelopmentState {
  const growth: CharacterGrowth = {
    growthId,
    characterId,
    stage: 'introduction',
    growthType,
    arcShape,
    startState,
    endState: '',
    progress: 0,
  };

  const developments = new Map(state.developments).set(growthId, growth);
  const activeCharacters = new Set(state.activeCharacters).add(characterId);
  return recomputeDevelopment({ ...state, developments, activeCharacters, totalGrowths: state.totalGrowths + 1 });
}

// Advance development
export function advanceDevelopment(state: CharacterDevelopmentState, growthId: string, newStage: DevelopmentStage, progress: number, endState: string = ''): CharacterDevelopmentState {
  const growth = state.developments.get(growthId);
  if (!growth) return state;

  const updated: CharacterGrowth = {
    ...growth,
    stage: newStage,
    progress: Math.min(1, Math.max(0, progress)),
    endState: endState || growth.endState,
  };
  const developments = new Map(state.developments).set(growthId, updated);
  return recomputeDevelopment({ ...state, developments });
}

// Complete development
export function completeDevelopment(state: CharacterDevelopmentState, growthId: string, endState: string): CharacterDevelopmentState {
  const growth = state.developments.get(growthId);
  if (!growth) return state;

  const updated: CharacterGrowth = { ...growth, stage: 'mastery', progress: 1, endState };
  const developments = new Map(state.developments).set(growthId, updated);
  return recomputeDevelopment({ ...state, developments, completedGrowths: state.completedGrowths + 1 });
}

// Get development by character
export function getDevelopmentByCharacter(state: CharacterDevelopmentState, characterId: string): CharacterGrowth[] {
  return Array.from(state.developments.values()).filter(d => d.characterId === characterId);
}

// Get development by stage
export function getDevelopmentByStage(state: CharacterDevelopmentState, stage: DevelopmentStage): CharacterGrowth[] {
  return Array.from(state.developments.values()).filter(d => d.stage === stage);
}

// Get development by type
export function getDevelopmentByType(state: CharacterDevelopmentState, growthType: GrowthType): CharacterGrowth[] {
  return Array.from(state.developments.values()).filter(d => d.growthType === growthType);
}

// Get development report
export function getDevelopmentReport(state: CharacterDevelopmentState): {
  totalGrowths: number;
  completedGrowths: number;
  characterCount: number;
  averageProgress: number;
  arcComplexity: number;
  positiveGrowths: number;
  negativeGrowths: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGrowths === 0) recommendations.push('No character developments started');
  if (state.averageProgress < 0.3 && state.totalGrowths > 0) recommendations.push('Low progress — advance character arcs');
  if (state.positiveGrowths === 0 && state.totalGrowths > 0) recommendations.push('No positive growths — consider redemption arcs');
  if (state.arcComplexity < 0.4) recommendations.push('Low complexity — vary arc shapes');

  return {
    totalGrowths: state.totalGrowths,
    completedGrowths: state.completedGrowths,
    characterCount: state.activeCharacters.size,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    arcComplexity: Math.round(state.arcComplexity * 100) / 100,
    positiveGrowths: state.positiveGrowths,
    negativeGrowths: state.negativeGrowths,
    recommendations,
  };
}

// Recompute metrics
function recomputeDevelopment(state: CharacterDevelopmentState): CharacterDevelopmentState {
  const developments = Array.from(state.developments.values());

  const averageProgress = developments.length > 0
    ? developments.reduce((s, d) => s + d.progress, 0) / developments.length
    : 0;

  const positiveGrowths = developments.filter(d => d.growthType === 'positive').length;
  const negativeGrowths = developments.filter(d => d.growthType === 'negative').length;

  const arcShapes = new Set(developments.map(d => d.arcShape)).size;
  const arcComplexity = Math.min(1, arcShapes / 5);

  return { ...state, averageProgress, positiveGrowths, negativeGrowths, arcComplexity };
}

// Reset development state
export function resetCharacterDevelopmentState(): CharacterDevelopmentState {
  return createCharacterDevelopmentState();
}