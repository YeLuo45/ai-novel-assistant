/**
 * V714 EnhancementEngine — Direction D Iter 7/9 (Round 2)
 * Enhancement engine: enhancement suggestions + content improvements
 * Sources: thunderbolt enhancement + chatdev + generic-agent
 */

export type EnhancementType = 'vocabulary' | 'imagery' | 'rhythm' | 'clarity' | 'impact' | 'depth';
export type EnhancementPriority = 'urgent' | 'high' | 'medium' | 'low';
export type EnhancementStatus = 'suggested' | 'in_progress' | 'applied' | 'skipped';

export interface Enhancement {
  enhancementId: string;
  type: EnhancementType;
  priority: EnhancementPriority;
  status: EnhancementStatus;
  originalText: string;
  enhancedText: string;
  reason: string;
  position: number;
  impact: number;
}

export interface EnhancementSession {
  sessionId: string;
  workId: string;
  enhancements: Enhancement[];
  totalSuggestions: number;
  appliedCount: number;
  averageImpact: number;
}

export interface EnhancementEngineState {
  sessions: Map<string, EnhancementSession>;
  totalEnhancements: number;
  appliedEnhancements: number;
  averageImpact: number;
  enhancementCoverage: number;
  typeDistribution: Map<EnhancementType, number>;
}

// Factory
export function createEnhancementEngineState(): EnhancementEngineState {
  return {
    sessions: new Map(),
    totalEnhancements: 0,
    appliedEnhancements: 0,
    averageImpact: 0,
    enhancementCoverage: 0,
    typeDistribution: new Map(),
  };
}

// Create session
export function createEnhancementSession(state: EnhancementEngineState, sessionId: string, workId: string): EnhancementEngineState {
  const session: EnhancementSession = {
    sessionId,
    workId,
    enhancements: [],
    totalSuggestions: 0,
    appliedCount: 0,
    averageImpact: 0,
  };
  const sessions = new Map(state.sessions).set(sessionId, session);
  return { ...state, sessions };
}

// Suggest enhancement
export function suggestEnhancement(
  state: EnhancementEngineState,
  sessionId: string,
  enhancementId: string,
  type: EnhancementType,
  priority: EnhancementPriority,
  originalText: string,
  enhancedText: string,
  reason: string,
  position: number = 0,
  impact: number = 0.5
): EnhancementEngineState {
  const enhancement: Enhancement = {
    enhancementId,
    type,
    priority,
    status: 'suggested',
    originalText,
    enhancedText,
    reason,
    position,
    impact: Math.min(1, Math.max(0, impact)),
  };

  const session = state.sessions.get(sessionId);
  let sessions = state.sessions;
  if (session) {
    const updated: EnhancementSession = {
      ...session,
      enhancements: [...session.enhancements, enhancement],
      totalSuggestions: session.totalSuggestions + 1,
    };
    sessions = new Map(state.sessions).set(sessionId, updated);
  }

  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);

  return recomputeEnhancement({ ...state, sessions, typeDistribution, totalEnhancements: state.totalEnhancements + 1 });
}

// Apply enhancement
export function applyEnhancement(state: EnhancementEngineState, enhancementId: string): EnhancementEngineState {
  const appliedEnhancements = state.appliedEnhancements + 1;
  const sessions = new Map(state.sessions);
  state.sessions.forEach((session, sessionId) => {
    const updated = session.enhancements.map(e =>
      e.enhancementId === enhancementId ? { ...e, status: 'applied' as EnhancementStatus } : e
    );
    if (updated !== session.enhancements) {
      const appliedCount = updated.filter(e => e.status === 'applied').length;
      const avgImpact = updated.length > 0
        ? updated.reduce((s, e) => s + e.impact, 0) / updated.length
        : 0;
      sessions.set(sessionId, { ...session, enhancements: updated, appliedCount, averageImpact: avgImpact });
    }
  });

  return recomputeEnhancement({ ...state, sessions, appliedEnhancements });
}

// Skip enhancement
export function skipEnhancement(state: EnhancementEngineState, enhancementId: string): EnhancementEngineState {
  const sessions = new Map(state.sessions);
  state.sessions.forEach((session, sessionId) => {
    const updated = session.enhancements.map(e =>
      e.enhancementId === enhancementId ? { ...e, status: 'skipped' as EnhancementStatus } : e
    );
    if (updated !== session.enhancements) {
      sessions.set(sessionId, { ...session, enhancements: updated });
    }
  });
  return { ...state, sessions };
}

// Get enhancements by type
export function getEnhancementsByType(state: EnhancementEngineState, type: EnhancementType): Enhancement[] {
  const result: Enhancement[] = [];
  state.sessions.forEach(session => {
    session.enhancements.forEach(e => {
      if (e.type === type) result.push(e);
    });
  });
  return result;
}

// Get high-impact enhancements
export function getHighImpactEnhancements(state: EnhancementEngineState, threshold: number = 0.7): Enhancement[] {
  const result: Enhancement[] = [];
  state.sessions.forEach(session => {
    session.enhancements.forEach(e => {
      if (e.impact >= threshold) result.push(e);
    });
  });
  return result;
}

// Get enhancement report
export function getEnhancementReport(state: EnhancementEngineState): {
  totalEnhancements: number;
  appliedEnhancements: number;
  averageImpact: number;
  enhancementCoverage: number;
  typeDistribution: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEnhancements === 0) recommendations.push('No enhancements — suggest improvements');
  if (state.appliedEnhancements / Math.max(1, state.totalEnhancements) < 0.4) {
    recommendations.push('Low application rate — review suggestions');
  }

  const typeDistribution: Record<string, number> = {};
  state.typeDistribution.forEach((count, type) => {
    typeDistribution[type] = count;
  });

  return {
    totalEnhancements: state.totalEnhancements,
    appliedEnhancements: state.appliedEnhancements,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    enhancementCoverage: Math.round(state.enhancementCoverage * 100) / 100,
    typeDistribution,
    recommendations,
  };
}

// Recompute metrics
function recomputeEnhancement(state: EnhancementEngineState): EnhancementEngineState {
  const allEnhancements: Enhancement[] = [];
  state.sessions.forEach(s => s.enhancements.forEach(e => allEnhancements.push(e)));

  const averageImpact = allEnhancements.length > 0
    ? allEnhancements.reduce((s, e) => s + e.impact, 0) / allEnhancements.length
    : 0;

  const enhancementCoverage = Math.min(1, state.appliedEnhancements / Math.max(1, state.totalEnhancements));

  return { ...state, averageImpact, enhancementCoverage };
}

// Reset enhancement state
export function resetEnhancementEngineState(): EnhancementEngineState {
  return createEnhancementEngineState();
}