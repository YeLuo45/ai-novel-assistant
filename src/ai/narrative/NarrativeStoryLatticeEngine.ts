/**
 * V1274 NarrativeStoryLatticeEngine — Direction I Iter 5/20 (Round 5)
 * Story lattice engine: lattice of story structure
 * Sources: thunderbolt lattice + nanobot + ruflo
 */

export type StoryLatticeLevel = 'surface' | 'shallow' | 'medium' | 'deep' | 'abyssal';
export type StoryLatticeGeometry = 'linear' | 'branching' | 'cyclic' | 'fractal' | 'crystalline';
export type StoryLatticeStrength = 'fragile' | 'moderate' | 'strong' | 'unyielding' | 'eternal';

export interface StoryLatticeNode {
  nodeId: string;
  level: StoryLatticeLevel;
  geometry: StoryLatticeGeometry;
  strength: StoryLatticeStrength;
  description: string;
  structural: number;
  connectivity: number;
  chapter: number;
}

export interface StoryLatticePlane {
  planeId: string,
  nodeIds: string[],
  cumulativeStructural: number,
  integrity: number,
}

export interface NarrativeStoryLatticeEngineState {
  nodes: Map<string, StoryLatticeNode>;
  planes: Map<string, StoryLatticePlane>;
  totalNodes: number;
  totalPlanes: number;
  averageStructural: number;
  averageConnectivity: number;
  planeIntegrity: number;
  storyLatticeMastery: number;
}

// Factory
export function createNarrativeStoryLatticeEngineState(): NarrativeStoryLatticeEngineState {
  return {
    nodes: new Map(),
    planes: new Map(),
    totalNodes: 0,
    totalPlanes: 0,
    averageStructural: 0.5,
    averageConnectivity: 0.5,
    planeIntegrity: 0.5,
    storyLatticeMastery: 0.5,
  };
}

// Add node
export function addStoryLatticeNode(
  state: NarrativeStoryLatticeEngineState,
  nodeId: string,
  level: StoryLatticeLevel,
  geometry: StoryLatticeGeometry,
  strength: StoryLatticeStrength,
  description: string,
  structural: number,
  connectivity: number,
  chapter: number
): NarrativeStoryLatticeEngineState {
  const node: StoryLatticeNode = { nodeId, level, geometry, strength, description, structural, connectivity, chapter };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputeStoryLattice({ ...state, nodes, totalNodes: nodes.size });
}

// Add plane
export function addStoryLatticePlane(
  state: NarrativeStoryLatticeEngineState,
  planeId: string,
  nodeIds: string[]
): NarrativeStoryLatticeEngineState {
  const nodes = nodeIds.map(id => state.nodes.get(id)).filter((n): n is StoryLatticeNode => n !== undefined);
  const cumulativeStructural = nodes.length === 0 ? 0
    : nodes.reduce((s, n) => s + n.structural, 0) / nodes.length;
  const levelSet = new Set(nodes.map(n => n.level));
  const integrity = Math.min(1, levelSet.size / 6);
  const plane: StoryLatticePlane = { planeId, nodeIds, cumulativeStructural, integrity };
  const planes = new Map(state.planes).set(planeId, plane);
  return recomputeStoryLattice({ ...state, planes, totalPlanes: planes.size });
}

// Get nodes by level
export function getStoryLatticeNodesByLevel(state: NarrativeStoryLatticeEngineState, level: StoryLatticeLevel): StoryLatticeNode[] {
  return Array.from(state.nodes.values()).filter(n => n.level === level);
}

// Get story lattice report
export function getStoryLatticeReport(state: NarrativeStoryLatticeEngineState): {
  totalNodes: number;
  totalPlanes: number;
  averageStructural: number;
  averageConnectivity: number;
  storyLatticeMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — add story lattice nodes');
  if (state.averageStructural < 0.5) recommendations.push('Low structural — strengthen');
  if (state.storyLatticeMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalNodes: state.totalNodes,
    totalPlanes: state.totalPlanes,
    averageStructural: Math.round(state.averageStructural * 100) / 100,
    averageConnectivity: Math.round(state.averageConnectivity * 100) / 100,
    storyLatticeMastery: Math.round(state.storyLatticeMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryLattice(state: NarrativeStoryLatticeEngineState): NarrativeStoryLatticeEngineState {
  const nodes = Array.from(state.nodes.values());
  const averageStructural = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.structural, 0) / nodes.length;
  const averageConnectivity = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.connectivity, 0) / nodes.length;

  const planes = Array.from(state.planes.values());
  const planeIntegrity = planes.length === 0 ? 0.5
    : planes.reduce((s, p) => s + p.integrity, 0) / planes.length;

  const storyLatticeMastery = (averageStructural * 0.4 + averageConnectivity * 0.3 + planeIntegrity * 0.3);

  return { ...state, averageStructural, averageConnectivity, planeIntegrity, storyLatticeMastery };
}

// Reset
export function resetNarrativeStoryLatticeEngineState(): NarrativeStoryLatticeEngineState {
  return createNarrativeStoryLatticeEngineState();
}