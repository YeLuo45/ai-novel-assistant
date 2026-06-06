/**
 * V952 NarrativeCreationEngine — Direction E Iter 9/15 (Round 4)
 * Narrative creation engine: creation process + generative aspects
 * Sources: nanobot creation + chatdev + thunderbolt
 */

export type CreationStage = 'inspiration' | 'conception' | 'incubation' | 'creation' | 'revision' | 'completion';
export type CreationFlow = 'struggling' | 'searching' | 'flowing' | 'productive' | 'effortless';
export type CreationQuality = 'amateur' | 'developing' | 'competent' | 'professional' | 'masterful';

export interface CreationEvent {
  eventId: string;
  stage: CreationStage;
  flow: CreationFlow;
  quality: CreationQuality;
  description: string;
  output: string;
  inspiration: number;
  chapter: number;
}

export interface CreativeWork {
  workId: string,
  title: string,
  events: string[],
  overallQuality: CreationQuality,
  totalInspiration: number,
  completed: boolean,
}

export interface NarrativeCreationEngineState {
  events: Map<string, CreationEvent>;
  works: Map<string, CreativeWork>;
  totalEvents: number;
  totalWorks: number;
  completedWorks: number;
  averageInspiration: number;
  creativeFlow: number;
  creationMastery: number;
}

// Factory
export function createNarrativeCreationEngineState(): NarrativeCreationEngineState {
  return {
    events: new Map(),
    works: new Map(),
    totalEvents: 0,
    totalWorks: 0,
    completedWorks: 0,
    averageInspiration: 0.5,
    creativeFlow: 0.5,
    creationMastery: 0.5,
  };
}

// Add event
export function addCreationEvent(
  state: NarrativeCreationEngineState,
  eventId: string,
  stage: CreationStage,
  flow: CreationFlow,
  quality: CreationQuality,
  description: string,
  output: string,
  inspiration: number,
  chapter: number
): NarrativeCreationEngineState {
  const event: CreationEvent = { eventId, stage, flow, quality, description, output, inspiration, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeCreation({ ...state, events, totalEvents: events.size });
}

// Add work
export function addCreativeWork(
  state: NarrativeCreationEngineState,
  workId: string,
  title: string,
  eventIds: string[]
): NarrativeCreationEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is CreationEvent => e !== undefined);
  const totalInspiration = events.reduce((s, e) => s + e.inspiration, 0);
  const qualityMap: Record<CreationQuality, number> = { amateur: 0.2, developing: 0.4, competent: 0.6, professional: 0.8, masterful: 1.0 };
  const avgQualityValue = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + qualityMap[e.quality], 0) / events.length;
  const overallQuality: CreationQuality = avgQualityValue < 0.3 ? 'amateur'
    : avgQualityValue < 0.5 ? 'developing'
    : avgQualityValue < 0.7 ? 'competent'
    : avgQualityValue < 0.9 ? 'professional'
    : 'masterful';
  const work: CreativeWork = { workId, title, events: eventIds, overallQuality, totalInspiration, completed: false };
  const works = new Map(state.works).set(workId, work);
  return recomputeCreation({ ...state, works, totalWorks: works.size });
}

// Complete work
export function completeCreativeWork(state: NarrativeCreationEngineState, workId: string): NarrativeCreationEngineState {
  const work = state.works.get(workId);
  if (!work) return state;

  const updated: CreativeWork = { ...work, completed: true };
  const works = new Map(state.works).set(workId, updated);
  const completedWorks = state.completedWorks + 1;
  return recomputeCreation({ ...state, works, completedWorks });
}

// Get events by stage
export function getEventsByStage(state: NarrativeCreationEngineState, stage: CreationStage): CreationEvent[] {
  return Array.from(state.events.values()).filter(e => e.stage === stage);
}

// Get creation report
export function getCreationReport(state: NarrativeCreationEngineState): {
  totalEvents: number;
  totalWorks: number;
  completedWorks: number;
  averageInspiration: number;
  creativeFlow: number;
  creationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add creation events');
  if (state.averageInspiration < 0.5) recommendations.push('Low inspiration — seek inspiration');
  if (state.creationMastery < 0.5) recommendations.push('Low mastery — develop craft');

  return {
    totalEvents: state.totalEvents,
    totalWorks: state.totalWorks,
    completedWorks: state.completedWorks,
    averageInspiration: Math.round(state.averageInspiration * 100) / 100,
    creativeFlow: Math.round(state.creativeFlow * 100) / 100,
    creationMastery: Math.round(state.creationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCreation(state: NarrativeCreationEngineState): NarrativeCreationEngineState {
  const events = Array.from(state.events.values());
  const averageInspiration = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.inspiration, 0) / events.length;

  const flowMap: Record<CreationFlow, number> = { struggling: 0.1, searching: 0.3, flowing: 0.6, productive: 0.8, effortless: 1.0 };
  const avgFlow = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + flowMap[e.flow], 0) / events.length;
  const creativeFlow = avgFlow;

  const completionRate = state.totalWorks === 0 ? 0
    : state.completedWorks / state.totalWorks;

  const creationMastery = (averageInspiration * 0.4 + creativeFlow * 0.3 + completionRate * 0.3);

  return { ...state, averageInspiration, creativeFlow, creationMastery };
}

// Reset creation state
export function resetNarrativeCreationEngineState(): NarrativeCreationEngineState {
  return createNarrativeCreationEngineState();
}