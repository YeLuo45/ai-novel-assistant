/**
 * V894 WorldEcosystemEngine — Direction C Iter 10/15 (Round 4)
 * World ecosystem engine: ecosystems + food chains + balance
 * Sources: nanobot ecosystem + thunderbolt + ruflo
 */

export type BiomeType = 'forest' | 'grassland' | 'wetland' | 'marine' | 'desert' | 'mountain' | 'magical';
export type SpeciesRole = 'producer' | 'consumer' | 'predator' | 'apex' | 'decomposer';
export type EcosystemHealth = 'collapsed' | 'unstable' | 'recovering' | 'stable' | 'thriving';

export interface Species {
  speciesId: string;
  name: string;
  role: SpeciesRole;
  population: number;
  birthRate: number;
  deathRate: number;
  predators: string[];
  prey: string[];
  biome: BiomeType;
}

export interface Ecosystem {
  ecosystemId: string;
  name: string;
  biome: BiomeType;
  speciesIds: string[];
  primaryProducer: string;
  apexPredator: string;
  balance: number;
  health: EcosystemHealth;
}

export interface WorldEcosystemEngineState {
  ecosystems: Map<string, Ecosystem>;
  species: Map<string, Species>;
  totalEcosystems: number;
  totalSpecies: number;
  totalPopulation: number;
  biomeCoverage: number;
  averageBalance: number;
  ecosystemHealth: EcosystemHealth;
  biodiversity: number;
}

// Factory
export function createWorldEcosystemEngineState(): WorldEcosystemEngineState {
  return {
    ecosystems: new Map(),
    species: new Map(),
    totalEcosystems: 0,
    totalSpecies: 0,
    totalPopulation: 0,
    biomeCoverage: 0,
    averageBalance: 0.5,
    ecosystemHealth: 'stable',
    biodiversity: 0,
  };
}

// Add species
export function addSpecies(
  state: WorldEcosystemEngineState,
  speciesId: string,
  name: string,
  role: SpeciesRole,
  population: number,
  biome: BiomeType,
  birthRate: number = 0.1,
  deathRate: number = 0.1,
  predators: string[] = [],
  prey: string[] = []
): WorldEcosystemEngineState {
  const sp: Species = { speciesId, name, role, population, birthRate, deathRate, predators, prey, biome };
  const species = new Map(state.species).set(speciesId, sp);
  return recomputeEcosystem({ ...state, species, totalSpecies: species.size });
}

// Create ecosystem
export function createEcosystem(
  state: WorldEcosystemEngineState,
  ecosystemId: string,
  name: string,
  biome: BiomeType,
  speciesIds: string[],
  primaryProducer: string,
  apexPredator: string
): WorldEcosystemEngineState {
  // Calculate balance
  const species = speciesIds.map(id => state.species.get(id)).filter((s): s is Species => s !== undefined);
  const avgGrowth = species.length === 0 ? 0
    : species.reduce((s, sp) => s + (sp.birthRate - sp.deathRate), 0) / species.length;
  const balance = Math.max(0, Math.min(1, 0.5 + avgGrowth));

  const health: EcosystemHealth = balance < 0.2 ? 'collapsed'
    : balance < 0.4 ? 'unstable'
    : balance < 0.5 ? 'recovering'
    : balance < 0.7 ? 'stable'
    : 'thriving';

  const ecosystem: Ecosystem = { ecosystemId, name, biome, speciesIds, primaryProducer, apexPredator, balance, health };
  const ecosystems = new Map(state.ecosystems).set(ecosystemId, ecosystem);
  return recomputeEcosystem({ ...state, ecosystems, totalEcosystems: ecosystems.size });
}

// Get species by biome
export function getSpeciesByBiome(state: WorldEcosystemEngineState, biome: BiomeType): Species[] {
  return Array.from(state.species.values()).filter(s => s.biome === biome);
}

// Get ecosystem report
export function getEcosystemReport(state: WorldEcosystemEngineState): {
  totalEcosystems: number;
  totalSpecies: number;
  totalPopulation: number;
  biomeCoverage: number;
  biodiversity: number;
  averageBalance: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSpecies === 0) recommendations.push('No species — add species');
  if (state.biomeCoverage < 0.3) recommendations.push('Low biome coverage — diversify');
  if (state.biodiversity < 0.3) recommendations.push('Low biodiversity — add species');

  return {
    totalEcosystems: state.totalEcosystems,
    totalSpecies: state.totalSpecies,
    totalPopulation: state.totalPopulation,
    biomeCoverage: Math.round(state.biomeCoverage * 100) / 100,
    biodiversity: Math.round(state.biodiversity * 100) / 100,
    averageBalance: Math.round(state.averageBalance * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEcosystem(state: WorldEcosystemEngineState): WorldEcosystemEngineState {
  const species = Array.from(state.species.values());
  const totalPopulation = species.reduce((s, sp) => s + sp.population, 0);
  const biomeSet = new Set(species.map(s => s.biome));
  const biomeCoverage = Math.min(1, biomeSet.size / 5);

  const roleSet = new Set(species.map(s => s.role));
  const biodiversity = Math.min(1, roleSet.size / 5);

  const ecosystems = Array.from(state.ecosystems.values());
  const averageBalance = ecosystems.length === 0 ? 0.5
    : ecosystems.reduce((s, e) => s + e.balance, 0) / ecosystems.length;

  return { ...state, totalPopulation, biomeCoverage, biodiversity, averageBalance };
}

// Reset ecosystem state
export function resetWorldEcosystemEngineState(): WorldEcosystemEngineState {
  return createWorldEcosystemEngineState();
}