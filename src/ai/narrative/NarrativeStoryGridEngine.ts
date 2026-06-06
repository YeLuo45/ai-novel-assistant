/**
 * V1268 NarrativeStoryGridEngine — Direction I Iter 2/20 (Round 5)
 * Story grid engine: grid of story scenes
 * Sources: thunderbolt grid + nanobot + ruflo
 */

export type StoryGridScene = 'setup' | 'inciting' | 'rising' | 'climax' | 'falling' | 'resolution';
export type StoryGridIntensity = 'low' | 'moderate' | 'high' | 'peak' | 'transcendent';
export type StoryGridRhythm = 'staccato' | 'measured' | 'flowing' | 'crescendo' | 'symphonic';

export interface StoryGridCell {
  cellId: string;
  scene: StoryGridScene;
  intensity: StoryGridIntensity;
  rhythm: StoryGridRhythm;
  description: string;
  dramatic: number;
  pacing: number;
  chapter: number;
}

export interface StoryGridAxis {
  axisId: string,
  cellIds: string[],
  cumulativeDramatic: number,
  coverage: number,
}

export interface NarrativeStoryGridEngineState {
  cells: Map<string, StoryGridCell>;
  axes: Map<string, StoryGridAxis>;
  totalCells: number;
  totalAxes: number;
  averageDramatic: number;
  averagePacing: number;
  axisCoverage: number;
  storyGridMastery: number;
}

// Factory
export function createNarrativeStoryGridEngineState(): NarrativeStoryGridEngineState {
  return {
    cells: new Map(),
    axes: new Map(),
    totalCells: 0,
    totalAxes: 0,
    averageDramatic: 0.5,
    averagePacing: 0.5,
    axisCoverage: 0.5,
    storyGridMastery: 0.5,
  };
}

// Add cell
export function addStoryGridCell(
  state: NarrativeStoryGridEngineState,
  cellId: string,
  scene: StoryGridScene,
  intensity: StoryGridIntensity,
  rhythm: StoryGridRhythm,
  description: string,
  dramatic: number,
  pacing: number,
  chapter: number
): NarrativeStoryGridEngineState {
  const cell: StoryGridCell = { cellId, scene, intensity, rhythm, description, dramatic, pacing, chapter };
  const cells = new Map(state.cells).set(cellId, cell);
  return recomputeStoryGrid({ ...state, cells, totalCells: cells.size });
}

// Add axis
export function addStoryGridAxis(
  state: NarrativeStoryGridEngineState,
  axisId: string,
  cellIds: string[]
): NarrativeStoryGridEngineState {
  const cells = cellIds.map(id => state.cells.get(id)).filter((c): c is StoryGridCell => c !== undefined);
  const cumulativeDramatic = cells.length === 0 ? 0
    : cells.reduce((s, c) => s + c.dramatic, 0) / cells.length;
  const sceneSet = new Set(cells.map(c => c.scene));
  const coverage = Math.min(1, sceneSet.size / 6);
  const axis: StoryGridAxis = { axisId, cellIds, cumulativeDramatic, coverage };
  const axes = new Map(state.axes).set(axisId, axis);
  return recomputeStoryGrid({ ...state, axes, totalAxes: axes.size });
}

// Get cells by scene
export function getStoryGridCellsByScene(state: NarrativeStoryGridEngineState, scene: StoryGridScene): StoryGridCell[] {
  return Array.from(state.cells.values()).filter(c => c.scene === scene);
}

// Get story grid report
export function getStoryGridReport(state: NarrativeStoryGridEngineState): {
  totalCells: number;
  totalAxes: number;
  averageDramatic: number;
  averagePacing: number;
  storyGridMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCells === 0) recommendations.push('No cells — add story grid cells');
  if (state.averageDramatic < 0.5) recommendations.push('Low dramatic — strengthen');
  if (state.storyGridMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCells: state.totalCells,
    totalAxes: state.totalAxes,
    averageDramatic: Math.round(state.averageDramatic * 100) / 100,
    averagePacing: Math.round(state.averagePacing * 100) / 100,
    storyGridMastery: Math.round(state.storyGridMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryGrid(state: NarrativeStoryGridEngineState): NarrativeStoryGridEngineState {
  const cells = Array.from(state.cells.values());
  const averageDramatic = cells.length === 0 ? 0.5
    : cells.reduce((s, c) => s + c.dramatic, 0) / cells.length;
  const averagePacing = cells.length === 0 ? 0.5
    : cells.reduce((s, c) => s + c.pacing, 0) / cells.length;

  const axes = Array.from(state.axes.values());
  const axisCoverage = axes.length === 0 ? 0.5
    : axes.reduce((s, a) => s + a.coverage, 0) / axes.length;

  const storyGridMastery = (averageDramatic * 0.4 + averagePacing * 0.3 + axisCoverage * 0.3);

  return { ...state, averageDramatic, averagePacing, axisCoverage, storyGridMastery };
}

// Reset
export function resetNarrativeStoryGridEngineState(): NarrativeStoryGridEngineState {
  return createNarrativeStoryGridEngineState();
}