/**
 * V1112 NarrativeRewardCircuitEngine — Direction E Iter 4/20 (Round 5)
 * Reward circuit engine: circuit of reader rewards
 * Sources: nanobot reward + thunderbolt + ruflo
 */

export type RewardType = 'resolution' | 'revelation' | 'recognition' | 'relief' | 'justice' | 'beauty';
export type RewardMagnitude = 'minor' | 'small' | 'moderate' | 'large' | 'transformative';
export type RewardTiming = 'too_early' | 'early' | 'optimal' | 'late' | 'too_late';

export interface Reward {
  rewardId: string;
  type: RewardType;
  magnitude: RewardMagnitude;
  timing: RewardTiming;
  description: string;
  satisfaction: number;
  anticipation: number;
  chapter: number;
}

export interface RewardLoop {
  loopId: string,
  rewardIds: string[],
  cumulativeSatisfaction: number,
  rhythm: number,
}

export interface NarrativeRewardCircuitEngineState {
  rewards: Map<string, Reward>;
  loops: Map<string, RewardLoop>;
  totalRewards: number;
  totalLoops: number;
  averageSatisfaction: number;
  averageAnticipation: number;
  loopRhythm: number;
  rewardMastery: number;
}

// Factory
export function createNarrativeRewardCircuitEngineState(): NarrativeRewardCircuitEngineState {
  return {
    rewards: new Map(),
    loops: new Map(),
    totalRewards: 0,
    totalLoops: 0,
    averageSatisfaction: 0.5,
    averageAnticipation: 0.5,
    loopRhythm: 0.5,
    rewardMastery: 0.5,
  };
}

// Add reward
export function addReward(
  state: NarrativeRewardCircuitEngineState,
  rewardId: string,
  type: RewardType,
  magnitude: RewardMagnitude,
  timing: RewardTiming,
  description: string,
  satisfaction: number,
  anticipation: number,
  chapter: number
): NarrativeRewardCircuitEngineState {
  const reward: Reward = { rewardId, type, magnitude, timing, description, satisfaction, anticipation, chapter };
  const rewards = new Map(state.rewards).set(rewardId, reward);
  return recomputeReward({ ...state, rewards, totalRewards: rewards.size });
}

// Add loop
export function addRewardLoop(
  state: NarrativeRewardCircuitEngineState,
  loopId: string,
  rewardIds: string[]
): NarrativeRewardCircuitEngineState {
  const rewards = rewardIds.map(id => state.rewards.get(id)).filter((r): r is Reward => r !== undefined);
  const cumulativeSatisfaction = rewards.length === 0 ? 0
    : rewards.reduce((s, r) => s + r.satisfaction, 0) / rewards.length;
  const typeSet = new Set(rewards.map(r => r.type));
  const rhythm = Math.min(1, typeSet.size / 6);
  const loop: RewardLoop = { loopId, rewardIds, cumulativeSatisfaction, rhythm };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeReward({ ...state, loops, totalLoops: loops.size });
}

// Get rewards by type
export function getRewardsByType(state: NarrativeRewardCircuitEngineState, type: RewardType): Reward[] {
  return Array.from(state.rewards.values()).filter(r => r.type === type);
}

// Get reward report
export function getRewardCircuitReport(state: NarrativeRewardCircuitEngineState): {
  totalRewards: number;
  totalLoops: number;
  averageSatisfaction: number;
  loopRhythm: number;
  rewardMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRewards === 0) recommendations.push('No rewards — add rewards');
  if (state.averageSatisfaction < 0.5) recommendations.push('Low satisfaction — strengthen');
  if (state.rewardMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRewards: state.totalRewards,
    totalLoops: state.totalLoops,
    averageSatisfaction: Math.round(state.averageSatisfaction * 100) / 100,
    loopRhythm: Math.round(state.loopRhythm * 100) / 100,
    rewardMastery: Math.round(state.rewardMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeReward(state: NarrativeRewardCircuitEngineState): NarrativeRewardCircuitEngineState {
  const rewards = Array.from(state.rewards.values());
  const averageSatisfaction = rewards.length === 0 ? 0.5
    : rewards.reduce((s, r) => s + r.satisfaction, 0) / rewards.length;
  const averageAnticipation = rewards.length === 0 ? 0.5
    : rewards.reduce((s, r) => s + r.anticipation, 0) / rewards.length;

  const loops = Array.from(state.loops.values());
  const loopRhythm = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.rhythm, 0) / loops.length;

  const rewardMastery = (averageSatisfaction * 0.4 + loopRhythm * 0.3 + averageAnticipation * 0.3);

  return { ...state, averageSatisfaction, averageAnticipation, loopRhythm, rewardMastery };
}

// Reset
export function resetNarrativeRewardCircuitEngineState(): NarrativeRewardCircuitEngineState {
  return createNarrativeRewardCircuitEngineState();
}