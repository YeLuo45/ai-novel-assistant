/**
 * V1088 NarrativeExpansionEngine — Direction D Iter 12/20 (Round 6)
 * Narrative expansion engine: expand narrative elements
 * Sources: ruflo expansion + nanobot + thunderbolt
 */

export type ExpansionType = 'descriptive' | 'emotional' | 'contextual' | 'sensory' | 'thematic' | 'narrative';
export type ExpansionRichness = 'thin' | 'moderate' | 'rich' | 'lush' | 'baroque';
export type ExpansionNecessity = 'optional' | 'helpful' | 'important' | 'essential' | 'critical';

export interface ExpansionEvent {
  eventId: string;
  type: ExpansionType;
  richness: ExpansionRichness;
  necessity: ExpansionNecessity;
  description: string;
  baseValue: number;
  expanded: number;
  growth: number;
}

export interface ExpansionArc {
  arcId: string,
  eventIds: string[],
  totalGrowth: number,
  cohesion: number,
}

export interface NarrativeExpansionEngineState {
  events: Map<string, ExpansionEvent>;
  arcs: Map<string, ExpansionArc>;
  totalEvents: number;
  totalArcs: number;
  averageGrowth: number;
  averageRichness: number;
  arcCohesion: number;
  expansionMastery: number;
}

// Factory
export function createNarrativeExpansionEngineState(): NarrativeExpansionEngineState {
  return {
    events: new Map(),
    arcs: new Map(),
    totalEvents: 0,
    totalArcs: 0,
    averageGrowth: 0.5,
    averageRichness: 0.5,
    arcCohesion: 0.5,
    expansionMastery: 0.5,
  };
}

// Add event
export function addExpansionEvent(
  state: NarrativeExpansionEngineState,
  eventId: string,
  type: ExpansionType,
  richness: ExpansionRichness,
  necessity: ExpansionNecessity,
  description: string,
  baseValue: number,
  expanded: number
): NarrativeExpansionEngineState {
  const growth = Math.max(0, expanded - baseValue);
  const event: ExpansionEvent = { eventId, type, richness, necessity, description, baseValue, expanded, growth };
  const events = new Map(state.events).set(eventId, event);
  return recomputeExpansion({ ...state, events, totalEvents: events.size });
}

// Add arc
export function addExpansionArc(
  state: NarrativeExpansionEngineState,
  arcId: string,
  eventIds: string[]
): NarrativeExpansionEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is ExpansionEvent => e !== undefined);
  const totalGrowth = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.growth, 0) / events.length;
  const typeSet = new Set(events.map(e => e.type));
  const cohesion = Math.min(1, typeSet.size / 6);
  const arc: ExpansionArc = { arcId, eventIds, totalGrowth, cohesion };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeExpansion({ ...state, arcs, totalArcs: arcs.size });
}

// Get events by type
export function getExpansionEventsByType(state: NarrativeExpansionEngineState, type: ExpansionType): ExpansionEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get expansion report
export function getExpansionReport(state: NarrativeExpansionEngineState): {
  totalEvents: number;
  totalArcs: number;
  averageGrowth: number;
  averageRichness: number;
  expansionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add expansion events');
  if (state.averageGrowth < 0.2) recommendations.push('Low growth — strengthen');
  if (state.expansionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalArcs: state.totalArcs,
    averageGrowth: Math.round(state.averageGrowth * 100) / 100,
    averageRichness: Math.round(state.averageRichness * 100) / 100,
    expansionMastery: Math.round(state.expansionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeExpansion(state: NarrativeExpansionEngineState): NarrativeExpansionEngineState {
  const events = Array.from(state.events.values());
  const averageGrowth = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.growth, 0) / events.length;
  const averageRichness = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + (e.richness === 'baroque' ? 1 : e.richness === 'lush' ? 0.85 : e.richness === 'rich' ? 0.7 : e.richness === 'moderate' ? 0.5 : 0.3), 0) / events.length;

  const arcs = Array.from(state.arcs.values());
  const arcCohesion = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.cohesion, 0) / arcs.length;

  const expansionMastery = (averageGrowth * 0.4 + averageRichness * 0.3 + arcCohesion * 0.3);

  return { ...state, averageGrowth, averageRichness, arcCohesion, expansionMastery };
}

// Reset
export function resetNarrativeExpansionEngineState(): NarrativeExpansionEngineState {
  return createNarrativeExpansionEngineState();
}