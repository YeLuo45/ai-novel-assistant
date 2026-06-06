/**
 * V1258 NarrativeAudienceLoyaltyEngine — Direction H Iter 17/20 (Round 5)
 * Audience loyalty engine: loyalty of audience
 * Sources: ruflo loyalty + nanobot + thunderbolt
 */

export type AudienceLoyaltyType = 'cognitive' | 'emotional' | 'behavioral' | 'attitudinal' | 'spiritual' | 'transcendent';
export type AudienceLoyaltyStrength = 'fragile' | 'weak' | 'moderate' | 'strong' | 'unbreakable';
export type AudienceLoyaltyTest = 'untested' | 'tested_once' | 'tested_several' | 'battle_tested' | 'forged_in_fire';

export interface AudienceLoyalty {
  loyaltyId: string;
  type: AudienceLoyaltyType;
  strength: AudienceLoyaltyStrength;
  test: AudienceLoyaltyTest;
  description: string;
  depth: number;
  durability: number;
  chapter: number;
}

export interface AudienceLoyaltyPact {
  pactId: string,
  loyaltyIds: string[],
  cumulativeDepth: number,
  resilience: number,
}

export interface NarrativeAudienceLoyaltyEngineState {
  loyalties: Map<string, AudienceLoyalty>;
  pacts: Map<string, AudienceLoyaltyPact>;
  totalLoyalties: number;
  totalPacts: number;
  averageDepth: number;
  averageDurability: number;
  pactResilience: number;
  audienceLoyaltyMastery: number;
}

// Factory
export function createNarrativeAudienceLoyaltyEngineState(): NarrativeAudienceLoyaltyEngineState {
  return {
    loyalties: new Map(),
    pacts: new Map(),
    totalLoyalties: 0,
    totalPacts: 0,
    averageDepth: 0.5,
    averageDurability: 0.5,
    pactResilience: 0.5,
    audienceLoyaltyMastery: 0.5,
  };
}

// Add loyalty
export function addAudienceLoyalty(
  state: NarrativeAudienceLoyaltyEngineState,
  loyaltyId: string,
  type: AudienceLoyaltyType,
  strength: AudienceLoyaltyStrength,
  test: AudienceLoyaltyTest,
  description: string,
  depth: number,
  durability: number,
  chapter: number
): NarrativeAudienceLoyaltyEngineState {
  const loyalty: AudienceLoyalty = { loyaltyId, type, strength, test, description, depth, durability, chapter };
  const loyalties = new Map(state.loyalties).set(loyaltyId, loyalty);
  return recomputeAudienceLoyalty({ ...state, loyalties, totalLoyalties: loyalties.size });
}

// Add pact
export function addAudienceLoyaltyPact(
  state: NarrativeAudienceLoyaltyEngineState,
  pactId: string,
  loyaltyIds: string[]
): NarrativeAudienceLoyaltyEngineState {
  const loyalties = loyaltyIds.map(id => state.loyalties.get(id)).filter((l): l is AudienceLoyalty => l !== undefined);
  const cumulativeDepth = loyalties.length === 0 ? 0
    : loyalties.reduce((s, l) => s + l.depth, 0) / loyalties.length;
  const typeSet = new Set(loyalties.map(l => l.type));
  const resilience = Math.min(1, typeSet.size / 6);
  const pact: AudienceLoyaltyPact = { pactId, loyaltyIds, cumulativeDepth, resilience };
  const pacts = new Map(state.pacts).set(pactId, pact);
  return recomputeAudienceLoyalty({ ...state, pacts, totalPacts: pacts.size });
}

// Get loyalties by type
export function getAudienceLoyaltiesByType(state: NarrativeAudienceLoyaltyEngineState, type: AudienceLoyaltyType): AudienceLoyalty[] {
  return Array.from(state.loyalties.values()).filter(l => l.type === type);
}

// Get audience loyalty report
export function getAudienceLoyaltyReport(state: NarrativeAudienceLoyaltyEngineState): {
  totalLoyalties: number;
  totalPacts: number;
  averageDepth: number;
  averageDurability: number;
  audienceLoyaltyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoyalties === 0) recommendations.push('No loyalties — add audience loyalties');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.audienceLoyaltyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalLoyalties: state.totalLoyalties,
    totalPacts: state.totalPacts,
    averageDepth: Math.round(state.averageDepth * 100) / 100,
    averageDurability: Math.round(state.averageDurability * 100) / 100,
    audienceLoyaltyMastery: Math.round(state.audienceLoyaltyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceLoyalty(state: NarrativeAudienceLoyaltyEngineState): NarrativeAudienceLoyaltyEngineState {
  const loyalties = Array.from(state.loyalties.values());
  const averageDepth = loyalties.length === 0 ? 0.5
    : loyalties.reduce((s, l) => s + l.depth, 0) / loyalties.length;
  const averageDurability = loyalties.length === 0 ? 0.5
    : loyalties.reduce((s, l) => s + l.durability, 0) / loyalties.length;

  const pacts = Array.from(state.pacts.values());
  const pactResilience = pacts.length === 0 ? 0.5
    : pacts.reduce((s, p) => s + p.resilience, 0) / pacts.length;

  const audienceLoyaltyMastery = (averageDepth * 0.4 + averageDurability * 0.3 + pactResilience * 0.3);

  return { ...state, averageDepth, averageDurability, pactResilience, audienceLoyaltyMastery };
}

// Reset
export function resetNarrativeAudienceLoyaltyEngineState(): NarrativeAudienceLoyaltyEngineState {
  return createNarrativeAudienceLoyaltyEngineState();
}