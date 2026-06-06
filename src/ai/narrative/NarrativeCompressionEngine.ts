/**
 * V1086 NarrativeCompressionEngine — Direction D Iter 11/20 (Round 6)
 * Narrative compression engine: compress narrative elements
 * Sources: nanobot compression + thunderbolt + ruflo
 */

export type CompressionType = 'temporal' | 'spatial' | 'descriptive' | 'dialogue' | 'narrative' | 'emotional';
export type CompressionRatio = 'light' | 'moderate' | 'heavy' | 'extreme' | 'atomic';
export type CompressionQuality = 'lossy' | 'acceptable' | 'good' | 'excellent' | 'lossless';

export interface CompressionEvent {
  eventId: string;
  type: CompressionType;
  ratio: CompressionRatio;
  quality: CompressionQuality;
  description: string;
  originalSize: number;
  compressedSize: number;
  ratio_actual: number;
}

export interface CompressionPlan {
  planId: string,
  name: string,
  eventIds: string[],
  totalRatio: number,
  averageQuality: number,
}

export interface NarrativeCompressionEngineState {
  events: Map<string, CompressionEvent>;
  plans: Map<string, CompressionPlan>;
  totalEvents: number;
  totalPlans: number;
  averageRatio: number;
  averageQuality: number;
  planQuality: number;
  compressionMastery: number;
}

// Factory
export function createNarrativeCompressionEngineState(): NarrativeCompressionEngineState {
  return {
    events: new Map(),
    plans: new Map(),
    totalEvents: 0,
    totalPlans: 0,
    averageRatio: 0.5,
    averageQuality: 0.5,
    planQuality: 0.5,
    compressionMastery: 0.5,
  };
}

// Add event
export function addCompressionEvent(
  state: NarrativeCompressionEngineState,
  eventId: string,
  type: CompressionType,
  ratio: CompressionRatio,
  quality: CompressionQuality,
  description: string,
  originalSize: number,
  compressedSize: number
): NarrativeCompressionEngineState {
  const ratioActual = originalSize === 0 ? 0 : 1 - compressedSize / originalSize;
  const event: CompressionEvent = { eventId, type, ratio, quality, description, originalSize, compressedSize, ratio_actual: ratioActual };
  const events = new Map(state.events).set(eventId, event);
  return recomputeCompression({ ...state, events, totalEvents: events.size });
}

// Add plan
export function addCompressionPlan(
  state: NarrativeCompressionEngineState,
  planId: string,
  name: string,
  eventIds: string[]
): NarrativeCompressionEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is CompressionEvent => e !== undefined);
  const totalRatio = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.ratio_actual, 0) / events.length;
  const averageQuality = events.length === 0 ? 0
    : events.reduce((s, e) => s + (e.quality === 'lossless' ? 1 : e.quality === 'excellent' ? 0.85 : e.quality === 'good' ? 0.7 : e.quality === 'acceptable' ? 0.5 : 0.3), 0) / events.length;
  const plan: CompressionPlan = { planId, name, eventIds, totalRatio, averageQuality };
  const plans = new Map(state.plans).set(planId, plan);
  return recomputeCompression({ ...state, plans, totalPlans: plans.size });
}

// Get events by type
export function getCompressionEventsByType(state: NarrativeCompressionEngineState, type: CompressionType): CompressionEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get compression report
export function getCompressionReport(state: NarrativeCompressionEngineState): {
  totalEvents: number;
  totalPlans: number;
  averageRatio: number;
  averageQuality: number;
  compressionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add compression events');
  if (state.averageQuality < 0.5) recommendations.push('Low quality — improve');
  if (state.compressionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalPlans: state.totalPlans,
    averageRatio: Math.round(state.averageRatio * 100) / 100,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    compressionMastery: Math.round(state.compressionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCompression(state: NarrativeCompressionEngineState): NarrativeCompressionEngineState {
  const events = Array.from(state.events.values());
  const averageRatio = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.ratio_actual, 0) / events.length;
  const averageQuality = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + (e.quality === 'lossless' ? 1 : e.quality === 'excellent' ? 0.85 : e.quality === 'good' ? 0.7 : e.quality === 'acceptable' ? 0.5 : 0.3), 0) / events.length;

  const plans = Array.from(state.plans.values());
  const planQuality = plans.length === 0 ? 0.5
    : plans.reduce((s, p) => s + p.averageQuality, 0) / plans.length;

  const compressionMastery = (averageQuality * 0.4 + planQuality * 0.3 + averageRatio * 0.3);

  return { ...state, averageRatio, averageQuality, planQuality, compressionMastery };
}

// Reset
export function resetNarrativeCompressionEngineState(): NarrativeCompressionEngineState {
  return createNarrativeCompressionEngineState();
}