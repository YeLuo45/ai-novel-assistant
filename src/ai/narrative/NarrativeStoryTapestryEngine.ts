/**
 * V1278 NarrativeStoryTapestryEngine — Direction I Iter 7/20 (Round 5)
 * Story tapestry engine: tapestry of story threads
 * Sources: nanobot tapestry + thunderbolt + ruflo
 */

export type StoryTapestryThread = 'narrative' | 'descriptive' | 'dialogue' | 'interior' | 'symbolic' | 'meta';
export type StoryTapestryTexture = 'plain' | 'woven' | 'embroidered' | 'rich' | 'opulent';
export type StoryTapestryColor = 'monochrome' | 'muted' | 'varied' | 'vibrant' | 'kaleidoscopic';

export interface StoryTapestryThreadNode {
  threadId: string;
  thread: StoryTapestryThread;
  texture: StoryTapestryTexture;
  color: StoryTapestryColor;
  description: string;
  richness: number;
  harmony: number;
  chapter: number;
}

export interface StoryTapestryPanel {
  panelId: string,
  threadIds: string[],
  cumulativeRichness: number,
  beauty: number,
}

export interface NarrativeStoryTapestryEngineState {
  threads: Map<string, StoryTapestryThreadNode>;
  panels: Map<string, StoryTapestryPanel>;
  totalThreads: number;
  totalPanels: number;
  averageRichness: number;
  averageHarmony: number;
  panelBeauty: number;
  storyTapestryMastery: number;
}

// Factory
export function createNarrativeStoryTapestryEngineState(): NarrativeStoryTapestryEngineState {
  return {
    threads: new Map(),
    panels: new Map(),
    totalThreads: 0,
    totalPanels: 0,
    averageRichness: 0.5,
    averageHarmony: 0.5,
    panelBeauty: 0.5,
    storyTapestryMastery: 0.5,
  };
}

// Add thread
export function addStoryTapestryThread(
  state: NarrativeStoryTapestryEngineState,
  threadId: string,
  thread: StoryTapestryThread,
  texture: StoryTapestryTexture,
  color: StoryTapestryColor,
  description: string,
  richness: number,
  harmony: number,
  chapter: number
): NarrativeStoryTapestryEngineState {
  const threadNode: StoryTapestryThreadNode = { threadId, thread, texture, color, description, richness, harmony, chapter };
  const threads = new Map(state.threads).set(threadId, threadNode);
  return recomputeStoryTapestry({ ...state, threads, totalThreads: threads.size });
}

// Add panel
export function addStoryTapestryPanel(
  state: NarrativeStoryTapestryEngineState,
  panelId: string,
  threadIds: string[]
): NarrativeStoryTapestryEngineState {
  const threads = threadIds.map(id => state.threads.get(id)).filter((t): t is StoryTapestryThreadNode => t !== undefined);
  const cumulativeRichness = threads.length === 0 ? 0
    : threads.reduce((s, t) => s + t.richness, 0) / threads.length;
  const threadSet = new Set(threads.map(t => t.thread));
  const beauty = Math.min(1, threadSet.size / 6);
  const panel: StoryTapestryPanel = { panelId, threadIds, cumulativeRichness, beauty };
  const panels = new Map(state.panels).set(panelId, panel);
  return recomputeStoryTapestry({ ...state, panels, totalPanels: panels.size });
}

// Get threads by thread type
export function getStoryTapestryThreadsByThread(state: NarrativeStoryTapestryEngineState, thread: StoryTapestryThread): StoryTapestryThreadNode[] {
  return Array.from(state.threads.values()).filter(t => t.thread === thread);
}

// Get story tapestry report
export function getStoryTapestryReport(state: NarrativeStoryTapestryEngineState): {
  totalThreads: number;
  totalPanels: number;
  averageRichness: number;
  averageHarmony: number;
  storyTapestryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalThreads === 0) recommendations.push('No threads — add story tapestry threads');
  if (state.averageRichness < 0.5) recommendations.push('Low richness — strengthen');
  if (state.storyTapestryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalThreads: state.totalThreads,
    totalPanels: state.totalPanels,
    averageRichness: Math.round(state.averageRichness * 100) / 100,
    averageHarmony: Math.round(state.averageHarmony * 100) / 100,
    storyTapestryMastery: Math.round(state.storyTapestryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryTapestry(state: NarrativeStoryTapestryEngineState): NarrativeStoryTapestryEngineState {
  const threads = Array.from(state.threads.values());
  const averageRichness = threads.length === 0 ? 0.5
    : threads.reduce((s, t) => s + t.richness, 0) / threads.length;
  const averageHarmony = threads.length === 0 ? 0.5
    : threads.reduce((s, t) => s + t.harmony, 0) / threads.length;

  const panels = Array.from(state.panels.values());
  const panelBeauty = panels.length === 0 ? 0.5
    : panels.reduce((s, p) => s + p.beauty, 0) / panels.length;

  const storyTapestryMastery = (averageRichness * 0.4 + averageHarmony * 0.3 + panelBeauty * 0.3);

  return { ...state, averageRichness, averageHarmony, panelBeauty, storyTapestryMastery };
}

// Reset
export function resetNarrativeStoryTapestryEngineState(): NarrativeStoryTapestryEngineState {
  return createNarrativeStoryTapestryEngineState();
}