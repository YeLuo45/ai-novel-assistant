/**
 * V1358 NarrativeWorldPhilosophyEngine — Direction J Iter 27/30 (Round 5)
 * World philosophy engine: philosophy of narrative world
 * Sources: nanobot philosophy + thunderbolt + ruflo
 */

export type WorldPhilosophySchool = 'idealism' | 'materialism' | 'dualism' | 'pragmatism' | 'existentialism' | 'nihilism' | 'transcendent';
export type WorldPhilosophyQuestion = 'meaning' | 'purpose' | 'value' | 'truth' | 'beauty' | 'good' | 'transcendent';
export type WorldPhilosophyDepth = 'surface' | 'moderate' | 'deep' | 'profound' | 'abyssal' | 'infinite' | 'transcendent';

export interface WorldPhilosophyEntry {
  entryId: string;
  school: WorldPhilosophySchool;
  question: WorldPhilosophyQuestion;
  depth: WorldPhilosophyDepth;
  description: string;
  insight: number;
  wisdom: number;
  chapter: number;
}

export interface WorldPhilosophySchool_ {
  schoolId: string,
  entryIds: string[],
  cumulativeInsight: number,
  breadth: number,
}

export interface NarrativeWorldPhilosophyEngineState {
  entries: Map<string, WorldPhilosophyEntry>;
  schools: Map<string, WorldPhilosophySchool_>;
  totalEntries: number;
  totalSchools: number;
  averageInsight: number;
  averageWisdom: number;
  schoolBreadth: number;
  worldPhilosophyMastery: number;
}

// Factory
export function createNarrativeWorldPhilosophyEngineState(): NarrativeWorldPhilosophyEngineState {
  return {
    entries: new Map(),
    schools: new Map(),
    totalEntries: 0,
    totalSchools: 0,
    averageInsight: 0.5,
    averageWisdom: 0.5,
    schoolBreadth: 0.5,
    worldPhilosophyMastery: 0.5,
  };
}

// Add entry
export function addWorldPhilosophyEntry(
  state: NarrativeWorldPhilosophyEngineState,
  entryId: string,
  school: WorldPhilosophySchool,
  question: WorldPhilosophyQuestion,
  depth: WorldPhilosophyDepth,
  description: string,
  insight: number,
  wisdom: number,
  chapter: number
): NarrativeWorldPhilosophyEngineState {
  const entry: WorldPhilosophyEntry = { entryId, school, question, depth, description, insight, wisdom, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldPhilosophy({ ...state, entries, totalEntries: entries.size });
}

// Add school
export function addWorldPhilosophySchool_(
  state: NarrativeWorldPhilosophyEngineState,
  schoolId: string,
  entryIds: string[]
): NarrativeWorldPhilosophyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldPhilosophyEntry => e !== undefined);
  const cumulativeInsight = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.insight, 0) / entries.length;
  const schoolSet = new Set(entries.map(e => e.school));
  const breadth = Math.min(1, schoolSet.size / 7);
  const sch: WorldPhilosophySchool_ = { schoolId, entryIds, cumulativeInsight, breadth };
  const schools = new Map(state.schools).set(schoolId, sch);
  return recomputeWorldPhilosophy({ ...state, schools, totalSchools: schools.size });
}

// Get entries by school
export function getWorldPhilosophyEntriesBySchool(state: NarrativeWorldPhilosophyEngineState, school: WorldPhilosophySchool): WorldPhilosophyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.school === school);
}

// Get world philosophy report
export function getWorldPhilosophyReport(state: NarrativeWorldPhilosophyEngineState): {
  totalEntries: number;
  totalSchools: number;
  averageInsight: number;
  averageWisdom: number;
  worldPhilosophyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world philosophy entries');
  if (state.averageInsight < 0.5) recommendations.push('Low insight — strengthen');
  if (state.worldPhilosophyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSchools: state.totalSchools,
    averageInsight: Math.round(state.averageInsight * 100) / 100,
    averageWisdom: Math.round(state.averageWisdom * 100) / 100,
    worldPhilosophyMastery: Math.round(state.worldPhilosophyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldPhilosophy(state: NarrativeWorldPhilosophyEngineState): NarrativeWorldPhilosophyEngineState {
  const entries = Array.from(state.entries.values());
  const averageInsight = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.insight, 0) / entries.length;
  const averageWisdom = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.wisdom, 0) / entries.length;

  const schools = Array.from(state.schools.values());
  const schoolBreadth = schools.length === 0 ? 0.5
    : schools.reduce((s, sch) => s + sch.breadth, 0) / schools.length;

  const worldPhilosophyMastery = (averageInsight * 0.4 + averageWisdom * 0.3 + schoolBreadth * 0.3);

  return { ...state, averageInsight, averageWisdom, schoolBreadth, worldPhilosophyMastery };
}

// Reset
export function resetNarrativeWorldPhilosophyEngineState(): NarrativeWorldPhilosophyEngineState {
  return createNarrativeWorldPhilosophyEngineState();
}