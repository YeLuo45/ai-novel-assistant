/**
 * V996 NarrativeSubplotEngine — Direction B Iter 1/15 (Round 5)
 * Subplot engine: subplot weaving + secondary storylines
 * Sources: thunderbolt subplot + chatdev + ruflo
 */

export type SubplotType = 'romance' | 'mystery' | 'character_arc' | 'thematic' | 'world_building' | 'ensemble';
export type SubplotStatus = 'introduced' | 'developing' | 'climaxing' | 'converging' | 'resolved' | 'abandoned';
export type SubplotIntegration = 'parallel' | 'interwoven' | 'mirrored' | 'nested' | 'independent';

export interface Subplot {
  subplotId: string;
  type: SubplotType;
  status: SubplotStatus;
  integration: SubplotIntegration;
  name: string;
  characterIds: string[];
  progress: number;
  contribution: number;
  chapter: number;
}

export interface SubplotRelationship {
  relationshipId: string,
  subplot1Id: string,
  subplot2Id: string,
  type: 'parallel' | 'contrast' | 'support' | 'intersect' | 'echo',
  strength: number,
}

export interface NarrativeSubplotEngineState {
  subplots: Map<string, Subplot>;
  relationships: Map<string, SubplotRelationship>;
  totalSubplots: number;
  totalRelationships: number;
  averageProgress: number;
  averageContribution: number;
  integrationCohesion: number;
  subplotMastery: number;
}

// Factory
export function createNarrativeSubplotEngineState(): NarrativeSubplotEngineState {
  return {
    subplots: new Map(),
    relationships: new Map(),
    totalSubplots: 0,
    totalRelationships: 0,
    averageProgress: 0.5,
    averageContribution: 0.5,
    integrationCohesion: 0.5,
    subplotMastery: 0.5,
  };
}

// Add subplot
export function addSubplot(
  state: NarrativeSubplotEngineState,
  subplotId: string,
  type: SubplotType,
  integration: SubplotIntegration,
  name: string,
  characterIds: string[],
  chapter: number
): NarrativeSubplotEngineState {
  const status: SubplotStatus = 'introduced';
  const subplot: Subplot = { subplotId, type, status, integration, name, characterIds, progress: 0, contribution: 0.5, chapter };
  const subplots = new Map(state.subplots).set(subplotId, subplot);
  return recomputeSubplot({ ...state, subplots, totalSubplots: subplots.size });
}

// Update progress
export function updateSubplotProgress(state: NarrativeSubplotEngineState, subplotId: string, progress: number, contribution: number): NarrativeSubplotEngineState {
  const subplot = state.subplots.get(subplotId);
  if (!subplot) return state;

  const status: SubplotStatus = progress === 1 ? 'resolved'
    : progress === 0 ? 'introduced'
    : progress < 0.3 ? 'developing'
    : progress < 0.8 ? 'developing'
    : 'climaxing';
  const updated: Subplot = { ...subplot, progress, contribution, status };
  const subplots = new Map(state.subplots).set(subplotId, updated);
  return recomputeSubplot({ ...state, subplots });
}

// Add relationship
export function addSubplotRelationship(
  state: NarrativeSubplotEngineState,
  relationshipId: string,
  subplot1Id: string,
  subplot2Id: string,
  type: SubplotRelationship['type'],
  strength: number
): NarrativeSubplotEngineState {
  const relationship: SubplotRelationship = { relationshipId, subplot1Id, subplot2Id, type, strength };
  const relationships = new Map(state.relationships).set(relationshipId, relationship);
  return recomputeSubplot({ ...state, relationships, totalRelationships: relationships.size });
}

// Get subplots by type
export function getSubplotsByType(state: NarrativeSubplotEngineState, type: SubplotType): Subplot[] {
  return Array.from(state.subplots.values()).filter(s => s.type === type);
}

// Get subplot report
export function getSubplotReport(state: NarrativeSubplotEngineState): {
  totalSubplots: number;
  totalRelationships: number;
  averageProgress: number;
  averageContribution: number;
  subplotMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSubplots === 0) recommendations.push('No subplots — add subplots');
  if (state.averageProgress < 0.3) recommendations.push('Low progress — advance subplots');
  if (state.subplotMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSubplots: state.totalSubplots,
    totalRelationships: state.totalRelationships,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    averageContribution: Math.round(state.averageContribution * 100) / 100,
    subplotMastery: Math.round(state.subplotMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSubplot(state: NarrativeSubplotEngineState): NarrativeSubplotEngineState {
  const subplots = Array.from(state.subplots.values());
  const totalProgress = subplots.reduce((s, sp) => s + sp.progress, 0);
  const averageProgress = subplots.length === 0 ? 0.5
    : totalProgress / subplots.length;
  const averageContribution = subplots.length === 0 ? 0.5
    : subplots.reduce((s, sp) => s + sp.contribution, 0) / subplots.length;

  const relationships = Array.from(state.relationships.values());
  const avgStrength = relationships.length === 0 ? 0.5
    : relationships.reduce((s, r) => s + r.strength, 0) / relationships.length;
  const integrationCohesion = avgStrength;

  const subplotMastery = (averageProgress * 0.4 + averageContribution * 0.3 + integrationCohesion * 0.3);

  return { ...state, averageProgress, averageContribution, integrationCohesion, subplotMastery };
}

// Reset
export function resetNarrativeSubplotEngineState(): NarrativeSubplotEngineState {
  return createNarrativeSubplotEngineState();
}