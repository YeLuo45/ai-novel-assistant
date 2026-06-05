/**
 * V746 AdaptiveLearningEngine — Direction A Iter 5/9 (Round 3)
 * Adaptive learning engine: learning rate adaptation + retention
 * Sources: generic-agent learning + thunderbolt + nanobot
 */

export type LearningMode = 'supervised' | 'unsupervised' | 'reinforcement' | 'transfer' | 'meta';
export type LearningPhase = 'observe' | 'hypothesize' | 'test' | 'integrate' | 'apply';
export type LearningRate = 'slow' | 'moderate' | 'fast' | 'adaptive';

export interface LearningExperience {
  experienceId: string;
  mode: LearningMode;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  reward: number;
  phase: LearningPhase;
  timestamp: number;
}

export interface LearningModel {
  modelId: string;
  name: string;
  rate: LearningRate;
  accuracy: number;
  loss: number;
  epochs: number;
  lastUpdated: number;
  experiences: string[];
}

export interface AdaptiveLearningEngineState {
  experiences: Map<string, LearningExperience>;
  models: Map<string, LearningModel>;
  totalExperiences: number;
  totalModels: number;
  averageReward: number;
  averageAccuracy: number;
  learningVelocity: number;
  dominantMode: LearningMode | null;
}

// Factory
export function createAdaptiveLearningEngineState(): AdaptiveLearningEngineState {
  return {
    experiences: new Map(),
    models: new Map(),
    totalExperiences: 0,
    totalModels: 0,
    averageReward: 0.5,
    averageAccuracy: 0.5,
    learningVelocity: 0.5,
    dominantMode: null,
  };
}

// Record experience
export function recordLearningExperience(
  state: AdaptiveLearningEngineState,
  experienceId: string,
  mode: LearningMode,
  input: string,
  expectedOutput: string,
  actualOutput: string,
  reward: number,
  phase: LearningPhase = 'observe'
): AdaptiveLearningEngineState {
  const experience: LearningExperience = {
    experienceId,
    mode,
    input,
    expectedOutput,
    actualOutput,
    reward: Math.min(1, Math.max(-1, reward)),
    phase,
    timestamp: Date.now(),
  };
  const experiences = new Map(state.experiences).set(experienceId, experience);
  return recomputeAdaptiveLearning({ ...state, experiences, totalExperiences: experiences.size });
}

// Create model
export function createLearningModel(
  state: AdaptiveLearningEngineState,
  modelId: string,
  name: string,
  rate: LearningRate = 'adaptive',
  accuracy: number = 0.5,
  loss: number = 1.0
): AdaptiveLearningEngineState {
  const model: LearningModel = {
    modelId,
    name,
    rate,
    accuracy: Math.min(1, Math.max(0, accuracy)),
    loss: Math.max(0, loss),
    epochs: 0,
    lastUpdated: Date.now(),
    experiences: [],
  };
  const models = new Map(state.models).set(modelId, model);
  return recomputeAdaptiveLearning({ ...state, models, totalModels: models.size });
}

// Train model
export function trainModel(state: AdaptiveLearningEngineState, modelId: string, epochs: number = 1, accuracyDelta: number = 0.01): AdaptiveLearningEngineState {
  const model = state.models.get(modelId);
  if (!model) return state;

  const newAccuracy = Math.min(1, model.accuracy + accuracyDelta * epochs);
  const newLoss = Math.max(0, model.loss - accuracyDelta * 0.5 * epochs);
  const updated: LearningModel = {
    ...model,
    epochs: model.epochs + epochs,
    accuracy: newAccuracy,
    loss: newLoss,
    lastUpdated: Date.now(),
  };
  const models = new Map(state.models).set(modelId, updated);
  return recomputeAdaptiveLearning({ ...state, models });
}

// Get experiences by mode
export function getExperiencesByMode(state: AdaptiveLearningEngineState, mode: LearningMode): LearningExperience[] {
  return Array.from(state.experiences.values()).filter(e => e.mode === mode);
}

// Get models by rate
export function getModelsByRate(state: AdaptiveLearningEngineState, rate: LearningRate): LearningModel[] {
  return Array.from(state.models.values()).filter(m => m.rate === rate);
}

// Get adaptive learning report
export function getAdaptiveLearningReport(state: AdaptiveLearningEngineState): {
  totalExperiences: number;
  totalModels: number;
  averageReward: number;
  averageAccuracy: number;
  learningVelocity: number;
  dominantMode: LearningMode | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalExperiences === 0) recommendations.push('No experiences — record experiences');
  if (state.averageAccuracy < 0.5) recommendations.push('Low accuracy — train more');
  if (state.learningVelocity < 0.3) recommendations.push('Low velocity — accelerate learning');

  return {
    totalExperiences: state.totalExperiences,
    totalModels: state.totalModels,
    averageReward: Math.round(state.averageReward * 100) / 100,
    averageAccuracy: Math.round(state.averageAccuracy * 100) / 100,
    learningVelocity: Math.round(state.learningVelocity * 100) / 100,
    dominantMode: state.dominantMode,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptiveLearning(state: AdaptiveLearningEngineState): AdaptiveLearningEngineState {
  const experiences = Array.from(state.experiences.values());
  const models = Array.from(state.models.values());

  const averageReward = experiences.length > 0
    ? experiences.reduce((s, e) => s + e.reward, 0) / experiences.length
    : 0.5;
  const averageAccuracy = models.length > 0
    ? models.reduce((s, m) => s + m.accuracy, 0) / models.length
    : 0.5;

  const totalEpochs = models.reduce((s, m) => s + m.epochs, 0);
  const learningVelocity = state.totalExperiences === 0 ? 0.5 : Math.min(1, totalEpochs / state.totalExperiences);

  let dominantMode: LearningMode | null = null;
  let maxCount = -1;
  const modeCounts = new Map<LearningMode, number>();
  experiences.forEach(e => modeCounts.set(e.mode, (modeCounts.get(e.mode) || 0) + 1));
  modeCounts.forEach((count, mode) => {
    if (count > maxCount) { maxCount = count; dominantMode = mode; }
  });

  return { ...state, averageReward, averageAccuracy, learningVelocity, dominantMode };
}

// Reset adaptive learning state
export function resetAdaptiveLearningEngineState(): AdaptiveLearningEngineState {
  return createAdaptiveLearningEngineState();
}