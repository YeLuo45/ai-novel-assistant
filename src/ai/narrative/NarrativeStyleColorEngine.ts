/**
 * V1596 NarrativeStyleColorEngine — Direction N Iter 26/30 (Round 5)
 */
export type StyleColorType = 'monochrome' | 'duotone' | 'limited' | 'full' | 'saturated' | 'transcendent' | 'infinite';
export type StyleColorApplication = 'literal' | 'figurative' | 'mixed' | 'transcendent' | 'infinite';
export interface StyleColorEntry { entryId: string; type: StyleColorType; application: StyleColorApplication; description: string; visuality: number; chapter: number; }
export interface StyleColorPalette { paletteId: string; entryIds: string[]; cumulativeVisuality: number; breadth: number; }
export interface NarrativeStyleColorEngineState { entries: Map<string, StyleColorEntry>; palettes: Map<string, StyleColorPalette>; totalEntries: number; totalPalettes: number; averageVisuality: number; colorComplexity: number; colorMastery: number; }
export function createNarrativeStyleColorEngineState(): NarrativeStyleColorEngineState { return { entries: new Map(), palettes: new Map(), totalEntries: 0, totalPalettes: 0, averageVisuality: 0.5, colorComplexity: 0.5, colorMastery: 0.5 }; }
export function addStyleColorEntry(state: NarrativeStyleColorEngineState, entryId: string, type: StyleColorType, application: StyleColorApplication, description: string, visuality: number, chapter: number): NarrativeStyleColorEngineState {
  const entry: StyleColorEntry = { entryId, type, application, description, visuality, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleColorPalette(state: NarrativeStyleColorEngineState, paletteId: string, entryIds: string[]): NarrativeStyleColorEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleColorEntry => e !== undefined);
  const cumulativeVisuality = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.visuality, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const palette: StyleColorPalette = { paletteId, entryIds, cumulativeVisuality, breadth };
  return recompute({ ...state, palettes: new Map(state.palettes).set(paletteId, palette), totalPalettes: state.palettes.size + 1 });
}
export function getStyleColorEntriesByType(state: NarrativeStyleColorEngineState, type: StyleColorType): StyleColorEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleColorReport(state: NarrativeStyleColorEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style color entries');
  if (state.averageVisuality < 0.5) recommendations.push('Low visuality — strengthen');
  if (state.colorMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPalettes: state.totalPalettes, averageVisuality: Math.round(state.averageVisuality * 100) / 100, colorComplexity: Math.round(state.colorComplexity * 100) / 100, colorMastery: Math.round(state.colorMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleColorEngineState): NarrativeStyleColorEngineState {
  const entries = Array.from(state.entries.values());
  const averageVisuality = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.visuality, 0) / entries.length;
  const palettes = Array.from(state.palettes.values());
  const colorComplexity = palettes.length === 0 ? 0.5 : palettes.reduce((s, p) => s + p.breadth, 0) / palettes.length;
  return { ...state, averageVisuality, colorComplexity, colorMastery: averageVisuality * 0.5 + colorComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleColorEngineState(): NarrativeStyleColorEngineState { return createNarrativeStyleColorEngineState(); }