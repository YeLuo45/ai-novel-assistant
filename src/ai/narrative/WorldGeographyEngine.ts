/**
 * V878 WorldGeographyEngine — Direction C Iter 2/15 (Round 4)
 * World geography engine: geography + regions + spatial features
 * Sources: nanobot geography + ruflo + thunderbolt
 */

export type RegionType = 'continent' | 'country' | 'city' | 'wilderness' | 'dungeon' | 'realm' | 'dimension';
export type ClimateType = 'tropical' | 'temperate' | 'arctic' | 'arid' | 'magical' | 'variable';
export type TerrainType = 'plains' | 'mountains' | 'forest' | 'desert' | 'ocean' | 'tundra' | 'floating';

export interface Region {
  regionId: string;
  name: string;
  type: RegionType;
  climate: ClimateType;
  terrain: TerrainType;
  description: string;
  size: number;
  population: number;
  parent: string | null;
  hazards: string[];
}

export interface RegionConnection {
  connectionId: string;
  fromRegionId: string;
  toRegionId: string;
  type: 'road' | 'river' | 'portal' | 'teleport' | 'trade_route';
  traversable: boolean;
  danger: number;
}

export interface WorldGeographyEngineState {
  regions: Map<string, Region>;
  connections: Map<string, RegionConnection>;
  totalRegions: number;
  totalConnections: number;
  averagePopulation: number;
  geographyRichness: number;
  connectivity: number;
  regionDiversity: number;
}

// Factory
export function createWorldGeographyEngineState(): WorldGeographyEngineState {
  return {
    regions: new Map(),
    connections: new Map(),
    totalRegions: 0,
    totalConnections: 0,
    averagePopulation: 0,
    geographyRichness: 0.5,
    connectivity: 0,
    regionDiversity: 0,
  };
}

// Add region
export function addRegion(
  state: WorldGeographyEngineState,
  regionId: string,
  name: string,
  type: RegionType,
  climate: ClimateType,
  terrain: TerrainType,
  description: string,
  size: number,
  population: number = 0,
  parent: string | null = null
): WorldGeographyEngineState {
  const region: Region = { regionId, name, type, climate, terrain, description, size, population, parent, hazards: [] };
  const regions = new Map(state.regions).set(regionId, region);
  return recomputeGeography({ ...state, regions, totalRegions: regions.size });
}

// Add connection
export function addRegionConnection(
  state: WorldGeographyEngineState,
  connectionId: string,
  fromRegionId: string,
  toRegionId: string,
  type: RegionConnection['type'],
  traversable: boolean = true,
  danger: number = 0
): WorldGeographyEngineState {
  const connection: RegionConnection = { connectionId, fromRegionId, toRegionId, type, traversable, danger };
  const connections = new Map(state.connections).set(connectionId, connection);
  return recomputeGeography({ ...state, connections, totalConnections: connections.size });
}

// Add hazard
export function addRegionHazard(state: WorldGeographyEngineState, regionId: string, hazard: string): WorldGeographyEngineState {
  const region = state.regions.get(regionId);
  if (!region) return state;

  const updated: Region = { ...region, hazards: [...region.hazards, hazard] };
  const regions = new Map(state.regions).set(regionId, updated);
  return recomputeGeography({ ...state, regions });
}

// Get regions by type
export function getRegionsByType(state: WorldGeographyEngineState, type: RegionType): Region[] {
  return Array.from(state.regions.values()).filter(r => r.type === type);
}

// Get geography report
export function getGeographyReport(state: WorldGeographyEngineState): {
  totalRegions: number;
  totalConnections: number;
  averagePopulation: number;
  geographyRichness: number;
  connectivity: number;
  regionDiversity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRegions === 0) recommendations.push('No regions — add regions');
  if (state.connectivity < 0.3) recommendations.push('Low connectivity — add connections');
  if (state.regionDiversity < 0.3) recommendations.push('Low diversity — diversify');

  return {
    totalRegions: state.totalRegions,
    totalConnections: state.totalConnections,
    averagePopulation: Math.round(state.averagePopulation),
    geographyRichness: Math.round(state.geographyRichness * 100) / 100,
    connectivity: Math.round(state.connectivity * 100) / 100,
    regionDiversity: Math.round(state.regionDiversity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeGeography(state: WorldGeographyEngineState): WorldGeographyEngineState {
  const regions = Array.from(state.regions.values());
  const totalPopulation = regions.reduce((s, r) => s + r.population, 0);
  const averagePopulation = regions.length === 0 ? 0 : totalPopulation / regions.length;

  const typeSet = new Set(regions.map(r => r.type));
  const regionDiversity = Math.min(1, typeSet.size / 5);

  const totalSize = regions.reduce((s, r) => s + r.size, 0);
  const geographyRichness = regions.length === 0 ? 0.5
    : Math.min(1, totalSize / 10000 + regionDiversity * 0.3);

  const traversableConnections = Array.from(state.connections.values()).filter(c => c.traversable).length;
  const connectivity = state.totalRegions === 0 ? 0
    : Math.min(1, traversableConnections / Math.max(1, state.totalRegions - 1));

  return { ...state, averagePopulation, regionDiversity, geographyRichness, connectivity };
}

// Reset geography state
export function resetWorldGeographyEngineState(): WorldGeographyEngineState {
  return createWorldGeographyEngineState();
}