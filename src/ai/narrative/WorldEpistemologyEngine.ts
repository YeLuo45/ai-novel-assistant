/**
 * V902 WorldEpistemologyEngine — Direction C Iter 14/15 (Round 4)
 * World epistemology engine: knowledge + belief + truth systems
 * Sources: ruflo epistemology + nanobot + thunderbolt
 */

export type KnowledgeType = 'factual' | 'mythical' | 'forbidden' | 'esoteric' | 'common' | 'secret';
export type BeliefCertainty = 'certain' | 'confident' | 'uncertain' | 'doubtful' | 'mythical';
export type TruthStatus = 'verified' | 'accepted' | 'disputed' | 'forgotten' | 'suppressed';

export interface KnowledgeItem {
  knowledgeId: string;
  name: string;
  type: KnowledgeType;
  certainty: BeliefCertainty;
  status: TruthStatus;
  description: string;
  holders: string[];
  chapter: number;
}

export interface BeliefSystem {
  systemId: string;
  name: string;
  knowledgeIds: string[];
  cohesion: number;
  adherents: number;
  dominant: boolean;
}

export interface WorldEpistemologyEngineState {
  knowledge: Map<string, KnowledgeItem>;
  systems: Map<string, BeliefSystem>;
  totalKnowledge: number;
  totalSystems: number;
  verifiedKnowledge: number;
  averageCohesion: number;
  knowledgeRichness: number;
  epistemologicalHealth: number;
  truthAccessibility: number;
}

// Factory
export function createWorldEpistemologyEngineState(): WorldEpistemologyEngineState {
  return {
    knowledge: new Map(),
    systems: new Map(),
    totalKnowledge: 0,
    totalSystems: 0,
    verifiedKnowledge: 0,
    averageCohesion: 0.5,
    knowledgeRichness: 0.5,
    epistemologicalHealth: 0.5,
    truthAccessibility: 0.5,
  };
}

// Add knowledge
export function addKnowledge(
  state: WorldEpistemologyEngineState,
  knowledgeId: string,
  name: string,
  type: KnowledgeType,
  certainty: BeliefCertainty,
  status: TruthStatus,
  description: string,
  chapter: number,
  holders: string[] = []
): WorldEpistemologyEngineState {
  const knowledge: KnowledgeItem = { knowledgeId, name, type, certainty, status, description, holders, chapter };
  const knowledgeMap = new Map(state.knowledge).set(knowledgeId, knowledge);
  const verifiedKnowledge = status === 'verified' ? state.verifiedKnowledge + 1 : state.verifiedKnowledge;
  return recomputeEpistemology({ ...state, knowledge: knowledgeMap, verifiedKnowledge, totalKnowledge: knowledgeMap.size });
}

// Create belief system
export function createBeliefSystem(
  state: WorldEpistemologyEngineState,
  systemId: string,
  name: string,
  knowledgeIds: string[],
  cohesion: number = 0.5,
  adherents: number = 100,
  dominant: boolean = false
): WorldEpistemologyEngineState {
  const system: BeliefSystem = { systemId, name, knowledgeIds, cohesion, adherents, dominant };
  const systems = new Map(state.systems).set(systemId, system);
  return recomputeEpistemology({ ...state, systems, totalSystems: systems.size });
}

// Get knowledge by type
export function getKnowledgeByType(state: WorldEpistemologyEngineState, type: KnowledgeType): KnowledgeItem[] {
  return Array.from(state.knowledge.values()).filter(k => k.type === type);
}

// Get epistemology report
export function getEpistemologyReport(state: WorldEpistemologyEngineState): {
  totalKnowledge: number;
  totalSystems: number;
  verifiedKnowledge: number;
  averageCohesion: number;
  knowledgeRichness: number;
  epistemologicalHealth: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalKnowledge === 0) recommendations.push('No knowledge — add knowledge');
  if (state.knowledgeRichness < 0.4) recommendations.push('Low richness — add knowledge');
  if (state.epistemologicalHealth < 0.4) recommendations.push('Low health — improve');

  return {
    totalKnowledge: state.totalKnowledge,
    totalSystems: state.totalSystems,
    verifiedKnowledge: state.verifiedKnowledge,
    averageCohesion: Math.round(state.averageCohesion * 100) / 100,
    knowledgeRichness: Math.round(state.knowledgeRichness * 100) / 100,
    epistemologicalHealth: Math.round(state.epistemologicalHealth * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEpistemology(state: WorldEpistemologyEngineState): WorldEpistemologyEngineState {
  const knowledge = Array.from(state.knowledge.values());
  const typeSet = new Set(knowledge.map(k => k.type));
  const knowledgeRichness = Math.min(1, typeSet.size / 5);

  const systems = Array.from(state.systems.values());
  const averageCohesion = systems.length === 0 ? 0.5
    : systems.reduce((s, sy) => s + sy.cohesion, 0) / systems.length;

  // Health: verified knowledge ratio
  const healthRatio = state.totalKnowledge === 0 ? 0.5
    : state.verifiedKnowledge / state.totalKnowledge;
  const epistemologicalHealth = (averageCohesion * 0.5 + healthRatio * 0.5);

  // Truth accessibility: how accessible verified knowledge is
  const suppressed = knowledge.filter(k => k.status === 'suppressed' || k.status === 'forgotten').length;
  const truthAccessibility = state.totalKnowledge === 0 ? 0.5
    : 1 - suppressed / state.totalKnowledge;

  return { ...state, averageCohesion, knowledgeRichness, epistemologicalHealth, truthAccessibility };
}

// Reset epistemology state
export function resetWorldEpistemologyEngineState(): WorldEpistemologyEngineState {
  return createWorldEpistemologyEngineState();
}