/**
 * V1168 NarrativeToneEngine — Direction F Iter 12/20 (Round 5)
 * Tone engine: tone of narrative voice
 * Sources: ruflo tone + nanobot + thunderbolt
 */

export type ToneType = 'formal' | 'casual' | 'playful' | 'serious' | 'ironic' | 'wistful' | 'ominous' | 'hopeful';
export type ToneConsistency = 'inconsistent' | 'shifting' | 'mostly' | 'consistent' | 'unwavering';
export type ToneRange = 'narrow' | 'moderate' | 'wide' | 'expansive' | 'comprehensive';

export interface Tone {
  toneId: string;
  type: ToneType;
  consistency: ToneConsistency;
  range: ToneRange;
  description: string;
  clarity: number;
  resonance: number;
  chapter: number;
}

export interface TonePattern {
  patternId: string,
  toneIds: string[],
  cumulativeClarity: number,
  breadth: number,
}

export interface NarrativeToneEngineState {
  tones: Map<string, Tone>;
  patterns: Map<string, TonePattern>;
  totalTones: number;
  totalPatterns: number;
  averageClarity: number;
  averageResonance: number;
  patternBreadth: number;
  toneMastery: number;
}

// Factory
export function createNarrativeToneEngineState(): NarrativeToneEngineState {
  return {
    tones: new Map(),
    patterns: new Map(),
    totalTones: 0,
    totalPatterns: 0,
    averageClarity: 0.5,
    averageResonance: 0.5,
    patternBreadth: 0.5,
    toneMastery: 0.5,
  };
}

// Add tone
export function addTone(
  state: NarrativeToneEngineState,
  toneId: string,
  type: ToneType,
  consistency: ToneConsistency,
  range: ToneRange,
  description: string,
  clarity: number,
  resonance: number,
  chapter: number
): NarrativeToneEngineState {
  const tone: Tone = { toneId, type, consistency, range, description, clarity, resonance, chapter };
  const tones = new Map(state.tones).set(toneId, tone);
  return recomputeTone({ ...state, tones, totalTones: tones.size });
}

// Add pattern
export function addTonePattern(
  state: NarrativeToneEngineState,
  patternId: string,
  toneIds: string[]
): NarrativeToneEngineState {
  const tones = toneIds.map(id => state.tones.get(id)).filter((t): t is Tone => t !== undefined);
  const cumulativeClarity = tones.length === 0 ? 0
    : tones.reduce((s, t) => s + t.clarity, 0) / tones.length;
  const typeSet = new Set(tones.map(t => t.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const pattern: TonePattern = { patternId, toneIds, cumulativeClarity, breadth };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeTone({ ...state, patterns, totalPatterns: patterns.size });
}

// Get tones by type
export function getTonesByType(state: NarrativeToneEngineState, type: ToneType): Tone[] {
  return Array.from(state.tones.values()).filter(t => t.type === type);
}

// Get tone report
export function getToneReport(state: NarrativeToneEngineState): {
  totalTones: number;
  totalPatterns: number;
  averageClarity: number;
  averageResonance: number;
  toneMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTones === 0) recommendations.push('No tones — add tones');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.toneMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTones: state.totalTones,
    totalPatterns: state.totalPatterns,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    toneMastery: Math.round(state.toneMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTone(state: NarrativeToneEngineState): NarrativeToneEngineState {
  const tones = Array.from(state.tones.values());
  const averageClarity = tones.length === 0 ? 0.5
    : tones.reduce((s, t) => s + t.clarity, 0) / tones.length;
  const averageResonance = tones.length === 0 ? 0.5
    : tones.reduce((s, t) => s + t.resonance, 0) / tones.length;

  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;

  const toneMastery = (averageClarity * 0.4 + averageResonance * 0.3 + patternBreadth * 0.3);

  return { ...state, averageClarity, averageResonance, patternBreadth, toneMastery };
}

// Reset
export function resetNarrativeToneEngineState(): NarrativeToneEngineState {
  return createNarrativeToneEngineState();
}