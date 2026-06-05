/**
 * V852 SceneArchitectureEngine — Direction B Iter 4/15 (Round 4)
 * Scene architecture engine: scene structure + architectural elements
 * Sources: thunderbolt scene + nanobot + chatdev
 */

export type SceneComponent = 'setting' | 'character' | 'action' | 'dialogue' | 'conflict' | 'resolution';
export type SceneFunction = 'exposition' | 'rising_action' | 'climax' | 'falling_action' | 'transition';
export type SceneIntensity = 'calm' | 'tense' | 'intense' | 'explosive' | 'reflective';

export interface Scene {
  sceneId: string;
  name: string;
  function: SceneFunction;
  intensity: SceneIntensity;
  setting: string;
  characterIds: string[];
  components: Map<SceneComponent, number>;
  wordCount: number;
  effectiveness: number;
  chapter: number;
}

export interface SceneTransition {
  transitionId: string;
  fromSceneId: string;
  toSceneId: string;
  type: 'cut' | 'fade' | 'dissolve' | 'match' | 'bridge';
  smoothness: number;
}

export interface SceneArchitectureEngineState {
  scenes: Map<string, Scene>;
  transitions: Map<string, SceneTransition>;
  totalScenes: number;
  totalTransitions: number;
  averageEffectiveness: number;
  totalWordCount: number;
  componentBalance: number;
  transitionQuality: number;
  architectureCoherence: number;
}

// Factory
export function createSceneArchitectureEngineState(): SceneArchitectureEngineState {
  return {
    scenes: new Map(),
    transitions: new Map(),
    totalScenes: 0,
    totalTransitions: 0,
    averageEffectiveness: 0.5,
    totalWordCount: 0,
    componentBalance: 0.5,
    transitionQuality: 0.5,
    architectureCoherence: 0.5,
  };
}

// Create scene
export function createScene(
  state: SceneArchitectureEngineState,
  sceneId: string,
  name: string,
  sceneFunction: SceneFunction,
  setting: string,
  chapter: number,
  intensity: SceneIntensity = 'tense'
): SceneArchitectureEngineState {
  const emptyComponents = new Map<SceneComponent, number>();
  const components: SceneComponent[] = ['setting', 'character', 'action', 'dialogue', 'conflict', 'resolution'];
  components.forEach(c => emptyComponents.set(c, 0.5));

  const scene: Scene = {
    sceneId, name, function: sceneFunction, intensity, setting,
    characterIds: [], components: emptyComponents, wordCount: 0, effectiveness: 0.5, chapter,
  };
  const scenes = new Map(state.scenes).set(sceneId, scene);
  return recomputeSceneArch({ ...state, scenes, totalScenes: scenes.size });
}

// Update scene component
export function updateSceneComponent(
  state: SceneArchitectureEngineState,
  sceneId: string,
  component: SceneComponent,
  value: number
): SceneArchitectureEngineState {
  const scene = state.scenes.get(sceneId);
  if (!scene) return state;

  const components = new Map(scene.components).set(component, Math.min(1, Math.max(0, value)));
  const updated: Scene = { ...scene, components };
  const scenes = new Map(state.scenes).set(sceneId, updated);
  return recomputeSceneArch({ ...state, scenes });
}

// Add transition
export function addSceneTransition(
  state: SceneArchitectureEngineState,
  transitionId: string,
  fromSceneId: string,
  toSceneId: string,
  type: SceneTransition['type'],
  smoothness: number = 0.5
): SceneArchitectureEngineState {
  const transition: SceneTransition = { transitionId, fromSceneId, toSceneId, type, smoothness };
  const transitions = new Map(state.transitions).set(transitionId, transition);
  return recomputeSceneArch({ ...state, transitions, totalTransitions: transitions.size });
}

// Get scenes by function
export function getScenesByFunction(state: SceneArchitectureEngineState, func: SceneFunction): Scene[] {
  return Array.from(state.scenes.values()).filter(s => s.function === func);
}

// Get scene architecture report
export function getSceneArchitectureReport(state: SceneArchitectureEngineState): {
  totalScenes: number;
  totalTransitions: number;
  averageEffectiveness: number;
  totalWordCount: number;
  componentBalance: number;
  transitionQuality: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalScenes === 0) recommendations.push('No scenes — create scenes');
  if (state.averageEffectiveness < 0.5) recommendations.push('Low effectiveness — improve');
  if (state.transitionQuality < 0.4) recommendations.push('Low transition quality — improve');

  return {
    totalScenes: state.totalScenes,
    totalTransitions: state.totalTransitions,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    totalWordCount: state.totalWordCount,
    componentBalance: Math.round(state.componentBalance * 100) / 100,
    transitionQuality: Math.round(state.transitionQuality * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSceneArch(state: SceneArchitectureEngineState): SceneArchitectureEngineState {
  const scenes = Array.from(state.scenes.values());
  const averageEffectiveness = scenes.length === 0 ? 0.5
    : scenes.reduce((s, sc) => s + sc.effectiveness, 0) / scenes.length;
  const totalWordCount = scenes.reduce((s, sc) => s + sc.wordCount, 0);

  // Component balance: how varied components are
  const allValues: number[] = [];
  scenes.forEach(s => s.components.forEach(v => allValues.push(v)));
  const componentVariance = allValues.length === 0 ? 0
    : allValues.reduce((s, v) => s + Math.pow(v - 0.5, 2), 0) / allValues.length;
  const componentBalance = Math.max(0, 1 - componentVariance * 4);

  const transitions = Array.from(state.transitions.values());
  const transitionQuality = transitions.length === 0 ? 0.5
    : transitions.reduce((s, t) => s + t.smoothness, 0) / transitions.length;

  // Architecture coherence: scenes with proper structure
  const withAllComponents = scenes.filter(s => s.components.size === 6).length;
  const architectureCoherence = scenes.length === 0 ? 0.5 : withAllComponents / scenes.length;

  return { ...state, averageEffectiveness, totalWordCount, componentBalance, transitionQuality, architectureCoherence };
}

// Reset scene architecture state
export function resetSceneArchitectureEngineState(): SceneArchitectureEngineState {
  return createSceneArchitectureEngineState();
}