/**
 * V1098 NarrativeBalancingEngine — Direction D Iter 17/20 (Round 6)
 * Narrative balancing engine: balance narrative elements
 * Sources: ruflo balancing + thunderbolt + nanobot
 */

export type BalanceType = 'action' | 'reflection' | 'dialogue' | 'description' | 'plot' | 'character';
export type BalanceImbalance = 'severe_lopsided' | 'lopsided' | 'slight' | 'balanced' | 'perfect';
export type BalanceRange = 'narrow' | 'moderate' | 'wide' | 'comprehensive' | 'universal';

export interface Balance {
  balanceId: string;
  type: BalanceType;
  imbalance: BalanceImbalance;
  range: BalanceRange;
  description: string;
  balance: number;
  dynamism: number;
  chapter: number;
}

export interface BalanceProfile {
  profileId: string,
  balanceIds: string[],
  averageBalance: number,
  consistency: number,
}

export interface NarrativeBalancingEngineState {
  balances: Map<string, Balance>;
  profiles: Map<string, BalanceProfile>;
  totalBalances: number;
  totalProfiles: number;
  averageBalance: number;
  averageDynamism: number;
  profileConsistency: number;
  balancingMastery: number;
}

// Factory
export function createNarrativeBalancingEngineState(): NarrativeBalancingEngineState {
  return {
    balances: new Map(),
    profiles: new Map(),
    totalBalances: 0,
    totalProfiles: 0,
    averageBalance: 0.5,
    averageDynamism: 0.5,
    profileConsistency: 0.5,
    balancingMastery: 0.5,
  };
}

// Add balance
export function addBalance(
  state: NarrativeBalancingEngineState,
  balanceId: string,
  type: BalanceType,
  imbalance: BalanceImbalance,
  range: BalanceRange,
  description: string,
  balance: number,
  dynamism: number,
  chapter: number
): NarrativeBalancingEngineState {
  const b: Balance = { balanceId, type, imbalance, range, description, balance, dynamism, chapter };
  const balances = new Map(state.balances).set(balanceId, b);
  return recomputeBalancing({ ...state, balances, totalBalances: balances.size });
}

// Add profile
export function addBalanceProfile(
  state: NarrativeBalancingEngineState,
  profileId: string,
  balanceIds: string[]
): NarrativeBalancingEngineState {
  const balances = balanceIds.map(id => state.balances.get(id)).filter((b): b is Balance => b !== undefined);
  const averageBalance = balances.length === 0 ? 0
    : balances.reduce((s, b) => s + b.balance, 0) / balances.length;
  const consistency = balances.length < 2 ? 0.5
    : 1 - Math.abs(balances[0].balance - balances[balances.length - 1].balance);
  const profile: BalanceProfile = { profileId, balanceIds, averageBalance, consistency };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeBalancing({ ...state, profiles, totalProfiles: profiles.size });
}

// Get balances by type
export function getBalancesByType(state: NarrativeBalancingEngineState, type: BalanceType): Balance[] {
  return Array.from(state.balances.values()).filter(b => b.type === type);
}

// Get balancing report
export function getBalancingReport(state: NarrativeBalancingEngineState): {
  totalBalances: number;
  totalProfiles: number;
  averageBalance: number;
  averageDynamism: number;
  balancingMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBalances === 0) recommendations.push('No balances — add balances');
  if (state.averageBalance < 0.5) recommendations.push('Low balance — improve');
  if (state.balancingMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalBalances: state.totalBalances,
    totalProfiles: state.totalProfiles,
    averageBalance: Math.round(state.averageBalance * 100) / 100,
    averageDynamism: Math.round(state.averageDynamism * 100) / 100,
    balancingMastery: Math.round(state.balancingMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeBalancing(state: NarrativeBalancingEngineState): NarrativeBalancingEngineState {
  const balances = Array.from(state.balances.values());
  const averageBalance = balances.length === 0 ? 0.5
    : balances.reduce((s, b) => s + b.balance, 0) / balances.length;
  const averageDynamism = balances.length === 0 ? 0.5
    : balances.reduce((s, b) => s + b.dynamism, 0) / balances.length;

  const profiles = Array.from(state.profiles.values());
  const profileConsistency = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.consistency, 0) / profiles.length;

  const balancingMastery = (averageBalance * 0.4 + averageDynamism * 0.3 + profileConsistency * 0.3);

  return { ...state, averageBalance, averageDynamism, profileConsistency, balancingMastery };
}

// Reset
export function resetNarrativeBalancingEngineState(): NarrativeBalancingEngineState {
  return createNarrativeBalancingEngineState();
}