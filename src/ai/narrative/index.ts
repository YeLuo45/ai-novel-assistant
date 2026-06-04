/**
 * V50 循环叙事引擎 - 统一导出
 * Circular Narrative Engine - Unified Export
 */

// 类型
export * from './types';

// DAG 验证器
export { DAGValidator, validateDAG, findCycles, findMinCutToBreakCycles } from './DAGValidator';

// Tarjan SCC
export { TarjanSCC, findSCCs, identifyCircularNarratives, isInCircularNarrative } from './TarjanSCC';

// 循环叙事引擎
export { CircularNarrativeEngine, createCircularNarrativeEngine } from './CircularNarrativeEngine';

// 一致性检查器
export { NarrativeConsistencyChecker, checkNarrativeConsistency } from './NarrativeConsistencyChecker';

// V562 叙事弧线智能引擎 — Direction B Iter 1/9
export {
  createArcIntelligenceState,
  addArcLayer,
  buildHierarchicalStructure,
  computeFeedbackScores,
  getOverallIntelligenceScore,
  flattenHierarchy,
  checkCrossLayerConsistency,
  updateTrends,
  type ArcIntelligenceState,
  type ArcLayer,
  type HierarchyNode,
  type FeedbackScore,
} from './NarrativeArcIntelligenceEngine';