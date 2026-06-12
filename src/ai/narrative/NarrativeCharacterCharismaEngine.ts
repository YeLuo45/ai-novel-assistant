/**
 * V1416 NarrativeCharacterCharismaEngine — Direction K Iter 26/30 (Round 5)
 * Character charisma engine: charisma of character
 * Sources: thunderbolt charisma + nanobot + ruflo
 */

export type CharacterCharismaSource = 'presence' | 'warmth' | 'power' | 'compassion' | 'mystery' | 'vulnerability' | 'transcendent';
export type CharacterCharismaIntensity = 'subtle' | 'noticeable' | 'strong' | 'powerful' | 'magnetic' | 'irresistible' | 'transcendent';
export type CharacterCharismaConsciousness = 'unconscious' | 'instinctive' | 'aware' | 'cultivated' | 'mastered' | 'transcendent' | 'absolute';

export interface CharacterCharismaEntry {
  entryId: string;
  source: CharacterCharismaSource;
  intensity: CharacterCharismaIntensity;
  consciousness: CharacterCharismaConsciousness;
  description: string;
  allure: number;
  influence: number;
  chapter: number;
}

export interface CharacterCharismaAura {
  auraId: string,
  entryIds: string[],
  cumulativeAllure: number,
  breadth: number,
}

export interface NarrativeCharacterCharismaEngineState {
  entries: Map<string, CharacterCharismaEntry>;
  auras: Map<string, CharacterCharismaAura>;
  totalEntries: number;
  totalAuras: number;
  averageAllure: number;
  averageInfluence: number;
  auraBreadth: number;
  characterCharismaMastery: number;
}

export function createNarrativeCharacterCharismaEngineState(): NarrativeCharacterCharismaEngineState {
  return { entries: new Map(), auras: new Map(), totalEntries: 0, totalAuras: 0, averageAllure: 0.5, averageInfluence: 0.5, auraBreadth: 0.5, characterCharismaMastery: 0.5 };
}

export function addCharacterCharismaEntry(state: NarrativeCharacterCharismaEngineState, entryId: string, source: CharacterCharismaSource, intensity: CharacterCharismaIntensity, consciousness: CharacterCharismaConsciousness, description: string, allure: number, influence: number, chapter: number): NarrativeCharacterCharismaEngineState {
  const entry: CharacterCharismaEntry = { entryId, source, intensity, consciousness, description, allure, influence, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterCharismaAura(state: NarrativeCharacterCharismaEngineState, auraId: string, entryIds: string[]): NarrativeCharacterCharismaEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterCharismaEntry => e !== undefined);
  const cumulativeAllure = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.allure, 0) / entries.length;
  const sourceSet = new Set(entries.map(e => e.source));
  const breadth = Math.min(1, sourceSet.size / 7);
  const aura: CharacterCharismaAura = { auraId, entryIds, cumulativeAllure, breadth };
  return recompute({ ...state, auras: new Map(state.auras).set(auraId, aura), totalAuras: state.auras.size + 1 });
}

export function getCharacterCharismaEntriesBySource(state: NarrativeCharacterCharismaEngineState, source: CharacterCharismaSource): CharacterCharismaEntry[] {
  return Array.from(state.entries.values()).filter(e => e.source === source);
}

export function getCharacterCharismaReport(state: NarrativeCharacterCharismaEngineState): { totalEntries: number; totalAuras: number; averageAllure: number; averageInfluence: number; characterCharismaMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character charisma entries');
  if (state.averageAllure < 0.5) recommendations.push('Low allure — strengthen');
  if (state.characterCharismaMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalAuras: state.totalAuras, averageAllure: Math.round(state.averageAllure * 100) / 100, averageInfluence: Math.round(state.averageInfluence * 100) / 100, characterCharismaMastery: Math.round(state.characterCharismaMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterCharismaEngineState): NarrativeCharacterCharismaEngineState {
  const entries = Array.from(state.entries.values());
  const averageAllure = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.allure, 0) / entries.length;
  const averageInfluence = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.influence, 0) / entries.length;
  const auras = Array.from(state.auras.values());
  const auraBreadth = auras.length === 0 ? 0.5 : auras.reduce((s, a) => s + a.breadth, 0) / auras.length;
  const characterCharismaMastery = (averageAllure * 0.4 + averageInfluence * 0.3 + auraBreadth * 0.3);
  return { ...state, averageAllure, averageInfluence, auraBreadth, characterCharismaMastery };
}

export function resetNarrativeCharacterCharismaEngineState(): NarrativeCharacterCharismaEngineState {
  return createNarrativeCharacterCharismaEngineState();
}