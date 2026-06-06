/**
 * V1280 NarrativeStoryMosaicEngine — Direction I Iter 8/20 (Round 5)
 * Story mosaic engine: mosaic of story fragments
 * Sources: thunderbolt mosaic + nanobot + ruflo
 */

export type StoryMosaicFragment = 'scene' | 'image' | 'memory' | 'flashback' | 'flashforward' | 'vision';
export type StoryMosaicFit = 'loose' | 'moderate' | 'tight' | 'perfect' | 'seamless';
export type StoryMosaicPattern = 'random' | 'organic' | 'geometric' | 'radial' | 'spiral';

export interface StoryMosaicFragmentNode {
  fragmentId: string;
  fragment: StoryMosaicFragment;
  fit: StoryMosaicFit;
  pattern: StoryMosaicPattern;
  description: string;
  clarity: number;
  place: number;
  chapter: number;
}

export interface StoryMosaicSection {
  sectionId: string,
  fragmentIds: string[],
  cumulativeClarity: number,
  coherence: number,
}

export interface NarrativeStoryMosaicEngineState {
  fragments: Map<string, StoryMosaicFragmentNode>;
  sections: Map<string, StoryMosaicSection>;
  totalFragments: number;
  totalSections: number;
  averageClarity: number;
  averagePlace: number;
  sectionCoherence: number;
  storyMosaicMastery: number;
}

// Factory
export function createNarrativeStoryMosaicEngineState(): NarrativeStoryMosaicEngineState {
  return {
    fragments: new Map(),
    sections: new Map(),
    totalFragments: 0,
    totalSections: 0,
    averageClarity: 0.5,
    averagePlace: 0.5,
    sectionCoherence: 0.5,
    storyMosaicMastery: 0.5,
  };
}

// Add fragment
export function addStoryMosaicFragment(
  state: NarrativeStoryMosaicEngineState,
  fragmentId: string,
  fragment: StoryMosaicFragment,
  fit: StoryMosaicFit,
  pattern: StoryMosaicPattern,
  description: string,
  clarity: number,
  place: number,
  chapter: number
): NarrativeStoryMosaicEngineState {
  const fragmentNode: StoryMosaicFragmentNode = { fragmentId, fragment, fit, pattern, description, clarity, place, chapter };
  const fragments = new Map(state.fragments).set(fragmentId, fragmentNode);
  return recomputeStoryMosaic({ ...state, fragments, totalFragments: fragments.size });
}

// Add section
export function addStoryMosaicSection(
  state: NarrativeStoryMosaicEngineState,
  sectionId: string,
  fragmentIds: string[]
): NarrativeStoryMosaicEngineState {
  const fragments = fragmentIds.map(id => state.fragments.get(id)).filter((f): f is StoryMosaicFragmentNode => f !== undefined);
  const cumulativeClarity = fragments.length === 0 ? 0
    : fragments.reduce((s, f) => s + f.clarity, 0) / fragments.length;
  const fragmentSet = new Set(fragments.map(f => f.fragment));
  const coherence = Math.min(1, fragmentSet.size / 6);
  const section: StoryMosaicSection = { sectionId, fragmentIds, cumulativeClarity, coherence };
  const sections = new Map(state.sections).set(sectionId, section);
  return recomputeStoryMosaic({ ...state, sections, totalSections: sections.size });
}

// Get fragments by fragment type
export function getStoryMosaicFragmentsByFragment(state: NarrativeStoryMosaicEngineState, fragment: StoryMosaicFragment): StoryMosaicFragmentNode[] {
  return Array.from(state.fragments.values()).filter(f => f.fragment === fragment);
}

// Get story mosaic report
export function getStoryMosaicReport(state: NarrativeStoryMosaicEngineState): {
  totalFragments: number;
  totalSections: number;
  averageClarity: number;
  averagePlace: number;
  storyMosaicMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFragments === 0) recommendations.push('No fragments — add story mosaic fragments');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.storyMosaicMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFragments: state.totalFragments,
    totalSections: state.totalSections,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averagePlace: Math.round(state.averagePlace * 100) / 100,
    storyMosaicMastery: Math.round(state.storyMosaicMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryMosaic(state: NarrativeStoryMosaicEngineState): NarrativeStoryMosaicEngineState {
  const fragments = Array.from(state.fragments.values());
  const averageClarity = fragments.length === 0 ? 0.5
    : fragments.reduce((s, f) => s + f.clarity, 0) / fragments.length;
  const averagePlace = fragments.length === 0 ? 0.5
    : fragments.reduce((s, f) => s + f.place, 0) / fragments.length;

  const sections = Array.from(state.sections.values());
  const sectionCoherence = sections.length === 0 ? 0.5
    : sections.reduce((s, sec) => s + sec.coherence, 0) / sections.length;

  const storyMosaicMastery = (averageClarity * 0.4 + averagePlace * 0.3 + sectionCoherence * 0.3);

  return { ...state, averageClarity, averagePlace, sectionCoherence, storyMosaicMastery };
}

// Reset
export function resetNarrativeStoryMosaicEngineState(): NarrativeStoryMosaicEngineState {
  return createNarrativeStoryMosaicEngineState();
}