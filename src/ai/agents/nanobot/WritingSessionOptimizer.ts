/**
 * WritingSessionOptimizer - V160
 * Adaptive Writing Flow Optimization Engine
 */

export type SessionPhase = 'warmup' | 'peak' | 'sustain' | 'fatigue' | 'break_needed'
export type OptimalMetric = 'word_count' | 'quality' | 'flow_state' | 'creative_output'

export interface SessionMetrics {
  timestamp: number
  wordsWritten: number
  qualityScore: number  // 0-100
  flowState: number  // 0-100
  focusLevel: number  // 0-100
  energyLevel: number  // 0-100
  interruptions: number
}

export interface OptimalBlock {
  blockId: string
  startHour: number
  endHour: number
  typicalOutput: number
  qualityRating: number
  optimalFor: OptimalMetric[]
}

export interface SessionState {
  currentSessionId: string | null
  metrics: SessionMetrics[]
  sessionStartTime: number | null
  currentPhase: SessionPhase
  optimalBlocks: OptimalBlock[]
  energyCurve: Array<{hour: number; energy: number}>
  recommendations: string[]
  totalWordsToday: number
  targetWordsPerDay: number
}

// State Management
export function createEmptySessionState(): SessionState {
  return {
    currentSessionId: null, metrics: [], sessionStartTime: null,
    currentPhase: 'warmup', optimalBlocks: [], energyCurve: [],
    recommendations: [], totalWordsToday: 0, targetWordsPerDay: 2000
  };
}

export function startSession(state: SessionState): SessionState {
  return {
    ...state, currentSessionId: 'session_' + Date.now(), sessionStartTime: Date.now(),
    currentPhase: 'warmup', metrics: []
  };
}

export function endSession(state: SessionState): SessionState {
  return { ...state, currentSessionId: null, sessionStartTime: null, currentPhase: 'warmup' };
}

// Metrics Recording
export function recordMetrics(state: SessionState, wordsWritten: number, qualityScore: number, flowState: number, focusLevel: number, energyLevel: number, interruptions: number): SessionState {
  const metric: SessionMetrics = { timestamp: Date.now(), wordsWritten, qualityScore, flowState, focusLevel, energyLevel, interruptions };
  return { ...state, metrics: [...state.metrics, metric], totalWordsToday: state.totalWordsToday + wordsWritten };
}

// Phase Detection
export function detectPhase(metrics: SessionMetrics[]): SessionPhase {
  if (metrics.length < 3) return 'warmup';
  const recent = metrics.slice(-3);
  const avgEnergy = recent.reduce((a, m) => a + m.energyLevel, 0) / recent.length;
  const avgFlow = recent.reduce((a, m) => a + m.flowState, 0) / recent.length;
  
  if (avgEnergy < 30) return 'break_needed';
  if (avgEnergy < 50) return 'fatigue';
  if (avgFlow > 80 && avgEnergy > 70) return 'peak';
  if (avgFlow > 50) return 'sustain';
  return 'warmup';
}

export function updatePhase(state: SessionState): SessionState {
  const phase = detectPhase(state.metrics);
  return { ...state, currentPhase: phase };
}

// Recommendations
export function generateRecommendations(state: SessionState): string[] {
  const recs: string[] = [];
  const recent = state.metrics.slice(-10);
  
  if (recent.length === 0) return recs;
  
  const avgEnergy = recent.reduce((a, m) => a + m.energyLevel, 0) / recent.length;
  const avgFlow = recent.reduce((a, m) => a + m.flowState, 0) / recent.length;
  const avgQuality = recent.reduce((a, m) => a + m.qualityScore, 0) / recent.length;
  
  if (avgEnergy < 40) recs.push('Energy low - consider a 5-minute stretch break');
  if (avgFlow < 50) recs.push('Flow disrupted - try closing distracting tabs');
  if (avgQuality > 85 && recent.length > 5) recs.push('Quality high - you are in peak form, continue writing');
  if (state.totalWordsToday > state.targetWordsPerDay * 1.5) recs.push('Daily target exceeded - consider winding down');
  if (recent.filter(m => m.interruptions > 3).length > 3) recs.push('Multiple interruptions detected - try focus mode');
  if (avgEnergy > 70 && avgFlow > 70) recs.push('Optimal writing state - maximize output');
  
  return recs;
}

