/**
 * V760 CharacterPsychologyEngine — Direction B Iter 3/9 (Round 3)
 * Character psychology engine: personality + traits + psychological depth
 * Sources: chatdev role + ruflo hierarchical + nanobot
 */

export type PersonalityTrait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism' | 'creativity' | 'courage' | 'compassion';
export type DefenseMechanism = 'denial' | 'projection' | 'sublimation' | 'rationalization' | 'displacement' | 'regression' | 'humor';
export type PsychologicalState = 'stable' | 'stressed' | 'conflicted' | 'transforming' | 'broken' | 'integrated';

export interface CharacterPersonality {
  characterId: string;
  name: string;
  traits: Map<PersonalityTrait, number>;
  defenses: Map<DefenseMechanism, number>;
  state: PsychologicalState;
  shadow: string[];
  values: string[];
  wounds: string[];
  growthAreas: string[];
  depthScore: number;
}

export interface PsychologyInsight {
  insightId: string;
  characterId: string;
  description: string;
  category: 'motivation' | 'fear' | 'desire' | 'conflict' | 'growth';
  impact: number;
  timestamp: number;
}

export interface CharacterPsychologyEngineState {
  characters: Map<string, CharacterPersonality>;
  insights: Map<string, PsychologyInsight>;
  totalCharacters: number;
  totalInsights: number;
  averageDepth: number;
  traitCoverage: number;
  dominantTrait: PersonalityTrait | null;
  psychologicalHealth: number;
}

// Factory
export function createCharacterPsychologyEngineState(): CharacterPsychologyEngineState {
  return {
    characters: new Map(),
    insights: new Map(),
    totalCharacters: 0,
    totalInsights: 0,
    averageDepth: 0,
    traitCoverage: 0,
    dominantTrait: null,
    psychologicalHealth: 0.7,
  };
}

// Create character
export function createPsychologyCharacter(
  state: CharacterPsychologyEngineState,
  characterId: string,
  name: string,
  traits: Partial<Record<PersonalityTrait, number>> = {},
  values: string[] = []
): CharacterPsychologyEngineState {
  const fullTraits = new Map<PersonalityTrait, number>();
  const allTraits: PersonalityTrait[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism', 'creativity', 'courage', 'compassion'];
  allTraits.forEach(t => fullTraits.set(t, traits[t] ?? 0.5));

  const character: CharacterPersonality = {
    characterId,
    name,
    traits: fullTraits,
    defenses: new Map(),
    state: 'stable',
    shadow: [],
    values,
    wounds: [],
    growthAreas: [],
    depthScore: 0.5,
  };
  const characters = new Map(state.characters).set(characterId, character);
  return recomputePsychology({ ...state, characters, totalCharacters: characters.size });
}

// Add defense mechanism
export function addDefenseMechanism(state: CharacterPsychologyEngineState, characterId: string, defense: DefenseMechanism, strength: number = 0.5): CharacterPsychologyEngineState {
  const character = state.characters.get(characterId);
  if (!character) return state;

  const defenses = new Map(character.defenses).set(defense, Math.min(1, Math.max(0, strength)));
  const updated: CharacterPersonality = { ...character, defenses };
  const characters = new Map(state.characters).set(characterId, updated);
  return recomputePsychology({ ...state, characters });
}

// Add shadow/wound
export function addPsychologicalElement(
  state: CharacterPsychologyEngineState,
  characterId: string,
  element: 'shadow' | 'wounds' | 'growthAreas',
  value: string
): CharacterPsychologyEngineState {
  const character = state.characters.get(characterId);
  if (!character) return state;

  const updated: CharacterPersonality = { ...character, [element]: [...character[element], value] };
  const characters = new Map(state.characters).set(characterId, updated);
  return recomputePsychology({ ...state, characters });
}

// Add insight
export function addPsychologyInsight(
  state: CharacterPsychologyEngineState,
  insightId: string,
  characterId: string,
  description: string,
  category: PsychologyInsight['category'],
  impact: number = 0.5
): CharacterPsychologyEngineState {
  const insight: PsychologyInsight = { insightId, characterId, description, category, impact, timestamp: Date.now() };
  const insights = new Map(state.insights).set(insightId, insight);
  return recomputePsychology({ ...state, insights, totalInsights: insights.size });
}

// Update state
export function updatePsychologicalState(state: CharacterPsychologyEngineState, characterId: string, newState: PsychologicalState): CharacterPsychologyEngineState {
  const character = state.characters.get(characterId);
  if (!character) return state;

  const updated: CharacterPersonality = { ...character, state: newState };
  const characters = new Map(state.characters).set(characterId, updated);
  return recomputePsychology({ ...state, characters });
}

// Get insights by category
export function getInsightsByCategory(state: CharacterPsychologyEngineState, category: PsychologyInsight['category']): PsychologyInsight[] {
  return Array.from(state.insights.values()).filter(i => i.category === category);
}

// Get psychology report
export function getPsychologyReport(state: CharacterPsychologyEngineState): {
  totalCharacters: number;
  totalInsights: number;
  averageDepth: number;
  traitCoverage: number;
  psychologicalHealth: number;
  dominantTrait: PersonalityTrait | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCharacters === 0) recommendations.push('No characters — create characters');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — add psychological layers');
  if (state.psychologicalHealth < 0.5) recommendations.push('Low health — address wounds');

  return {
    totalCharacters: state.totalCharacters,
    totalInsights: state.totalInsights,
    averageDepth: Math.round(state.averageDepth * 100) / 100,
    traitCoverage: Math.round(state.traitCoverage * 100) / 100,
    psychologicalHealth: Math.round(state.psychologicalHealth * 100) / 100,
    dominantTrait: state.dominantTrait,
    recommendations,
  };
}

