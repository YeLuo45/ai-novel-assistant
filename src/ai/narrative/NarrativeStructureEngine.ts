/**
 * V684 NarrativeStructureEngine — Direction B Iter 1/9 (Round 2)
 * Narrative structure engine: 3-act + hero's journey + structure patterns
 * Sources: ruflo hierarchical + thunderbolt pipeline + nanobot structure
 */

export type StructureType = 'three_act' | 'hero_journey' | 'save_the_cat' | 'kishotenketsu' | 'freytag_pyramid' | 'in_medias_res';
export type ActPhase = 'setup' | 'rising_action' | 'climax' | 'falling_action' | 'resolution' | 'denouement';

export interface StoryAct {
  actId: string;
  phase: ActPhase;
  description: string;
  scenes: string[];
  duration: number;
  intensity: number;
  position: number;
}

export interface StoryBeat {
  beatId: string;
  name: string;
  description: string;
  act: number;
  percentage: number;
  importance: number;
}

export interface NarrativeStructureState {
  structureType: StructureType;
  acts: Map<string, StoryAct>;
  beats: Map<string, StoryBeat>;
  totalScenes: number;
  averageIntensity: number;
  structureCompleteness: number;
  pacingScore: number;
}

// Factory
export function createNarrativeStructureState(): NarrativeStructureState {
  return {
    structureType: 'three_act',
    acts: new Map(),
    beats: new Map(),
    totalScenes: 0,
    averageIntensity: 0.5,
    structureCompleteness: 0,
    pacingScore: 0.7,
  };
}

// Set structure type
export function setStructureType(state: NarrativeStructureState, type: StructureType): NarrativeStructureState {
  return { ...state, structureType: type };
}

// Add act
export function addAct(
  state: NarrativeStructureState,
  actId: string,
  phase: ActPhase,
  description: string,
  duration: number = 1000,
  intensity: number = 0.5,
  position: number = 0
): NarrativeStructureState {
  const act: StoryAct = { actId, phase, description, scenes: [], duration, intensity, position };
  const acts = new Map(state.acts).set(actId, act);
  return recomputeStructure({ ...state, acts });
}

// Add scene to act
export function addSceneToAct(state: NarrativeStructureState, actId: string, sceneId: string): NarrativeStructureState {
  const act = state.acts.get(actId);
  if (!act) return state;

  const updated: StoryAct = { ...act, scenes: [...act.scenes, sceneId] };
  const acts = new Map(state.acts).set(actId, updated);
  return recomputeStructure({ ...state, acts, totalScenes: state.totalScenes + 1 });
}

// Add beat
export function addBeat(
  state: NarrativeStructureState,
  beatId: string,
  name: string,
  description: string,
  act: number,
  percentage: number,
  importance: number = 0.5
): NarrativeStructureState {
  const beat: StoryBeat = { beatId, name, description, act, percentage, importance };
  const beats = new Map(state.beats).set(beatId, beat);
  return recomputeStructure({ ...state, beats });
}

// Get acts by phase
export function getActsByPhase(state: NarrativeStructureState, phase: ActPhase): StoryAct[] {
  return Array.from(state.acts.values()).filter(a => a.phase === phase);
}

// Get beats by act
export function getBeatsByAct(state: NarrativeStructureState, act: number): StoryBeat[] {
  return Array.from(state.beats.values()).filter(b => b.act === act);
}

// Validate structure
export function validateStructure(state: NarrativeStructureState): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (state.acts.size < 3) issues.push('Fewer than 3 acts — structure incomplete');
  if (state.totalScenes === 0) issues.push('No scenes — add scenes to acts');
  if (state.structureCompleteness < 0.5) issues.push('Structure less than 50% complete');

  return { valid: issues.length === 0, issues };
}

// Get structure report
export function getStructureReport(state: NarrativeStructureState): {
  structureType: StructureType;
  actCount: number;
  totalScenes: number;
  averageIntensity: number;
  structureCompleteness: number;
  pacingScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.acts.size < 3) recommendations.push('Add more acts to complete structure');
  if (state.totalScenes < 5) recommendations.push('Add more scenes to flesh out structure');
  if (state.averageIntensity < 0.4) recommendations.push('Add more tension to acts');
  if (state.structureCompleteness < 0.7) recommendations.push('Complete missing structural elements');

  return {
    structureType: state.structureType,
    actCount: state.acts.size,
    totalScenes: state.totalScenes,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    structureCompleteness: Math.round(state.structureCompleteness * 100) / 100,
    pacingScore: Math.round(state.pacingScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStructure(state: NarrativeStructureState): NarrativeStructureState {
  const acts = Array.from(state.acts.values());
  const beats = Array.from(state.beats.values());

  const averageIntensity = acts.length > 0
    ? acts.reduce((s, a) => s + a.intensity, 0) / acts.length
    : 0.5;

  const totalScenes = acts.reduce((s, a) => s + a.scenes.length, 0);
  const structureCompleteness = Math.min(1, (acts.length / 5 + beats.length / 10) / 2);
  const pacingScore = 1 - Math.abs(0.6 - averageIntensity);

  return {
    ...state,
    totalScenes,
    averageIntensity,
    structureCompleteness,
    pacingScore: Math.max(0, Math.min(1, pacingScore)),
  };
}

// Reset structure state
export function resetNarrativeStructureState(): NarrativeStructureState {
  return createNarrativeStructureState();
}