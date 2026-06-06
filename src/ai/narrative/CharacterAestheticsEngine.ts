/**
 * V1052 CharacterAestheticsEngine — Direction C Iter 14/20 (Round 5)
 * Character aesthetics engine: beauty + form of character
 * Sources: nanobot aesthetics + chatdev + thunderbolt
 */

export type AestheticQuality = 'grace' | 'presence' | 'charisma' | 'elegance' | 'magnetism' | 'aura';
export type AestheticForm = 'classical' | 'unconventional' | 'striking' | 'subtle' | 'commanding' | 'ethereal';
export type AestheticDepth = 'superficial' | 'surface' | 'moderate' | 'deep' | 'transcendent';

export interface CharacterAesthetic {
  aestheticId: string;
  quality: AestheticQuality;
  form: AestheticForm;
  depth: AestheticDepth;
  characterId: string;
  description: string;
  presence: number;
  memorability: number;
  chapter: number;
}

export interface AestheticPresence {
  presenceId: string,
  characterId: string,
  aestheticIds: string[],
  presencePower: number,
  consistency: number,
}

export interface CharacterAestheticsEngineState {
  aesthetics: Map<string, CharacterAesthetic>;
  presences: Map<string, AestheticPresence>;
  totalAesthetics: number;
  totalPresences: number;
  averagePresence: number;
  averageMemorability: number;
  presenceConsistency: number;
  characterAestheticsMastery: number;
}

// Factory
export function createCharacterAestheticsEngineState(): CharacterAestheticsEngineState {
  return {
    aesthetics: new Map(),
    presences: new Map(),
    totalAesthetics: 0,
    totalPresences: 0,
    averagePresence: 0.5,
    averageMemorability: 0.5,
    presenceConsistency: 0.5,
    characterAestheticsMastery: 0.5,
  };
}

// Add aesthetic
export function addCharacterAesthetic(
  state: CharacterAestheticsEngineState,
  aestheticId: string,
  quality: AestheticQuality,
  form: AestheticForm,
  depth: AestheticDepth,
  characterId: string,
  description: string,
  presence: number,
  memorability: number,
  chapter: number
): CharacterAestheticsEngineState {
  const aesthetic: CharacterAesthetic = { aestheticId, quality, form, depth, characterId, description, presence, memorability, chapter };
  const aesthetics = new Map(state.aesthetics).set(aestheticId, aesthetic);
  return recomputeCharacterAesthetics({ ...state, aesthetics, totalAesthetics: aesthetics.size });
}

// Add presence
export function addAestheticPresence(
  state: CharacterAestheticsEngineState,
  presenceId: string,
  characterId: string,
  aestheticIds: string[]
): CharacterAestheticsEngineState {
  const aesthetics = aestheticIds.map(id => state.aesthetics.get(id)).filter((a): a is CharacterAesthetic => a !== undefined);
  const presencePower = aesthetics.length === 0 ? 0
    : aesthetics.reduce((s, a) => s + a.presence, 0) / aesthetics.length;
  const consistency = aesthetics.length < 2 ? 0.5
    : 1 - Math.abs(aesthetics[0].memorability - aesthetics[aesthetics.length - 1].memorability);
  const presence: AestheticPresence = { presenceId, characterId, aestheticIds, presencePower, consistency };
  const presences = new Map(state.presences).set(presenceId, presence);
  return recomputeCharacterAesthetics({ ...state, presences, totalPresences: presences.size });
}

// Get aesthetics by quality
export function getAestheticsByQuality(state: CharacterAestheticsEngineState, quality: AestheticQuality): CharacterAesthetic[] {
  return Array.from(state.aesthetics.values()).filter(a => a.quality === quality);
}

// Get character aesthetics report
export function getCharacterAestheticsReport(state: CharacterAestheticsEngineState): {
  totalAesthetics: number;
  totalPresences: number;
  averagePresence: number;
  averageMemorability: number;
  characterAestheticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAesthetics === 0) recommendations.push('No aesthetics — add character aesthetics');
  if (state.averageMemorability < 0.5) recommendations.push('Low memorability — strengthen');
  if (state.characterAestheticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAesthetics: state.totalAesthetics,
    totalPresences: state.totalPresences,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    averageMemorability: Math.round(state.averageMemorability * 100) / 100,
    characterAestheticsMastery: Math.round(state.characterAestheticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterAesthetics(state: CharacterAestheticsEngineState): CharacterAestheticsEngineState {
  const aesthetics = Array.from(state.aesthetics.values());
  const averagePresence = aesthetics.length === 0 ? 0.5
    : aesthetics.reduce((s, a) => s + a.presence, 0) / aesthetics.length;
  const averageMemorability = aesthetics.length === 0 ? 0.5
    : aesthetics.reduce((s, a) => s + a.memorability, 0) / aesthetics.length;

  const presences = Array.from(state.presences.values());
  const presenceConsistency = presences.length === 0 ? 0.5
    : presences.reduce((s, p) => s + p.consistency, 0) / presences.length;

  const characterAestheticsMastery = (averagePresence * 0.3 + averageMemorability * 0.4 + presenceConsistency * 0.3);

  return { ...state, averagePresence, averageMemorability, presenceConsistency, characterAestheticsMastery };
}

// Reset
export function resetCharacterAestheticsEngineState(): CharacterAestheticsEngineState {
  return createCharacterAestheticsEngineState();
}