/**
 * V1062 PlotPhenomenologyEngine — Direction C Iter 19/20 (Round 5)
 * Plot phenomenology engine: lived experience of plot events
 * Sources: ruflo phenomenology + nanobot + thunderbolt
 */

export type PhenomenologicalAspect = 'perception' | 'emotion' | 'thought' | 'sensation' | 'temporal' | 'spatial';
export type PhenomenologicalIntensity = 'mild' | 'moderate' | 'intense' | 'overwhelming' | 'transformative';
export type PhenomenologicalFidelity = 'approximate' | 'accurate' | 'vivid' | 'immersive' | 'uncanny';

export interface PlotPhenomenon {
  phenomenonId: string;
  aspect: PhenomenologicalAspect;
  intensity: PhenomenologicalIntensity;
  fidelity: PhenomenologicalFidelity;
  description: string;
  presence: number;
  authenticity: number;
  chapter: number;
}

export interface PhenomenologicalSpan {
  spanId: string,
  phenomenonIds: string[],
  cumulativePresence: number,
  fidelity: number,
}

export interface PlotPhenomenologyEngineState {
  phenomena: Map<string, PlotPhenomenon>;
  spans: Map<string, PhenomenologicalSpan>;
  totalPhenomena: number;
  totalSpans: number;
  averagePresence: number;
  averageAuthenticity: number;
  spanFidelity: number;
  phenomenologyMastery: number;
}

// Factory
export function createPlotPhenomenologyEngineState(): PlotPhenomenologyEngineState {
  return {
    phenomena: new Map(),
    spans: new Map(),
    totalPhenomena: 0,
    totalSpans: 0,
    averagePresence: 0.5,
    averageAuthenticity: 0.5,
    spanFidelity: 0.5,
    phenomenologyMastery: 0.5,
  };
}

// Add phenomenon
export function addPlotPhenomenon(
  state: PlotPhenomenologyEngineState,
  phenomenonId: string,
  aspect: PhenomenologicalAspect,
  intensity: PhenomenologicalIntensity,
  fidelity: PhenomenologicalFidelity,
  description: string,
  presence: number,
  authenticity: number,
  chapter: number
): PlotPhenomenologyEngineState {
  const phenomenon: PlotPhenomenon = { phenomenonId, aspect, intensity, fidelity, description, presence, authenticity, chapter };
  const phenomena = new Map(state.phenomena).set(phenomenonId, phenomenon);
  return recomputePlotPhenomenology({ ...state, phenomena, totalPhenomena: phenomena.size });
}

// Add span
export function addPhenomenologicalSpan(
  state: PlotPhenomenologyEngineState,
  spanId: string,
  phenomenonIds: string[]
): PlotPhenomenologyEngineState {
  const phenomena = phenomenonIds.map(id => state.phenomena.get(id)).filter((p): p is PlotPhenomenon => p !== undefined);
  const cumulativePresence = phenomena.length === 0 ? 0
    : phenomena.reduce((s, p) => s + p.presence, 0) / phenomena.length;
  const fidelity = phenomena.length === 0 ? 0
    : phenomena.reduce((s, p) => s + p.authenticity, 0) / phenomena.length;
  const span: PhenomenologicalSpan = { spanId, phenomenonIds, cumulativePresence, fidelity };
  const spans = new Map(state.spans).set(spanId, span);
  return recomputePlotPhenomenology({ ...state, spans, totalSpans: spans.size });
}

// Get phenomena by aspect
export function getPhenomenaByAspect(state: PlotPhenomenologyEngineState, aspect: PhenomenologicalAspect): PlotPhenomenon[] {
  return Array.from(state.phenomena.values()).filter(p => p.aspect === aspect);
}

// Get phenomenology report
export function getPlotPhenomenologyReport(state: PlotPhenomenologyEngineState): {
  totalPhenomena: number;
  totalSpans: number;
  averagePresence: number;
  averageAuthenticity: number;
  phenomenologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPhenomena === 0) recommendations.push('No phenomena — add plot phenomena');
  if (state.averageAuthenticity < 0.5) recommendations.push('Low authenticity — strengthen');
  if (state.phenomenologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPhenomena: state.totalPhenomena,
    totalSpans: state.totalSpans,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    phenomenologyMastery: Math.round(state.phenomenologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePlotPhenomenology(state: PlotPhenomenologyEngineState): PlotPhenomenologyEngineState {
  const phenomena = Array.from(state.phenomena.values());
  const averagePresence = phenomena.length === 0 ? 0.5
    : phenomena.reduce((s, p) => s + p.presence, 0) / phenomena.length;
  const averageAuthenticity = phenomena.length === 0 ? 0.5
    : phenomena.reduce((s, p) => s + p.authenticity, 0) / phenomena.length;

  const spans = Array.from(state.spans.values());
  const spanFidelity = spans.length === 0 ? 0.5
    : spans.reduce((s, sp) => s + sp.fidelity, 0) / spans.length;

  const phenomenologyMastery = (averagePresence * 0.3 + averageAuthenticity * 0.4 + spanFidelity * 0.3);

  return { ...state, averagePresence, averageAuthenticity, spanFidelity, phenomenologyMastery };
}

// Reset
export function resetPlotPhenomenologyEngineState(): PlotPhenomenologyEngineState {
  return createPlotPhenomenologyEngineState();
}