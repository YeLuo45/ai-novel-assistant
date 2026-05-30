/**
 * AutonomousPlanOptimizer - V148
 * Adaptive Writing Strategy Optimization Engine
 * 
 * Design references:
 * - thunderbolt: pipeline feedback loops for continuous monitoring
 * - nanobot: distributed mesh with adaptive resource allocation
 * - chatdev: multi-agent coordination for strategy execution
 * - generic-agent: autonomous self-correction and optimization
 */

export type StrategyType = 
  | 'brainstorm_first'    // Explore before writing
  | 'outline_draft'       // Plan thoroughly then execute
  | 'fast_draft'          // Write fast, edit later
  | 'layered_writing'     // Multiple passes for depth
  | 'character_anchored'  // Build around character development
  | 'scene_first'         // Write key scenes before filler

export type PerformanceMetric = 
  | 'word_velocity'       // words per hour
  | 'focus_duration'      // minutes per session
  | 'revision_ratio'      // revisions per draft word
  | 'scene_completion'    // scenes completed per session
  | 'creative_flow'       // subjective flow score (0-100)

export interface WritingStrategy {
  strategyId: string
  type: StrategyType
  name: string
  description: string
 applicableScenarios: string[]     // scenarios where this strategy works best
  expectedWordRate: number  // words/hour typical output
  bestForGenres: string[]
  effectivenessHistory: Array<{ chapter: number; score: number }>
  currentEffectiveness: number  // 0-100
  recommendedForChapters: [number, number]  // [start, end] range
}

export interface PerformanceSnapshot {
  timestamp: number
  chapter: number
  wordVelocity: number        // words written in this session
  focusScore: number          // 0-100 focus quality
  creativeFlowScore: number   // 0-100 subjective experience
  revisionCount: number
  scenesCompleted: number
  timeSpentMinutes: number
}

export interface OptimizerState {
  strategies: Map<string, WritingStrategy>
  performanceHistory: PerformanceSnapshot[]
  activeStrategyId: string | null
  sessionWordCounts: number[]  // last N sessions for trend analysis
  averageWordVelocity: number  // words/hour rolling average
  chapterStrategyMap: Map<number, string>  // chapter -> strategyId
  adaptationCount: number       // how many times we've adapted
  sessionCount: number
  totalWordsWritten: number
}

export type AdaptationTrigger = 
  | 'low_velocity'        // below threshold
  | 'low_flow'           // creative flow drops
  | 'stall_pattern'      // same words repeatedly
  | 'high_revisions'     // too many revisions
  | 'chapter_boundary'   // new chapter approaching
  | 'genre_shift'        // genre/tone changes

// =============================================================================
// State Management
// =============================================================================

export function createEmptyOptimizerState(): OptimizerState {
  return {
    strategies: new Map(),
    performanceHistory: [],
    activeStrategyId: null,
    sessionWordCounts: [],
    averageWordVelocity: 0,
    chapterStrategyMap: new Map(),
    adaptationCount: 0,
    sessionCount: 0,
    totalWordsWritten: 0,
  }
}

// =============================================================================
// Strategy Management
// =============================================================================

