/**
 * V954 NarrativeImaginationEngine — Direction E Iter 10/15 (Round 4)
 * Narrative imagination engine: imagination + creative visualization
 * Sources: nanobot imagination + chatdev + thunderbolt
 */

export type ImaginationType = 'visual' | 'auditory' | 'kinesthetic' | 'olfactory' | 'gustatory' | 'abstract';
export type ImaginationVividness = 'dim' | 'moderate' | 'vivid' | 'hyperreal' | 'lucid';
export type ImaginationPurpose = 'creation' | 'exploration' | 'problem_solving' | 'empathy' | 'escape' | 'insight';

export interface ImaginationImage {
  imageId: string;
  type: ImaginationType;
  vividness: ImaginationVividness;
  purpose: ImaginationPurpose;
  content: string;
  intensity: number;
  originality: number;
  chapter: number;
}

export interface ImaginationScenario {
  scenarioId: string;
  name: string;
  imageIds: string[];
  richness: number;
  coherence: number;
}

export interface NarrativeImaginationEngineState {
  images: Map<string, ImaginationImage>;
  scenarios: Map<string, ImaginationScenario>;
  totalImages: number;
  totalScenarios: number;
  averageIntensity: number;
  averageOriginality: number;
  imaginationVersatility: number;
  imaginationMastery: number;
}

// Factory
export function createNarrativeImaginationEngineState(): NarrativeImaginationEngineState {
  return {
    images: new Map(),
    scenarios: new Map(),
    totalImages: 0,
    totalScenarios: 0,
    averageIntensity: 0.5,
    averageOriginality: 0.5,
    imaginationVersatility: 0,
    imaginationMastery: 0.5,
  };
}

// Add image
export function addImaginationImage(
  state: NarrativeImaginationEngineState,
  imageId: string,
  type: ImaginationType,
  vividness: ImaginationVividness,
  purpose: ImaginationPurpose,
  content: string,
  intensity: number,
  originality: number,
  chapter: number
): NarrativeImaginationEngineState {
  const image: ImaginationImage = { imageId, type, vividness, purpose, content, intensity, originality, chapter };
  const images = new Map(state.images).set(imageId, image);
  return recomputeImagination({ ...state, images, totalImages: images.size });
}

// Create scenario
export function createImaginationScenario(
  state: NarrativeImaginationEngineState,
  scenarioId: string,
  name: string,
  imageIds: string[]
): NarrativeImaginationEngineState {
  const images = imageIds.map(id => state.images.get(id)).filter((i): i is ImaginationImage => i !== undefined);
  const richness = images.length === 0 ? 0
    : images.reduce((s, i) => s + i.intensity, 0) / images.length;
  const coherence = images.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(images[0].originality - images[images.length - 1].originality));
  const scenario: ImaginationScenario = { scenarioId, name, imageIds, richness, coherence };
  const scenarios = new Map(state.scenarios).set(scenarioId, scenario);
  return recomputeImagination({ ...state, scenarios, totalScenarios: scenarios.size });
}

// Get images by type
export function getImagesByType(state: NarrativeImaginationEngineState, type: ImaginationType): ImaginationImage[] {
  return Array.from(state.images.values()).filter(i => i.type === type);
}

// Get imagination report
export function getImaginationReport(state: NarrativeImaginationEngineState): {
  totalImages: number;
  totalScenarios: number;
  averageIntensity: number;
  averageOriginality: number;
  imaginationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalImages === 0) recommendations.push('No images — add imagination images');
  if (state.averageOriginality < 0.4) recommendations.push('Low originality — push boundaries');
  if (state.imaginationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalImages: state.totalImages,
    totalScenarios: state.totalScenarios,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    averageOriginality: Math.round(state.averageOriginality * 100) / 100,
    imaginationMastery: Math.round(state.imaginationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeImagination(state: NarrativeImaginationEngineState): NarrativeImaginationEngineState {
  const images = Array.from(state.images.values());
  const averageIntensity = images.length === 0 ? 0.5
    : images.reduce((s, i) => s + i.intensity, 0) / images.length;
  const averageOriginality = images.length === 0 ? 0.5
    : images.reduce((s, i) => s + i.originality, 0) / images.length;
  const typeSet = new Set(images.map(i => i.type));
  const imaginationVersatility = Math.min(1, typeSet.size / 5);

  const scenarios = Array.from(state.scenarios.values());
  const avgCoherence = scenarios.length === 0 ? 0.5
    : scenarios.reduce((s, sc) => s + sc.coherence, 0) / scenarios.length;

  const imaginationMastery = (averageIntensity * 0.3 + averageOriginality * 0.4 + avgCoherence * 0.3);

  return { ...state, averageIntensity, averageOriginality, imaginationVersatility, imaginationMastery };
}

// Reset imagination state
export function resetNarrativeImaginationEngineState(): NarrativeImaginationEngineState {
  return createNarrativeImaginationEngineState();
}