// Recompute metrics
function recomputePsychology(state: CharacterPsychologyEngineState): CharacterPsychologyEngineState {
  const characters = Array.from(state.characters.values());
  const totalDepthScore = characters.reduce((s, c) => {
    const traitVariance = Array.from(c.traits.values()).reduce((v, t) => v + Math.abs(t - 0.5), 0) / 8;
    const defenseScore = c.defenses.size * 0.1;
    const woundScore = c.wounds.length * 0.1;
    const shadowScore = c.shadow.length * 0.1;
    const growthScore = c.growthAreas.length * 0.1;
    const depth = Math.min(1, 0.3 + traitVariance * 0.3 + defenseScore + woundScore + shadowScore + growthScore);
    c.depthScore = depth;
    return s + depth;
  }, 0);
  const averageDepth = characters.length === 0 ? 0 : totalDepthScore / characters.length;

  const stateMap: Record<PsychologicalState, number> = { stable: 0.9, stressed: 0.7, conflicted: 0.5, transforming: 0.6, broken: 0.2, integrated: 1.0 };
  const psychologicalHealth = characters.length === 0 ? 0.7
    : characters.reduce((s, c) => s + stateMap[c.state], 0) / characters.length;

  const traitCounts = new Map<PersonalityTrait, number>();
  characters.forEach(c => c.traits.forEach((v, t) => {
    if (v > 0.7) traitCounts.set(t, (traitCounts.get(t) || 0) + 1);
  }));
  let dominantTrait: PersonalityTrait | null = null;
  let maxCount = -1;
  traitCounts.forEach((count, t) => { if (count > maxCount) { maxCount = count; dominantTrait = t; } });

  const traitCoverage = state.totalCharacters === 0 ? 0 : Math.min(1, state.totalInsights / (state.totalCharacters * 3));

  return { ...state, averageDepth, traitCoverage, psychologicalHealth, dominantTrait };
}

// Reset psychology state
export function resetCharacterPsychologyEngineState(): CharacterPsychologyEngineState {
  return createCharacterPsychologyEngineState();
}