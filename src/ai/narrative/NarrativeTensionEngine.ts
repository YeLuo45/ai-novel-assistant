/**
 * V762 NarrativeTensionEngine — Direction B Iter 4/9 (Round 3)
 * Narrative tension engine: tension building + release + pacing
 * Sources: thunderbolt tension + chatdev conflict + nanobot
 */

export type TensionType = 'suspense' | 'mystery' | 'dramatic_irony' | 'anticipation' | 'conflict' | 'emotional';
export type TensionLevel = 'subtle' | 'building' | 'high' | 'climactic' | 'explosive' | 'resolved';
export type TensionSource = 'plot' | 'character' | 'setting' | 'internal' | 'external' | 'relational';

export interface TensionPoint {
  tensionId: string;
  type: TensionType;
  source: TensionSource;
  level: TensionLevel;
  intensity: number;
  startChapter: number;
  peakChapter: number;
  releaseChapter: number;
  status: 'building' | 'peaked' | 'releasing' | 'resolved';
}

export interface TensionCurve {
  chapter: number;
  totalIntensity: number;
  dominantType: TensionType | null;
}

export interface NarrativeTensionEngineState {
  tensions: Map<string, TensionPoint>;
  tensionHistory: TensionCurve[];
  totalTensions: number;
  activeTensions: number;
  averageIntensity: number;
  tensionDensity: number;
  peakIntensity: number;
  releaseRatio: number;
}

// Factory
export function createNarrativeTensionEngineState(): NarrativeTensionEngineState {
  return {
    tensions: new Map(),
    tensionHistory: [],
    totalTensions: 0,
    activeTensions: 0,
    averageIntensity: 0,
    tensionDensity: 0,
    peakIntensity: 0,
    releaseRatio: 0,
  };
}

// Create tension
export function createTension(
  state: NarrativeTensionEngineState,
  tensionId: string,
  type: TensionType,
  source: TensionSource,
  startChapter: number,
  peakChapter: number,
  releaseChapter: number,
  peakIntensity: number = 0.7
): NarrativeTensionEngineState {
  const tension: TensionPoint = {
    tensionId,
    type,
    source,
    level: 'building',
    intensity: 0.1,
    startChapter,
    peakChapter,
    releaseChapter,
    status: 'building',
  };
  const tensions = new Map(state.tensions).set(tensionId, tension);
  return recomputeTension({ ...state, tensions, totalTensions: tensions.size, activeTensions: state.activeTensions + 1, peakIntensity: Math.max(state.peakIntensity, peakIntensity) });
}

// Advance tension
export function advanceTension(state: NarrativeTensionEngineState, tensionId: string, chapter: number): NarrativeTensionEngineState {
  const tension = state.tensions.get(tensionId);
  if (!tension) return state;

  let intensity: number;
  let status: TensionPoint['status'];
  let level: TensionLevel;

  if (chapter <= tension.peakChapter) {
    const progress = (chapter - tension.startChapter) / Math.max(1, tension.peakChapter - tension.startChapter);
    intensity = Math.min(1, 0.1 + progress * 0.9);
    status = 'building';
    level = intensity > 0.7 ? 'climactic' : intensity > 0.4 ? 'high' : 'building';
  } else if (chapter <= tension.releaseChapter) {
    intensity = 0.9;
    status = 'peaked';
    level = 'climactic';
  } else {
    const progress = (chapter - tension.releaseChapter) / 5;
    intensity = Math.max(0, 0.9 - progress);
    status = intensity === 0 ? 'resolved' : 'releasing';
    level = 'resolved';
  }

  const updated: TensionPoint = { ...tension, intensity, status, level };
  const tensions = new Map(state.tensions).set(tensionId, updated);

  // Record curve point
  const newTensionHistory = [
    ...state.tensionHistory,
    { chapter, totalIntensity: intensity, dominantType: tension.type },
  ];

  return recomputeTension({ ...state, tensions, tensionHistory: newTensionHistory });
}

// Get tensions by type
export function getTensionsByType(state: NarrativeTensionEngineState, type: TensionType): TensionPoint[] {
  return Array.from(state.tensions.values()).filter(t => t.type === type);
}

// Get tensions by level
export function getTensionsByLevel(state: NarrativeTensionEngineState, level: TensionLevel): TensionPoint[] {
  return Array.from(state.tensions.values()).filter(t => t.level === level);
}

// Get tension report
export function getTensionReport(state: NarrativeTensionEngineState): {
  totalTensions: number;
  activeTensions: number;
  averageIntensity: number;
  tensionDensity: number;
  peakIntensity: number;
  releaseRatio: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTensions === 0) recommendations.push('No tensions — create tensions');
  if (state.averageIntensity < 0.3) recommendations.push('Low intensity — increase tension');
  if (state.releaseRatio < 0.3) recommendations.push('Few releases — balance tension');

  return {
    totalTensions: state.totalTensions,
    activeTensions: state.activeTensions,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    tensionDensity: Math.round(state.tensionDensity * 100) / 100,
    peakIntensity: Math.round(state.peakIntensity * 100) / 100,
    releaseRatio: Math.round(state.releaseRatio * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTension(state: NarrativeTensionEngineState): NarrativeTensionEngineState {
  const tensions = Array.from(state.tensions.values());
  const active = tensions.filter(t => t.status !== 'resolved');
  const averageIntensity = tensions.length > 0
    ? tensions.reduce((s, t) => s + t.intensity, 0) / tensions.length
    : 0;
  const tensionDensity = state.totalTensions === 0 ? 0 : Math.min(1, active.length / state.totalTensions);
  const resolved = tensions.filter(t => t.status === 'resolved').length;
  const releaseRatio = state.totalTensions === 0 ? 0 : resolved / state.totalTensions;

  return { ...state, activeTensions: active.length, averageIntensity, tensionDensity, releaseRatio };
}

// Reset tension state
export function resetNarrativeTensionEngineState(): NarrativeTensionEngineState {
  return createNarrativeTensionEngineState();
}