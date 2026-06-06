/**
 * V1300 NarrativeStorySpineEngine — Direction I Iter 18/20 (Round 5)
 * Story spine engine: spine of story
 * Sources: ruflo spine + nanobot + thunderbolt
 */

export type StorySpineVertebra = 'plot_point' | 'pivot' | 'climax' | 'revelation' | 'transformation' | 'transcendent';
export type StorySpineFlexibility = 'rigid' | 'moderate' | 'flexible' | 'very_flexible' | 'fluid';
export type StorySpineSupport = 'weak' | 'moderate' | 'strong' | 'powerful' | 'infallible';

export interface StorySpineNode {
  spineId: string;
  vertebra: StorySpineVertebra;
  flexibility: StorySpineFlexibility;
  support: StorySpineSupport;
  description: string;
  centrality: number;
  load: number;
  chapter: number;
}

export interface StorySpineSection {
  sectionId: string,
  spineIds: string[],
  cumulativeCentrality: number,
  integrity: number,
}

export interface NarrativeStorySpineEngineState {
  spines: Map<string, StorySpineNode>;
  sections: Map<string, StorySpineSection>;
  totalSpines: number;
  totalSections: number;
  averageCentrality: number;
  averageLoad: number;
  sectionIntegrity: number;
  storySpineMastery: number;
}

// Factory
export function createNarrativeStorySpineEngineState(): NarrativeStorySpineEngineState {
  return {
    spines: new Map(),
    sections: new Map(),
    totalSpines: 0,
    totalSections: 0,
    averageCentrality: 0.5,
    averageLoad: 0.5,
    sectionIntegrity: 0.5,
    storySpineMastery: 0.5,
  };
}

// Add spine
export function addStorySpineNode(
  state: NarrativeStorySpineEngineState,
  spineId: string,
  vertebra: StorySpineVertebra,
  flexibility: StorySpineFlexibility,
  support: StorySpineSupport,
  description: string,
  centrality: number,
  load: number,
  chapter: number
): NarrativeStorySpineEngineState {
  const spine: StorySpineNode = { spineId, vertebra, flexibility, support, description, centrality, load, chapter };
  const spines = new Map(state.spines).set(spineId, spine);
  return recomputeStorySpine({ ...state, spines, totalSpines: spines.size });
}

// Add section
export function addStorySpineSection(
  state: NarrativeStorySpineEngineState,
  sectionId: string,
  spineIds: string[]
): NarrativeStorySpineEngineState {
  const spines = spineIds.map(id => state.spines.get(id)).filter((s): s is StorySpineNode => s !== undefined);
  const cumulativeCentrality = spines.length === 0 ? 0
    : spines.reduce((s, sp) => s + sp.centrality, 0) / spines.length;
  const vertebraSet = new Set(spines.map(s => s.vertebra));
  const integrity = Math.min(1, vertebraSet.size / 6);
  const section: StorySpineSection = { sectionId, spineIds, cumulativeCentrality, integrity };
  const sections = new Map(state.sections).set(sectionId, section);
  return recomputeStorySpine({ ...state, sections, totalSections: sections.size });
}

// Get spines by vertebra
export function getStorySpineNodesByVertebra(state: NarrativeStorySpineEngineState, vertebra: StorySpineVertebra): StorySpineNode[] {
  return Array.from(state.spines.values()).filter(s => s.vertebra === vertebra);
}

// Get story spine report
export function getStorySpineReport(state: NarrativeStorySpineEngineState): {
  totalSpines: number;
  totalSections: number;
  averageCentrality: number;
  averageLoad: number;
  storySpineMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSpines === 0) recommendations.push('No spines — add story spine nodes');
  if (state.averageCentrality < 0.5) recommendations.push('Low centrality — strengthen');
  if (state.storySpineMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSpines: state.totalSpines,
    totalSections: state.totalSections,
    averageCentrality: Math.round(state.averageCentrality * 100) / 100,
    averageLoad: Math.round(state.averageLoad * 100) / 100,
    storySpineMastery: Math.round(state.storySpineMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStorySpine(state: NarrativeStorySpineEngineState): NarrativeStorySpineEngineState {
  const spines = Array.from(state.spines.values());
  const averageCentrality = spines.length === 0 ? 0.5
    : spines.reduce((s, sp) => s + sp.centrality, 0) / spines.length;
  const averageLoad = spines.length === 0 ? 0.5
    : spines.reduce((s, sp) => s + sp.load, 0) / spines.length;

  const sections = Array.from(state.sections.values());
  const sectionIntegrity = sections.length === 0 ? 0.5
    : sections.reduce((s, sec) => s + sec.integrity, 0) / sections.length;

  const storySpineMastery = (averageCentrality * 0.4 + averageLoad * 0.3 + sectionIntegrity * 0.3);

  return { ...state, averageCentrality, averageLoad, sectionIntegrity, storySpineMastery };
}

// Reset
export function resetNarrativeStorySpineEngineState(): NarrativeStorySpineEngineState {
  return createNarrativeStorySpineEngineState();
}