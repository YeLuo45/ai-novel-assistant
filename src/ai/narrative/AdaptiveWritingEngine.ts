/**
 * V704 AdaptiveWritingEngine — Direction D Iter 2/9 (Round 2)
 * Adaptive writing engine: style adaptation + audience targeting
 * Sources: generic-agent adaptive + thunderbolt + nanobot
 */

export type WritingContextTypeAlias = 'novel' | 'short_story' | 'screenplay' | 'essay' | 'poetry' | 'article';
export type AudienceType = 'children' | 'young_adult' | 'adult' | 'academic' | 'general';
export type AdaptationMode = 'strict' | 'moderate' | 'flexible' | 'experimental';

export interface WritingContext {
  contextId: string;
  type: WritingContextTypeAlias;
  audience: AudienceType;
  mode: AdaptationMode;
  vocabularyLevel: number;
  sentenceComplexity: number;
  readingLevel: number;
}

export interface AdaptationRule {
  ruleId: string;
  trigger: string;
  adjustment: string;
  priority: number;
  enabled: boolean;
}

export interface AdaptiveWritingState {
  contexts: Map<string, WritingContext>;
  rules: Map<string, AdaptationRule>;
  activeContext: string | null;
  totalContexts: number;
  totalRules: number;
  enabledRules: number;
  averageReadingLevel: number;
  averageVocabulary: number;
  adaptationCoverage: number;
}

// Factory
export function createAdaptiveWritingState(): AdaptiveWritingState {
  return {
    contexts: new Map(),
    rules: new Map(),
    activeContext: null,
    totalContexts: 0,
    totalRules: 0,
    enabledRules: 0,
    averageReadingLevel: 0.5,
    averageVocabulary: 0.5,
    adaptationCoverage: 0,
  };
}

// Create context
export function createContext(
  state: AdaptiveWritingState,
  contextId: string,
  type: WritingContextTypeAlias,
  audience: AudienceType,
  mode: AdaptationMode = 'moderate',
  vocabularyLevel: number = 0.5,
  sentenceComplexity: number = 0.5,
  readingLevel: number = 0.5
): AdaptiveWritingState {
  const context: WritingContext = {
    contextId,
    type,
    audience,
    mode,
    vocabularyLevel: Math.min(1, Math.max(0, vocabularyLevel)),
    sentenceComplexity: Math.min(1, Math.max(0, sentenceComplexity)),
    readingLevel: Math.min(1, Math.max(0, readingLevel)),
  };
  const contexts = new Map(state.contexts).set(contextId, context);
  return recomputeAdaptation({ ...state, contexts, totalContexts: contexts.size });
}

// Add rule
export function addRule(
  state: AdaptiveWritingState,
  ruleId: string,
  trigger: string,
  adjustment: string,
  priority: number = 1,
  enabled: boolean = true
): AdaptiveWritingState {
  const rule: AdaptationRule = { ruleId, trigger, adjustment, priority, enabled };
  const rules = new Map(state.rules).set(ruleId, rule);
  return recomputeAdaptation({ ...state, rules, totalRules: rules.size });
}

// Toggle rule
export function toggleRule(state: AdaptiveWritingState, ruleId: string, enabled: boolean): AdaptiveWritingState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: AdaptationRule = { ...rule, enabled };
  const rules = new Map(state.rules).set(ruleId, updated);
  return recomputeAdaptation({ ...state, rules });
}

// Set active context
export function setActiveContext(state: AdaptiveWritingState, contextId: string): AdaptiveWritingState {
  return { ...state, activeContext: contextId };
}

// Get context by type
export function getContextsByType(state: AdaptiveWritingState, type: WritingContextTypeAlias): WritingContext[] {
  return Array.from(state.contexts.values()).filter(c => c.type === type);
}

// Get rules by priority
export function getRulesByPriority(state: AdaptiveWritingState, minPriority: number = 1): AdaptationRule[] {
  return Array.from(state.rules.values())
    .filter(r => r.enabled && r.priority >= minPriority)
    .sort((a, b) => b.priority - a.priority);
}

// Check adaptation coverage
export function checkAdaptationCoverage(state: AdaptiveWritingState): number {
  if (state.totalContexts === 0) return 0;
  return state.enabledRules / (state.totalContexts * 3);
}

// Get adaptation report
export function getAdaptationReport(state: AdaptiveWritingState): {
  totalContexts: number;
  totalRules: number;
  enabledRules: number;
  averageReadingLevel: number;
  averageVocabulary: number;
  adaptationCoverage: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalContexts === 0) recommendations.push('No contexts — create writing contexts');
  if (state.adaptationCoverage < 0.5) recommendations.push('Low adaptation coverage — add more rules');
  if (state.averageVocabulary < 0.3 && state.contexts.size > 0) recommendations.push('Vocabulary level too low');

  return {
    totalContexts: state.totalContexts,
    totalRules: state.totalRules,
    enabledRules: state.enabledRules,
    averageReadingLevel: Math.round(state.averageReadingLevel * 100) / 100,
    averageVocabulary: Math.round(state.averageVocabulary * 100) / 100,
    adaptationCoverage: Math.round(state.adaptationCoverage * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptation(state: AdaptiveWritingState): AdaptiveWritingState {
  const contexts = Array.from(state.contexts.values());
  const rules = Array.from(state.rules.values());

  const averageReadingLevel = contexts.length > 0
    ? contexts.reduce((s, c) => s + c.readingLevel, 0) / contexts.length
    : 0.5;
  const averageVocabulary = contexts.length > 0
    ? contexts.reduce((s, c) => s + c.vocabularyLevel, 0) / contexts.length
    : 0.5;
  const enabledRules = rules.filter(r => r.enabled).length;
  const adaptationCoverage = state.totalContexts === 0 ? 0 : enabledRules / (state.totalContexts * 3);

  return { ...state, averageReadingLevel, averageVocabulary, enabledRules, adaptationCoverage };
}

// Reset adaptive state
export function resetAdaptiveWritingState(): AdaptiveWritingState {
  return createAdaptiveWritingState();
}