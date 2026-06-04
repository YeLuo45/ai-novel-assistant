/**
 * V696 NarrativeEmotionEngine — Direction B Iter 7/9 (Round 2)
 * Narrative emotion engine: emotion tracking + emotional arcs + catharsis
 * Sources: chatdev emotional + nanobot emotion + thunderbolt
 */

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'love' | 'hope' | 'despair';
export type EmotionIntensity = 'subtle' | 'moderate' | 'intense' | 'overwhelming';
export type CatharsisType = 'purging' | 'clarification' | 'transformation' | 'release';

export interface EmotionalBeat {
  beatId: string;
  position: number;
  primaryEmotion: EmotionType;
  intensity: EmotionIntensity;
  trigger: string;
  characterId: string;
  timestamp: number;
}

export interface EmotionalArc {
  arcId: string;
  characterId: string;
  beats: string[];
  startEmotion: EmotionType;
  endEmotion: EmotionType;
  catharsis: CatharsisType | null;
  catharsisPosition: number | null;
}

export interface NarrativeEmotionState {
  beats: Map<string, EmotionalBeat>;
  arcs: Map<string, EmotionalArc>;
  emotionCounts: Map<EmotionType, number>;
  totalBeats: number;
  totalArcs: number;
  emotionalRange: number;
  averageIntensity: number;
  catharsisCount: number;
}

// Factory
export function createNarrativeEmotionState(): NarrativeEmotionState {
  return {
    beats: new Map(),
    arcs: new Map(),
    emotionCounts: new Map(),
    totalBeats: 0,
    totalArcs: 0,
    emotionalRange: 0,
    averageIntensity: 0.5,
    catharsisCount: 0,
  };
}

// Add emotional beat
export function addEmotionalBeat(
  state: NarrativeEmotionState,
  beatId: string,
  position: number,
  primaryEmotion: EmotionType,
  intensity: EmotionIntensity,
  trigger: string,
  characterId: string,
  timestamp: number
): NarrativeEmotionState {
  const beat: EmotionalBeat = { beatId, position, primaryEmotion, intensity, trigger, characterId, timestamp };
  const beats = new Map(state.beats).set(beatId, beat);
  const emotionCounts = new Map(state.emotionCounts);
  emotionCounts.set(primaryEmotion, (emotionCounts.get(primaryEmotion) || 0) + 1);
  return recomputeEmotion({ ...state, beats, emotionCounts, totalBeats: state.totalBeats + 1 });
}

// Create emotional arc
export function createEmotionalArc(
  state: NarrativeEmotionState,
  arcId: string,
  characterId: string,
  startEmotion: EmotionType,
  endEmotion: EmotionType,
  beats: string[] = []
): NarrativeEmotionState {
  const arc: EmotionalArc = { arcId, characterId, beats, startEmotion, endEmotion, catharsis: null, catharsisPosition: null };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeEmotion({ ...state, arcs, totalArcs: state.totalArcs + 1 });
}

// Add catharsis
export function addCatharsis(state: NarrativeEmotionState, arcId: string, type: CatharsisType, position: number): NarrativeEmotionState {
  const arc = state.arcs.get(arcId);
  if (!arc) return state;

  const updated: EmotionalArc = { ...arc, catharsis: type, catharsisPosition: position };
  const arcs = new Map(state.arcs).set(arcId, updated);
  return recomputeEmotion({ ...state, arcs });
}

// Get beats by emotion
export function getBeatsByEmotion(state: NarrativeEmotionState, emotion: EmotionType): EmotionalBeat[] {
  return Array.from(state.beats.values()).filter(b => b.primaryEmotion === emotion);
}

// Get arcs by character
export function getArcsByCharacter(state: NarrativeEmotionState, characterId: string): EmotionalArc[] {
  return Array.from(state.arcs.values()).filter(a => a.characterId === characterId);
}

// Get emotional journey
export function getEmotionalJourney(state: NarrativeEmotionState, characterId: string): EmotionalBeat[] {
  return Array.from(state.beats.values())
    .filter(b => b.characterId === characterId)
    .sort((a, b) => a.position - b.position);
}

// Get emotion report
export function getEmotionReport(state: NarrativeEmotionState): {
  totalBeats: number;
  totalArcs: number;
  emotionalRange: number;
  averageIntensity: number;
  catharsisCount: number;
  emotionDistribution: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBeats === 0) recommendations.push('No emotional beats — add emotional content');
  if (state.emotionalRange < 0.3) recommendations.push('Limited emotional range — vary emotions');
  if (state.catharsisCount === 0 && state.totalArcs > 0) recommendations.push('No catharsis moments — add emotional release');

  const emotionDistribution: Record<string, number> = {};
  state.emotionCounts.forEach((count, emotion) => {
    emotionDistribution[emotion] = count;
  });

  return {
    totalBeats: state.totalBeats,
    totalArcs: state.totalArcs,
    emotionalRange: Math.round(state.emotionalRange * 100) / 100,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    catharsisCount: state.catharsisCount,
    emotionDistribution,
    recommendations,
  };
}

// Recompute metrics
function recomputeEmotion(state: NarrativeEmotionState): NarrativeEmotionState {
  const beats = Array.from(state.beats.values());
  const arcs = Array.from(state.arcs.values());

  const intensityMap: Record<EmotionIntensity, number> = {
    subtle: 0.25,
    moderate: 0.5,
    intense: 0.75,
    overwhelming: 1.0,
  };

  const averageIntensity = beats.length > 0
    ? beats.reduce((s, b) => s + intensityMap[b.intensity], 0) / beats.length
    : 0.5;

  const emotionalRange = Math.min(1, state.emotionCounts.size / 9);
  const catharsisCount = arcs.filter(a => a.catharsis !== null).length;

  return { ...state, averageIntensity, emotionalRange, catharsisCount };
}

// Reset emotion state
export function resetNarrativeEmotionState(): NarrativeEmotionState {
  return createNarrativeEmotionState();
}