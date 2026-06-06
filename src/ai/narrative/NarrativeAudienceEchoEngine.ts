/**
 * V1250 NarrativeAudienceEchoEngine — Direction H Iter 13/20 (Round 5)
 * Audience echo engine: echo of narrative in audience
 * Sources: thunderbolt echo + nanobot + ruflo
 */

export type AudienceEchoType = 'phrase' | 'image' | 'theme' | 'moment' | 'feeling' | 'idea';
export type AudienceEchoStrength = 'faint' | 'subtle' | 'clear' | 'loud' | 'resonant';
export type AudienceEchoSpread = 'self' | 'intimate' | 'social' | 'cultural' | 'universal';

export interface AudienceEcho {
  echoId: string;
  type: AudienceEchoType;
  strength: AudienceEchoStrength;
  spread: AudienceEchoSpread;
  description: string;
  clarity: number;
  persistence: number;
  chapter: number;
}

export interface AudienceEchoChamber {
  chamberId: string,
  echoIds: string[],
  cumulativeClarity: number,
  resonance: number,
}

export interface NarrativeAudienceEchoEngineState {
  echoes: Map<string, AudienceEcho>;
  chambers: Map<string, AudienceEchoChamber>;
  totalEchoes: number;
  totalChambers: number;
  averageClarity: number;
  averagePersistence: number;
  chamberResonance: number;
  audienceEchoMastery: number;
}

// Factory
export function createNarrativeAudienceEchoEngineState(): NarrativeAudienceEchoEngineState {
  return {
    echoes: new Map(),
    chambers: new Map(),
    totalEchoes: 0,
    totalChambers: 0,
    averageClarity: 0.5,
    averagePersistence: 0.5,
    chamberResonance: 0.5,
    audienceEchoMastery: 0.5,
  };
}

// Add echo
export function addAudienceEcho(
  state: NarrativeAudienceEchoEngineState,
  echoId: string,
  type: AudienceEchoType,
  strength: AudienceEchoStrength,
  spread: AudienceEchoSpread,
  description: string,
  clarity: number,
  persistence: number,
  chapter: number
): NarrativeAudienceEchoEngineState {
  const echo: AudienceEcho = { echoId, type, strength, spread, description, clarity, persistence, chapter };
  const echoes = new Map(state.echoes).set(echoId, echo);
  return recomputeAudienceEcho({ ...state, echoes, totalEchoes: echoes.size });
}

// Add chamber
export function addAudienceEchoChamber(
  state: NarrativeAudienceEchoEngineState,
  chamberId: string,
  echoIds: string[]
): NarrativeAudienceEchoEngineState {
  const echoes = echoIds.map(id => state.echoes.get(id)).filter((e): e is AudienceEcho => e !== undefined);
  const cumulativeClarity = echoes.length === 0 ? 0
    : echoes.reduce((s, e) => s + e.clarity, 0) / echoes.length;
  const typeSet = new Set(echoes.map(e => e.type));
  const resonance = Math.min(1, typeSet.size / 6);
  const chamber: AudienceEchoChamber = { chamberId, echoIds, cumulativeClarity, resonance };
  const chambers = new Map(state.chambers).set(chamberId, chamber);
  return recomputeAudienceEcho({ ...state, chambers, totalChambers: chambers.size });
}

// Get echoes by type
export function getAudienceEchoesByType(state: NarrativeAudienceEchoEngineState, type: AudienceEchoType): AudienceEcho[] {
  return Array.from(state.echoes.values()).filter(e => e.type === type);
}

// Get audience echo report
export function getAudienceEchoReport(state: NarrativeAudienceEchoEngineState): {
  totalEchoes: number;
  totalChambers: number;
  averageClarity: number;
  averagePersistence: number;
  audienceEchoMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEchoes === 0) recommendations.push('No echoes — add audience echoes');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.audienceEchoMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEchoes: state.totalEchoes,
    totalChambers: state.totalChambers,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averagePersistence: Math.round(state.averagePersistence * 100) / 100,
    audienceEchoMastery: Math.round(state.audienceEchoMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceEcho(state: NarrativeAudienceEchoEngineState): NarrativeAudienceEchoEngineState {
  const echoes = Array.from(state.echoes.values());
  const averageClarity = echoes.length === 0 ? 0.5
    : echoes.reduce((s, e) => s + e.clarity, 0) / echoes.length;
  const averagePersistence = echoes.length === 0 ? 0.5
    : echoes.reduce((s, e) => s + e.persistence, 0) / echoes.length;

  const chambers = Array.from(state.chambers.values());
  const chamberResonance = chambers.length === 0 ? 0.5
    : chambers.reduce((s, c) => s + c.resonance, 0) / chambers.length;

  const audienceEchoMastery = (averageClarity * 0.4 + averagePersistence * 0.3 + chamberResonance * 0.3);

  return { ...state, averageClarity, averagePersistence, chamberResonance, audienceEchoMastery };
}

// Reset
export function resetNarrativeAudienceEchoEngineState(): NarrativeAudienceEchoEngineState {
  return createNarrativeAudienceEchoEngineState();
}