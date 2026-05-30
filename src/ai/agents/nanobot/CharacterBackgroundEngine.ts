/**
 * CharacterBackgroundEngine - V156
 * Character History & Motivation Tracking Engine
 */

export type MotivationType = 'survival' | 'power' | 'love' | 'revenge' | 'knowledge' | 'freedom' | 'belonging' | 'legacy'
export type RelationshipType = 'ally' | 'enemy' | 'neutral' | 'family' | 'romantic' | 'mentor' | 'rival'

export interface CharacterEvent {
  eventId: string
  timestamp: number
  title: string
  description: string
  emotionalImpact: number  // -100 to 100
  characters: string[]
  location: string
}

export interface CharacterMotivation {
  type: MotivationType
  strength: number  // 0-100
  trigger: string
  goal: string
  barrier: string
}

export interface CharacterProfile {
  charId: string
  name: string
  backstory: CharacterEvent[]
  currentMotivations: CharacterMotivation[]
  personalityTraits: string[]
  relationships: Map<string, RelationshipType>
  arcProgress: number  // 0-100
  emotionalState: string
  secrets: string[]
  fears: string[]
}

export interface BackgroundState {
  characters: Map<string, CharacterProfile>
  events: CharacterEvent[]
  currentCharacterId: string | null
  timeline: Array<{timestamp: number; charId: string; eventId: string}>
}

// State Management
export function createEmptyBackgroundState(): BackgroundState {
  return { characters: new Map(), events: [], currentCharacterId: null, timeline: [] };
}

export function createCharacter(charId: string, name: string): CharacterProfile {
  return {
    charId, name, backstory: [], currentMotivations: [], personalityTraits: [],
    relationships: new Map(), arcProgress: 0, emotionalState: 'neutral', secrets: [], fears: []
  };
}

export function registerCharacter(state: BackgroundState, profile: CharacterProfile): BackgroundState {
  const newChars = new Map(state.characters);
  newChars.set(profile.charId, profile);
  return { ...state, characters: newChars, currentCharacterId: profile.charId };
}

// Event Management
export function addEvent(state: BackgroundState, charId: string, title: string, description: string, emotionalImpact: number, location: string): BackgroundState {
  const event: CharacterEvent = { eventId: 'evt_' + Date.now(), timestamp: Date.now(), title, description, emotionalImpact, characters: [charId], location };
  const char = state.characters.get(charId);
  if (!char) return state;
  
  const updated = { ...char, backstory: [...char.backstory, event] };
  const newChars = new Map(state.characters);
  newChars.set(charId, updated);
  
  return {
    ...state, characters: newChars, events: [...state.events, event],
    timeline: [...state.timeline, { timestamp: event.timestamp, charId, eventId: event.eventId }]
  };
}

// Motivation Management
export function setMotivation(state: BackgroundState, charId: string, motivation: CharacterMotivation): BackgroundState {
  const char = state.characters.get(charId);
  if (!char) return state;
  
  const existing = char.currentMotivations.findIndex(m => m.type === motivation.type);
  const newMotifs = existing >= 0
    ? char.currentMotivations.map((m, i) => i === existing ? motivation : m)
    : [...char.currentMotivations, motivation];
  
  const newChars = new Map(state.characters);
  newChars.set(charId, { ...char, currentMotivations: newMotifs });
  return { ...state, characters: newChars };
}

export function getPrimaryMotivation(char: CharacterProfile): CharacterMotivation | null {
  if (!char.currentMotivations.length) return null;
  return char.currentMotivations.reduce((a, b) => a.strength > b.strength ? a : b);
}

// Relationship Management
export function setRelationship(state: BackgroundState, char1Id: string, char2Id: string, relType: RelationshipType): BackgroundState {
  const c1 = state.characters.get(char1Id), c2 = state.characters.get(char2Id);
  if (!c1 || !c2) return state;
  
  const newC1Rels = new Map(c1.relationships); newC1Rels.set(char2Id, relType);
  const newC2Rels = new Map(c2.relationships); newC2Rels.set(char1Id, relType);
  
  const newChars = new Map(state.characters);
  newChars.set(char1Id, { ...c1, relationships: newC1Rels });
  newChars.set(char2Id, { ...c2, relationships: newC2Rels });
  return { ...state, characters: newChars };
}

// Arc Progress
export function updateArcProgress(state: BackgroundState, charId: string, progress: number): BackgroundState {
  const char = state.characters.get(charId);
  if (!char) return state;
  const newChars = new Map(state.characters);
  newChars.set(charId, { ...char, arcProgress: Math.min(100, Math.max(0, progress)) });
  return { ...state, characters: newChars };
}

// Motivation Analysis
export function analyzeMotivationDrift(state: BackgroundState, charId: string): {from: MotivationType; to: MotivationType; strength: number}[] {
  const char = state.characters.get(charId);
  if (!char || char.backstory.length < 2) return [];
  
  const drifts: {from: MotivationType; to: MotivationType; strength: number}[] = [];
  for (const m of char.currentMotivations) {
    const oldM = char.currentMotivations.find(o => o.type === m.type);
    if (oldM && oldM.strength !== m.strength) {
      drifts.push({ from: oldM.type, to: m.type, strength: Math.abs(m.strength - oldM.strength) });
    }
  }
  return drifts;
}

// Consistency Check
export function checkConsistency(state: BackgroundState, charId: string): {consistent: boolean; issues: string[]} {
  const char = state.characters.get(charId);
  if (!char) return { consistent: false, issues: ['Character not found'] };
  
  const issues: string[] = [];
  const primary = getPrimaryMotivation(char);
  if (!primary) issues.push('No primary motivation defined');
  if (char.arcProgress > 100 || char.arcProgress < 0) issues.push('Invalid arc progress');
  if (char.fears.length > 10) issues.push('Excessive number of fears');
  if (char.secrets.length > 10) issues.push('Excessive number of secrets');
  
  // Check for contradictory emotions
  const posEvents = char.backstory.filter(e => e.emotionalImpact > 50).length;
  const negEvents = char.backstory.filter(e => e.emotionalImpact < -50).length;
  if (posEvents > 5 && negEvents > 5 && char.backstory.length > 10) {
    issues.push('Conflicting emotional events in backstory');
  }
  
  return { consistent: issues.length === 0, issues };
}

// Formatters
export function formatCharacterProfile(char: CharacterProfile): string {
  const primary = getPrimaryMotivation(char);
  let s = '=== Character Profile: ' + char.name + ' ===\n';
  s += 'Arc Progress: ' + char.arcProgress + '%\n';
  s += 'Emotional State: ' + char.emotionalState + '\n';
  if (primary) s += 'Primary Motivation: ' + primary.type + ' (strength: ' + primary.strength + ')\n';
  s += 'Backstory Events: ' + char.backstory.length + '\n';
  s += 'Relationships: ' + Array.from(char.relationships.values()).join(', ') + '\n';
  if (char.fears.length) s += 'Fears: ' + char.fears.join(', ') + '\n';
  return s;
}

export function formatBackgroundDashboard(state: BackgroundState): string {
  let s = '=== Character Background Dashboard ===\n';
  s += 'Registered Characters: ' + state.characters.size + '\n';
  s += 'Total Events: ' + state.events.length + '\n\n';
  
  for (const [id, char] of state.characters) {
    s += formatCharacterProfile(char) + '\n';
  }
  return s;
}
