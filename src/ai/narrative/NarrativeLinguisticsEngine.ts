/**
 * V1032 NarrativeLinguisticsEngine — Direction C Iter 4/20 (Round 5)
 * Narrative linguistics engine: linguistic analysis of narrative
 * Sources: nanobot linguistics + ruflo + thunderbolt
 */

export type LinguisticFeature = 'register' | 'dialect' | 'idiolect' | 'jargon' | 'archaic' | 'vernacular';
export type LinguisticFunction = 'characterization' | 'atmosphere' | 'theme' | 'humor' | 'tension' | 'realism';
export type LinguisticLayer = 'lexical' | 'syntactic' | 'pragmatic' | 'phonological' | 'semantic' | 'discourse';

export interface LinguisticChoice {
  choiceId: string;
  feature: LinguisticFeature;
  function: LinguisticFunction;
  layer: LinguisticLayer;
  description: string;
  authenticity: number;
  expressiveness: number;
  chapter: number;
}

export interface LinguisticProfile {
  profileId: string,
  characterId: string,
  choiceIds: string[],
  voiceConsistency: number,
  distinctiveness: number,
}

export interface NarrativeLinguisticsEngineState {
  choices: Map<string, LinguisticChoice>;
  profiles: Map<string, LinguisticProfile>;
  totalChoices: number;
  totalProfiles: number;
  averageAuthenticity: number;
  averageExpressiveness: number;
  profileDistinctiveness: number;
  linguisticsMastery: number;
}

// Factory
export function createNarrativeLinguisticsEngineState(): NarrativeLinguisticsEngineState {
  return {
    choices: new Map(),
    profiles: new Map(),
    totalChoices: 0,
    totalProfiles: 0,
    averageAuthenticity: 0.5,
    averageExpressiveness: 0.5,
    profileDistinctiveness: 0.5,
    linguisticsMastery: 0.5,
  };
}

// Add choice
export function addLinguisticChoice(
  state: NarrativeLinguisticsEngineState,
  choiceId: string,
  feature: LinguisticFeature,
  function_: LinguisticFunction,
  layer: LinguisticLayer,
  description: string,
  authenticity: number,
  expressiveness: number,
  chapter: number
): NarrativeLinguisticsEngineState {
  const choice: LinguisticChoice = { choiceId, feature, function: function_, layer, description, authenticity, expressiveness, chapter };
  const choices = new Map(state.choices).set(choiceId, choice);
  return recomputeLinguistics({ ...state, choices, totalChoices: choices.size });
}

// Add profile
export function addLinguisticProfile(
  state: NarrativeLinguisticsEngineState,
  profileId: string,
  characterId: string,
  choiceIds: string[]
): NarrativeLinguisticsEngineState {
  const choices = choiceIds.map(id => state.choices.get(id)).filter((c): c is LinguisticChoice => c !== undefined);
  // Voice consistency = how similar authenticity values are
  const voiceConsistency = choices.length < 2 ? 0.5
    : 1 - Math.abs(choices[0].authenticity - choices[choices.length - 1].authenticity);
  const distinctiveness = Math.min(1, new Set(choices.map(c => c.feature)).size / 6);
  const profile: LinguisticProfile = { profileId, characterId, choiceIds, voiceConsistency, distinctiveness };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeLinguistics({ ...state, profiles, totalProfiles: profiles.size });
}

// Get choices by feature
export function getChoicesByFeature(state: NarrativeLinguisticsEngineState, feature: LinguisticFeature): LinguisticChoice[] {
  return Array.from(state.choices.values()).filter(c => c.feature === feature);
}

// Get linguistics report
export function getLinguisticsReport(state: NarrativeLinguisticsEngineState): {
  totalChoices: number;
  totalProfiles: number;
  averageAuthenticity: number;
  averageExpressiveness: number;
  linguisticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalChoices === 0) recommendations.push('No choices — add linguistic choices');
  if (state.averageExpressiveness < 0.5) recommendations.push('Low expressiveness — strengthen');
  if (state.linguisticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalChoices: state.totalChoices,
    totalProfiles: state.totalProfiles,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    averageExpressiveness: Math.round(state.averageExpressiveness * 100) / 100,
    linguisticsMastery: Math.round(state.linguisticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeLinguistics(state: NarrativeLinguisticsEngineState): NarrativeLinguisticsEngineState {
  const choices = Array.from(state.choices.values());
  const averageAuthenticity = choices.length === 0 ? 0.5
    : choices.reduce((s, c) => s + c.authenticity, 0) / choices.length;
  const averageExpressiveness = choices.length === 0 ? 0.5
    : choices.reduce((s, c) => s + c.expressiveness, 0) / choices.length;

  const profiles = Array.from(state.profiles.values());
  const profileDistinctiveness = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.distinctiveness, 0) / profiles.length;

  const linguisticsMastery = (averageAuthenticity * 0.3 + averageExpressiveness * 0.4 + profileDistinctiveness * 0.3);

  return { ...state, averageAuthenticity, averageExpressiveness, profileDistinctiveness, linguisticsMastery };
}

// Reset
export function resetNarrativeLinguisticsEngineState(): NarrativeLinguisticsEngineState {
  return createNarrativeLinguisticsEngineState();
}