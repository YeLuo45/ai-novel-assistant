/**
 * V752 ContextAwarenessEngine — Direction A Iter 8/9 (Round 3)
 * Context awareness engine: situational awareness + context understanding
 * Sources: nanobot awareness + chatdev context + thunderbolt
 */

export type AwarenessLevel = 'minimal' | 'basic' | 'moderate' | 'full' | 'omniscient';
export type AwarenessType = 'self' | 'environment' | 'others' | 'task' | 'meta';
export type ContextSignal = 'explicit' | 'implicit' | 'inferred' | 'predicted';

export interface ContextSignalData {
  signalId: string;
  type: AwarenessType;
  signal: ContextSignal;
  content: string;
  strength: number;
  reliability: number;
  timestamp: number;
}

export interface AwarenessSnapshot {
  snapshotId: string;
  level: AwarenessLevel;
  signals: string[];
  totalSignals: number;
  coherence: number;
  timestamp: number;
  scope: string;
}

export interface ContextAwarenessEngineState {
  signals: Map<string, ContextSignalData>;
  snapshots: Map<string, AwarenessSnapshot>;
  currentLevel: AwarenessLevel;
  totalSignals: number;
  totalSnapshots: number;
  averageReliability: number;
  averageCoherence: number;
  awarenessScore: number;
  dominantType: AwarenessType | null;
}

// Factory
export function createContextAwarenessEngineState(): ContextAwarenessEngineState {
  return {
    signals: new Map(),
    snapshots: new Map(),
    currentLevel: 'moderate',
    totalSignals: 0,
    totalSnapshots: 0,
    averageReliability: 0.7,
    averageCoherence: 0.5,
    awarenessScore: 0.6,
    dominantType: null,
  };
}

// Capture signal
export function captureAwarenessSignal(
  state: ContextAwarenessEngineState,
  signalId: string,
  type: AwarenessType,
  signal: ContextSignal,
  content: string,
  strength: number = 0.5,
  reliability: number = 0.7
): ContextAwarenessEngineState {
  const signalData: ContextSignalData = {
    signalId,
    type,
    signal,
    content,
    strength: Math.min(1, Math.max(0, strength)),
    reliability: Math.min(1, Math.max(0, reliability)),
    timestamp: Date.now(),
  };
  const signals = new Map(state.signals).set(signalId, signalData);
  return recomputeAwareness({ ...state, signals, totalSignals: signals.size });
}

// Create snapshot
export function createAwarenessSnapshot(
  state: ContextAwarenessEngineState,
  snapshotId: string,
  level: AwarenessLevel,
  scope: string,
  signalIds: string[] = []
): ContextAwarenessEngineState {
  const validSignals = signalIds.filter(id => state.signals.has(id));
  const totalSignals = validSignals.length;

  let coherence = 0.5;
  if (validSignals.length > 0) {
    const signals = validSignals.map(id => state.signals.get(id)!);
    const avgReliability = signals.reduce((s, sig) => s + sig.reliability, 0) / signals.length;
    const avgStrength = signals.reduce((s, sig) => s + sig.strength, 0) / signals.length;
    coherence = (avgReliability + avgStrength) / 2;
  }

  const snapshot: AwarenessSnapshot = { snapshotId, level, signals: validSignals, totalSignals, coherence, timestamp: Date.now(), scope };
  const snapshots = new Map(state.snapshots).set(snapshotId, snapshot);
  return recomputeAwareness({ ...state, snapshots, totalSnapshots: snapshots.size });
}

// Set awareness level
export function setAwarenessLevel(state: ContextAwarenessEngineState, level: AwarenessLevel): ContextAwarenessEngineState {
  return { ...state, currentLevel: level };
}

// Get signals by type
export function getSignalsByType(state: ContextAwarenessEngineState, type: AwarenessType): ContextSignalData[] {
  return Array.from(state.signals.values()).filter(s => s.type === type);
}

// Get signals by signal type
export function getSignalsBySignalType(state: ContextAwarenessEngineState, signal: ContextSignal): ContextSignalData[] {
  return Array.from(state.signals.values()).filter(s => s.signal === signal);
}

// Get snapshot
export function getSnapshot(state: ContextAwarenessEngineState, snapshotId: string): AwarenessSnapshot | null {
  return state.snapshots.get(snapshotId) || null;
}

// Get awareness report
export function getAwarenessReport(state: ContextAwarenessEngineState): {
  totalSignals: number;
  totalSnapshots: number;
  averageReliability: number;
  averageCoherence: number;
  awarenessScore: number;
  currentLevel: AwarenessLevel;
  dominantType: AwarenessType | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSignals === 0) recommendations.push('No signals — capture awareness signals');
  if (state.averageReliability < 0.5) recommendations.push('Low reliability — verify signals');
  if (state.awarenessScore < 0.5) recommendations.push('Low awareness — capture more signals');

  return {
    totalSignals: state.totalSignals,
    totalSnapshots: state.totalSnapshots,
    averageReliability: Math.round(state.averageReliability * 100) / 100,
    averageCoherence: Math.round(state.averageCoherence * 100) / 100,
    awarenessScore: Math.round(state.awarenessScore * 100) / 100,
    currentLevel: state.currentLevel,
    dominantType: state.dominantType,
    recommendations,
  };
}

// Recompute metrics
function recomputeAwareness(state: ContextAwarenessEngineState): ContextAwarenessEngineState {
  const signals = Array.from(state.signals.values());
  const snapshots = Array.from(state.snapshots.values());

  const averageReliability = signals.length > 0
    ? signals.reduce((s, sig) => s + sig.reliability, 0) / signals.length
    : 0.7;
  const averageCoherence = snapshots.length > 0
    ? snapshots.reduce((s, snap) => s + snap.coherence, 0) / snapshots.length
    : 0.5;

  const levelMap: Record<AwarenessLevel, number> = {
    minimal: 0.2,
    basic: 0.4,
    moderate: 0.6,
    full: 0.8,
    omniscient: 1.0,
  };
  const awarenessScore = (averageReliability + averageCoherence + levelMap[state.currentLevel]) / 3;

  let dominantType: AwarenessType | null = null;
  let maxCount = -1;
  const typeCounts = new Map<AwarenessType, number>();
  signals.forEach(s => typeCounts.set(s.type, (typeCounts.get(s.type) || 0) + 1));
  typeCounts.forEach((count, type) => {
    if (count > maxCount) { maxCount = count; dominantType = type; }
  });

  return { ...state, averageReliability, averageCoherence, awarenessScore, dominantType };
}

// Reset awareness state
export function resetContextAwarenessEngineState(): ContextAwarenessEngineState {
  return createContextAwarenessEngineState();
}