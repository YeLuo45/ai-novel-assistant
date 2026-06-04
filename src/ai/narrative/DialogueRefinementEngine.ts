/**
 * V692 DialogueRefinementEngine — Direction B Iter 5/9 (Round 2)
 * Dialogue refinement engine: voice consistency + naturalness + clarity
 * Sources: chatdev role + thunderbolt quality + nanobot
 */

export type RefinementType = 'clarity' | 'naturalness' | 'characterization' | 'pacing' | 'subtext';
export type RefinementLevel = 'minor' | 'moderate' | 'major' | 'rewrite';

export interface DialogueRefinement {
  refinementId: string;
  originalText: string;
  refinedText: string;
  type: RefinementType;
  level: RefinementLevel;
  reason: string;
  qualityScore: number;
  characterId: string;
}

export interface DialogueVoice {
  voiceId: string;
  characterId: string;
  patterns: string[];
  avoidances: string[];
  vocabulary: string[];
  sentenceComplexity: number;
  formality: number;
}

export interface DialogueRefinementState {
  refinements: Map<string, DialogueRefinement>;
  voices: Map<string, DialogueVoice>;
  totalRefinements: number;
  averageQualityScore: number;
  characterVoices: number;
  refinementHistory: DialogueRefinement[];
}

// Factory
export function createDialogueRefinementState(): DialogueRefinementState {
  return {
    refinements: new Map(),
    voices: new Map(),
    totalRefinements: 0,
    averageQualityScore: 0.7,
    characterVoices: 0,
    refinementHistory: [],
  };
}

// Define voice
export function defineVoice(
  state: DialogueRefinementState,
  voiceId: string,
  characterId: string,
  patterns: string[] = [],
  avoidances: string[] = [],
  vocabulary: string[] = [],
  sentenceComplexity: number = 0.5,
  formality: number = 0.5
): DialogueRefinementState {
  const voice: DialogueVoice = { voiceId, characterId, patterns, avoidances, vocabulary, sentenceComplexity, formality };
  const voices = new Map(state.voices).set(voiceId, voice);
  return { ...state, voices, characterVoices: voices.size };
}

// Add refinement
export function addRefinement(
  state: DialogueRefinementState,
  refinementId: string,
  originalText: string,
  refinedText: string,
  type: RefinementType,
  level: RefinementLevel,
  reason: string,
  qualityScore: number,
  characterId: string
): DialogueRefinementState {
  const refinement: DialogueRefinement = {
    refinementId,
    originalText,
    refinedText,
    type,
    level,
    reason,
    qualityScore: Math.min(1, Math.max(0, qualityScore)),
    characterId,
  };
  const refinements = new Map(state.refinements).set(refinementId, refinement);
  const refinementHistory = [...state.refinementHistory, refinement];
  return recomputeRefinement({ ...state, refinements, refinementHistory, totalRefinements: refinements.size });
}

// Get refinements by type
export function getRefinementsByType(state: DialogueRefinementState, type: RefinementType): DialogueRefinement[] {
  return Array.from(state.refinements.values()).filter(r => r.type === type);
}

// Get refinements by character
export function getRefinementsByCharacter(state: DialogueRefinementState, characterId: string): DialogueRefinement[] {
  return Array.from(state.refinements.values()).filter(r => r.characterId === characterId);
}

// Get voice by character
export function getVoiceByCharacter(state: DialogueRefinementState, characterId: string): DialogueVoice | null {
  return Array.from(state.voices.values()).find(v => v.characterId === characterId) || null;
}

// Check voice consistency
export function checkVoiceConsistency(state: DialogueRefinementState, characterId: string, dialogueText: string): { consistent: boolean; issues: string[] } {
  const voice = getVoiceByCharacter(state, characterId);
  if (!voice) return { consistent: true, issues: [] };

  const issues: string[] = [];
  for (const avoidance of voice.avoidances) {
    if (dialogueText.toLowerCase().includes(avoidance.toLowerCase())) {
      issues.push(`Contains avoided word: ${avoidance}`);
    }
  }

  return { consistent: issues.length === 0, issues };
}

// Get refinement report
export function getRefinementReport(state: DialogueRefinementState): {
  totalRefinements: number;
  averageQualityScore: number;
  characterVoices: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRefinements === 0) recommendations.push('No refinements — review dialogue');
  if (state.averageQualityScore < 0.6) recommendations.push('Low quality — refine further');
  if (state.characterVoices < 2) recommendations.push('Define more character voices');

  return {
    totalRefinements: state.totalRefinements,
    averageQualityScore: Math.round(state.averageQualityScore * 100) / 100,
    characterVoices: state.characterVoices,
    recommendations,
  };
}

// Recompute metrics
function recomputeRefinement(state: DialogueRefinementState): DialogueRefinementState {
  const refinements = Array.from(state.refinements.values());
  const averageQualityScore = refinements.length > 0
    ? refinements.reduce((s, r) => s + r.qualityScore, 0) / refinements.length
    : 0.7;
  return { ...state, averageQualityScore };
}

// Reset refinement state
export function resetDialogueRefinementState(): DialogueRefinementState {
  return createDialogueRefinementState();
}