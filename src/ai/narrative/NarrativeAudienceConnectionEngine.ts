/**
 * V1254 NarrativeAudienceConnectionEngine — Direction H Iter 15/20 (Round 5)
 * Audience connection engine: connection with audience
 * Sources: nanobot connection + thunderbolt + ruflo
 */

export type AudienceConnectionType = 'emotional' | 'intellectual' | 'spiritual' | 'experiential' | 'cultural' | 'transcendent';
export type AudienceConnectionDepth = 'shallow' | 'moderate' | 'deep' | 'profound' | 'soul_level';
export type AudienceConnectionMutuality = 'one_way' | 'asymmetric' | 'balanced' | 'symmetric' | 'unified';

export interface AudienceConnection {
  connectionId: string;
  type: AudienceConnectionType;
  depth: AudienceConnectionDepth;
  mutuality: AudienceConnectionMutuality;
  description: string;
  intimacy: number;
  authenticity: number;
  chapter: number;
}

export interface AudienceConnectionWeb {
  webId: string,
  connectionIds: string[],
  cumulativeIntimacy: number,
  cohesion: number,
}

export interface NarrativeAudienceConnectionEngineState {
  connections: Map<string, AudienceConnection>;
  webs: Map<string, AudienceConnectionWeb>;
  totalConnections: number;
  totalWebs: number;
  averageIntimacy: number;
  averageAuthenticity: number;
  webCohesion: number;
  audienceConnectionMastery: number;
}

// Factory
export function createNarrativeAudienceConnectionEngineState(): NarrativeAudienceConnectionEngineState {
  return {
    connections: new Map(),
    webs: new Map(),
    totalConnections: 0,
    totalWebs: 0,
    averageIntimacy: 0.5,
    averageAuthenticity: 0.5,
    webCohesion: 0.5,
    audienceConnectionMastery: 0.5,
  };
}

// Add connection
export function addAudienceConnection(
  state: NarrativeAudienceConnectionEngineState,
  connectionId: string,
  type: AudienceConnectionType,
  depth: AudienceConnectionDepth,
  mutuality: AudienceConnectionMutuality,
  description: string,
  intimacy: number,
  authenticity: number,
  chapter: number
): NarrativeAudienceConnectionEngineState {
  const connection: AudienceConnection = { connectionId, type, depth, mutuality, description, intimacy, authenticity, chapter };
  const connections = new Map(state.connections).set(connectionId, connection);
  return recomputeAudienceConnection({ ...state, connections, totalConnections: connections.size });
}

// Add web
export function addAudienceConnectionWeb(
  state: NarrativeAudienceConnectionEngineState,
  webId: string,
  connectionIds: string[]
): NarrativeAudienceConnectionEngineState {
  const connections = connectionIds.map(id => state.connections.get(id)).filter((c): c is AudienceConnection => c !== undefined);
  const cumulativeIntimacy = connections.length === 0 ? 0
    : connections.reduce((s, c) => s + c.intimacy, 0) / connections.length;
  const typeSet = new Set(connections.map(c => c.type));
  const cohesion = Math.min(1, typeSet.size / 6);
  const web: AudienceConnectionWeb = { webId, connectionIds, cumulativeIntimacy, cohesion };
  const webs = new Map(state.webs).set(webId, web);
  return recomputeAudienceConnection({ ...state, webs, totalWebs: webs.size });
}

// Get connections by type
export function getAudienceConnectionsByType(state: NarrativeAudienceConnectionEngineState, type: AudienceConnectionType): AudienceConnection[] {
  return Array.from(state.connections.values()).filter(c => c.type === type);
}

// Get audience connection report
export function getAudienceConnectionReport(state: NarrativeAudienceConnectionEngineState): {
  totalConnections: number;
  totalWebs: number;
  averageIntimacy: number;
  averageAuthenticity: number;
  audienceConnectionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalConnections === 0) recommendations.push('No connections — add audience connections');
  if (state.averageIntimacy < 0.5) recommendations.push('Low intimacy — strengthen');
  if (state.audienceConnectionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalConnections: state.totalConnections,
    totalWebs: state.totalWebs,
    averageIntimacy: Math.round(state.averageIntimacy * 100) / 100,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    audienceConnectionMastery: Math.round(state.audienceConnectionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceConnection(state: NarrativeAudienceConnectionEngineState): NarrativeAudienceConnectionEngineState {
  const connections = Array.from(state.connections.values());
  const averageIntimacy = connections.length === 0 ? 0.5
    : connections.reduce((s, c) => s + c.intimacy, 0) / connections.length;
  const averageAuthenticity = connections.length === 0 ? 0.5
    : connections.reduce((s, c) => s + c.authenticity, 0) / connections.length;

  const webs = Array.from(state.webs.values());
  const webCohesion = webs.length === 0 ? 0.5
    : webs.reduce((s, w) => s + w.cohesion, 0) / webs.length;

  const audienceConnectionMastery = (averageIntimacy * 0.4 + averageAuthenticity * 0.3 + webCohesion * 0.3);

  return { ...state, averageIntimacy, averageAuthenticity, webCohesion, audienceConnectionMastery };
}

// Reset
export function resetNarrativeAudienceConnectionEngineState(): NarrativeAudienceConnectionEngineState {
  return createNarrativeAudienceConnectionEngineState();
}