// Optimal Block Analysis
export function analyzeOptimalBlocks(state: SessionState): OptimalBlock[] {
  const hourGroups: Record<number, SessionMetrics[]> = {};
  for (const m of state.metrics) {
    const hour = new Date(m.timestamp).getHours();
    if (!hourGroups[hour]) hourGroups[hour] = [];
    hourGroups[hour].push(m);
  }
  
  const blocks: OptimalBlock[] = [];
  for (const [hour, metrics] of Object.entries(hourGroups)) {
    const h = parseInt(hour);
    const avgOutput = metrics.reduce((a, m) => a + m.wordsWritten, 0) / metrics.length;
    const avgQuality = metrics.reduce((a, m) => a + m.qualityScore, 0) / metrics.length;
    const avgFlow = metrics.reduce((a, m) => a + m.flowState, 0) / metrics.length;
    
    const optimalFor: OptimalMetric[] = [];
    if (avgOutput > 200) optimalFor.push('word_count');
    if (avgQuality > 75) optimalFor.push('quality');
    if (avgFlow > 75) optimalFor.push('flow_state');
    
    blocks.push({
      blockId: 'block_' + h, startHour: h, endHour: h + 1,
      typicalOutput: Math.round(avgOutput), qualityRating: Math.round(avgQuality),
      optimalFor
    });
  }
  
  return blocks.sort((a, b) => b.qualityRating - a.qualityRating);
}

// Update state with recommendations and blocks
export function optimizeSession(state: SessionState): SessionState {
  const recommendations = generateRecommendations(state);
  const optimalBlocks = analyzeOptimalBlocks(state);
  return { ...state, recommendations, optimalBlocks };
}

// Flow Analysis
export function analyzeFlowTrend(metrics: SessionMetrics[]): {trend: 'improving' | 'stable' | 'declining'; delta: number} {
  if (metrics.length < 4) return { trend: 'stable', delta: 0 };
  
  const recent = metrics.slice(-4);
  const older = metrics.slice(-8, -4);
  
  if (older.length === 0) return { trend: 'stable', delta: 0 };
  
  const recentFlow = recent.reduce((a, m) => a + m.flowState, 0) / recent.length;
  const olderFlow = older.reduce((a, m) => a + m.flowState, 0) / older.length;
  const delta = recentFlow - olderFlow;
  
  if (delta > 10) return { trend: 'improving', delta };
  if (delta < -10) return { trend: 'declining', delta };
  return { trend: 'stable', delta };
}

// Session Statistics
export function getSessionStats(state: SessionState) {
  if (state.metrics.length === 0) return null;
  
  const totalWords = state.metrics.reduce((a, m) => a + m.wordsWritten, 0);
  const avgQuality = state.metrics.reduce((a, m) => a + m.qualityScore, 0) / state.metrics.length;
  const avgFlow = state.metrics.reduce((a, m) => a + m.flowState, 0) / state.metrics.length;
  const totalInterruptions = state.metrics.reduce((a, m) => a + m.interruptions, 0);
  
  return { totalWords, avgQuality, avgFlow, totalInterruptions, metricCount: state.metrics.length };
}

// Formatters
export function formatSessionSummary(state: SessionState): string {
  const stats = getSessionStats(state);
  let s = '=== Writing Session Status ===\n';
  s += 'Phase: ' + state.currentPhase + '\n';
  s += 'Total Words Today: ' + state.totalWordsToday + ' / ' + state.targetWordsPerDay + '\n';
  
  if (stats) {
    s += '--- Current Session ---\n';
    s += 'Words: ' + stats.totalWords + '\n';
    s += 'Avg Quality: ' + stats.avgQuality.toFixed(1) + '%\n';
    s += 'Avg Flow: ' + stats.avgFlow.toFixed(1) + '%\n';
    s += 'Interruptions: ' + stats.totalInterruptions + '\n';
  }
  
  if (state.recommendations.length) {
    s += '\n--- Recommendations ---\n';
    for (const r of state.recommendations) s += '→ ' + r + '\n';
  }
  
  return s;
}

export function formatSessionDashboard(state: SessionState): string {
  let s = '=== Writing Session Dashboard ===\n';
  s += 'Target: ' + state.totalWordsToday + ' / ' + state.targetWordsPerDay + ' words\n';
  s += 'Progress: ' + Math.min(100, Math.round(state.totalWordsToday / state.targetWordsPerDay * 100)) + '%\n';
  s += 'Current Phase: ' + state.currentPhase + '\n';
  s += 'Metrics Recorded: ' + state.metrics.length + '\n';
  
  if (state.optimalBlocks.length) {
    s += '\n--- Optimal Writing Windows ---\n';
    for (const b of state.optimalBlocks.slice(0, 3)) {
      s += '  ' + b.startHour + ':00-' + b.endHour + ':00 (output: ' + b.typicalOutput + ' words, quality: ' + b.qualityRating + '%)\n';
    }
  }
  
  return s;
}
