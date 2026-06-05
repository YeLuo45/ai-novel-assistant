/**
 * V800 TensionBalanceEngine — Direction D Iter 5/9 (Round 3)
 * Tension balance engine: tension equilibrium + pacing rhythm
 * Sources: thunderbolt tension + nanobot + chatdev
 */

export type TensionSource = 'plot' | 'character' | 'dialogue' | 'setting' | 'internal' | 'relational';
export type BalanceStatus = 'unbalanced' | 'low' | 'moderate' | 'optimal' | 'excessive';
export type TensionAction = 'increase' | 'decrease' | 'maintain' | 'redistribute';

export interface TensionPointData {
  tensionPointId: string;
  source: TensionSource;
  intensity: number;
  position: number;
  duration: number;
  effectiveness: number;
}

export interface TensionBalanceRecord {
  recordId: string;
  status: BalanceStatus;
  pointCount: number;
  averageIntensity: number;
  variance: number;
  recommendation: TensionAction;
  chapter: number;
  timestamp: number;
}

export interface TensionBalanceEngineState {
  points: Map<string, TensionPointData>;
  records: Map<string, TensionBalanceRecord>;
  totalPoints: number;
  totalRecords: number;
  currentStatus: BalanceStatus;
  averageIntensity: number;
  variance: number;
  balanceScore: number;
  recommendationRate: Map<TensionAction, number>;
}

// Factory
export function createTensionBalanceEngineState(): TensionBalanceEngineState {
  return {
    points: new Map(),
    records: new Map(),
    totalPoints: 0,
    totalRecords: 0,
    currentStatus: 'moderate',
    averageIntensity: 0.5,
    variance: 0,
    balanceScore: 0.5,
    recommendationRate: new Map(),
  };
}

// Add tension point
export function addTensionPoint(
  state: TensionBalanceEngineState,
  pointId: string,
  source: TensionSource,
  intensity: number,
  position: number,
  duration: number = 1
): TensionBalanceEngineState {
  const point: TensionPointData = {
    pointId, source,
    intensity: Math.min(1, Math.max(0, intensity)),
    position, duration,
    effectiveness: 0,
  };
  const points = new Map(state.points).set(pointId, point);
  return recomputeTensionBalance({ ...state, points, totalPoints: points.size });
}

// Update effectiveness
export function updateTensionEffectiveness(state: TensionBalanceEngineState, pointId: string, effectiveness: number): TensionBalanceEngineState {
  const point = state.points.get(pointId);
  if (!point) return state;

  const updated: TensionPointData = { ...point, effectiveness: Math.min(1, Math.max(0, effectiveness)) };
  const points = new Map(state.points).set(pointId, updated);
  return recomputeTensionBalance({ ...state, points });
}

// Record balance snapshot
export function recordBalanceSnapshot(
  state: TensionBalanceEngineState,
  recordId: string,
  chapter: number
): TensionBalanceEngineState {
  const points = Array.from(state.points.values());
  const pointCount = points.length;
  const averageIntensity = points.length === 0 ? 0.5
    : points.reduce((s, p) => s + p.intensity, 0) / points.length;
  const variance = points.length === 0 ? 0
    : points.reduce((s, p) => s + Math.pow(p.intensity - averageIntensity, 2), 0) / points.length;

  const status: BalanceStatus = averageIntensity < 0.2 ? 'low'
    : averageIntensity < 0.4 ? 'unbalanced'
    : averageIntensity < 0.6 ? 'moderate'
    : averageIntensity < 0.8 ? 'optimal'
    : 'excessive';

  const recommendation: TensionAction = status === 'low' || status === 'unbalanced' ? 'increase'
    : status === 'excessive' ? 'decrease'
    : variance > 0.1 ? 'redistribute' : 'maintain';

  const record: TensionBalanceRecord = { recordId, status, pointCount, averageIntensity, variance, recommendation, chapter, timestamp: Date.now() };
  const records = new Map(state.records).set(recordId, record);

  const recommendationRate = new Map(state.recommendationRate);
  recommendationRate.set(recommendation, (recommendationRate.get(recommendation) || 0) + 1);

  return recomputeTensionBalance({ ...state, records, recommendationRate, totalRecords: records.size, currentStatus: status });
}

// Get points by source
export function getPointsBySource(state: TensionBalanceEngineState, source: TensionSource): TensionPointData[] {
  return Array.from(state.points.values()).filter(p => p.source === source);
}

// Get tension balance report
export function getTensionBalanceReport(state: TensionBalanceEngineState): {
  totalPoints: number;
  totalRecords: number;
  currentStatus: BalanceStatus;
  averageIntensity: number;
  variance: number;
  balanceScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPoints === 0) recommendations.push('No tension points — add tension');
  if (state.balanceScore < 0.5) recommendations.push('Low balance — redistribute tension');
  if (state.variance > 0.15) recommendations.push('High variance — smooth tension');

  return {
    totalPoints: state.totalPoints,
    totalRecords: state.totalRecords,
    currentStatus: state.currentStatus,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    variance: Math.round(state.variance * 100) / 100,
    balanceScore: Math.round(state.balanceScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTensionBalance(state: TensionBalanceEngineState): TensionBalanceEngineState {
  const points = Array.from(state.points.values());
  const averageIntensity = points.length === 0 ? 0.5
    : points.reduce((s, p) => s + p.intensity, 0) / points.length;
  const variance = points.length === 0 ? 0
    : points.reduce((s, p) => s + Math.pow(p.intensity - averageIntensity, 2), 0) / points.length;

  // Balance score: 1 when intensity is around 0.7 with low variance
  const idealIntensity = 0.7;
  const intensityDelta = Math.abs(averageIntensity - idealIntensity);
  const balanceScore = Math.max(0, 1 - intensityDelta * 2 - variance * 5);

  return { ...state, averageIntensity, variance, balanceScore };
}

// Reset tension balance state
export function resetTensionBalanceEngineState(): TensionBalanceEngineState {
  return createTensionBalanceEngineState();
}