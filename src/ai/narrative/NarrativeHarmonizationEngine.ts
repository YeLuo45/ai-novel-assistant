/**
 * V1096 NarrativeHarmonizationEngine — Direction D Iter 16/20 (Round 6)
 * Narrative harmonization engine: harmonize narrative elements
 * Sources: thunderbolt harmonization + nanobot + ruflo
 */

export type HarmonizationMode = 'dissonant' | 'consonant' | 'polyphonic' | 'syncopated' | 'symphonic';
export type HarmonizationLevel = 'partial' | 'local' | 'sectional' | 'arc' | 'complete';
export type HarmonizationTension = 'consonant' | 'slight' | 'moderate' | 'high' | 'extreme';

export interface HarmonizationEvent {
  eventId: string;
  mode: HarmonizationMode;
  level: HarmonizationLevel;
  tension: HarmonizationTension;
  description: string;
  unity: number;
  richness: number;
  chapter: number;
}

export interface HarmonizationLayer {
  layerId: string,
  eventIds: string[],
  cumulativeUnity: number,
  depth: number,
}

export interface NarrativeHarmonizationEngineState {
  events: Map<string, HarmonizationEvent>;
  layers: Map<string, HarmonizationLayer>;
  totalEvents: number;
  totalLayers: number;
  averageUnity: number;
  averageRichness: number;
  layerDepth: number;
  harmonizationMastery: number;
}

// Factory
export function createNarrativeHarmonizationEngineState(): NarrativeHarmonizationEngineState {
  return {
    events: new Map(),
    layers: new Map(),
    totalEvents: 0,
    totalLayers: 0,
    averageUnity: 0.5,
    averageRichness: 0.5,
    layerDepth: 0.5,
    harmonizationMastery: 0.5,
  };
}

// Add event
export function addHarmonizationEvent(
  state: NarrativeHarmonizationEngineState,
  eventId: string,
  mode: HarmonizationMode,
  level: HarmonizationLevel,
  tension: HarmonizationTension,
  description: string,
  unity: number,
  richness: number,
  chapter: number
): NarrativeHarmonizationEngineState {
  const event: HarmonizationEvent = { eventId, mode, level, tension, description, unity, richness, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeHarmonization({ ...state, events, totalEvents: events.size });
}

// Add layer
export function addHarmonizationLayer(
  state: NarrativeHarmonizationEngineState,
  layerId: string,
  eventIds: string[]
): NarrativeHarmonizationEngineState {
  const events = eventIds.map(id => state.events.get(id)).filter((e): e is HarmonizationEvent => e !== undefined);
  const cumulativeUnity = events.length === 0 ? 0
    : events.reduce((s, e) => s + e.unity, 0) / events.length;
  const modeSet = new Set(events.map(e => e.mode));
  const depth = Math.min(1, modeSet.size / 5);
  const layer: HarmonizationLayer = { layerId, eventIds, cumulativeUnity, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeHarmonization({ ...state, layers, totalLayers: layers.size });
}

// Get events by mode
export function getHarmonizationEventsByMode(state: NarrativeHarmonizationEngineState, mode: HarmonizationMode): HarmonizationEvent[] {
  return Array.from(state.events.values()).filter(e => e.mode === mode);
}

// Get harmonization report
export function getHarmonizationReport(state: NarrativeHarmonizationEngineState): {
  totalEvents: number;
  totalLayers: number;
  averageUnity: number;
  averageRichness: number;
  harmonizationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add harmonization events');
  if (state.averageUnity < 0.5) recommendations.push('Low unity — improve');
  if (state.harmonizationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalLayers: state.totalLayers,
    averageUnity: Math.round(state.averageUnity * 100) / 100,
    averageRichness: Math.round(state.averageRichness * 100) / 100,
    harmonizationMastery: Math.round(state.harmonizationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeHarmonization(state: NarrativeHarmonizationEngineState): NarrativeHarmonizationEngineState {
  const events = Array.from(state.events.values());
  const averageUnity = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.unity, 0) / events.length;
  const averageRichness = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.richness, 0) / events.length;

  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.depth, 0) / layers.length;

  const harmonizationMastery = (averageUnity * 0.4 + averageRichness * 0.3 + layerDepth * 0.3);

  return { ...state, averageUnity, averageRichness, layerDepth, harmonizationMastery };
}

// Reset
export function resetNarrativeHarmonizationEngineState(): NarrativeHarmonizationEngineState {
  return createNarrativeHarmonizationEngineState();
}