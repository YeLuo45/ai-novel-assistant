/**
 * V962 NarrativePerceptionCore — Direction E Iter 14/15 (Round 4)
 * Narrative perception core: deep narrative perception
 * Sources: nanobot perception + chatdev + thunderbolt
 */

export type PerceptionChannel = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'proprioceptive';
export type PerceptionClarity = 'blurry' | 'fuzzy' | 'clear' | 'vivid' | 'luminous';
export type PerceptionIntegration = 'isolated' | 'paired' | 'grouped' | 'integrated' | 'unified';

export interface PerceptionDetail {
  detailId: string;
  channel: PerceptionChannel;
  clarity: PerceptionClarity;
  integration: PerceptionIntegration;
  content: string;
  intensity: number;
  vividness: number;
  chapter: number;
}

export interface PerceptionScene {
  sceneId: string,
  name: string,
  detailIds: string[],
  coherence: number,
  power: number,
}

export interface NarrativePerceptionCoreState {
  details: Map<string, PerceptionDetail>;
  scenes: Map<string, PerceptionScene>;
  totalDetails: number;
  totalScenes: number;
  averageVividness: number;
  channelCoverage: number;
  perceptionPower: number;
  perceptionMastery: number;
}

// Factory
export function createNarrativePerceptionCoreState(): NarrativePerceptionCoreState {
  return {
    details: new Map(),
    scenes: new Map(),
    totalDetails: 0,
    totalScenes: 0,
    averageVividness: 0.5,
    channelCoverage: 0,
    perceptionPower: 0.5,
    perceptionMastery: 0.5,
  };
}

// Add detail
export function addPerceptionDetail(
  state: NarrativePerceptionCoreState,
  detailId: string,
  channel: PerceptionChannel,
  clarity: PerceptionClarity,
  integration: PerceptionIntegration,
  content: string,
  intensity: number,
  vividness: number,
  chapter: number
): NarrativePerceptionCoreState {
  const detail: PerceptionDetail = { detailId, channel, clarity, integration, content, intensity, vividness, chapter };
  const details = new Map(state.details).set(detailId, detail);
  return recomputePercCore({ ...state, details, totalDetails: details.size });
}

// Add scene
export function addPerceptionScene(
  state: NarrativePerceptionCoreState,
  sceneId: string,
  name: string,
  detailIds: string[]
): NarrativePerceptionCoreState {
  const details = detailIds.map(id => state.details.get(id)).filter((d): d is PerceptionDetail => d !== undefined);
  const power = details.length === 0 ? 0
    : details.reduce((s, d) => s + d.intensity, 0) / details.length;
  const coherence = details.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(details[0].vividness - details[details.length - 1].vividness));
  const scene: PerceptionScene = { sceneId, name, detailIds, coherence, power };
  const scenes = new Map(state.scenes).set(sceneId, scene);
  return recomputePercCore({ ...state, scenes, totalScenes: scenes.size });
}

// Get details by channel
export function getDetailsByChannel(state: NarrativePerceptionCoreState, channel: PerceptionChannel): PerceptionDetail[] {
  return Array.from(state.details.values()).filter(d => d.channel === channel);
}

// Get perception report
export function getPerceptionCoreReport(state: NarrativePerceptionCoreState): {
  totalDetails: number;
  totalScenes: number;
  averageVividness: number;
  channelCoverage: number;
  perceptionPower: number;
  perceptionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDetails === 0) recommendations.push('No details — add perception details');
  if (state.channelCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.perceptionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDetails: state.totalDetails,
    totalScenes: state.totalScenes,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    channelCoverage: Math.round(state.channelCoverage * 100) / 100,
    perceptionPower: Math.round(state.perceptionPower * 100) / 100,
    perceptionMastery: Math.round(state.perceptionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePercCore(state: NarrativePerceptionCoreState): NarrativePerceptionCoreState {
  const details = Array.from(state.details.values());
  const averageVividness = details.length === 0 ? 0.5
    : details.reduce((s, d) => s + d.vividness, 0) / details.length;
  const channelSet = new Set(details.map(d => d.channel));
  const channelCoverage = Math.min(1, channelSet.size / 5);

  const scenes = Array.from(state.scenes.values());
  const perceptionPower = scenes.length === 0 ? 0.5
    : scenes.reduce((s, sc) => s + sc.power, 0) / scenes.length;

  const perceptionMastery = (averageVividness * 0.4 + channelCoverage * 0.3 + perceptionPower * 0.3);

  return { ...state, averageVividness, channelCoverage, perceptionPower, perceptionMastery };
}

// Reset perception state
export function resetNarrativePerceptionCoreState(): NarrativePerceptionCoreState {
  return createNarrativePerceptionCoreState();
}