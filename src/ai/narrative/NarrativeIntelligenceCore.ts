/**
 * V956 NarrativeIntelligenceCore — Direction E Iter 11/15 (Round 4)
 * Narrative intelligence core: integrated narrative intelligence
 * Sources: nanobot intelligence + thunderbolt + chatdev
 */

export type IntelligenceType = 'emotional' | 'social' | 'spatial' | 'verbal' | 'logical' | 'creative';
export type IntelligenceLevel = 'low' | 'moderate' | 'high' | 'very_high' | 'exceptional';
export type IntelligenceApplication = 'craft' | 'character' | 'plot' | 'theme' | 'world' | 'meta';

export interface IntelligenceFacet {
  facetId: string;
  type: IntelligenceType;
  level: IntelligenceLevel;
  application: IntelligenceApplication;
  description: string;
  score: number;
  chapter: number;
}

export interface IntelligenceProfile {
  profileId: string,
  name: string,
  facetIds: string[],
  overallScore: number,
  versatility: number,
}

export interface NarrativeIntelligenceCoreState {
  facets: Map<string, IntelligenceFacet>;
  profiles: Map<string, IntelligenceProfile>;
  totalFacets: number;
  totalProfiles: number;
  averageScore: number;
  typeCoverage: number;
  intelligenceBalance: number;
  intelligenceMastery: number;
}

// Factory
export function createNarrativeIntelligenceCoreState(): NarrativeIntelligenceCoreState {
  return {
    facets: new Map(),
    profiles: new Map(),
    totalFacets: 0,
    totalProfiles: 0,
    averageScore: 0.5,
    typeCoverage: 0,
    intelligenceBalance: 0.5,
    intelligenceMastery: 0.5,
  };
}

// Add facet
export function addIntelligenceFacet(
  state: NarrativeIntelligenceCoreState,
  facetId: string,
  type: IntelligenceType,
  level: IntelligenceLevel,
  application: IntelligenceApplication,
  description: string,
  score: number,
  chapter: number
): NarrativeIntelligenceCoreState {
  const facet: IntelligenceFacet = { facetId, type, level, application, description, score, chapter };
  const facets = new Map(state.facets).set(facetId, facet);
  return recomputeIntelligence({ ...state, facets, totalFacets: facets.size });
}

// Add profile
export function addIntelligenceProfile(
  state: NarrativeIntelligenceCoreState,
  profileId: string,
  name: string,
  facetIds: string[]
): NarrativeIntelligenceCoreState {
  const facets = facetIds.map(id => state.facets.get(id)).filter((f): f is IntelligenceFacet => f !== undefined);
  const overallScore = facets.length === 0 ? 0.5
    : facets.reduce((s, f) => s + f.score, 0) / facets.length;
  const typeSet = new Set(facets.map(f => f.type));
  const versatility = Math.min(1, typeSet.size / 5);
  const profile: IntelligenceProfile = { profileId, name, facetIds, overallScore, versatility };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeIntelligence({ ...state, profiles, totalProfiles: profiles.size });
}

// Get facets by type
export function getFacetsByType(state: NarrativeIntelligenceCoreState, type: IntelligenceType): IntelligenceFacet[] {
  return Array.from(state.facets.values()).filter(f => f.type === type);
}

// Get intelligence report
export function getIntelligenceCoreReport(state: NarrativeIntelligenceCoreState): {
  totalFacets: number;
  totalProfiles: number;
  averageScore: number;
  typeCoverage: number;
  intelligenceBalance: number;
  intelligenceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFacets === 0) recommendations.push('No facets — add intelligence facets');
  if (state.typeCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.intelligenceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFacets: state.totalFacets,
    totalProfiles: state.totalProfiles,
    averageScore: Math.round(state.averageScore * 100) / 100,
    typeCoverage: Math.round(state.typeCoverage * 100) / 100,
    intelligenceBalance: Math.round(state.intelligenceBalance * 100) / 100,
    intelligenceMastery: Math.round(state.intelligenceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeIntelligence(state: NarrativeIntelligenceCoreState): NarrativeIntelligenceCoreState {
  const facets = Array.from(state.facets.values());
  const averageScore = facets.length === 0 ? 0.5
    : facets.reduce((s, f) => s + f.score, 0) / facets.length;
  const typeSet = new Set(facets.map(f => f.type));
  const typeCoverage = Math.min(1, typeSet.size / 5);

  // Balance: how similar all scores are
  const variance = facets.length === 0 ? 0
    : facets.reduce((s, f) => s + Math.pow(f.score - averageScore, 2), 0) / facets.length;
  const intelligenceBalance = Math.max(0, 1 - variance * 4);

  const intelligenceMastery = (averageScore * 0.4 + typeCoverage * 0.3 + intelligenceBalance * 0.3);

  return { ...state, averageScore, typeCoverage, intelligenceBalance, intelligenceMastery };
}

// Reset intelligence state
export function resetNarrativeIntelligenceCoreState(): NarrativeIntelligenceCoreState {
  return createNarrativeIntelligenceCoreState();
}