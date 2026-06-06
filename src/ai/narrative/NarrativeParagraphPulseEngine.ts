/**
 * V1150 NarrativeParagraphPulseEngine — Direction F Iter 3/20 (Round 5)
 * Paragraph pulse engine: pulse of paragraphs
 * Sources: thunderbolt pulse + nanobot + ruflo
 */

export type ParagraphPulseType = 'single_beat' | 'multi_beat' | 'building' | 'releasing' | 'rhythmic' | 'syncopated';
export type ParagraphPulseDensity = 'sparse' | 'light' | 'moderate' | 'dense' | 'packed';
export type ParagraphPulseBreathing = 'tight' | 'comfortable' | 'expansive' | 'airy' | 'weightless';

export interface ParagraphPulse {
  pulseId: string;
  type: ParagraphPulseType;
  density: ParagraphPulseDensity;
  breathing: ParagraphPulseBreathing;
  description: string;
  impact: number;
  flow: number;
  chapter: number;
}

export interface ParagraphPulseBeat {
  beatId: string,
  pulseIds: string[],
  cumulativeImpact: number,
  flow: number,
}

export interface NarrativeParagraphPulseEngineState {
  pulses: Map<string, ParagraphPulse>;
  beats: Map<string, ParagraphPulseBeat>;
  totalPulses: number;
  totalBeats: number;
  averageImpact: number;
  averageFlow: number;
  beatFlow: number;
  paragraphPulseMastery: number;
}

// Factory
export function createNarrativeParagraphPulseEngineState(): NarrativeParagraphPulseEngineState {
  return {
    pulses: new Map(),
    beats: new Map(),
    totalPulses: 0,
    totalBeats: 0,
    averageImpact: 0.5,
    averageFlow: 0.5,
    beatFlow: 0.5,
    paragraphPulseMastery: 0.5,
  };
}

// Add pulse
export function addParagraphPulse(
  state: NarrativeParagraphPulseEngineState,
  pulseId: string,
  type: ParagraphPulseType,
  density: ParagraphPulseDensity,
  breathing: ParagraphPulseBreathing,
  description: string,
  impact: number,
  flow: number,
  chapter: number
): NarrativeParagraphPulseEngineState {
  const pulse: ParagraphPulse = { pulseId, type, density, breathing, description, impact, flow, chapter };
  const pulses = new Map(state.pulses).set(pulseId, pulse);
  return recomputeParagraphPulse({ ...state, pulses, totalPulses: pulses.size });
}

// Add beat
export function addParagraphPulseBeat(
  state: NarrativeParagraphPulseEngineState,
  beatId: string,
  pulseIds: string[]
): NarrativeParagraphPulseEngineState {
  const pulses = pulseIds.map(id => state.pulses.get(id)).filter((p): p is ParagraphPulse => p !== undefined);
  const cumulativeImpact = pulses.length === 0 ? 0
    : pulses.reduce((s, p) => s + p.impact, 0) / pulses.length;
  const flow = pulses.length < 2 ? 0.5
    : 1 - Math.abs(pulses[0].flow - pulses[pulses.length - 1].flow);
  const beat: ParagraphPulseBeat = { beatId, pulseIds, cumulativeImpact, flow };
  const beats = new Map(state.beats).set(beatId, beat);
  return recomputeParagraphPulse({ ...state, beats, totalBeats: beats.size });
}

// Get pulses by type
export function getParagraphPulsesByType(state: NarrativeParagraphPulseEngineState, type: ParagraphPulseType): ParagraphPulse[] {
  return Array.from(state.pulses.values()).filter(p => p.type === type);
}

// Get paragraph pulse report
export function getParagraphPulseReport(state: NarrativeParagraphPulseEngineState): {
  totalPulses: number;
  totalBeats: number;
  averageImpact: number;
  averageFlow: number;
  paragraphPulseMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPulses === 0) recommendations.push('No pulses — add paragraph pulses');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.paragraphPulseMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPulses: state.totalPulses,
    totalBeats: state.totalBeats,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageFlow: Math.round(state.averageFlow * 100) / 100,
    paragraphPulseMastery: Math.round(state.paragraphPulseMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeParagraphPulse(state: NarrativeParagraphPulseEngineState): NarrativeParagraphPulseEngineState {
  const pulses = Array.from(state.pulses.values());
  const averageImpact = pulses.length === 0 ? 0.5
    : pulses.reduce((s, p) => s + p.impact, 0) / pulses.length;
  const averageFlow = pulses.length === 0 ? 0.5
    : pulses.reduce((s, p) => s + p.flow, 0) / pulses.length;

  const beats = Array.from(state.beats.values());
  const beatFlow = beats.length === 0 ? 0.5
    : beats.reduce((s, b) => s + b.flow, 0) / beats.length;

  const paragraphPulseMastery = (averageImpact * 0.4 + averageFlow * 0.3 + beatFlow * 0.3);

  return { ...state, averageImpact, averageFlow, beatFlow, paragraphPulseMastery };
}

// Reset
export function resetNarrativeParagraphPulseEngineState(): NarrativeParagraphPulseEngineState {
  return createNarrativeParagraphPulseEngineState();
}