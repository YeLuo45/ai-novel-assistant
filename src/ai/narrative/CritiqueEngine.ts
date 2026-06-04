/**
 * V712 CritiqueEngine — Direction D Iter 6/9 (Round 2)
 * Critique engine: automated critique + multi-perspective feedback
 * Sources: chatdev critique + thunderbolt feedback + nanobot
 */

export type CritiqueAspect = 'plot' | 'character' | 'prose' | 'theme' | 'pacing' | 'dialogue' | 'world' | 'emotion';
export type CritiqueSentiment = 'positive' | 'neutral' | 'constructive' | 'critical';
export type CritiqueSeverity = 'minor' | 'moderate' | 'major';

export interface Critique {
  critiqueId: string;
  aspect: CritiqueAspect;
  sentiment: CritiqueSentiment;
  severity: CritiqueSeverity;
  observation: string;
  suggestion: string;
  position: number;
  examples: string[];
}

export interface CritiqueSession {
  sessionId: string;
  workId: string;
  critiques: Critique[];
  startTime: number;
  endTime: number | null;
  totalCritiques: number;
  status: 'in_progress' | 'completed';
}

export interface CritiqueEngineState {
  sessions: Map<string, CritiqueSession>;
  totalSessions: number;
  totalCritiques: number;
  aspectDistribution: Map<CritiqueAspect, number>;
  sentimentDistribution: Map<CritiqueSentiment, number>;
  averageCritiquesPerSession: number;
  constructiveRatio: number;
  critiqueDepth: number;
}

// Factory
export function createCritiqueEngineState(): CritiqueEngineState {
  return {
    sessions: new Map(),
    totalSessions: 0,
    totalCritiques: 0,
    aspectDistribution: new Map(),
    sentimentDistribution: new Map(),
    averageCritiquesPerSession: 0,
    constructiveRatio: 0.5,
    critiqueDepth: 0.6,
  };
}

// Start session
export function startSession(state: CritiqueEngineState, sessionId: string, workId: string): CritiqueEngineState {
  const session: CritiqueSession = {
    sessionId,
    workId,
    critiques: [],
    startTime: Date.now(),
    endTime: null,
    totalCritiques: 0,
    status: 'in_progress',
  };
  const sessions = new Map(state.sessions).set(sessionId, session);
  return recomputeCritique({ ...state, sessions, totalSessions: sessions.size });
}

// Add critique
export function addCritique(
  state: CritiqueEngineState,
  sessionId: string,
  critiqueId: string,
  aspect: CritiqueAspect,
  sentiment: CritiqueSentiment,
  severity: CritiqueSeverity,
  observation: string,
  suggestion: string,
  position: number = 0,
  examples: string[] = []
): CritiqueEngineState {
  const critique: Critique = { critiqueId, aspect, sentiment, severity, observation, suggestion, position, examples };

  const session = state.sessions.get(sessionId);
  let sessions = state.sessions;
  if (session) {
    const updatedSession: CritiqueSession = { ...session, critiques: [...session.critiques, critique], totalCritiques: session.totalCritiques + 1 };
    sessions = new Map(state.sessions).set(sessionId, updatedSession);
  }

  const aspectDistribution = new Map(state.aspectDistribution);
  aspectDistribution.set(aspect, (aspectDistribution.get(aspect) || 0) + 1);

  const sentimentDistribution = new Map(state.sentimentDistribution);
  sentimentDistribution.set(sentiment, (sentimentDistribution.get(sentiment) || 0) + 1);

  return recomputeCritique({ ...state, sessions, aspectDistribution, sentimentDistribution, totalCritiques: state.totalCritiques + 1 });
}

// Complete session
export function completeSession(state: CritiqueEngineState, sessionId: string): CritiqueEngineState {
  const session = state.sessions.get(sessionId);
  if (!session) return state;

  const updated: CritiqueSession = { ...session, status: 'completed', endTime: Date.now() };
  const sessions = new Map(state.sessions).set(sessionId, updated);
  return { ...state, sessions };
}

// Get critiques by aspect
export function getCritiquesByAspect(state: CritiqueEngineState, aspect: CritiqueAspect): Critique[] {
  const result: Critique[] = [];
  state.sessions.forEach(session => {
    session.critiques.forEach(c => {
      if (c.aspect === aspect) result.push(c);
    });
  });
  return result;
}

// Get critiques by sentiment
export function getCritiquesBySentiment(state: CritiqueEngineState, sentiment: CritiqueSentiment): Critique[] {
  const result: Critique[] = [];
  state.sessions.forEach(session => {
    session.critiques.forEach(c => {
      if (c.sentiment === sentiment) result.push(c);
    });
  });
  return result;
}

// Get critiques for session
export function getSessionCritiques(state: CritiqueEngineState, sessionId: string): Critique[] {
  return state.sessions.get(sessionId)?.critiques || [];
}

// Get critique report
export function getCritiqueReport(state: CritiqueEngineState): {
  totalSessions: number;
  totalCritiques: number;
  averageCritiquesPerSession: number;
  constructiveRatio: number;
  critiqueDepth: number;
  aspectDistribution: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCritiques === 0) recommendations.push('No critiques yet — start sessions');
  if (state.constructiveRatio < 0.4) recommendations.push('Low constructive ratio — provide actionable feedback');
  if (state.averageCritiquesPerSession < 3 && state.totalSessions > 0) recommendations.push('Few critiques per session — more depth needed');

  const aspectDistribution: Record<string, number> = {};
  state.aspectDistribution.forEach((count, aspect) => {
    aspectDistribution[aspect] = count;
  });

  return {
    totalSessions: state.totalSessions,
    totalCritiques: state.totalCritiques,
    averageCritiquesPerSession: Math.round(state.averageCritiquesPerSession * 100) / 100,
    constructiveRatio: Math.round(state.constructiveRatio * 100) / 100,
    critiqueDepth: Math.round(state.critiqueDepth * 100) / 100,
    aspectDistribution,
    recommendations,
  };
}

// Recompute metrics
function recomputeCritique(state: CritiqueEngineState): CritiqueEngineState {
  const sessions = Array.from(state.sessions.values());
  const allCritiques: Critique[] = [];
  sessions.forEach(s => s.critiques.forEach(c => allCritiques.push(c)));

  const averageCritiquesPerSession = sessions.length > 0
    ? allCritiques.length / sessions.length
    : 0;

  const constructive = allCritiques.filter(c => c.sentiment === 'constructive' || c.sentiment === 'positive').length;
  const constructiveRatio = allCritiques.length > 0 ? constructive / allCritiques.length : 0.5;

  const examplesCount = allCritiques.reduce((s, c) => s + c.examples.length, 0);
  const critiqueDepth = allCritiques.length > 0
    ? Math.min(1, examplesCount / (allCritiques.length * 2))
    : 0.6;

  return { ...state, averageCritiquesPerSession, constructiveRatio, critiqueDepth };
}

// Reset critique state
export function resetCritiqueEngineState(): CritiqueEngineState {
  return createCritiqueEngineState();
}