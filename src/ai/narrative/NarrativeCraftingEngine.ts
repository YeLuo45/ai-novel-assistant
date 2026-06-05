/**
 * V756 NarrativeCraftingEngine — Direction B Iter 1/9 (Round 3)
 * Narrative crafting engine: craft techniques + style mastery
 * Sources: chatdev craft + thunderbolt quality + nanobot
 */

export type CraftTechnique = 'show_dont_tell' | 'in_medias_res' | 'foreshadowing' | 'callback' | 'subtext' | 'parallelism' | 'contrasts' | 'symbolism';
export type CraftQuality = 'novice' | 'competent' | 'proficient' | 'expert' | 'master';
export type CraftStatus = 'learning' | 'practicing' | 'refining' | 'mastered' | 'forgotten';

export interface CraftPractice {
  practiceId: string;
  technique: CraftTechnique;
  quality: CraftQuality;
  status: CraftStatus;
  attempts: number;
  successes: number;
  lastPracticed: number;
  notes: string;
}

export interface CraftTechniqueMetrics {
  technique: CraftTechnique;
  attempts: number;
  successes: number;
  successRate: number;
  averageQuality: number;
}

export interface NarrativeCraftingEngineState {
  practices: Map<string, CraftPractice>;
  techniqueMetrics: Map<CraftTechnique, CraftTechniqueMetrics>;
  totalPractices: number;
  totalAttempts: number;
  totalSuccesses: number;
  overallSuccessRate: number;
  averageQuality: number;
  techniquesMastered: number;
  dominantTechnique: CraftTechnique | null;
}

// Factory
export function createNarrativeCraftingEngineState(): NarrativeCraftingEngineState {
  return {
    practices: new Map(),
    techniqueMetrics: new Map(),
    totalPractices: 0,
    totalAttempts: 0,
    totalSuccesses: 0,
    overallSuccessRate: 0,
    averageQuality: 0.5,
    techniquesMastered: 0,
    dominantTechnique: null,
  };
}

// Record practice
export function recordCraftPractice(
  state: NarrativeCraftingEngineState,
  practiceId: string,
  technique: CraftTechnique,
  quality: CraftQuality = 'competent',
  success: boolean = true,
  notes: string = ''
): NarrativeCraftingEngineState {
  const practice: CraftPractice = {
    practiceId,
    technique,
    quality,
    status: 'practicing',
    attempts: 1,
    successes: success ? 1 : 0,
    lastPracticed: Date.now(),
    notes,
  };
  const practices = new Map(state.practices).set(practiceId, practice);

  // Update technique metrics
  const existing = state.techniqueMetrics.get(technique);
  const totalAttempts = (existing?.attempts || 0) + 1;
  const totalSuccesses = (existing?.successes || 0) + (success ? 1 : 0);
  const successRate = totalSuccesses / totalAttempts;
  const qualityMap: Record<CraftQuality, number> = { novice: 0.2, competent: 0.4, proficient: 0.6, expert: 0.8, master: 1.0 };
  const averageQuality = ((existing?.averageQuality || 0) * (existing?.attempts || 0) + qualityMap[quality]) / totalAttempts;
  const metrics: CraftTechniqueMetrics = { technique, attempts: totalAttempts, successes: totalSuccesses, successRate, averageQuality };
  const techniqueMetrics = new Map(state.techniqueMetrics).set(technique, metrics);

  return recomputeCraft({ ...state, practices, techniqueMetrics, totalPractices: practices.size });
}

