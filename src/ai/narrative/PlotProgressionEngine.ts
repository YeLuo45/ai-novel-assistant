/**
 * V688 PlotProgressionEngine — Direction B Iter 3/9 (Round 2)
 * Plot progression engine: plot beats + subplot + main plot tracking
 * Sources: thunderbolt pipeline + ruflo + generic-agent
 */

export type PlotElement = 'setup' | 'complication' | 'crisis' | 'climax' | 'resolution';
export type SubplotType = 'romance' | 'mystery' | 'character' | 'thematic' | 'worldbuilding';
export type PlotStatus = 'pending' | 'active' | 'paused' | 'resolved' | 'abandoned';

export interface PlotBeat {
  beatId: string;
  name: string;
  description: string;
  element: PlotElement;
  subplot: SubplotType | null;
  status: PlotStatus;
  position: number;
  importance: number;
  parentId: string | null;
}

export interface PlotProgressionState {
  mainPlotBeats: Map<string, PlotBeat>;
  subplots: Map<string, PlotBeat[]>;
  totalBeats: number;
  activeBeats: number;
  resolvedBeats: number;
  averageImportance: number;
  progressionScore: number;
  subplotCount: number;
}

// Factory
export function createPlotProgressionState(): PlotProgressionState {
  return {
    mainPlotBeats: new Map(),
    subplots: new Map(),
    totalBeats: 0,
    activeBeats: 0,
    resolvedBeats: 0,
    averageImportance: 0.5,
    progressionScore: 0.5,
    subplotCount: 0,
  };
}

// Add main plot beat
export function addMainBeat(
  state: PlotProgressionState,
  beatId: string,
  name: string,
  description: string,
  element: PlotElement,
  position: number,
  importance: number = 0.5,
  parentId: string | null = null
): PlotProgressionState {
  const beat: PlotBeat = {
    beatId,
    name,
    description,
    element,
    subplot: null,
    status: 'active',
    position,
    importance,
    parentId,
  };
  const mainPlotBeats = new Map(state.mainPlotBeats).set(beatId, beat);
  return recomputeProgression({ ...state, mainPlotBeats, totalBeats: state.totalBeats + 1 });
}

// Add subplot
export function addSubplot(
  state: PlotProgressionState,
  subplotId: string,
  subplotType: SubplotType
): PlotProgressionState {
  const subplots = new Map(state.subplots).set(subplotId, []);
  return recomputeProgression({ ...state, subplots, subplotCount: subplots.size });
}

// Add subplot beat
export function addSubplotBeat(
  state: PlotProgressionState,
  subplotId: string,
  beatId: string,
  name: string,
  description: string,
  element: PlotElement,
  position: number,
  importance: number = 0.5
): PlotProgressionState {
  const beat: PlotBeat = {
    beatId,
    name,
    description,
    element,
    subplot: subplotId as SubplotType,
    status: 'active',
    position,
    importance,
    parentId: null,
  };

  const subplot = state.subplots.get(subplotId) || [];
  const updatedSubplot = [...subplot, beat];
  const subplots = new Map(state.subplots).set(subplotId, updatedSubplot);

  return recomputeProgression({ ...state, subplots, totalBeats: state.totalBeats + 1 });
}

// Update beat status
export function updateBeatStatus(state: PlotProgressionState, beatId: string, status: PlotStatus): PlotProgressionState {
  let mainPlotBeats = state.mainPlotBeats;
  let subplots = state.subplots;

  const mainBeat = mainPlotBeats.get(beatId);
  if (mainBeat) {
    mainPlotBeats = new Map(mainPlotBeats).set(beatId, { ...mainBeat, status });
  } else {
    subplots.forEach((beats, subplotId) => {
      const updated = beats.map(b => b.beatId === beatId ? { ...b, status } : b);
      if (updated !== beats) {
        subplots = new Map(subplots).set(subplotId, updated);
      }
    });
  }

  return recomputeProgression({ ...state, mainPlotBeats, subplots });
}

// Get beats by element
export function getBeatsByElement(state: PlotProgressionState, element: PlotElement): PlotBeat[] {
  const mainBeats = Array.from(state.mainPlotBeats.values()).filter(b => b.element === element);
  const subplotBeats: PlotBeat[] = [];
  state.subplots.forEach(beats => {
    beats.forEach(b => {
      if (b.element === element) subplotBeats.push(b);
    });
  });
  return [...mainBeats, ...subplotBeats];
}

// Get subplot beats
export function getSubplotBeats(state: PlotProgressionState, subplotId: string): PlotBeat[] {
  return state.subplots.get(subplotId) || [];
}

// Get progression report
export function getProgressionReport(state: PlotProgressionState): {
  totalBeats: number;
  activeBeats: number;
  resolvedBeats: number;
  averageImportance: number;
  progressionScore: number;
  subplotCount: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.mainPlotBeats.size < 3) recommendations.push('Add more main plot beats');
  if (state.subplotCount === 0) recommendations.push('Add subplots for depth');
  if (state.averageImportance < 0.5) recommendations.push('Boost beat importance');
  if (state.progressionScore < 0.5) recommendations.push('Advance plot progression');

  return {
    totalBeats: state.totalBeats,
    activeBeats: state.activeBeats,
    resolvedBeats: state.resolvedBeats,
    averageImportance: Math.round(state.averageImportance * 100) / 100,
    progressionScore: Math.round(state.progressionScore * 100) / 100,
    subplotCount: state.subplotCount,
    recommendations,
  };
}

// Recompute metrics
function recomputeProgression(state: PlotProgressionState): PlotProgressionState {
  const mainBeats = Array.from(state.mainPlotBeats.values());
  const subplotBeats: PlotBeat[] = [];
  state.subplots.forEach(beats => beats.forEach(b => subplotBeats.push(b)));

  const allBeats = [...mainBeats, ...subplotBeats];
  const activeBeats = allBeats.filter(b => b.status === 'active').length;
  const resolvedBeats = allBeats.filter(b => b.status === 'resolved').length;
  const averageImportance = allBeats.length > 0
    ? allBeats.reduce((s, b) => s + b.importance, 0) / allBeats.length
    : 0.5;
  const progressionScore = allBeats.length === 0
    ? 0.5
    : resolvedBeats / allBeats.length;

  return { ...state, activeBeats, resolvedBeats, averageImportance, progressionScore };
}

// Reset progression state
export function resetPlotProgressionState(): PlotProgressionState {
  return createPlotProgressionState();
}