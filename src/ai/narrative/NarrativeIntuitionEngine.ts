/**
 * V936 NarrativeIntuitionEngine — Direction E Iter 1/15 (Round 4)
 * Narrative intuition engine: intuitive narrative sense + gut feeling
 * Sources: nanobot intuition + generic-agent + chatdev
 */

export type IntuitionType = 'creative' | 'emotional' | 'structural' | 'relational' | 'thematic' | 'aesthetic';
export type IntuitionSource = 'experience' | 'pattern_recognition' | 'subconscious' | 'analogy' | 'synthesis' | 'insight';
export type IntuitionConfidence = 'whisper' | 'hunch' | 'feeling' | 'conviction' | 'certainty';

export interface IntuitiveInsight {
  insightId: string;
  type: IntuitionType;
  source: IntuitionSource;
  confidence: IntuitionConfidence;
  content: string;
  accuracy: number;
  chapter: number;
}

export interface IntuitivePattern {
  patternId: string;
  name: string;
  insightIds: string[];
  reliability: number;
  frequency: number;
}

export interface NarrativeIntuitionEngineState {
  insights: Map<string, IntuitiveInsight>;
  patterns: Map<string, IntuitivePattern>;
  totalInsights: number;
  totalPatterns: number;
  averageAccuracy: number;
  averageConfidence: number;
  intuitiveSensitivity: number;
  intuitionMastery: number;
}

// Factory
export function createNarrativeIntuitionEngineState(): NarrativeIntuitionEngineState {
  return {
    insights: new Map(),
    patterns: new Map(),
    totalInsights: 0,
    totalPatterns: 0,
    averageAccuracy: 0.5,
    averageConfidence: 0.5,
    intuitiveSensitivity: 0.5,
    intuitionMastery: 0.5,
  };
}

// Record insight
export function recordIntuitiveInsight(
  state: NarrativeIntuitionEngineState,
  insightId: string,
  type: IntuitionType,
  source: IntuitionSource,
  confidence: IntuitionConfidence,
  content: string,
  accuracy: number,
  chapter: number
): NarrativeIntuitionEngineState {
  const insight: IntuitiveInsight = {
    insightId, type, source, confidence, content,
    accuracy: Math.min(1, Math.max(0, accuracy)), chapter,
  };
  const insights = new Map(state.insights).set(insightId, insight);
  return recomputeNarrativeInt({ ...state, insights, totalInsights: insights.size });
}

// Add pattern
export function addIntuitivePattern(
  state: NarrativeIntuitionEngineState,
  patternId: string,
  name: string,
  insightIds: string[]
): NarrativeIntuitionEngineState {
  const insights = insightIds.map(id => state.insights.get(id)).filter((i): i is IntuitiveInsight => i !== undefined);
  const reliability = insights.length === 0 ? 0.5
    : insights.reduce((s, i) => s + i.accuracy, 0) / insights.length;
  const pattern: IntuitivePattern = { patternId, name, insightIds, reliability, frequency: insightIds.length };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeNarrativeInt({ ...state, patterns, totalPatterns: patterns.size });
}

// Get insights by type
export function getInsightsByType(state: NarrativeIntuitionEngineState, type: IntuitionType): IntuitiveInsight[] {
  return Array.from(state.insights.values()).filter(i => i.type === type);
}

// Get intuition report
export function getIntuitionReport(state: NarrativeIntuitionEngineState): {
  totalInsights: number;
  totalPatterns: number;
  averageAccuracy: number;
  averageConfidence: number;
  intuitionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalInsights === 0) recommendations.push('No insights — record insights');
  if (state.averageAccuracy < 0.5) recommendations.push('Low accuracy — refine intuition');
  if (state.intuitionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalInsights: state.totalInsights,
    totalPatterns: state.totalPatterns,
    averageAccuracy: Math.round(state.averageAccuracy * 100) / 100,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    intuitionMastery: Math.round(state.intuitionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeNarrativeInt(state: NarrativeIntuitionEngineState): NarrativeIntuitionEngineState {
  const insights = Array.from(state.insights.values());
  const averageAccuracy = insights.length === 0 ? 0.5
    : insights.reduce((s, i) => s + i.accuracy, 0) / insights.length;
  const confidenceMap: Record<IntuitionConfidence, number> = { whisper: 0.2, hunch: 0.4, feeling: 0.6, conviction: 0.8, certainty: 1.0 };
  const averageConfidence = insights.length === 0 ? 0.5
    : insights.reduce((s, i) => s + confidenceMap[i.confidence], 0) / insights.length;

  // Sensitivity: insights + patterns coverage
  const typeSet = new Set(insights.map(i => i.type));
  const intuitiveSensitivity = Math.min(1, typeSet.size / 6 + (state.totalPatterns > 0 ? 0.2 : 0));

  const intuitionMastery = (averageAccuracy * 0.4 + averageConfidence * 0.3 + intuitiveSensitivity * 0.3);

  return { ...state, averageAccuracy, averageConfidence, intuitiveSensitivity, intuitionMastery };
}

// Reset intuition state
export function resetNarrativeIntuitionEngineState(): NarrativeIntuitionEngineState {
  return createNarrativeIntuitionEngineState();
}