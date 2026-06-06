/**
 * V946 NarrativeAnalysisEngine — Direction E Iter 6/15 (Round 4)
 * Narrative analysis engine: deep analysis of narrative elements
 * Sources: nanobot analysis + thunderbolt + ruflo
 */

export type AnalysisType = 'thematic' | 'structural' | 'character' | 'stylistic' | 'symbolic' | 'cultural';
export type AnalysisMethod = 'close_reading' | 'distant_reading' | 'comparative' | 'historical' | 'psychoanalytic' | 'formalist';
export type AnalysisDepth = 'surface' | 'moderate' | 'deep' | 'comprehensive' | 'exhaustive';

export interface AnalysisUnit {
  unitId: string;
  type: AnalysisType;
  method: AnalysisMethod;
  depth: AnalysisDepth;
  text: string;
  findings: string[];
  confidence: number;
  chapter: number;
}

export interface AnalysisFramework {
  frameworkId: string;
  name: string;
  unitIds: string[];
  coherence: number;
  insights: number;
}

export interface NarrativeAnalysisEngineState {
  units: Map<string, AnalysisUnit>;
  frameworks: Map<string, AnalysisFramework>;
  totalUnits: number;
  totalFrameworks: number;
  averageConfidence: number;
  totalFindings: number;
  methodDiversity: number;
  analysisMastery: number;
}

// Factory
export function createNarrativeAnalysisEngineState(): NarrativeAnalysisEngineState {
  return {
    units: new Map(),
    frameworks: new Map(),
    totalUnits: 0,
    totalFrameworks: 0,
    averageConfidence: 0.5,
    totalFindings: 0,
    methodDiversity: 0,
    analysisMastery: 0.5,
  };
}

// Add unit
export function addAnalysisUnit(
  state: NarrativeAnalysisEngineState,
  unitId: string,
  type: AnalysisType,
  method: AnalysisMethod,
  depth: AnalysisDepth,
  text: string,
  findings: string[],
  confidence: number,
  chapter: number
): NarrativeAnalysisEngineState {
  const unit: AnalysisUnit = { unitId, type, method, depth, text, findings, confidence, chapter };
  const units = new Map(state.units).set(unitId, unit);
  const totalFindings = state.totalFindings + findings.length;
  return recomputeAnalysis({ ...state, units, totalFindings, totalUnits: units.size });
}

// Create framework
export function createAnalysisFramework(
  state: NarrativeAnalysisEngineState,
  frameworkId: string,
  name: string,
  unitIds: string[]
): NarrativeAnalysisEngineState {
  const units = unitIds.map(id => state.units.get(id)).filter((u): u is AnalysisUnit => u !== undefined);
  const totalInsights = units.reduce((s, u) => s + u.findings.length, 0);
  const coherence = units.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(units[0].confidence - units[units.length - 1].confidence));
  const framework: AnalysisFramework = { frameworkId, name, unitIds, coherence, insights: totalInsights };
  const frameworks = new Map(state.frameworks).set(frameworkId, framework);
  return recomputeAnalysis({ ...state, frameworks, totalFrameworks: frameworks.size });
}

// Get units by type
export function getUnitsByType(state: NarrativeAnalysisEngineState, type: AnalysisType): AnalysisUnit[] {
  return Array.from(state.units.values()).filter(u => u.type === type);
}

// Get analysis report
export function getAnalysisReport(state: NarrativeAnalysisEngineState): {
  totalUnits: number;
  totalFrameworks: number;
  averageConfidence: number;
  totalFindings: number;
  methodDiversity: number;
  analysisMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalUnits === 0) recommendations.push('No units — add analysis units');
  if (state.methodDiversity < 0.3) recommendations.push('Low diversity — diversify methods');
  if (state.analysisMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalUnits: state.totalUnits,
    totalFrameworks: state.totalFrameworks,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    totalFindings: state.totalFindings,
    methodDiversity: Math.round(state.methodDiversity * 100) / 100,
    analysisMastery: Math.round(state.analysisMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAnalysis(state: NarrativeAnalysisEngineState): NarrativeAnalysisEngineState {
  const units = Array.from(state.units.values());
  const averageConfidence = units.length === 0 ? 0.5
    : units.reduce((s, u) => s + u.confidence, 0) / units.length;

  const methodSet = new Set(units.map(u => u.method));
  const methodDiversity = Math.min(1, methodSet.size / 5);

  const frameworks = Array.from(state.frameworks.values());
  const avgCoherence = frameworks.length === 0 ? 0.5
    : frameworks.reduce((s, f) => s + f.coherence, 0) / frameworks.length;

  const analysisMastery = (averageConfidence * 0.4 + methodDiversity * 0.3 + avgCoherence * 0.3);

  return { ...state, averageConfidence, methodDiversity, analysisMastery };
}

// Reset analysis state
export function resetNarrativeAnalysisEngineState(): NarrativeAnalysisEngineState {
  return createNarrativeAnalysisEngineState();
}