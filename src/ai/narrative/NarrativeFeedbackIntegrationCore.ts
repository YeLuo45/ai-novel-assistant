/**
 * V988 NarrativeFeedbackIntegrationCore — Direction A Iter 12/15 (Round 5)
 * Feedback integration core: integration of feedback into narrative
 * Sources: thunderbolt feedback + chatdev + nanobot
 */

export type IntegrationType = 'absorb' | 'adapt' | 'transform' | 'synthesize' | 'reframe' | 'transcend';
export type FeedbackSource = 'reader' | 'editor' | 'peer' | 'critic' | 'self' | 'metric';
export type IntegrationDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'radical';

export interface FeedbackUnit {
  unitId: string;
  source: FeedbackSource;
  content: string;
  sentiment: number;
  importance: number;
  chapter: number;
}

export interface IntegrationEvent {
  eventId: string;
  unitId: string;
  integration: IntegrationType;
  depth: IntegrationDepth;
  before: number;
  after: number;
  improvement: number;
  description: string;
  chapter: number;
}

export interface IntegrationPattern {
  patternId: string,
  name: string,
  eventIds: string[],
  averageImprovement: number,
  reuse: number,
}

export interface NarrativeFeedbackIntegrationCoreState {
  units: Map<string, FeedbackUnit>;
  events: Map<string, IntegrationEvent>;
  patterns: Map<string, IntegrationPattern>;
  totalUnits: number;
  totalEvents: number;
  totalPatterns: number;
  totalImprovement: number;
  averageImprovement: number;
  integrationMastery: number;
}

// Factory
export function createNarrativeFeedbackIntegrationCoreState(): NarrativeFeedbackIntegrationCoreState {
  return {
    units: new Map(),
    events: new Map(),
    patterns: new Map(),
    totalUnits: 0,
    totalEvents: 0,
    totalPatterns: 0,
    totalImprovement: 0,
    averageImprovement: 0,
    integrationMastery: 0.5,
  };
}

// Add unit
export function addFeedbackUnit(
  state: NarrativeFeedbackIntegrationCoreState,
  unitId: string,
  source: FeedbackSource,
  content: string,
  sentiment: number,
  importance: number,
  chapter: number
): NarrativeFeedbackIntegrationCoreState {
  const unit: FeedbackUnit = { unitId, source, content, sentiment, importance, chapter };
  const units = new Map(state.units).set(unitId, unit);
  return recomputeFeedbackInt({ ...state, units, totalUnits: units.size });
}

// Add event
export function addIntegrationEvent(
  state: NarrativeFeedbackIntegrationCoreState,
  eventId: string,
  unitId: string,
  integration: IntegrationType,
  depth: IntegrationDepth,
  before: number,
  after: number,
  description: string,
  chapter: number
): NarrativeFeedbackIntegrationCoreState {
  const improvement = Math.max(0, after - before);
  const event: IntegrationEvent = { eventId, unitId, integration, depth, before, after, improvement, description, chapter };
  const events = new Map(state.events).set(eventId, event);
  const totalImprovement = state.totalImprovement + improvement;
  return recomputeFeedbackInt({ ...state, events, totalImprovement, totalEvents: events.size });
}

// Add pattern
export function addIntegrationPattern(
  state: NarrativeFeedbackIntegrationCoreState,
  patternId: string,
  name: string,
  eventIds: string[]
): NarrativeFeedbackIntegrationCoreState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is IntegrationEvent => e !== undefined);
  const totalImprovement = events.reduce((s, e) => s + e.improvement, 0);
  const averageImprovement = events.length === 0 ? 0
    : totalImprovement / events.length;
  const pattern: IntegrationPattern = { patternId, name, eventIds, averageImprovement, reuse: 0 };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeFeedbackInt({ ...state, patterns, totalPatterns: patterns.size });
}

// Get events by integration
export function getEventsByIntegration(state: NarrativeFeedbackIntegrationCoreState, integration: IntegrationType): IntegrationEvent[] {
  return Array.from(state.events.values()).filter(e => e.integration === integration);
}

// Get integration report
export function getIntegrationReport(state: NarrativeFeedbackIntegrationCoreState): {
  totalUnits: number;
  totalEvents: number;
  totalImprovement: number;
  averageImprovement: number;
  integrationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add integration events');
  if (state.averageImprovement < 0.05) recommendations.push('Low improvement — improve integration');
  if (state.integrationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalUnits: state.totalUnits,
    totalEvents: state.totalEvents,
    totalImprovement: Math.round(state.totalImprovement * 100) / 100,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    integrationMastery: Math.round(state.integrationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeFeedbackInt(state: NarrativeFeedbackIntegrationCoreState): NarrativeFeedbackIntegrationCoreState {
  const events = Array.from(state.events.values());
  const totalImprovement = events.reduce((s, e) => s + e.improvement, 0);
  const averageImprovement = events.length === 0 ? 0
    : totalImprovement / events.length;

  const depthMap: Record<IntegrationDepth, number> = { surface: 0.2, shallow: 0.4, moderate: 0.6, deep: 0.8, radical: 1.0 };
  const averageDepth = events.length === 0 ? 0
    : events.reduce((s, e) => s + depthMap[e.depth], 0) / events.length;

  const patterns = Array.from(state.patterns.values());
  const patternEffectiveness = patterns.length === 0 ? 0
    : patterns.reduce((s, p) => s + p.averageImprovement, 0) / patterns.length;

  const integrationMastery = (averageImprovement * 0.4 + averageDepth * 0.3 + patternEffectiveness * 0.3);

  return { ...state, totalImprovement, averageImprovement, integrationMastery };
}

// Reset
export function resetNarrativeFeedbackIntegrationCoreState(): NarrativeFeedbackIntegrationCoreState {
  return createNarrativeFeedbackIntegrationCoreState();
}