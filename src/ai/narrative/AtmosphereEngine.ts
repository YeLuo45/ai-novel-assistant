/**
 * V766 AtmosphereEngine — Direction B Iter 6/9 (Round 3)
 * Atmosphere engine: mood + setting + sensory details
 * Sources: nanobot atmosphere + chatdev mood + thunderbolt
 */

export type MoodType = 'cheerful' | 'dark' | 'tense' | 'peaceful' | 'mysterious' | 'romantic' | 'melancholy' | 'epic';
export type SensoryType = 'visual' | 'auditory' | 'olfactory' | 'tactile' | 'gustatory' | 'kinesthetic';
export type AtmosphereIntensity = 'subtle' | 'moderate' | 'strong' | 'overwhelming';

export interface SensoryDetail {
  detailId: string;
  type: SensoryType;
  description: string;
  chapter: number;
  weight: number;
}

export interface MoodBeat {
  beatId: string;
  mood: MoodType;
  intensity: AtmosphereIntensity;
  startChapter: number;
  endChapter: number;
  description: string;
  sensoryDetailIds: string[];
}

export interface AtmosphereEngineState {
  sensoryDetails: Map<string, SensoryDetail>;
  moodBeats: Map<string, MoodBeat>;
  totalSensoryDetails: number;
  totalMoodBeats: number;
  activeMoodBeats: number;
  sensoryBalance: number;
  moodConsistency: number;
  averageIntensity: number;
  dominantMood: MoodType | null;
}

// Factory
export function createAtmosphereEngineState(): AtmosphereEngineState {
  return {
    sensoryDetails: new Map(),
    moodBeats: new Map(),
    totalSensoryDetails: 0,
    totalMoodBeats: 0,
    activeMoodBeats: 0,
    sensoryBalance: 0.5,
    moodConsistency: 0.7,
    averageIntensity: 0.5,
    dominantMood: null,
  };
}

// Add sensory detail
export function addSensoryDetail(
  state: AtmosphereEngineState,
  detailId: string,
  type: SensoryType,
  description: string,
  chapter: number,
  weight: number = 0.5
): AtmosphereEngineState {
  const detail: SensoryDetail = { detailId, type, description, chapter, weight: Math.min(1, Math.max(0, weight)) };
  const sensoryDetails = new Map(state.sensoryDetails).set(detailId, detail);
  return recomputeAtmosphere({ ...state, sensoryDetails, totalSensoryDetails: sensoryDetails.size });
}

// Create mood beat
export function createMoodBeat(
  state: AtmosphereEngineState,
  beatId: string,
  mood: MoodType,
  startChapter: number,
  endChapter: number,
  description: string = '',
  intensity: AtmosphereIntensity = 'moderate'
): AtmosphereEngineState {
  const beat: MoodBeat = { beatId, mood, intensity, startChapter, endChapter, description, sensoryDetailIds: [] };
  const moodBeats = new Map(state.moodBeats).set(beatId, beat);
  return recomputeAtmosphere({ ...state, moodBeats, totalMoodBeats: moodBeats.size, activeMoodBeats: state.activeMoodBeats + 1 });
}

// Link sensory detail to mood beat
export function linkSensoryToBeat(state: AtmosphereEngineState, beatId: string, detailId: string): AtmosphereEngineState {
  const beat = state.moodBeats.get(beatId);
  if (!beat) return state;

  const updated: MoodBeat = { ...beat, sensoryDetailIds: [...beat.sensoryDetailIds, detailId] };
  const moodBeats = new Map(state.moodBeats).set(beatId, updated);
  return recomputeAtmosphere({ ...state, moodBeats });
}

// Get sensory details by type
export function getSensoryByType(state: AtmosphereEngineState, type: SensoryType): SensoryDetail[] {
  return Array.from(state.sensoryDetails.values()).filter(d => d.type === type);
}

// Get mood beats by mood
export function getMoodBeatsByMood(state: AtmosphereEngineState, mood: MoodType): MoodBeat[] {
  return Array.from(state.moodBeats.values()).filter(b => b.mood === mood);
}

// Get atmosphere report
export function getAtmosphereReport(state: AtmosphereEngineState): {
  totalSensoryDetails: number;
  totalMoodBeats: number;
  sensoryBalance: number;
  moodConsistency: number;
  averageIntensity: number;
  dominantMood: MoodType | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSensoryDetails < 5) recommendations.push('Few sensory details — add more');
  if (state.sensoryBalance < 0.5) recommendations.push('Imbalanced senses — diversify');
  if (state.moodConsistency < 0.5) recommendations.push('Inconsistent mood — align beats');

  return {
    totalSensoryDetails: state.totalSensoryDetails,
    totalMoodBeats: state.totalMoodBeats,
    sensoryBalance: Math.round(state.sensoryBalance * 100) / 100,
    moodConsistency: Math.round(state.moodConsistency * 100) / 100,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    dominantMood: state.dominantMood,
    recommendations,
  };
}

// Recompute metrics
function recomputeAtmosphere(state: AtmosphereEngineState): AtmosphereEngineState {
  const sensoryDetails = Array.from(state.sensoryDetails.values());
  const moodBeats = Array.from(state.moodBeats.values());

  const typeCounts = new Map<SensoryType, number>();
  sensoryDetails.forEach(d => typeCounts.set(d.type, (typeCounts.get(d.type) || 0) + 1));
  const sensoryBalance = typeCounts.size === 0 ? 0.5
    : Math.min(1, sensoryDetails.length / (typeCounts.size * 3));

  const intensityMap: Record<AtmosphereIntensity, number> = { subtle: 0.25, moderate: 0.5, strong: 0.75, overwhelming: 1.0 };
  const averageIntensity = moodBeats.length === 0 ? 0.5
    : moodBeats.reduce((s, b) => s + intensityMap[b.intensity], 0) / moodBeats.length;

  // Mood consistency: lower if mood changes too frequently
  const moodCount = new Set(moodBeats.map(b => b.mood)).size;
  const moodConsistency = moodBeats.length === 0 ? 0.7
    : Math.max(0.3, 1 - (moodCount - 1) / moodBeats.length);

  let dominantMood: MoodType | null = null;
  let maxCount = -1;
  const moodCounts = new Map<MoodType, number>();
  moodBeats.forEach(b => moodCounts.set(b.mood, (moodCounts.get(b.mood) || 0) + 1));
  moodCounts.forEach((count, m) => { if (count > maxCount) { maxCount = count; dominantMood = m; } });

  return { ...state, sensoryBalance, averageIntensity, moodConsistency, dominantMood };
}

// Reset atmosphere state
export function resetAtmosphereEngineState(): AtmosphereEngineState {
  return createAtmosphereEngineState();
}