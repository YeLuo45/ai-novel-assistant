/**
 * V562 NarrativeArcIntelligenceEngine — Direction B Iter 1/9
 * Hierarchical story arc analysis + L0-L4 memory integration + feedback loops
 * Sources: generic-agent L0-L4 + ruflo hierarchical decomposition + thunderbolt feedback loops
 */

import type { CharacterArcState } from './agents/nanobot/CharacterArcTrajectoryEngine';
import type { EmotionalArcState } from './agents/nanobot/EmotionalArcEngine';
import type { ThemeArc } from './agents/nanobot/ThemeAnalyzer';

// Types
export interface ArcLayer {
  type: 'character' | 'emotional' | 'thematic' | 'plot';
  state: unknown;
  coherence: number; // 0-1
}

export interface ArcIntelligenceState {
  layers: ArcLayer[];
  hierarchicalStructure: HierarchyNode | null;
  feedbackScores: FeedbackScore[];
  lastAnalysisTimestamp: number;
}

export interface HierarchyNode {
  id: string;
  name: string;
  level: number; // 0=root, 1=act, 2=sequence, 3=scene
  children: HierarchyNode[];
  arcData: ArcLayer | null;
}

export interface FeedbackScore {
  layerType: ArcLayer['type'];
  score: number; // 0-100
  trend: 'improving' | 'declining' | 'stable';
  delta: number; // change from last check
  suggestions: string[];
}

// State factory
export function createArcIntelligenceState(): ArcIntelligenceState {
  return {
    layers: [],
    hierarchicalStructure: null,
    feedbackScores: [],
    lastAnalysisTimestamp: Date.now(),
  };
}

// Add a layer to intelligence tracking
export function addArcLayer(state: ArcIntelligenceState, layer: ArcLayer): ArcIntelligenceState {
  // Replace existing layer of same type
  const existing = state.layers.filter(l => l.type !== layer.type);
  return {
    ...state,
    layers: [...existing, layer],
    lastAnalysisTimestamp: Date.now(),
  };
}

// Build hierarchical structure from layers
export function buildHierarchicalStructure(
  state: ArcIntelligenceState,
  rootId: string,
  rootName: string
): ArcIntelligenceState {
  const root: HierarchyNode = {
    id: rootId,
    name: rootName,
    level: 0,
    children: [],
    arcData: null,
  };

  // Group layers by type and nest them
  const characterLayers = state.layers.filter(l => l.type === 'character');
  const emotionalLayers = state.layers.filter(l => l.type === 'emotional');
  const thematicLayers = state.layers.filter(l => l.type === 'thematic');
  const plotLayers = state.layers.filter(l => l.type === 'plot');

  // Level 1: Four main arcs
  const act1: HierarchyNode = {
    id: `${rootId}-character`,
    name: 'Character Arc',
    level: 1,
    children: characterLayers.map((l, i) => ({
      id: `${rootId}-character-${i}`,
      name: `Character Layer ${i + 1}`,
      level: 2,
      children: [],
      arcData: l,
    })),
    arcData: characterLayers[0] ?? null,
  };

  const act2: HierarchyNode = {
    id: `${rootId}-emotional`,
    name: 'Emotional Arc',
    level: 1,
    children: emotionalLayers.map((l, i) => ({
      id: `${rootId}-emotional-${i}`,
      name: `Emotional Layer ${i + 1}`,
      level: 2,
      children: [],
      arcData: l,
    })),
    arcData: emotionalLayers[0] ?? null,
  };

  const act3: HierarchyNode = {
    id: `${rootId}-thematic`,
    name: 'Thematic Arc',
    level: 1,
    children: thematicLayers.map((l, i) => ({
      id: `${rootId}-thematic-${i}`,
      name: `Thematic Layer ${i + 1}`,
      level: 2,
      children: [],
      arcData: l,
    })),
    arcData: thematicLayers[0] ?? null,
  };

  const act4: HierarchyNode = {
    id: `${rootId}-plot`,
    name: 'Plot Arc',
    level: 1,
    children: plotLayers.map((l, i) => ({
      id: `${rootId}-plot-${i}`,
      name: `Plot Layer ${i + 1}`,
      level: 2,
      children: [],
      arcData: l,
    })),
    arcData: plotLayers[0] ?? null,
  };

  root.children = [act1, act2, act3, act4];

  return {
    ...state,
    hierarchicalStructure: root,
    lastAnalysisTimestamp: Date.now(),
  };
}

