/**
 * V792 WritingFlowCore — Direction D Iter 1/9 (Round 3)
 * Writing flow core: writing flow state + flow maintenance
 * Sources: nanobot flow + thunderbolt pipeline + generic-agent
 */

export type FlowState = 'struggling' | 'forced' | 'warming' | 'flowing' | 'peak' | 'cooling' | 'blocked';
export type FlowFactor = 'skill' | 'challenge' | 'concentration' | 'clarity' | 'feedback' | 'motivation';
export type FlowDisturbance = 'distraction' | 'fatigue' | 'confusion' | 'self_doubt' | 'external_pressure';

export interface FlowSession {
  sessionId: string;
  state: FlowState;
  startTime: number;
  endTime: number | null;
  wordsWritten: number;
  qualityScore: number;
  factors: Map<FlowFactor, number>;
  disturbances: string[];
}

export interface FlowMetric {
  metricId: string;
  factor: FlowFactor;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  timestamp: number;
}

export interface WritingFlowCoreState {
  sessions: Map<string, FlowSession>;
  metrics: Map<string, FlowMetric>;
  totalSessions: number;
  activeSessions: number;
  peakSessions: number;
  totalWordsWritten: number;
  averageQuality: number;
  currentState: FlowState;
  flowConsistency: number;
  averageSessionLength: number;
}

// Factory
export function createWritingFlowCoreState(): WritingFlowCoreState {
  return {
    sessions: new Map(),
    metrics: new Map(),
    totalSessions: 0,
    activeSessions: 0,
    peakSessions: 0,
    totalWordsWritten: 0,
    averageQuality: 0.5,
    currentState: 'warming',
    flowConsistency: 0.5,
    averageSessionLength: 0,
  };
}

// Start session
export function startFlowSession(
  state: WritingFlowCoreState,
  sessionId: string,
  factors: Partial<Record<FlowFactor, number>> = {}
): WritingFlowCoreState {
  const fullFactors = new Map<FlowFactor, number>();
  const allFactors: FlowFactor[] = ['skill', 'challenge', 'concentration', 'clarity', 'feedback', 'motivation'];
  allFactors.forEach(f => fullFactors.set(f, factors[f] ?? 0.5));

  const session: FlowSession = {
    sessionId,
    state: 'warming',
    startTime: Date.now(),
    endTime: null,
    wordsWritten: 0,
    qualityScore: 0.5,
    factors: fullFactors,
    disturbances: [],
  };
  const sessions = new Map(state.sessions).set(sessionId, session);
  return recomputeFlow({ ...state, sessions, totalSessions: sessions.size, activeSessions: state.activeSessions + 1 });
}

// Update session state
export function updateSessionState(
  state: WritingFlowCoreState,
  sessionId: string,
  newState: FlowState,
  wordsWritten: number = 0,
  qualityScore: number = 0.5
): WritingFlowCoreState {
  const session = state.sessions.get(sessionId);
  if (!session) return state;

  const updated: FlowSession = { ...session, state: newState, wordsWritten, qualityScore };
  const sessions = new Map(state.sessions).set(sessionId, updated);
  return recomputeFlow({ ...state, sessions, currentState: newState });
}

// Add disturbance
export function addFlowDisturbance(state: WritingFlowCoreState, sessionId: string, disturbance: FlowDisturbance): WritingFlowCoreState {
  const session = state.sessions.get(sessionId);
  if (!session) return state;

  const updated: FlowSession = { ...session, disturbances: [...session.disturbances, disturbance] };
  const sessions = new Map(state.sessions).set(sessionId, updated);
  return recomputeFlow({ ...state, sessions });
}

// End session
export function endFlowSession(state: WritingFlowCoreState, sessionId: string, totalWords: number, finalQuality: number): WritingFlowCoreState {
  const session = state.sessions.get(sessionId);
  if (!session) return state;

  const updated: FlowSession = { ...session, endTime: Date.now(), wordsWritten: totalWords, qualityScore: finalQuality };
  const sessions = new Map(state.sessions).set(sessionId, updated);
  return recomputeFlow({ ...state, sessions, activeSessions: Math.max(0, state.activeSessions - 1) });
}

// Record metric
export function recordFlowMetric(
  state: WritingFlowCoreState,
  metricId: string,
  factor: FlowFactor,
  value: number,
  trend: 'improving' | 'stable' | 'declining' = 'stable'
): WritingFlowCoreState {
  const metric: FlowMetric = { metricId, factor, value: Math.min(1, Math.max(0, value)), trend, timestamp: Date.now() };
  const metrics = new Map(state.metrics).set(metricId, metric);
  return recomputeFlow({ ...state, metrics });
}

// Get sessions by state
export function getSessionsByState(state: WritingFlowCoreState, flowState: FlowState): FlowSession[] {
  return Array.from(state.sessions.values()).filter(s => s.state === flowState);
}

// Get flow report
export function getFlowCoreReport(state: WritingFlowCoreState): {
  totalSessions: number;
  activeSessions: number;
  peakSessions: number;
  totalWordsWritten: number;
  averageQuality: number;
  flowConsistency: number;
  currentState: FlowState;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSessions === 0) recommendations.push('No sessions — start a session');
  if (state.flowConsistency < 0.4) recommendations.push('Low consistency — maintain flow better');
  if (state.averageQuality < 0.5) recommendations.push('Low quality — improve focus');

  return {
    totalSessions: state.totalSessions,
    activeSessions: state.activeSessions,
    peakSessions: state.peakSessions,
    totalWordsWritten: state.totalWordsWritten,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    flowConsistency: Math.round(state.flowConsistency * 100) / 100,
    currentState: state.currentState,
    recommendations,
  };
}

// Recompute metrics
function recomputeFlow(state: WritingFlowCoreState): WritingFlowCoreState {
  const sessions = Array.from(state.sessions.values());
  const completed = sessions.filter(s => s.endTime !== null);
  const peak = sessions.filter(s => s.state === 'peak');
  const totalWords = completed.reduce((s, sess) => s + sess.wordsWritten, 0);
  const averageQuality = completed.length === 0 ? 0.5
    : completed.reduce((s, sess) => s + sess.qualityScore, 0) / completed.length;

  // Flow consistency: how often sessions are in good states
  const goodFlows = sessions.filter(s => s.state === 'flowing' || s.state === 'peak').length;
  const flowConsistency = sessions.length === 0 ? 0.5 : goodFlows / sessions.length;

  const totalDuration = completed.reduce((s, sess) => s + (sess.endTime! - sess.startTime), 0);
  const averageSessionLength = completed.length === 0 ? 0 : totalDuration / completed.length;

  return { ...state, peakSessions: peak.length, totalWordsWritten: totalWords, averageQuality, flowConsistency, averageSessionLength };
}

// Reset flow state
export function resetWritingFlowCoreState(): WritingFlowCoreState {
  return createWritingFlowCoreState();
}