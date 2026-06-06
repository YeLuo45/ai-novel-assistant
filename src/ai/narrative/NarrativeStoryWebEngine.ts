/**
 * V1272 NarrativeStoryWebEngine — Direction I Iter 4/20 (Round 5)
 * Story web engine: web of story threads
 * Sources: nanobot web + thunderbolt + ruflo
 */

export type StoryWebThread = 'primary' | 'secondary' | 'tertiary' | 'subplot' | 'background' | 'meta';
export type StoryWebTension = 'low' | 'moderate' | 'high' | 'extreme' | 'overwhelming';
export type StoryWebTie = 'weak' | 'moderate' | 'strong' | 'tight' | 'inextricable';

export interface StoryWebThreadNode {
  threadId: string;
  thread: StoryWebThread;
  tension: StoryWebTension;
  tie: StoryWebTie;
  description: string;
  weight: number;
  entanglement: number;
  chapter: number;
}

export interface StoryWebSection {
  sectionId: string,
  threadIds: string[],
  cumulativeWeight: number,
  complexity: number,
}

export interface NarrativeStoryWebEngineState {
  threads: Map<string, StoryWebThreadNode>;
  sections: Map<string, StoryWebSection>;
  totalThreads: number;
  totalSections: number;
  averageWeight: number;
  averageEntanglement: number;
  sectionComplexity: number;
  storyWebMastery: number;
}

// Factory
export function createNarrativeStoryWebEngineState(): NarrativeStoryWebEngineState {
  return {
    threads: new Map(),
    sections: new Map(),
    totalThreads: 0,
    totalSections: 0,
    averageWeight: 0.5,
    averageEntanglement: 0.5,
    sectionComplexity: 0.5,
    storyWebMastery: 0.5,
  };
}

// Add thread
export function addStoryWebThread(
  state: NarrativeStoryWebEngineState,
  threadId: string,
  thread: StoryWebThread,
  tension: StoryWebTension,
  tie: StoryWebTie,
  description: string,
  weight: number,
  entanglement: number,
  chapter: number
): NarrativeStoryWebEngineState {
  const threadNode: StoryWebThreadNode = { threadId, thread, tension, tie, description, weight, entanglement, chapter };
  const threads = new Map(state.threads).set(threadId, threadNode);
  return recomputeStoryWeb({ ...state, threads, totalThreads: threads.size });
}

// Add section
export function addStoryWebSection(
  state: NarrativeStoryWebEngineState,
  sectionId: string,
  threadIds: string[]
): NarrativeStoryWebEngineState {
  const threads = threadIds.map(id => state.threads.get(id)).filter((t): t is StoryWebThreadNode => t !== undefined);
  const cumulativeWeight = threads.length === 0 ? 0
    : threads.reduce((s, t) => s + t.weight, 0) / threads.length;
  const threadSet = new Set(threads.map(t => t.thread));
  const complexity = Math.min(1, threadSet.size / 6);
  const section: StoryWebSection = { sectionId, threadIds, cumulativeWeight, complexity };
  const sections = new Map(state.sections).set(sectionId, section);
  return recomputeStoryWeb({ ...state, sections, totalSections: sections.size });
}

// Get threads by thread type
export function getStoryWebThreadsByThread(state: NarrativeStoryWebEngineState, thread: StoryWebThread): StoryWebThreadNode[] {
  return Array.from(state.threads.values()).filter(t => t.thread === thread);
}

// Get story web report
export function getStoryWebReport(state: NarrativeStoryWebEngineState): {
  totalThreads: number;
  totalSections: number;
  averageWeight: number;
  averageEntanglement: number;
  storyWebMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalThreads === 0) recommendations.push('No threads — add story web threads');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.storyWebMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalThreads: state.totalThreads,
    totalSections: state.totalSections,
    averageWeight: Math.round(state.averageWeight * 100) / 100,
    averageEntanglement: Math.round(state.averageEntanglement * 100) / 100,
    storyWebMastery: Math.round(state.storyWebMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryWeb(state: NarrativeStoryWebEngineState): NarrativeStoryWebEngineState {
  const threads = Array.from(state.threads.values());
  const averageWeight = threads.length === 0 ? 0.5
    : threads.reduce((s, t) => s + t.weight, 0) / threads.length;
  const averageEntanglement = threads.length === 0 ? 0.5
    : threads.reduce((s, t) => s + t.entanglement, 0) / threads.length;

  const sections = Array.from(state.sections.values());
  const sectionComplexity = sections.length === 0 ? 0.5
    : sections.reduce((s, sec) => s + sec.complexity, 0) / sections.length;

  const storyWebMastery = (averageWeight * 0.4 + averageEntanglement * 0.3 + sectionComplexity * 0.3);

  return { ...state, averageWeight, averageEntanglement, sectionComplexity, storyWebMastery };
}

// Reset
export function resetNarrativeStoryWebEngineState(): NarrativeStoryWebEngineState {
  return createNarrativeStoryWebEngineState();
}