// Compute feedback scores for each layer (thunderbolt feedback loop pattern)
export function computeFeedbackScores(state: ArcIntelligenceState): ArcIntelligenceState {
  const scores: FeedbackScore[] = state.layers.map(layer => {
    const baseScore = Math.round(layer.coherence * 100);
    return {
      layerType: layer.type,
      score: baseScore,
      trend: 'stable',
      delta: 0,
      suggestions: generateSuggestions(layer.type, baseScore),
    };
  });

  return {
    ...state,
    feedbackScores: scores,
    lastAnalysisTimestamp: Date.now(),
  };
}

function generateSuggestions(layerType: ArcLayer['type'], score: number): string[] {
  if (score >= 80) return [`${layerType} arc is highly coherent`];
  if (score >= 60) return [`${layerType} arc needs minor refinement`, `Check character consistency in key scenes`];
  if (score >= 40) return [`${layerType} arc requires significant attention`, `Review arc trajectory against story outline`];
  return [`${layerType} arc coherence is critical — rebuild arc structure`, `Consider consulting narrative arc templates`];
}

// Get overall story intelligence score
export function getOverallIntelligenceScore(state: ArcIntelligenceState): number {
  if (state.layers.length === 0) return 0;
  const sum = state.layers.reduce((acc, l) => acc + l.coherence, 0);
  return Math.round((sum / state.layers.length) * 100);
}

// Get hierarchy as flat list for reporting
export function flattenHierarchy(node: HierarchyNode): HierarchyNode[] {
  const result: HierarchyNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenHierarchy(child));
  }
  return result;
}

// Check cross-layer consistency (character vs emotional arc alignment)
export function checkCrossLayerConsistency(state: ArcIntelligenceState): { characterEmotional: number; thematicPlot: number; overall: number } {
  const characterLayer = state.layers.find(l => l.type === 'character');
  const emotionalLayer = state.layers.find(l => l.type === 'emotional');
  const thematicLayer = state.layers.find(l => l.type === 'thematic');
  const plotLayer = state.layers.find(l => l.type === 'plot');

  const characterEmotional = characterLayer && emotionalLayer
    ? Math.min(characterLayer.coherence, emotionalLayer.coherence) * 100
    : 50;
  const thematicPlot = thematicLayer && plotLayer
    ? Math.min(thematicLayer.coherence, plotLayer.coherence) * 100
    : 50;
  const overall = state.layers.length > 0
    ? state.layers.reduce((acc, l) => acc + l.coherence * 100, 0) / state.layers.length
    : 50;

  return { characterEmotional, thematicPlot, overall };
}

// Update trend by comparing with previous scores
export function updateTrends(state: ArcIntelligenceState, previousScores: FeedbackScore[]): ArcIntelligenceState {
  const scoreMap = new Map(previousScores.map(s => [s.layerType, s]));

  const updatedScores: FeedbackScore[] = state.feedbackScores.map(score => {
    const prev = scoreMap.get(score.layerType);
    if (!prev) return { ...score, trend: 'stable' as const, delta: 0 };

    const delta = score.score - prev.score;
    const trend: FeedbackScore['trend'] = delta > 5 ? 'improving' : delta < -5 ? 'declining' : 'stable';
    return { ...score, trend, delta };
  });

  return { ...state, feedbackScores: updatedScores };
}