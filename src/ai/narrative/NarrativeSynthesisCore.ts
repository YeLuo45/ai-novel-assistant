/**
 * V732 NarrativeSynthesisCore — Direction E Iter 7/9 (Round 2)
 * Narrative synthesis core: integrates multiple intelligence sources
 * Sources: thunderbolt synthesis + nanobot + chatdev
 */

export type SynthesisMode = 'additive' | 'multiplicative' | 'integrative' | 'emergent';
export type SynthesisStage = 'gathering' | 'analyzing' | 'integrating' | 'refining' | 'complete';
export type SourceType = 'memory' | 'reasoning' | 'context' | 'pattern' | 'semantic' | 'knowledge';

export interface SynthesisSource {
  sourceId: string;
  type: SourceType;
  content: string;
  weight: number;
  reliability: number;
}

export interface SynthesisOutput {
  outputId: string;
  mode: SynthesisMode;
  stage: SynthesisStage;
  sources: SynthesisSource[];
  result: string;
  qualityScore: number;
  coherence: number;
  novelty: number;
  timestamp: number;
}

export interface NarrativeSynthesisCoreState {
  outputs: Map<string, SynthesisOutput>;
  totalOutputs: number;
  averageQuality: number;
  averageNovelty: number;
  averageCoherence: number;
  synthesisEfficiency: number;
  stageDistribution: Map<SynthesisStage, number>;
}

// Factory
export function createNarrativeSynthesisCoreState(): NarrativeSynthesisCoreState {
  return {
    outputs: new Map(),
    totalOutputs: 0,
    averageQuality: 0.5,
    averageNovelty: 0.5,
    averageCoherence: 0.5,
    synthesisEfficiency: 0.7,
    stageDistribution: new Map(),
  };
}

// Create synthesis
export function createSynthesis(
  state: NarrativeSynthesisCoreState,
  outputId: string,
  mode: SynthesisMode,
  sources: SynthesisSource[]
): NarrativeSynthesisCoreState {
  const output: SynthesisOutput = {
    outputId,
    mode,
    stage: 'gathering',
    sources,
    result: '',
    qualityScore: 0,
    coherence: 0,
    novelty: 0,
    timestamp: Date.now(),
  };
  const outputs = new Map(state.outputs).set(outputId, output);
  const stageDistribution = new Map(state.stageDistribution);
  stageDistribution.set('gathering', (stageDistribution.get('gathering') || 0) + 1);
  return recomputeSynthesis({ ...state, outputs, stageDistribution, totalOutputs: outputs.size });
}

// Advance stage
export function advanceSynthesisStage(
  state: NarrativeSynthesisCoreState,
  outputId: string,
  stage: SynthesisStage,
  result: string = '',
  qualityScore: number = 0.5,
  coherence: number = 0.5,
  novelty: number = 0.5
): NarrativeSynthesisCoreState {
  const output = state.outputs.get(outputId);
  if (!output) return state;

  const updated: SynthesisOutput = {
    ...output,
    stage,
    result: result || output.result,
    qualityScore,
    coherence,
    novelty,
  };
  const outputs = new Map(state.outputs).set(outputId, updated);

  // Update stage distribution
  const stageDistribution = new Map(state.stageDistribution);
  if (stageDistribution.get(output.stage)) {
    stageDistribution.set(output.stage, (stageDistribution.get(output.stage) || 1) - 1);
  }
  stageDistribution.set(stage, (stageDistribution.get(stage) || 0) + 1);

  return recomputeSynthesis({ ...state, outputs, stageDistribution });
}

// Add source
export function addSynthesisSource(
  state: NarrativeSynthesisCoreState,
  outputId: string,
  source: SynthesisSource
): NarrativeSynthesisCoreState {
  const output = state.outputs.get(outputId);
  if (!output) return state;

  const updated: SynthesisOutput = { ...output, sources: [...output.sources, source] };
  const outputs = new Map(state.outputs).set(outputId, updated);
  return recomputeSynthesis({ ...state, outputs });
}

// Get outputs by mode
export function getOutputsByMode(state: NarrativeSynthesisCoreState, mode: SynthesisMode): SynthesisOutput[] {
  return Array.from(state.outputs.values()).filter(o => o.mode === mode);
}

// Get outputs by stage
export function getOutputsByStage(state: NarrativeSynthesisCoreState, stage: SynthesisStage): SynthesisOutput[] {
  return Array.from(state.outputs.values()).filter(o => o.stage === stage);
}

// Get synthesis report
export function getSynthesisCoreReport(state: NarrativeSynthesisCoreState): {
  totalOutputs: number;
  averageQuality: number;
  averageNovelty: number;
  averageCoherence: number;
  synthesisEfficiency: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalOutputs === 0) recommendations.push('No syntheses — start synthesizing');
  if (state.averageQuality < 0.6) recommendations.push('Low quality — review sources');
  if (state.synthesisEfficiency < 0.5) recommendations.push('Low efficiency — optimize process');

  return {
    totalOutputs: state.totalOutputs,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    averageNovelty: Math.round(state.averageNovelty * 100) / 100,
    averageCoherence: Math.round(state.averageCoherence * 100) / 100,
    synthesisEfficiency: Math.round(state.synthesisEfficiency * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSynthesis(state: NarrativeSynthesisCoreState): NarrativeSynthesisCoreState {
  const outputs = Array.from(state.outputs.values());
  if (outputs.length === 0) return state;

  const completed = outputs.filter(o => o.stage === 'complete');
  const averageQuality = outputs.reduce((s, o) => s + o.qualityScore, 0) / outputs.length;
  const averageNovelty = outputs.reduce((s, o) => s + o.novelty, 0) / outputs.length;
  const averageCoherence = outputs.reduce((s, o) => s + o.coherence, 0) / outputs.length;
  const synthesisEfficiency = completed.length / outputs.length;

  return { ...state, averageQuality, averageNovelty, averageCoherence, synthesisEfficiency };
}

// Reset synthesis state
export function resetNarrativeSynthesisCoreState(): NarrativeSynthesisCoreState {
  return createNarrativeSynthesisCoreState();
}