/**
 * V1266 NarrativeStoryMatrixEngine — Direction I Iter 1/20 (Round 5)
 * Story matrix engine: matrix of story elements
 * Sources: nanobot matrix + thunderbolt + ruflo
 */

export type StoryMatrixDimension = 'plot' | 'character' | 'theme' | 'setting' | 'conflict' | 'resolution';
export type StoryMatrixDensity = 'sparse' | 'moderate' | 'dense' | 'very_dense' | 'complete';
export type StoryMatrixCoherence = 'fragmented' | 'loose' | 'coherent' | 'tight' | 'unified';

export interface StoryMatrixCell {
  cellId: string;
  row: StoryMatrixDimension;
  column: StoryMatrixDimension;
  density: StoryMatrixDensity;
  description: string;
  weight: number;
  integrity: number;
  chapter: number;
}

export interface StoryMatrixRow {
  rowId: string,
  cellIds: string[],
  cumulativeWeight: number,
  completeness: number,
}

export interface NarrativeStoryMatrixEngineState {
  cells: Map<string, StoryMatrixCell>;
  rows: Map<string, StoryMatrixRow>;
  totalCells: number;
  totalRows: number;
  averageWeight: number;
  averageIntegrity: number;
  rowCompleteness: number;
  storyMatrixMastery: number;
}

// Factory
export function createNarrativeStoryMatrixEngineState(): NarrativeStoryMatrixEngineState {
  return {
    cells: new Map(),
    rows: new Map(),
    totalCells: 0,
    totalRows: 0,
    averageWeight: 0.5,
    averageIntegrity: 0.5,
    rowCompleteness: 0.5,
    storyMatrixMastery: 0.5,
  };
}

// Add cell
export function addStoryMatrixCell(
  state: NarrativeStoryMatrixEngineState,
  cellId: string,
  row: StoryMatrixDimension,
  column: StoryMatrixDimension,
  density: StoryMatrixDensity,
  description: string,
  weight: number,
  integrity: number,
  chapter: number
): NarrativeStoryMatrixEngineState {
  const cell: StoryMatrixCell = { cellId, row, column, density, description, weight, integrity, chapter };
  const cells = new Map(state.cells).set(cellId, cell);
  return recomputeStoryMatrix({ ...state, cells, totalCells: cells.size });
}

// Add row
export function addStoryMatrixRow(
  state: NarrativeStoryMatrixEngineState,
  rowId: string,
  cellIds: string[]
): NarrativeStoryMatrixEngineState {
  const cells = cellIds.map(id => state.cells.get(id)).filter((c): c is StoryMatrixCell => c !== undefined);
  const cumulativeWeight = cells.length === 0 ? 0
    : cells.reduce((s, c) => s + c.weight, 0) / cells.length;
  const dimSet = new Set(cells.map(c => c.row));
  const completeness = Math.min(1, dimSet.size / 6);
  const matrixRow: StoryMatrixRow = { rowId, cellIds, cumulativeWeight, completeness };
  const rows = new Map(state.rows).set(rowId, matrixRow);
  return recomputeStoryMatrix({ ...state, rows, totalRows: rows.size });
}

// Get cells by row
export function getStoryMatrixCellsByRow(state: NarrativeStoryMatrixEngineState, row: StoryMatrixDimension): StoryMatrixCell[] {
  return Array.from(state.cells.values()).filter(c => c.row === row);
}

// Get story matrix report
export function getStoryMatrixReport(state: NarrativeStoryMatrixEngineState): {
  totalCells: number;
  totalRows: number;
  averageWeight: number;
  averageIntegrity: number;
  storyMatrixMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCells === 0) recommendations.push('No cells — add story matrix cells');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.storyMatrixMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCells: state.totalCells,
    totalRows: state.totalRows,
    averageWeight: Math.round(state.averageWeight * 100) / 100,
    averageIntegrity: Math.round(state.averageIntegrity * 100) / 100,
    storyMatrixMastery: Math.round(state.storyMatrixMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryMatrix(state: NarrativeStoryMatrixEngineState): NarrativeStoryMatrixEngineState {
  const cells = Array.from(state.cells.values());
  const averageWeight = cells.length === 0 ? 0.5
    : cells.reduce((s, c) => s + c.weight, 0) / cells.length;
  const averageIntegrity = cells.length === 0 ? 0.5
    : cells.reduce((s, c) => s + c.integrity, 0) / cells.length;

  const rows = Array.from(state.rows.values());
  const rowCompleteness = rows.length === 0 ? 0.5
    : rows.reduce((s, r) => s + r.completeness, 0) / rows.length;

  const storyMatrixMastery = (averageWeight * 0.4 + averageIntegrity * 0.3 + rowCompleteness * 0.3);

  return { ...state, averageWeight, averageIntegrity, rowCompleteness, storyMatrixMastery };
}

// Reset
export function resetNarrativeStoryMatrixEngineState(): NarrativeStoryMatrixEngineState {
  return createNarrativeStoryMatrixEngineState();
}