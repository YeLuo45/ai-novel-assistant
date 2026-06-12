/**
 * V1410 NarrativeCharacterIdEngine — Direction K Iter 23/30 (Round 5)
 * Character id engine: primal drives of character
 * Sources: thunderbolt id + nanobot + ruflo
 */

export type CharacterIdDrive = 'survival' | 'pleasure' | 'aggression' | 'sexual' | 'creative' | 'destructive' | 'transcendent';
export type CharacterIdIntensity = 'latent' | 'mild' | 'present' | 'strong' | 'overwhelming' | 'absolute' | 'transcendent';
export type CharacterIdChanneling = 'repressed' | 'sublimated' | 'expressed' | 'creative' | 'destructive' | 'transcendent' | 'infinite';

export interface CharacterIdEntry {
  entryId: string;
  drive: CharacterIdDrive;
  intensity: CharacterIdIntensity;
  channeling: CharacterIdChanneling;
  description: string;
  urgency: number;
  creativity: number;
  chapter: number;
}

export interface CharacterIdStream {
  streamId: string,
  entryIds: string[],
  cumulativeUrgency: number,
  diversity: number,
}

export interface NarrativeCharacterIdEngineState {
  entries: Map<string, CharacterIdEntry>;
  streams: Map<string, CharacterIdStream>;
  totalEntries: number;
  totalStreams: number;
  averageUrgency: number;
  averageCreativity: number;
  streamDiversity: number;
  characterIdMastery: number;
}

export function createNarrativeCharacterIdEngineState(): NarrativeCharacterIdEngineState {
  return { entries: new Map(), streams: new Map(), totalEntries: 0, totalStreams: 0, averageUrgency: 0.5, averageCreativity: 0.5, streamDiversity: 0.5, characterIdMastery: 0.5 };
}

export function addCharacterIdEntry(state: NarrativeCharacterIdEngineState, entryId: string, drive: CharacterIdDrive, intensity: CharacterIdIntensity, channeling: CharacterIdChanneling, description: string, urgency: number, creativity: number, chapter: number): NarrativeCharacterIdEngineState {
  const entry: CharacterIdEntry = { entryId, drive, intensity, channeling, description, urgency, creativity, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterIdStream(state: NarrativeCharacterIdEngineState, streamId: string, entryIds: string[]): NarrativeCharacterIdEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterIdEntry => e !== undefined);
  const cumulativeUrgency = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.urgency, 0) / entries.length;
  const driveSet = new Set(entries.map(e => e.drive));
  const diversity = Math.min(1, driveSet.size / 7);
  const stream: CharacterIdStream = { streamId, entryIds, cumulativeUrgency, diversity };
  return recompute({ ...state, streams: new Map(state.streams).set(streamId, stream), totalStreams: state.streams.size + 1 });
}

export function getCharacterIdEntriesByDrive(state: NarrativeCharacterIdEngineState, drive: CharacterIdDrive): CharacterIdEntry[] {
  return Array.from(state.entries.values()).filter(e => e.drive === drive);
}

export function getCharacterIdReport(state: NarrativeCharacterIdEngineState): { totalEntries: number; totalStreams: number; averageUrgency: number; averageCreativity: number; characterIdMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character id entries');
  if (state.averageUrgency < 0.5) recommendations.push('Low urgency — strengthen');
  if (state.characterIdMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalStreams: state.totalStreams, averageUrgency: Math.round(state.averageUrgency * 100) / 100, averageCreativity: Math.round(state.averageCreativity * 100) / 100, characterIdMastery: Math.round(state.characterIdMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterIdEngineState): NarrativeCharacterIdEngineState {
  const entries = Array.from(state.entries.values());
  const averageUrgency = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.urgency, 0) / entries.length;
  const averageCreativity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.creativity, 0) / entries.length;
  const streams = Array.from(state.streams.values());
  const streamDiversity = streams.length === 0 ? 0.5 : streams.reduce((s, st) => s + st.diversity, 0) / streams.length;
  const characterIdMastery = (averageUrgency * 0.4 + averageCreativity * 0.3 + streamDiversity * 0.3);
  return { ...state, averageUrgency, averageCreativity, streamDiversity, characterIdMastery };
}

export function resetNarrativeCharacterIdEngineState(): NarrativeCharacterIdEngineState {
  return createNarrativeCharacterIdEngineState();
}