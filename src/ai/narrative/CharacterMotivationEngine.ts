/**
 * V850 CharacterMotivationEngine — Direction B Iter 3/15 (Round 4)
 * Character motivation engine: motivation + drives + inner conflict
 * Sources: chatdev character + thunderbolt + nanobot
 */

export type MotivationType = 'need' | 'want' | 'fear' | 'belief' | 'value' | 'wound';
export type MotivationStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'overwhelming';
export type MotivationStatus = 'latent' | 'active' | 'conflicted' | 'resolved' | 'transformed';

export interface Motivation {
  motivationId: string;
  characterId: string;
  type: MotivationType;
  strength: MotivationStrength;
  status: MotivationStatus;
  description: string;
  target: string;
  intensity: number;
  obstacles: string[];
  chapter: number;
}

export interface MotivationConflict {
  conflictId: string;
  motivation1Id: string;
  motivation2Id: string;
  tension: number;
  resolution: string;
  resolved: boolean;
}

export interface CharacterMotivationEngineState {
  motivations: Map<string, Motivation>;
  conflicts: Map<string, MotivationConflict>;
  totalMotivations: number;
  totalConflicts: number;
  activeMotivations: number;
  resolvedConflicts: number;
  averageIntensity: number;
  conflictTension: number;
  motivationDepth: number;
  characterDrive: number;
}

// Factory
export function createCharacterMotivationEngineState(): CharacterMotivationEngineState {
  return {
    motivations: new Map(),
    conflicts: new Map(),
    totalMotivations: 0,
    totalConflicts: 0,
    activeMotivations: 0,
    resolvedConflicts: 0,
    averageIntensity: 0.5,
    conflictTension: 0,
    motivationDepth: 0.5,
    characterDrive: 0.5,
  };
}

// Add motivation
export function addMotivation(
  state: CharacterMotivationEngineState,
  motivationId: string,
  characterId: string,
  type: MotivationType,
  description: string,
  target: string,
  chapter: number,
  strength: MotivationStrength = 'moderate',
  intensity: number = 0.5
): CharacterMotivationEngineState {
  const motivation: Motivation = {
    motivationId, characterId, type, strength, status: 'latent',
    description, target,
    intensity: Math.min(1, Math.max(0, intensity)),
    obstacles: [], chapter,
  };
  const motivations = new Map(state.motivations).set(motivationId, motivation);
  return recomputeMotivation({ ...state, motivations, totalMotivations: motivations.size });
}

// Activate motivation
export function activateMotivation(state: CharacterMotivationEngineState, motivationId: string): CharacterMotivationEngineState {
  const motivation = state.motivations.get(motivationId);
  if (!motivation) return state;

  const updated: Motivation = { ...motivation, status: 'active' };
  const motivations = new Map(state.motivations).set(motivationId, updated);
  const activeMotivations = motivation.status === 'active' ? state.activeMotivations : state.activeMotivations + 1;
  return recomputeMotivation({ ...state, motivations, activeMotivations });
}

// Create conflict
export function createMotivationConflict(
  state: CharacterMotivationEngineState,
  conflictId: string,
  motivation1Id: string,
  motivation2Id: string,
  tension: number,
  resolution: string = ''
): CharacterMotivationEngineState {
  const conflict: MotivationConflict = { conflictId, motivation1Id, motivation2Id, tension, resolution, resolved: false };
  const conflicts = new Map(state.conflicts).set(conflictId, conflict);
  return recomputeMotivation({ ...state, conflicts, totalConflicts: conflicts.size });
}

// Resolve conflict
export function resolveMotivationConflict(state: CharacterMotivationEngineState, conflictId: string, resolution: string): CharacterMotivationEngineState {
  const conflict = state.conflicts.get(conflictId);
  if (!conflict) return state;

  const updated: MotivationConflict = { ...conflict, resolution, resolved: true };
  const conflicts = new Map(state.conflicts).set(conflictId, updated);
  const resolvedConflicts = state.resolvedConflicts + 1;
  return recomputeMotivation({ ...state, conflicts, resolvedConflicts });
}

// Get motivations by character
export function getMotivationsByCharacter(state: CharacterMotivationEngineState, characterId: string): Motivation[] {
  return Array.from(state.motivations.values()).filter(m => m.characterId === characterId);
}

// Get motivation report
export function getMotivationReport(state: CharacterMotivationEngineState): {
  totalMotivations: number;
  totalConflicts: number;
  activeMotivations: number;
  averageIntensity: number;
  conflictTension: number;
  characterDrive: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMotivations === 0) recommendations.push('No motivations — add them');
  if (state.averageIntensity < 0.5) recommendations.push('Low intensity — strengthen');
  if (state.conflictTension < 0.3) recommendations.push('Low tension — add conflicts');

  return {
    totalMotivations: state.totalMotivations,
    totalConflicts: state.totalConflicts,
    activeMotivations: state.activeMotivations,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    conflictTension: Math.round(state.conflictTension * 100) / 100,
    characterDrive: Math.round(state.characterDrive * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMotivation(state: CharacterMotivationEngineState): CharacterMotivationEngineState {
  const motivations = Array.from(state.motivations.values());
  const averageIntensity = motivations.length === 0 ? 0.5
    : motivations.reduce((s, m) => s + m.intensity, 0) / motivations.length;

  const conflicts = Array.from(state.conflicts.values());
  const conflictTension = conflicts.length === 0 ? 0
    : conflicts.reduce((s, c) => s + c.tension, 0) / conflicts.length;

  const typeSet = new Set(motivations.map(m => m.type));
  const motivationDepth = Math.min(1, typeSet.size / 6);
  const characterDrive = (averageIntensity * 0.5 + Math.min(0.5, conflictTension) + motivationDepth * 0.3);

  return { ...state, averageIntensity, conflictTension, motivationDepth, characterDrive };
}

// Reset motivation state
export function resetCharacterMotivationEngineState(): CharacterMotivationEngineState {
  return createCharacterMotivationEngineState();
}