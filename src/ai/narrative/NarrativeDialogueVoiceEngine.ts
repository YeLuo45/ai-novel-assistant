/**
 * V1152 NarrativeDialogueVoiceEngine — Direction F Iter 4/20 (Round 5)
 * Dialogue voice engine: distinct voice in dialogue
 * Sources: ruflo voice + chatdev + nanobot
 */

export type DialogueVoiceType = 'natural' | 'formal' | 'archaic' | 'street' | 'technical' | 'poetic';
export type DialogueVoiceDistinctiveness = 'generic' | 'slight' | 'clear' | 'strong' | 'unmistakable';
export type DialogueVoiceAuthenticity = 'stilted' | 'uneven' | 'natural' | 'authentic' | 'transcendent';

export interface DialogueVoice {
  voiceId: string;
  type: DialogueVoiceType;
  distinctiveness: DialogueVoiceDistinctiveness;
  authenticity: DialogueVoiceAuthenticity;
  description: string;
  clarity: number;
  ring: number;
  chapter: number;
}

export interface DialogueVoicePattern {
  patternId: string,
  voiceIds: string[],
  cumulativeClarity: number,
  diversity: number,
}

export interface NarrativeDialogueVoiceEngineState {
  voices: Map<string, DialogueVoice>;
  patterns: Map<string, DialogueVoicePattern>;
  totalVoices: number;
  totalPatterns: number;
  averageClarity: number;
  averageRing: number;
  patternDiversity: number;
  dialogueVoiceMastery: number;
}

// Factory
export function createNarrativeDialogueVoiceEngineState(): NarrativeDialogueVoiceEngineState {
  return {
    voices: new Map(),
    patterns: new Map(),
    totalVoices: 0,
    totalPatterns: 0,
    averageClarity: 0.5,
    averageRing: 0.5,
    patternDiversity: 0.5,
    dialogueVoiceMastery: 0.5,
  };
}

// Add voice
export function addDialogueVoice(
  state: NarrativeDialogueVoiceEngineState,
  voiceId: string,
  type: DialogueVoiceType,
  distinctiveness: DialogueVoiceDistinctiveness,
  authenticity: DialogueVoiceAuthenticity,
  description: string,
  clarity: number,
  ring: number,
  chapter: number
): NarrativeDialogueVoiceEngineState {
  const voice: DialogueVoice = { voiceId, type, distinctiveness, authenticity, description, clarity, ring, chapter };
  const voices = new Map(state.voices).set(voiceId, voice);
  return recomputeDialogueVoice({ ...state, voices, totalVoices: voices.size });
}

// Add pattern
export function addDialogueVoicePattern(
  state: NarrativeDialogueVoiceEngineState,
  patternId: string,
  voiceIds: string[]
): NarrativeDialogueVoiceEngineState {
  const voices = voiceIds.map(id => state.voices.get(id)).filter((v): v is DialogueVoice => v !== undefined);
  const cumulativeClarity = voices.length === 0 ? 0
    : voices.reduce((s, v) => s + v.clarity, 0) / voices.length;
  const typeSet = new Set(voices.map(v => v.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const pattern: DialogueVoicePattern = { patternId, voiceIds, cumulativeClarity, diversity };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeDialogueVoice({ ...state, patterns, totalPatterns: patterns.size });
}

// Get voices by type
export function getDialogueVoicesByType(state: NarrativeDialogueVoiceEngineState, type: DialogueVoiceType): DialogueVoice[] {
  return Array.from(state.voices.values()).filter(v => v.type === type);
}

// Get dialogue voice report
export function getDialogueVoiceReport(state: NarrativeDialogueVoiceEngineState): {
  totalVoices: number;
  totalPatterns: number;
  averageClarity: number;
  averageRing: number;
  dialogueVoiceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalVoices === 0) recommendations.push('No voices — add dialogue voices');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.dialogueVoiceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalVoices: state.totalVoices,
    totalPatterns: state.totalPatterns,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageRing: Math.round(state.averageRing * 100) / 100,
    dialogueVoiceMastery: Math.round(state.dialogueVoiceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDialogueVoice(state: NarrativeDialogueVoiceEngineState): NarrativeDialogueVoiceEngineState {
  const voices = Array.from(state.voices.values());
  const averageClarity = voices.length === 0 ? 0.5
    : voices.reduce((s, v) => s + v.clarity, 0) / voices.length;
  const averageRing = voices.length === 0 ? 0.5
    : voices.reduce((s, v) => s + v.ring, 0) / voices.length;

  const patterns = Array.from(state.patterns.values());
  const patternDiversity = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.diversity, 0) / patterns.length;

  const dialogueVoiceMastery = (averageClarity * 0.4 + averageRing * 0.3 + patternDiversity * 0.3);

  return { ...state, averageClarity, averageRing, patternDiversity, dialogueVoiceMastery };
}

// Reset
export function resetNarrativeDialogueVoiceEngineState(): NarrativeDialogueVoiceEngineState {
  return createNarrativeDialogueVoiceEngineState();
}