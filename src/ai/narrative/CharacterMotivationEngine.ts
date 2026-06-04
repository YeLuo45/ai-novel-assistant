/**
 * V670 CharacterMotivationEngine — Direction C Iter 3/9 (Round 2)
 * Character motivation engine: goal + need + desire + fear tracking
 * Sources: chatdev role + ruflo hierarchical + nanobot
 */

export type MotivationType = 'goal' | 'need' | 'desire' | 'fear' | 'wound';
export type MotivationState = 'latent' | 'active' | 'conflicted' | 'resolved' | 'abandoned';
export type MotivationStrength = 'weak' | 'moderate' | 'strong' | 'overwhelming';

export interface Motivation {
  motivationId: string;
  type: MotivationType;
  description: string;
  state: MotivationState;
  strength: MotivationStrength;
  priority: number;
  characterId: string;
  triggeredBy: string[];
  resolvedBy: string[];
}

export interface CharacterMotivationState {
  motivations: Map<string, Motivation>;
  characters: Set<string>;
  totalMotivations: number;
  activeMotivations: number;
  motivationComplexity: number;
  averageStrength: number;
  conflicts: number;
}

// Factory
export function createCharacterMotivationState(): CharacterMotivationState {
  return {
    motivations: new Map(),
    characters: new Set(),
    totalMotivations: 0,
    activeMotivations: 0,
    motivationComplexity: 0,
    averageStrength: 0.5,
    conflicts: 0,
  };
}

// Add motivation
export function addMotivation(
  state: CharacterMotivationState,
  motivationId: string,
  characterId: string,
  type: MotivationType,
  description: string,
  strength: MotivationStrength = 'moderate',
  priority: number = 1
): CharacterMotivationState {
  const motivation: Motivation = {
    motivationId,
    type,
    description,
    state: 'latent',
    strength,
    priority,
    characterId,
    triggeredBy: [],
    resolvedBy: [],
  };

  const motivations = new Map(state.motivations).set(motivationId, motivation);
  const characters = new Set(state.characters).add(characterId);
  return recomputeMotivationMetrics({ ...state, motivations, characters, totalMotivations: state.totalMotivations + 1 });
}

// Activate motivation
export function activateMotivation(state: CharacterMotivationState, motivationId: string, trigger: string): CharacterMotivationState {
  const motivation = state.motivations.get(motivationId);
  if (!motivation) return state;

  const updated: Motivation = {
    ...motivation,
    state: 'active',
    triggeredBy: [...motivation.triggeredBy, trigger],
  };
  const motivations = new Map(state.motivations).set(motivationId, updated);
  return recomputeMotivationMetrics({ ...state, motivations });
}

// Set motivation state
export function setMotivationState(state: CharacterMotivationState, motivationId: string, newState: MotivationState, resolution: string = ''): CharacterMotivationState {
  const motivation = state.motivations.get(motivationId);
  if (!motivation) return state;

  const updated: Motivation = {
    ...motivation,
    state: newState,
    resolvedBy: newState === 'resolved' ? [...motivation.resolvedBy, resolution] : motivation.resolvedBy,
  };
  const motivations = new Map(state.motivations).set(motivationId, updated);
  return recomputeMotivationMetrics({ ...state, motivations });
}

// Detect motivation conflicts
export function detectMotivationConflicts(state: CharacterMotivationState): number {
  let conflicts = 0;
  const motivations = Array.from(state.motivations.values());

  for (let i = 0; i < motivations.length; i++) {
    for (let j = i + 1; j < motivations.length; j++) {
      const m1 = motivations[i];
      const m2 = motivations[j];
      if (m1 && m2 && m1.characterId === m2.characterId) {
        if ((m1.type === 'goal' && m2.type === 'fear') || (m1.type === 'desire' && m2.type === 'wound')) {
          if (m1.state === 'active' && m2.state === 'active') conflicts++;
        }
      }
    }
  }
  return conflicts;
}

// Get motivations for character
export function getCharacterMotivations(state: CharacterMotivationState, characterId: string): Motivation[] {
  return Array.from(state.motivations.values()).filter(m => m.characterId === characterId);
}

// Get strongest motivation
export function getStrongestMotivation(state: CharacterMotivationState): Motivation | null {
  const strengthMap: Record<MotivationStrength, number> = {
    weak: 0.25,
    moderate: 0.5,
    strong: 0.75,
    overwhelming: 1.0,
  };

  let strongest: Motivation | null = null;
  let maxScore = -1;

  state.motivations.forEach(motivation => {
    const score = strengthMap[motivation.strength] * motivation.priority;
    if (score > maxScore) {
      maxScore = score;
      strongest = motivation;
    }
  });

  return strongest;
}

// Get motivation report
export function getMotivationReport(state: CharacterMotivationState): {
  totalMotivations: number;
  activeMotivations: number;
  characterCount: number;
  motivationComplexity: number;
  conflicts: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.activeMotivations === 0) recommendations.push('No active motivations — activate some');
  if (state.conflicts > 0) recommendations.push('Internal conflicts detected — explore character depth');
  if (state.motivationComplexity < 0.3) recommendations.push('Low complexity — add layered motivations');
  if (state.characters.size > 0 && state.activeMotivations / state.characters.size < 1) {
    recommendations.push('Some characters lack active motivations');
  }

  return {
    totalMotivations: state.totalMotivations,
    activeMotivations: state.activeMotivations,
    characterCount: state.characters.size,
    motivationComplexity: Math.round(state.motivationComplexity * 100) / 100,
    conflicts: state.conflicts,
    recommendations,
  };
}

// Recompute metrics
function recomputeMotivationMetrics(state: CharacterMotivationState): CharacterMotivationState {
  const motivations = Array.from(state.motivations.values());
  const activeMotivations = motivations.filter(m => m.state === 'active' || m.state === 'conflicted').length;

  const strengthMap: Record<MotivationStrength, number> = {
    weak: 0.25,
    moderate: 0.5,
    strong: 0.75,
    overwhelming: 1.0,
  };

  const averageStrength = motivations.length > 0
    ? motivations.reduce((s, m) => s + strengthMap[m.strength], 0) / motivations.length
    : 0.5;

  const motivationComplexity = Math.min(1, motivations.length / 10);
  const conflicts = detectMotivationConflicts({ ...state, motivations: new Map(motivations.map(m => [m.motivationId, m] as [string, Motivation])) });

  return { ...state, activeMotivations, averageStrength, motivationComplexity, conflicts };
}

// Reset motivation state
export function resetCharacterMotivationState(): CharacterMotivationState {
  return createCharacterMotivationState();
}