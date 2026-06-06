/**
 * V1238 NarrativeAudienceInvestmentEngine — Direction H Iter 7/20 (Round 5)
 * Audience investment engine: investment of audience
 * Sources: nanobot investment + thunderbolt + ruflo
 */

export type AudienceInvestmentType = 'emotional' | 'intellectual' | 'temporal' | 'financial' | 'social' | 'identity';
export type AudienceInvestmentDepth = 'shallow' | 'moderate' | 'deep' | 'profound' | 'identity_level';
export type AudienceInvestmentReturn = 'negative' | 'neutral' | 'modest' | 'significant' | 'transformative';

export interface AudienceInvestment {
  investmentId: string;
  type: AudienceInvestmentType;
  depth: AudienceInvestmentDepth;
  return: AudienceInvestmentReturn;
  description: string;
  stake: number;
  reward: number;
  chapter: number;
}

export interface AudienceInvestmentPortfolio {
  portfolioId: string,
  investmentIds: string[],
  cumulativeStake: number,
  diversity: number,
}

export interface NarrativeAudienceInvestmentEngineState {
  investments: Map<string, AudienceInvestment>;
  portfolios: Map<string, AudienceInvestmentPortfolio>;
  totalInvestments: number;
  totalPortfolios: number;
  averageStake: number;
  averageReward: number;
  portfolioDiversity: number;
  audienceInvestmentMastery: number;
}

// Factory
export function createNarrativeAudienceInvestmentEngineState(): NarrativeAudienceInvestmentEngineState {
  return {
    investments: new Map(),
    portfolios: new Map(),
    totalInvestments: 0,
    totalPortfolios: 0,
    averageStake: 0.5,
    averageReward: 0.5,
    portfolioDiversity: 0.5,
    audienceInvestmentMastery: 0.5,
  };
}

// Add investment
export function addAudienceInvestment(
  state: NarrativeAudienceInvestmentEngineState,
  investmentId: string,
  type: AudienceInvestmentType,
  depth: AudienceInvestmentDepth,
  returnType: AudienceInvestmentReturn,
  description: string,
  stake: number,
  reward: number,
  chapter: number
): NarrativeAudienceInvestmentEngineState {
  const investment: AudienceInvestment = { investmentId, type, depth, return: returnType, description, stake, reward, chapter };
  const investments = new Map(state.investments).set(investmentId, investment);
  return recomputeAudienceInvestment({ ...state, investments, totalInvestments: investments.size });
}

// Add portfolio
export function addAudienceInvestmentPortfolio(
  state: NarrativeAudienceInvestmentEngineState,
  portfolioId: string,
  investmentIds: string[]
): NarrativeAudienceInvestmentEngineState {
  const investments = investmentIds.map(id => state.investments.get(id)).filter((i): i is AudienceInvestment => i !== undefined);
  const cumulativeStake = investments.length === 0 ? 0
    : investments.reduce((s, i) => s + i.stake, 0) / investments.length;
  const typeSet = new Set(investments.map(i => i.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const portfolio: AudienceInvestmentPortfolio = { portfolioId, investmentIds, cumulativeStake, diversity };
  const portfolios = new Map(state.portfolios).set(portfolioId, portfolio);
  return recomputeAudienceInvestment({ ...state, portfolios, totalPortfolios: portfolios.size });
}

// Get investments by type
export function getAudienceInvestmentsByType(state: NarrativeAudienceInvestmentEngineState, type: AudienceInvestmentType): AudienceInvestment[] {
  return Array.from(state.investments.values()).filter(i => i.type === type);
}

// Get audience investment report
export function getAudienceInvestmentReport(state: NarrativeAudienceInvestmentEngineState): {
  totalInvestments: number;
  totalPortfolios: number;
  averageStake: number;
  averageReward: number;
  audienceInvestmentMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalInvestments === 0) recommendations.push('No investments — add audience investments');
  if (state.averageStake < 0.5) recommendations.push('Low stake — strengthen');
  if (state.audienceInvestmentMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalInvestments: state.totalInvestments,
    totalPortfolios: state.totalPortfolios,
    averageStake: Math.round(state.averageStake * 100) / 100,
    averageReward: Math.round(state.averageReward * 100) / 100,
    audienceInvestmentMastery: Math.round(state.audienceInvestmentMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceInvestment(state: NarrativeAudienceInvestmentEngineState): NarrativeAudienceInvestmentEngineState {
  const investments = Array.from(state.investments.values());
  const averageStake = investments.length === 0 ? 0.5
    : investments.reduce((s, i) => s + i.stake, 0) / investments.length;
  const averageReward = investments.length === 0 ? 0.5
    : investments.reduce((s, i) => s + i.reward, 0) / investments.length;

  const portfolios = Array.from(state.portfolios.values());
  const portfolioDiversity = portfolios.length === 0 ? 0.5
    : portfolios.reduce((s, p) => s + p.diversity, 0) / portfolios.length;

  const audienceInvestmentMastery = (averageStake * 0.4 + averageReward * 0.3 + portfolioDiversity * 0.3);

  return { ...state, averageStake, averageReward, portfolioDiversity, audienceInvestmentMastery };
}

// Reset
export function resetNarrativeAudienceInvestmentEngineState(): NarrativeAudienceInvestmentEngineState {
  return createNarrativeAudienceInvestmentEngineState();
}