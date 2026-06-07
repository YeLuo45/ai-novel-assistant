/**
 * V1400 NarrativeCharacterSecretEngine — Direction K Iter 18/30 (Round 5)
 * Character secret engine: secrets of character
 * Sources: ruflo secret + nanobot + thunderbolt
 */

export type CharacterSecretType = 'shameful' | 'protective' | 'strategic' | 'identity' | 'trauma' | 'love' | 'transcendent';
export type CharacterSecretBurden = 'light' | 'moderate' | 'heavy' | 'crushing' | 'defining' | 'absolute' | 'transcendent';
export type CharacterSecretReveal = 'hidden' | 'implied' | 'suspected' | 'partial' | 'revealed' | 'explosive' | 'transcendent';

export interface CharacterSecretEntry {
  entryId: string;
  type: CharacterSecretType;
  burden: CharacterSecretBurden;
  reveal: CharacterSecretReveal;
  description: string;
  concealment: number;
  impact: number;
  chapter: number;
}

export interface CharacterSecretVault {
  vaultId: string,
  entryIds: string[],
  cumulativeConcealment: number,
  density: number,
}

export interface NarrativeCharacterSecretEngineState {
  entries: Map<string, CharacterSecretEntry>;
  vaults: Map<string, CharacterSecretVault>;
  totalEntries: number;
  totalVaults: number;
  averageConcealment: number;
  averageImpact: number;
  vaultDensity: number;
  characterSecretMastery: number;
}

export function createNarrativeCharacterSecretEngineState(): NarrativeCharacterSecretEngineState {
  return { entries: new Map(), vaults: new Map(), totalEntries: 0, totalVaults: 0, averageConcealment: 0.5, averageImpact: 0.5, vaultDensity: 0.5, characterSecretMastery: 0.5 };
}

export function addCharacterSecretEntry(state: NarrativeCharacterSecretEngineState, entryId: string, type: CharacterSecretType, burden: CharacterSecretBurden, reveal: CharacterSecretReveal, description: string, concealment: number, impact: number, chapter: number): NarrativeCharacterSecretEngineState {
  const entry: CharacterSecretEntry = { entryId, type, burden, reveal, description, concealment, impact, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterSecretVault(state: NarrativeCharacterSecretEngineState, vaultId: string, entryIds: string[]): NarrativeCharacterSecretEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterSecretEntry => e !== undefined);
  const cumulativeConcealment = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.concealment, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const density = Math.min(1, typeSet.size / 7);
  const vault: CharacterSecretVault = { vaultId, entryIds, cumulativeConcealment, density };
  return recompute({ ...state, vaults: new Map(state.vaults).set(vaultId, vault), totalVaults: state.vaults.size + 1 });
}

export function getCharacterSecretEntriesByType(state: NarrativeCharacterSecretEngineState, type: CharacterSecretType): CharacterSecretEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getCharacterSecretReport(state: NarrativeCharacterSecretEngineState): { totalEntries: number; totalVaults: number; averageConcealment: number; averageImpact: number; characterSecretMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character secret entries');
  if (state.averageConcealment < 0.5) recommendations.push('Low concealment — strengthen');
  if (state.characterSecretMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalVaults: state.totalVaults, averageConcealment: Math.round(state.averageConcealment * 100) / 100, averageImpact: Math.round(state.averageImpact * 100) / 100, characterSecretMastery: Math.round(state.characterSecretMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterSecretEngineState): NarrativeCharacterSecretEngineState {
  const entries = Array.from(state.entries.values());
  const averageConcealment = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.concealment, 0) / entries.length;
  const averageImpact = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.impact, 0) / entries.length;
  const vaults = Array.from(state.vaults.values());
  const vaultDensity = vaults.length === 0 ? 0.5 : vaults.reduce((s, v) => s + v.density, 0) / vaults.length;
  const characterSecretMastery = (averageConcealment * 0.4 + averageImpact * 0.3 + vaultDensity * 0.3);
  return { ...state, averageConcealment, averageImpact, vaultDensity, characterSecretMastery };
}

export function resetNarrativeCharacterSecretEngineState(): NarrativeCharacterSecretEngineState {
  return createNarrativeCharacterSecretEngineState();
}