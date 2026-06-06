/**
 * V966 NarrativeAdaptiveLearningCore — Direction A Iter 1/15 (Round 5)
 * Adaptive learning core: continuous learning from narrative feedback
 * Sources: generic-agent adaptive + thunderbolt feedback + nanobot
 */

export type LearningMode = 'supervised' | 'unsupervised' | 'reinforcement' | 'self_supervised' | 'transfer' | 'meta';
export type LearningPhase = 'observe' | 'hypothesize' | 'experiment' | 'evaluate' | 'consolidate' | 'apply';
export type AdaptationType = 'incremental' | 'transformative' | 'radical' | 'gradual' | 'instant';

export interface LearningEpisode {
  episodeId: string;
  mode: LearningMode;
  phase: LearningPhase;
  adaptation: AdaptationType;
  input: string;
  output: string;
  reward: number;
  retention: number;
  chapter: number;
}

export interface LearningPolicy {
  policyId: string;
  name: string;
  episodeIds: string[];
  successRate: number;
  averageReward: number;
  usage: number;
}

export interface NarrativeAdaptiveLearningCoreState {
  episodes: Map<string, LearningEpisode>;
  policies: Map<string, LearningPolicy>;
  totalEpisodes: number;
  totalPolicies: number;
  averageReward: number;
  averageRetention: number;
  adaptationRate: number;
  learningMastery: number;
}

// Factory
export function createNarrativeAdaptiveLearningCoreState(): NarrativeAdaptiveLearningCoreState {
  return {
    episodes: new Map(),
    policies: new Map(),
    totalEpisodes: 0,
    totalPolicies: 0,
    averageReward: 0.5,
    averageRetention: 0.5,
    adaptationRate: 0.5,
    learningMastery: 0.5,
  };
}

// Add episode
export function addLearningEpisode(
  state: NarrativeAdaptiveLearningCoreState,
  episodeId: string,
  mode: LearningMode,
  phase: LearningPhase,
  adaptation: AdaptationType,
  input: string,
  output: string,
  reward: number,
  retention: number,
  chapter: number
): NarrativeAdaptiveLearningCoreState {
  const episode: LearningEpisode = {
    episodeId, mode, phase, adaptation, input, output,
    reward: Math.min(1, Math.max(0, reward)),
    retention: Math.min(1, Math.max(0, retention)),
    chapter,
  };
  const episodes = new Map(state.episodes).set(episodeId, episode);
  return recomputeAdaptiveLearn({ ...state, episodes, totalEpisodes: episodes.size });
}

// Add policy
export function addLearningPolicy(
  state: NarrativeAdaptiveLearningCoreState,
  policyId: string,
  name: string,
  episodeIds: string[]
): NarrativeAdaptiveLearningCoreState {
  const episodes = episodeIds.map(id => state.episodes.get(id)).filter((e): e is LearningEpisode => e !== undefined);
  const successRate = episodes.length === 0 ? 0.5
    : episodes.filter(e => e.reward > 0.5).length / episodes.length;
  const averageReward = episodes.length === 0 ? 0
    : episodes.reduce((s, e) => s + e.reward, 0) / episodes.length;
  const policy: LearningPolicy = { policyId, name, episodeIds, successRate, averageReward, usage: 0 };
  const policies = new Map(state.policies).set(policyId, policy);
  return recomputeAdaptiveLearn({ ...state, policies, totalPolicies: policies.size });
}

// Use policy
export function useLearningPolicy(state: NarrativeAdaptiveLearningCoreState, policyId: string): NarrativeAdaptiveLearningCoreState {
  const policy = state.policies.get(policyId);
  if (!policy) return state;

  const updated: LearningPolicy = { ...policy, usage: policy.usage + 1 };
  const policies = new Map(state.policies).set(policyId, updated);
  return recomputeAdaptiveLearn({ ...state, policies });
}

// Get episodes by mode
export function getEpisodesByMode(state: NarrativeAdaptiveLearningCoreState, mode: LearningMode): LearningEpisode[] {
  return Array.from(state.episodes.values()).filter(e => e.mode === mode);
}

// Get learning report
export function getAdaptiveLearningReport(state: NarrativeAdaptiveLearningCoreState): {
  totalEpisodes: number;
  totalPolicies: number;
  averageReward: number;
  averageRetention: number;
  learningMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEpisodes === 0) recommendations.push('No episodes — add learning episodes');
  if (state.averageReward < 0.5) recommendations.push('Low reward — improve learning');
  if (state.learningMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEpisodes: state.totalEpisodes,
    totalPolicies: state.totalPolicies,
    averageReward: Math.round(state.averageReward * 100) / 100,
    averageRetention: Math.round(state.averageRetention * 100) / 100,
    learningMastery: Math.round(state.learningMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptiveLearn(state: NarrativeAdaptiveLearningCoreState): NarrativeAdaptiveLearningCoreState {
  const episodes = Array.from(state.episodes.values());
  const averageReward = episodes.length === 0 ? 0.5
    : episodes.reduce((s, e) => s + e.reward, 0) / episodes.length;
  const averageRetention = episodes.length === 0 ? 0.5
    : episodes.reduce((s, e) => s + e.retention, 0) / episodes.length;

  // Adaptation rate: how diverse the adaptations are
  const adaptSet = new Set(episodes.map(e => e.adaptation));
  const adaptationRate = Math.min(1, adaptSet.size / 5);

  const policies = Array.from(state.policies.values());
  const policyEffectiveness = policies.length === 0 ? 0.5
    : policies.reduce((s, p) => s + p.averageReward, 0) / policies.length;

  const learningMastery = (averageReward * 0.4 + averageRetention * 0.3 + policyEffectiveness * 0.3);

  return { ...state, averageReward, averageRetention, adaptationRate, learningMastery };
}

// Reset
export function resetNarrativeAdaptiveLearningCoreState(): NarrativeAdaptiveLearningCoreState {
  return createNarrativeAdaptiveLearningCoreState();
}