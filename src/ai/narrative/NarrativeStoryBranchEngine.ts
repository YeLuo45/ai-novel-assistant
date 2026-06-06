/**
 * V1294 NarrativeStoryBranchEngine — Direction I Iter 15/20 (Round 5)
 * Story branch engine: branches of story
 * Sources: ruflo branch + nanobot + thunderbolt
 */

export type StoryBranchType = 'main' | 'sub' | 'side' | 'parallel' | 'alternative' | 'transcendent';
export type StoryBranchFork = 'early' | 'mid' | 'late' | 'climactic' | 'eternal';
export type StoryBranchMerge = 'never' | 'late' | 'climactic' | 'denouement' | 'transcendent';

export interface StoryBranchNode {
  branchId: string;
  type: StoryBranchType;
  fork: StoryBranchFork;
  merge: StoryBranchMerge;
  description: string;
  divergence: number;
  uniqueness: number;
  chapter: number;
}

export interface StoryBranchTree {
  treeId: string,
  branchIds: string[],
  cumulativeDivergence: number,
  branching: number,
}

export interface NarrativeStoryBranchEngineState {
  branches: Map<string, StoryBranchNode>;
  trees: Map<string, StoryBranchTree>;
  totalBranches: number;
  totalTrees: number;
  averageDivergence: number;
  averageUniqueness: number;
  treeBranching: number;
  storyBranchMastery: number;
}

// Factory
export function createNarrativeStoryBranchEngineState(): NarrativeStoryBranchEngineState {
  return {
    branches: new Map(),
    trees: new Map(),
    totalBranches: 0,
    totalTrees: 0,
    averageDivergence: 0.5,
    averageUniqueness: 0.5,
    treeBranching: 0.5,
    storyBranchMastery: 0.5,
  };
}

// Add branch
export function addStoryBranchNode(
  state: NarrativeStoryBranchEngineState,
  branchId: string,
  type: StoryBranchType,
  fork: StoryBranchFork,
  merge: StoryBranchMerge,
  description: string,
  divergence: number,
  uniqueness: number,
  chapter: number
): NarrativeStoryBranchEngineState {
  const branch: StoryBranchNode = { branchId, type, fork, merge, description, divergence, uniqueness, chapter };
  const branches = new Map(state.branches).set(branchId, branch);
  return recomputeStoryBranch({ ...state, branches, totalBranches: branches.size });
}

// Add tree
export function addStoryBranchTree(
  state: NarrativeStoryBranchEngineState,
  treeId: string,
  branchIds: string[]
): NarrativeStoryBranchEngineState {
  const branches = branchIds.map(id => state.branches.get(id)).filter((b): b is StoryBranchNode => b !== undefined);
  const cumulativeDivergence = branches.length === 0 ? 0
    : branches.reduce((s, b) => s + b.divergence, 0) / branches.length;
  const typeSet = new Set(branches.map(b => b.type));
  const branching = Math.min(1, typeSet.size / 6);
  const tree: StoryBranchTree = { treeId, branchIds, cumulativeDivergence, branching };
  const trees = new Map(state.trees).set(treeId, tree);
  return recomputeStoryBranch({ ...state, trees, totalTrees: trees.size });
}

// Get branches by type
export function getStoryBranchNodesByType(state: NarrativeStoryBranchEngineState, type: StoryBranchType): StoryBranchNode[] {
  return Array.from(state.branches.values()).filter(b => b.type === type);
}

// Get story branch report
export function getStoryBranchReport(state: NarrativeStoryBranchEngineState): {
  totalBranches: number;
  totalTrees: number;
  averageDivergence: number;
  averageUniqueness: number;
  storyBranchMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBranches === 0) recommendations.push('No branches — add story branch nodes');
  if (state.averageDivergence < 0.5) recommendations.push('Low divergence — strengthen');
  if (state.storyBranchMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalBranches: state.totalBranches,
    totalTrees: state.totalTrees,
    averageDivergence: Math.round(state.averageDivergence * 100) / 100,
    averageUniqueness: Math.round(state.averageUniqueness * 100) / 100,
    storyBranchMastery: Math.round(state.storyBranchMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryBranch(state: NarrativeStoryBranchEngineState): NarrativeStoryBranchEngineState {
  const branches = Array.from(state.branches.values());
  const averageDivergence = branches.length === 0 ? 0.5
    : branches.reduce((s, b) => s + b.divergence, 0) / branches.length;
  const averageUniqueness = branches.length === 0 ? 0.5
    : branches.reduce((s, b) => s + b.uniqueness, 0) / branches.length;

  const trees = Array.from(state.trees.values());
  const treeBranching = trees.length === 0 ? 0.5
    : trees.reduce((s, t) => s + t.branching, 0) / trees.length;

  const storyBranchMastery = (averageDivergence * 0.4 + averageUniqueness * 0.3 + treeBranching * 0.3);

  return { ...state, averageDivergence, averageUniqueness, treeBranching, storyBranchMastery };
}

// Reset
export function resetNarrativeStoryBranchEngineState(): NarrativeStoryBranchEngineState {
  return createNarrativeStoryBranchEngineState();
}