// Add attempts to practice
export function addCraftAttempt(state: NarrativeCraftingEngineState, practiceId: string, success: boolean = true): NarrativeCraftingEngineState {
  const practice = state.practices.get(practiceId);
  if (!practice) return state;

  const updated: CraftPractice = {
    ...practice,
    attempts: practice.attempts + 1,
    successes: practice.successes + (success ? 1 : 0),
    lastPracticed: Date.now(),
    status: practice.successes + (success ? 1 : 0) >= practice.attempts + 1 ? 'mastered' : practice.status,
  };
  const practices = new Map(state.practices).set(practiceId, updated);

  // Update technique metrics
  const existing = state.techniqueMetrics.get(practice.technique);
  if (existing) {
    const totalAttempts = existing.attempts + 1;
    const totalSuccesses = existing.successes + (success ? 1 : 0);
    const successRate = totalSuccesses / totalAttempts;
    const metrics: CraftTechniqueMetrics = { ...existing, attempts: totalAttempts, successes: totalSuccesses, successRate };
    const techniqueMetrics = new Map(state.techniqueMetrics).set(practice.technique, metrics);
    return recomputeCraft({ ...state, practices, techniqueMetrics });
  }
  return recomputeCraft({ ...state, practices });
}

// Set practice status
export function setCraftStatus(state: NarrativeCraftingEngineState, practiceId: string, status: CraftStatus): NarrativeCraftingEngineState {
  const practice = state.practices.get(practiceId);
  if (!practice) return state;

  const updated: CraftPractice = { ...practice, status };
  const practices = new Map(state.practices).set(practiceId, updated);
  return recomputeCraft({ ...state, practices });
}

// Get practices by technique
export function getPracticesByTechnique(state: NarrativeCraftingEngineState, technique: CraftTechnique): CraftPractice[] {
  return Array.from(state.practices.values()).filter(p => p.technique === technique);
}

// Get technique metrics
export function getTechniqueMetrics(state: NarrativeCraftingEngineState, technique: CraftTechnique): CraftTechniqueMetrics | null {
  return state.techniqueMetrics.get(technique) || null;
}

// Get crafting report
export function getCraftingReport(state: NarrativeCraftingEngineState): {
  totalPractices: number;
  totalAttempts: number;
  overallSuccessRate: number;
  averageQuality: number;
  techniquesMastered: number;
  dominantTechnique: CraftTechnique | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPractices === 0) recommendations.push('No practices — start practicing');
  if (state.overallSuccessRate < 0.5) recommendations.push('Low success rate — practice more');
  if (state.techniquesMastered < 2) recommendations.push('Few mastered techniques — focus on mastery');

  return {
    totalPractices: state.totalPractices,
    totalAttempts: state.totalAttempts,
    overallSuccessRate: Math.round(state.overallSuccessRate * 100) / 100,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    techniquesMastered: state.techniquesMastered,
    dominantTechnique: state.dominantTechnique,
    recommendations,
  };
}

// Recompute metrics
function recomputeCraft(state: NarrativeCraftingEngineState): NarrativeCraftingEngineState {
  const practices = Array.from(state.practices.values());
  const totalAttempts = practices.reduce((s, p) => s + p.attempts, 0);
  const totalSuccesses = practices.reduce((s, p) => s + p.successes, 0);
  const overallSuccessRate = totalAttempts === 0 ? 0 : totalSuccesses / totalAttempts;

  const qualityMap: Record<CraftQuality, number> = { novice: 0.2, competent: 0.4, proficient: 0.6, expert: 0.8, master: 1.0 };
  const averageQuality = practices.length === 0 ? 0.5 :
    practices.reduce((s, p) => s + qualityMap[p.quality], 0) / practices.length;

  const techniquesMastered = new Set(practices.filter(p => p.status === 'mastered').map(p => p.technique)).size;

  let dominantTechnique: CraftTechnique | null = null;
  let maxCount = -1;
  const techniqueCounts = new Map<CraftTechnique, number>();
  practices.forEach(p => techniqueCounts.set(p.technique, (techniqueCounts.get(p.technique) || 0) + 1));
  techniqueCounts.forEach((count, t) => { if (count > maxCount) { maxCount = count; dominantTechnique = t; } });

  return { ...state, totalAttempts, overallSuccessRate, averageQuality, techniquesMastered, dominantTechnique };
}

// Reset crafting state
export function resetNarrativeCraftingEngineState(): NarrativeCraftingEngineState {
  return createNarrativeCraftingEngineState();
}