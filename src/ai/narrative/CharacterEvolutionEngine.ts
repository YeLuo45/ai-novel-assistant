/**
 * V786 CharacterEvolutionEngine — Direction C Iter 7/9 (Round 3)
 * Character evolution engine: growth tracking + transformation phases
 * Sources: nanobot growth + chatdev evolution + thunderbolt
 */

export type EvolutionPhase = 'stable' | 'questioning' | 'struggling' | 'transforming' | 'transformed' | 'integrating';
export type EvolutionType = 'growth' | 'regression' | 'plateau' | 'crisis' | 'breakthrough' | 'integration';
export type EvolutionImpact = 'personal' | 'interpersonal' | 'societal' | 'philosophical' | 'spiritual';

export interface EvolutionEvent {
  eventId: string;
  characterId: string;
  type: EvolutionType;
  phase: EvolutionPhase;
  impact: EvolutionImpact;
  description: string;
  trigger: string;
  chapter: number;
  timestamp: number;
  resolved: boolean;
}

export interface CharacterEvolutionState {
  characterId: string;
  currentPhase: EvolutionPhase;
  evolutionHistory: string[];
  totalEvents: number;
  breakthroughs: number;
  crises: number;
  growthScore: number;
  stabilityIndex: number;
  lastUpdate: number;
}

export interface CharacterEvolutionEngineState {
  characters: Map<string, CharacterEvolutionState>;
  events: Map<string, EvolutionEvent>;
  totalCharacters: number;
  totalEvents: number;
  averageGrowth: number;
  averageStability: number;
  breakthroughRate: number;
  phaseDistribution: Map<EvolutionPhase, number>;
  evolutionMomentum: number;
}

// Factory
export function createCharacterEvolutionEngineState(): CharacterEvolutionEngineState {
  return {
    characters: new Map(),
    events: new Map(),
    totalCharacters: 0,
    totalEvents: 0,
    averageGrowth: 0,
    averageStability: 0.5,
    breakthroughRate: 0,
    phaseDistribution: new Map(),
    evolutionMomentum: 0.5,
  };
}

// Create character evolution state
export function createCharacterEvolution(
  state: CharacterEvolutionEngineState,
  characterId: string
): CharacterEvolutionEngineState {
  const evolutionState: CharacterEvolutionState = {
    characterId,
    currentPhase: 'stable',
    evolutionHistory: [],
    totalEvents: 0,
    breakthroughs: 0,
    crises: 0,
    growthScore: 0,
    stabilityIndex: 0.5,
    lastUpdate: Date.now(),
  };
  const characters = new Map(state.characters).set(characterId, evolutionState);
  return recomputeEvolution({ ...state, characters, totalCharacters: characters.size });
}

// Add evolution event
export function addEvolutionEvent(
  state: CharacterEvolutionEngineState,
  eventId: string,
  characterId: string,
  type: EvolutionType,
  phase: EvolutionPhase,
  impact: EvolutionImpact,
  description: string,
  trigger: string,
  chapter: number
): CharacterEvolutionEngineState {
  // Ensure character exists
  let next = state;
  if (!state.characters.has(characterId)) {
    next = createCharacterEvolution(state, characterId);
  }

  const event: EvolutionEvent = { eventId, characterId, type, phase, impact, description, trigger, chapter, timestamp: Date.now(), resolved: false };
  const events = new Map(next.events).set(eventId, event);

  // Update character state
  const charState = next.characters.get(characterId);
  let characters = next.characters;
  if (charState) {
    const isBreakthrough = type === 'breakthrough';
    const isCrisis = type === 'crisis';
    const growthDelta = type === 'growth' ? 0.2 : type === 'regression' ? -0.1 : 0;
    const updated: CharacterEvolutionState = {
      ...charState,
      currentPhase: phase,
      evolutionHistory: [...charState.evolutionHistory, description],
      totalEvents: charState.totalEvents + 1,
      breakthroughs: charState.breakthroughs + (isBreakthrough ? 1 : 0),
      crises: charState.crises + (isCrisis ? 1 : 0),
      growthScore: Math.max(0, charState.growthScore + growthDelta),
      stabilityIndex: isCrisis ? Math.max(0, charState.stabilityIndex - 0.2) : Math.min(1, charState.stabilityIndex + 0.05),
      lastUpdate: Date.now(),
    };
    characters = new Map(next.characters).set(characterId, updated);
  }

  const phaseDistribution = new Map(next.phaseDistribution);
  phaseDistribution.set(phase, (phaseDistribution.get(phase) || 0) + 1);

  return recomputeEvolution({ ...next, characters, events, phaseDistribution, totalEvents: events.size });
}

// Resolve event
export function resolveEvolutionEvent(state: CharacterEvolutionEngineState, eventId: string): CharacterEvolutionEngineState {
  const event = state.events.get(eventId);
  if (!event) return state;

  const updated: EvolutionEvent = { ...event, resolved: true };
  const events = new Map(state.events).set(eventId, updated);
  return recomputeEvolution({ ...state, events });
}

// Get events by character
export function getEventsByCharacter(state: CharacterEvolutionEngineState, characterId: string): EvolutionEvent[] {
  return Array.from(state.events.values()).filter(e => e.characterId === characterId);
}

// Get events by type
export function getEventsByType(state: CharacterEvolutionEngineState, type: EvolutionType): EvolutionEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get evolution report
export function getEvolutionReport(state: CharacterEvolutionEngineState): {
  totalCharacters: number;
  totalEvents: number;
  averageGrowth: number;
  averageStability: number;
  breakthroughRate: number;
  evolutionMomentum: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCharacters === 0) recommendations.push('No characters — create character evolutions');
  if (state.evolutionMomentum < 0.3) recommendations.push('Low momentum — trigger events');
  if (state.breakthroughRate < 0.1) recommendations.push('Low breakthroughs — add transformative events');

  return {
    totalCharacters: state.totalCharacters,
    totalEvents: state.totalEvents,
    averageGrowth: Math.round(state.averageGrowth * 100) / 100,
    averageStability: Math.round(state.averageStability * 100) / 100,
    breakthroughRate: Math.round(state.breakthroughRate * 100) / 100,
    evolutionMomentum: Math.round(state.evolutionMomentum * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEvolution(state: CharacterEvolutionEngineState): CharacterEvolutionEngineState {
  const characters = Array.from(state.characters.values());
  const averageGrowth = characters.length === 0 ? 0
    : characters.reduce((s, c) => s + c.growthScore, 0) / characters.length;
  const averageStability = characters.length === 0 ? 0.5
    : characters.reduce((s, c) => s + c.stabilityIndex, 0) / characters.length;

  const totalBreakthroughs = characters.reduce((s, c) => s + c.breakthroughs, 0);
  const totalEvents = state.totalEvents;
  const breakthroughRate = totalEvents === 0 ? 0 : totalBreakthroughs / totalEvents;

  const recentEvents = Array.from(state.events.values()).filter(e => Date.now() - e.timestamp < 1000000);
  const evolutionMomentum = state.totalEvents === 0 ? 0.5
    : Math.min(1, recentEvents.length / Math.max(1, state.totalCharacters));

  return { ...state, averageGrowth, averageStability, breakthroughRate, evolutionMomentum };
}

// Reset evolution state
export function resetCharacterEvolutionEngineState(): CharacterEvolutionEngineState {
  return createCharacterEvolutionEngineState();
}