export function registerStrategy(
  state: OptimizerState,
  type: StrategyType,
  name: string,
  description: string,
  scenarios: string[],
  expectedWordRate: number,
  bestForGenres: string[]
): { state: OptimizerState; strategyId: string } {
  const strategyId = `strat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const strategy: WritingStrategy = {
    strategyId,
    type,
    name,
    description,
    applicableScenarios: scenarios,
    expectedWordRate,
    bestForGenres,
    effectivenessHistory: [],
    currentEffectiveness: 50,  // start at neutral
    recommendedForChapters: [1, 999],  // default to all chapters
  }
  
  const newStrategies = new Map(state.strategies)
  newStrategies.set(strategyId, strategy)
  
  return {
    state: { ...state, strategies: newStrategies },
    strategyId,
  }
}

export function updateStrategyEffectiveness(
  state: OptimizerState,
  strategyId: string,
  chapter: number,
  score: number
): OptimizerState {
  const strategy = state.strategies.get(strategyId)
  if (!strategy) return state
  
  const newStrategies = new Map(state.strategies)
  newStrategies.set(strategyId, {
    ...strategy,
    effectivenessHistory: [
      ...strategy.effectivenessHistory.slice(-19),  // keep last 20
      { chapter, score },
    ],
    currentEffectiveness: score,
  })
  
  return { ...state, strategies: newStrategies }
}

export function setActiveStrategy(
  state: OptimizerState,
  strategyId: string
): OptimizerState {
  const strategy = state.strategies.get(strategyId)
  if (!strategy) return state
  
  return {
    ...state,
    activeStrategyId: strategyId,
  }
}

export function assignStrategyToChapter(
  state: OptimizerState,
  chapter: number,
  strategyId: string
): OptimizerState {
  const newMap = new Map(state.chapterStrategyMap)
  newMap.set(chapter, strategyId)
  
  return { ...state, chapterStrategyMap: newMap }
}

export function recommendStrategy(
  state: OptimizerState,
  chapter: number,
  genre: string,
  lastVelocity: number
): string | null {
  const strategies = Array.from(state.strategies.values())
    .filter(s => {
      const [start, end] = s.recommendedForChapters
      return chapter >= start && chapter <= end
    })
    .filter(s => s.bestForGenres.includes(genre) || s.bestForGenres.includes('通用'))
  
  if (strategies.length === 0) {
    // Fall back to highest effectiveness
    const all = Array.from(state.strategies.values())
    if (all.length === 0) return null
    all.sort((a, b) => b.currentEffectiveness - a.currentEffectiveness)
    return all[0].strategyId
  }
  
  // Filter by performance at similar velocities
  const matching = strategies.filter(s => {
    const ratio = lastVelocity / s.expectedWordRate
    return ratio > 0.3  // within 3x expected
  })
  
  if (matching.length > 0) {
    matching.sort((a, b) => b.currentEffectiveness - a.currentEffectiveness)
    return matching[0].strategyId
  }
  
  strategies.sort((a, b) => b.currentEffectiveness - a.currentEffectiveness)
  return strategies[0].strategyId
}

// =============================================================================
// Performance Tracking
// =============================================================================

export function recordPerformance(
  state: OptimizerState,
  wordsWritten: number,
  focusScore: number,
  creativeFlowScore: number,
  revisionCount: number,
  timeSpentMinutes: number
): OptimizerState {
  const snapshot: PerformanceSnapshot = {
    timestamp: Date.now(),
    chapter: state.sessionCount + 1,
    wordVelocity: timeSpentMinutes > 0 ? (wordsWritten / timeSpentMinutes) * 60 : 0,
    focusScore,
    creativeFlowScore,
    revisionCount,
    scenesCompleted: 0,
    timeSpentMinutes,
  }
  
  const newHistory = [...state.performanceHistory.slice(-49), snapshot]
  
  // Update rolling average
  const recentCounts = [...state.sessionWordCounts.slice(-9), wordsWritten]
  const avgVelocity = recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length
  
  return {
    ...state,
    performanceHistory: newHistory,
    sessionWordCounts: recentCounts,
    averageWordVelocity: avgVelocity,
    sessionCount: state.sessionCount + 1,
    totalWordsWritten: state.totalWordsWritten + wordsWritten,
  }
}

export function computeVelocityTrend(state: OptimizerState): 'improving' | 'stable' | 'declining' {
  const counts = state.sessionWordCounts
  if (counts.length < 3) return 'stable'
  
  const recent = counts.slice(-3)
  const older = counts.slice(-6, -3)
  
  if (older.length === 0) return 'stable'
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  
  if (recentAvg > olderAvg * 1.1) return 'improving'
  if (recentAvg < olderAvg * 0.9) return 'declining'
  return 'stable'
}

export function findPerformanceIssue(state: OptimizerState): AdaptationTrigger | null {
  if (state.sessionWordCounts.length < 3) return null
  
  const recent = state.sessionWordCounts.slice(-3)
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  
  // Low velocity check
  if (avg < 200) return 'low_velocity'
  
  // Check for stall pattern (similar words each session)
  if (recent.length >= 3) {
    const variance = Math.max(...recent) - Math.min(...recent)
    if (variance < 10) return 'stall_pattern'
  }
  
  // Check flow scores
  const recentFlow = state.performanceHistory.slice(-3)
  if (recentFlow.length >= 3) {
    const avgFlow = recentFlow.reduce((a, s) => a + s.creativeFlowScore, 0) / recentFlow.length
    if (avgFlow < 30) return 'low_flow'
  }
  
  return null
}

// =============================================================================
// Strategy Adaptation
// =============================================================================

export function triggerStrategyAdaptation(
  state: OptimizerState,
  trigger: AdaptationTrigger
): OptimizerState {
  if (!state.activeStrategyId) return state
  
  const activeStrategy = state.strategies.get(state.activeStrategyId)
  if (!activeStrategy) return state
  
  // Find alternative strategies
  const alternatives = Array.from(state.strategies.values())
    .filter(s => s.strategyId !== state.activeStrategyId)
  
  if (alternatives.length === 0) return state
  
  // Score alternatives based on trigger type
  let bestAlternative: WritingStrategy | null = null
  let bestScore = -1
  
  for (const alt of alternatives) {
    let score = alt.currentEffectiveness
    
    // Adjust score based on trigger
    if (trigger === 'low_velocity' && alt.type === 'fast_draft') {
      score += 30
    }
    if (trigger === 'low_flow' && alt.type === 'brainstorm_first') {
      score += 20
    }
    if (trigger === 'high_revisions' && alt.type === 'outline_draft') {
      score += 25
    }
    if (trigger === 'stall_pattern' && alt.type === 'layered_writing') {
      score += 20
    }
    
    if (score > bestScore) {
      bestScore = score
      bestAlternative = alt
    }
  }
  
  if (!bestAlternative) return state
  
  const newStrategies = new Map(state.strategies)
  // Reduce effectiveness of old strategy
  newStrategies.set(state.activeStrategyId, {
    ...activeStrategy,
    currentEffectiveness: Math.max(10, activeStrategy.currentEffectiveness - 15),
  })
  // Increase effectiveness of new strategy
  newStrategies.set(bestAlternative.strategyId, {
    ...bestAlternative,
    currentEffectiveness: Math.min(100, bestAlternative.currentEffectiveness + 10),
  })
  
  return {
    ...state,
    strategies: newStrategies,
    activeStrategyId: bestAlternative.strategyId,
    adaptationCount: state.adaptationCount + 1,
  }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatStrategyComparison(state: OptimizerState): string {
  const strategies = Array.from(state.strategies.values())
    .sort((a, b) => b.currentEffectiveness - a.currentEffectiveness)
  
  const lines = [
    '=== Writing Strategy Comparison ===',
    `Active strategies: ${strategies.length} | Adaptations: ${state.adaptationCount}`,
    '',
    '--- Strategy Effectiveness ---',
  ]
  
  for (const s of strategies) {
    const isActive = s.strategyId === state.activeStrategyId ? ' [ACTIVE]' : ''
    lines.push(`  ${s.name}${isActive}: ${s.currentEffectiveness}/100 (${s.type})`)
    lines.push(`    Expected: ${s.expectedWordRate} words/hr | History: ${s.effectivenessHistory.length} entries`)
    if (s.effectivenessHistory.length > 0) {
      const last = s.effectivenessHistory[s.effectivenessHistory.length - 1]
      lines.push(`    Last used Ch${last.chapter}: score ${last.score}`)
    }
  }
  
  return lines.join('\n')
}

export function formatOptimizerDashboard(state: OptimizerState): string {
  const lines = [
    '=== Adaptive Strategy Optimizer Dashboard ===',
    `Sessions: ${state.sessionCount} | Total Words: ${state.totalWordsWritten.toLocaleString()}`,
    `Average Velocity: ${state.averageWordVelocity.toFixed(0)} words/session`,
    `Adaptations triggered: ${state.adaptationCount}`,
    '',
  ]
  
  // Velocity trend
  const trend = computeVelocityTrend(state)
  const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'
  lines.push(`--- Performance Trend: ${trendIcon} ${trend} ---`)
  
  // Recent sessions
  const recent = state.performanceHistory.slice(-5)
  if (recent.length > 0) {
    lines.push('--- Recent Sessions ---')
    for (const s of recent) {
      lines.push(`  Ch${s.chapter}: ${s.wordVelocity.toFixed(0)} w/h | flow=${s.creativeFlowScore} | focus=${s.focusScore}`)
    }
  }
  
  // Active strategy
  if (state.activeStrategyId) {
    const active = state.strategies.get(state.activeStrategyId)
    if (active) {
      lines.push('')
      lines.push(`--- Active Strategy: ${active.name} ---`)
      lines.push(`  Type: ${active.type} | Effectiveness: ${active.currentEffectiveness}/100`)
      lines.push(`  Expected output: ${active.expectedWordRate} words/hour`)
    }
  }
  
  // Recommendations
  const issue = findPerformanceIssue(state)
  if (issue) {
    lines.push('')
    lines.push(`--- Performance Alert ---`)
    lines.push(`  Detected: ${issue} - consider strategy adaptation`)
  }
  
  return lines.join('\n')
}
