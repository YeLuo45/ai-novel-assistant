/**
 * V690 StoryWorldBuilder — Direction B Iter 4/9 (Round 2)
 * Story world builder: locations + lore + history + geography
 * Sources: nanobot world + ruflo hierarchical + thunderbolt
 */

export type LocationType = 'city' | 'wilderness' | 'building' | 'underground' | 'magical' | 'fictional';
export type WorldEra = 'ancient' | 'medieval' | 'modern' | 'futuristic' | 'timeless';
export type LocationRole = 'primary' | 'secondary' | 'mentioned' | 'imagined';

export interface WorldLocation {
  locationId: string;
  name: string;
  type: LocationType;
  era: WorldEra;
  role: LocationRole;
  description: string;
  atmosphere: string;
  features: string[];
  significance: number;
  visits: number;
}

export interface WorldHistoryEvent {
  eventId: string;
  title: string;
  description: string;
  era: WorldEra;
  impact: number;
  affectedLocations: string[];
}

export interface StoryWorldBuilderState {
  locations: Map<string, WorldLocation>;
  historyEvents: Map<string, WorldHistoryEvent>;
  totalLocations: number;
  totalHistoryEvents: number;
  averageSignificance: number;
  worldCoherence: number;
  primaryLocations: number;
  locationsByEra: Map<WorldEra, number>;
}

// Factory
export function createStoryWorldBuilderState(): StoryWorldBuilderState {
  return {
    locations: new Map(),
    historyEvents: new Map(),
    totalLocations: 0,
    totalHistoryEvents: 0,
    averageSignificance: 0.5,
    worldCoherence: 0.5,
    primaryLocations: 0,
    locationsByEra: new Map(),
  };
}

// Add location
export function addLocation(
  state: StoryWorldBuilderState,
  locationId: string,
  name: string,
  type: LocationType,
  era: WorldEra,
  role: LocationRole,
  description: string,
  atmosphere: string = '',
  features: string[] = [],
  significance: number = 0.5
): StoryWorldBuilderState {
  const location: WorldLocation = {
    locationId,
    name,
    type,
    era,
    role,
    description,
    atmosphere,
    features,
    significance,
    visits: 0,
  };

  const locations = new Map(state.locations).set(locationId, location);
  const locationsByEra = new Map(state.locationsByEra);
  locationsByEra.set(era, (locationsByEra.get(era) || 0) + 1);

  return recomputeWorld({ ...state, locations, locationsByEra, totalLocations: locations.size });
}

// Add history event
export function addHistoryEvent(
  state: StoryWorldBuilderState,
  eventId: string,
  title: string,
  description: string,
  era: WorldEra,
  impact: number,
  affectedLocations: string[] = []
): StoryWorldBuilderState {
  const event: WorldHistoryEvent = {
    eventId,
    title,
    description,
    era,
    impact: Math.min(1, Math.max(0, impact)),
    affectedLocations,
  };

  const historyEvents = new Map(state.historyEvents).set(eventId, event);
  return recomputeWorld({ ...state, historyEvents, totalHistoryEvents: historyEvents.size });
}

// Record location visit
export function recordLocationVisit(state: StoryWorldBuilderState, locationId: string): StoryWorldBuilderState {
  const location = state.locations.get(locationId);
  if (!location) return state;

  const updated: WorldLocation = { ...location, visits: location.visits + 1 };
  const locations = new Map(state.locations).set(locationId, updated);
  return { ...state, locations };
}

// Get locations by era
export function getLocationsByEra(state: StoryWorldBuilderState, era: WorldEra): WorldLocation[] {
  return Array.from(state.locations.values()).filter(l => l.era === era);
}

// Get primary locations
export function getPrimaryLocations(state: StoryWorldBuilderState): WorldLocation[] {
  return Array.from(state.locations.values()).filter(l => l.role === 'primary');
}

// Get world report
export function getWorldReport(state: StoryWorldBuilderState): {
  totalLocations: number;
  totalHistoryEvents: number;
  averageSignificance: number;
  worldCoherence: number;
  primaryLocations: number;
  locationsByEra: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLocations < 3) recommendations.push('Add more locations to flesh out world');
  if (state.totalHistoryEvents < 2) recommendations.push('Add history events for world depth');
  if (state.primaryLocations === 0) recommendations.push('Add primary locations for story focus');
  if (state.worldCoherence < 0.4) recommendations.push('Improve world coherence — connect locations');

  const locationsByEra: Record<string, number> = {};
  state.locationsByEra.forEach((count, era) => {
    locationsByEra[era] = count;
  });

  return {
    totalLocations: state.totalLocations,
    totalHistoryEvents: state.totalHistoryEvents,
    averageSignificance: Math.round(state.averageSignificance * 100) / 100,
    worldCoherence: Math.round(state.worldCoherence * 100) / 100,
    primaryLocations: state.primaryLocations,
    locationsByEra,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorld(state: StoryWorldBuilderState): StoryWorldBuilderState {
  const locations = Array.from(state.locations.values());
  const averageSignificance = locations.length > 0
    ? locations.reduce((s, l) => s + l.significance, 0) / locations.length
    : 0.5;

  const primaryLocations = locations.filter(l => l.role === 'primary').length;
  const historyEvents = Array.from(state.historyEvents.values());

  let worldCoherence = 0.5;
  if (historyEvents.length > 0 && locations.length > 0) {
    const linkedLocations = historyEvents.reduce((s, e) => s + e.affectedLocations.length, 0);
    worldCoherence = Math.min(1, linkedLocations / (locations.length * 2));
  }

  return { ...state, averageSignificance, primaryLocations, worldCoherence };
}

// Reset world state
export function resetStoryWorldBuilderState(): StoryWorldBuilderState {
  return createStoryWorldBuilderState();
}