/**
 * V694 ScenePacingEngine — Direction B Iter 6/9 (Round 2)
 * Scene pacing engine: scene-level rhythm + tension + flow
 * Sources: thunderbolt pipeline + nanobot + generic-agent
 */

export type SceneMood = 'tense' | 'peaceful' | 'mysterious' | 'romantic' | 'action' | 'reflective';
export type ScenePurpose = 'exposition' | 'development' | 'climax' | 'transition' | 'breathing';
export type PacingPattern = 'linear' | 'accelerating' | 'decelerating' | 'oscillating' | 'pulse';

export interface ScenePacing {
  sceneId: string;
  description: string;
  mood: SceneMood;
  purpose: ScenePurpose;
  duration: number;
  tension: number;
  pattern: PacingPattern;
  position: number;
}

export interface ScenePacingState {
  scenes: Map<string, ScenePacing>;
  currentPattern: PacingPattern;
  averageTension: number;
  averageDuration: number;
  totalScenes: number;
  pacingBalance: number;
  sceneFlow: number;
}

// Factory
export function createScenePacingState(): ScenePacingState {
  return {
    scenes: new Map(),
    currentPattern: 'linear',
    averageTension: 0.5,
    averageDuration: 1000,
    totalScenes: 0,
    pacingBalance: 0.5,
    sceneFlow: 0.7,
  };
}

// Add scene
export function addScene(
  state: ScenePacingState,
  sceneId: string,
  description: string,
  mood: SceneMood,
  purpose: ScenePurpose,
  duration: number,
  tension: number = 0.5,
  pattern: PacingPattern = 'linear'
): ScenePacingState {
  const scene: ScenePacing = {
    sceneId,
    description,
    mood,
    purpose,
    duration,
    tension: Math.min(1, Math.max(0, tension)),
    pattern,
    position: state.totalScenes,
  };
  const scenes = new Map(state.scenes).set(sceneId, scene);
  return recomputePacing({ ...state, scenes, totalScenes: state.totalScenes + 1 });
}

// Set current pattern
export function setCurrentPattern(state: ScenePacingState, pattern: PacingPattern): ScenePacingState {
  return { ...state, currentPattern: pattern };
}

// Get scenes by mood
export function getScenesByMood(state: ScenePacingState, mood: SceneMood): ScenePacing[] {
  return Array.from(state.scenes.values()).filter(s => s.mood === mood);
}

// Get scenes by purpose
export function getScenesByPurpose(state: ScenePacingState, purpose: ScenePurpose): ScenePacing[] {
  return Array.from(state.scenes.values()).filter(s => s.purpose === purpose);
}

// Get pacing curve
export function getPacingCurve(state: ScenePacingState): { position: number; tension: number }[] {
  return Array.from(state.scenes.values())
    .sort((a, b) => a.position - b.position)
    .map(s => ({ position: s.position, tension: s.tension }));
}

// Detect pacing imbalance
export function detectPacingImbalance(state: ScenePacingState): { imbalanced: boolean; issues: string[] } {
  const issues: string[] = [];

  if (state.averageTension > 0.85) issues.push('Sustained high tension — add relief scenes');
  if (state.averageTension < 0.2) issues.push('Sustained low tension — add conflict scenes');
  if (state.totalScenes > 10) {
    const breathingScenes = getScenesByPurpose(state, 'breathing').length;
    if (breathingScenes === 0) issues.push('No breathing scenes — add respite moments');
  }
  if (Math.abs(state.averageDuration - 1500) > 1000) {
    issues.push('Unusual scene duration average — review pacing');
  }

  return { imbalanced: issues.length > 0, issues };
}

// Get pacing report
export function getPacingReport(state: ScenePacingState): {
  totalScenes: number;
  averageTension: number;
  averageDuration: number;
  pacingBalance: number;
  sceneFlow: number;
  imbalanced: boolean;
  issues: string[];
} {
  const imbalance = detectPacingImbalance(state);
  return {
    totalScenes: state.totalScenes,
    averageTension: Math.round(state.averageTension * 100) / 100,
    averageDuration: Math.round(state.averageDuration),
    pacingBalance: Math.round(state.pacingBalance * 100) / 100,
    sceneFlow: Math.round(state.sceneFlow * 100) / 100,
    imbalanced: imbalance.imbalanced,
    issues: imbalance.issues,
  };
}

// Recompute metrics
function recomputePacing(state: ScenePacingState): ScenePacingState {
  const scenes = Array.from(state.scenes.values());
  if (scenes.length === 0) return state;

  const averageTension = scenes.reduce((s, sc) => s + sc.tension, 0) / scenes.length;
  const averageDuration = scenes.reduce((s, sc) => s + sc.duration, 0) / scenes.length;
  const tensionVariance = scenes.reduce((s, sc) => s + Math.pow(sc.tension - averageTension, 2), 0) / scenes.length;
  const pacingBalance = 1 - Math.sqrt(tensionVariance);
  const sceneFlow = Math.min(1, scenes.length / 10);

  return { ...state, averageTension, averageDuration, pacingBalance, sceneFlow };
}

// Reset pacing state
export function resetScenePacingState(): ScenePacingState {
  return createScenePacingState();
}