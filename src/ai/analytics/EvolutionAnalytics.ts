/**
 * EvolutionAnalytics Types - V72
 * Analytics & Monitoring Dashboard types for Self-Evolution system
 */

export interface EvolutionMetrics {
  // Self-Evolution Engine
  patternRecognitionCount: number
  skillCrystallizationCount: number
  skillDemotionCount: number
  skillEvolutionHistory: SkillEvolutionRecord[]
  
  // Tool usage
  totalToolCalls: number
  toolCallHistory: ToolCallSnapshot[]
  mostUsedTools: ToolUsageStat[]
  
  // Dream Memory
  dreamSessionCount: number
  eventsCollected: number
  skillsExtractedFromDreams: number
  memoryCompressionRatio: number
  
  // Federated Instance
  connectedInstances: number
  activeTasks: number
  completedTasks: number
  failedTasks: number
  pendingTasks: number
  totalVotesCast: number
  
  // Hook Lifecycle
  hookRegistryTotal: number
  hookByState: Record<string, number>
  hookExecutionCount: number
  hookAvgLatencyMs: number
  
  // Time window
  timeRange: TimeRange
  generatedAt: number
}

export interface SkillEvolutionRecord {
  skillId: string
  skillName: string
  event: 'crystallized' | 'demoted' | 'split' | 'merged'
  fromLevel?: string
  toLevel?: string
  timestamp: number
  confidence: number
  triggerReason: string
}

export interface ToolCallSnapshot {
  timestamp: number
  count: number
  topTools: string[]
}

export interface ToolUsageStat {
  toolName: string
  callCount: number
  successRate: number
  avgLatencyMs: number
  lastCalled: number
}

export interface TimeRange {
  start: number
  end: number
  label: string
}

export interface DashboardLayout {
  panels: PanelConfig[]
}

export interface PanelConfig {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'progress' | 'timeline'
  position: { row: number; col: number; width: number; height: number }
  dataSource: string
  refreshIntervalMs: number
}

export interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  color?: string
}

export interface EvolutionSnapshot {
  version: string
  capturedAt: number
  metrics: EvolutionMetrics
}

export type TimeWindowOption = '1h' | '6h' | '24h' | '7d' | '30d'

export function getTimeRange(window: TimeWindowOption): TimeRange {
  const now = Date.now()
  const offsets: Record<TimeWindowOption, number> = {
    '1h': 3_600_000,
    '6h': 21_600_000,
    '24h': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000
  }
  return {
    start: now - offsets[window],
    end: now,
    label: window
  }
}

export function createEmptyMetrics(): EvolutionMetrics {
  return {
    patternRecognitionCount: 0,
    skillCrystallizationCount: 0,
    skillDemotionCount: 0,
    skillEvolutionHistory: [],
    totalToolCalls: 0,
    toolCallHistory: [],
    mostUsedTools: [],
    dreamSessionCount: 0,
    eventsCollected: 0,
    skillsExtractedFromDreams: 0,
    memoryCompressionRatio: 0,
    connectedInstances: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingTasks: 0,
    totalVotesCast: 0,
    hookRegistryTotal: 0,
    hookByState: {},
    hookExecutionCount: 0,
    hookAvgLatencyMs: 0,
    timeRange: getTimeRange('24h'),
    generatedAt: Date.now()
  }
}

export function generateMockMetrics(timeWindow: TimeWindowOption = '24h'): EvolutionMetrics {
  const metrics = createEmptyMetrics()
  metrics.timeRange = getTimeRange(timeWindow)
  
  // Self-Evolution mock
  metrics.patternRecognitionCount = Math.floor(Math.random() * 50) + 10
  metrics.skillCrystallizationCount = Math.floor(Math.random() * 20) + 5
  metrics.skillDemotionCount = Math.floor(Math.random() * 5)
  
  // Tool usage mock
  metrics.totalToolCalls = Math.floor(Math.random() * 1000) + 200
  metrics.mostUsedTools = [
    { toolName: 'write-chapter', callCount: 320, successRate: 0.95, avgLatencyMs: 1250, lastCalled: Date.now() - 300000 },
    { toolName: 'character-arc', callCount: 180, successRate: 0.88, avgLatencyMs: 890, lastCalled: Date.now() - 600000 },
    { toolName: 'plot-twist', callCount: 95, successRate: 0.72, avgLatencyMs: 2100, lastCalled: Date.now() - 900000 },
    { toolName: 'world-building', callCount: 67, successRate: 0.91, avgLatencyMs: 1800, lastCalled: Date.now() - 1200000 },
    { toolName: 'dialogue-gen', callCount: 45, successRate: 0.83, avgLatencyMs: 670, lastCalled: Date.now() - 1800000 }
  ]
  
  // Dream Memory mock
  metrics.dreamSessionCount = Math.floor(Math.random() * 30) + 5
  metrics.eventsCollected = Math.floor(Math.random() * 500) + 100
  metrics.skillsExtractedFromDreams = Math.floor(Math.random() * 15) + 3
  metrics.memoryCompressionRatio = 0.35 + Math.random() * 0.3
  
  // Federated mock
  metrics.connectedInstances = Math.floor(Math.random() * 4) + 1
  metrics.activeTasks = Math.floor(Math.random() * 8)
  metrics.completedTasks = Math.floor(Math.random() * 50) + 10
  metrics.failedTasks = Math.floor(Math.random() * 5)
  metrics.pendingTasks = Math.floor(Math.random() * 10)
  metrics.totalVotesCast = Math.floor(Math.random() * 30) + 5
  
  // Hook mock
  metrics.hookRegistryTotal = Math.floor(Math.random() * 20) + 5
  metrics.hookByState = {
    active: Math.floor(Math.random() * 10) + 3,
    paused: Math.floor(Math.random() * 3),
    registered: Math.floor(Math.random() * 5),
    deprecated: Math.floor(Math.random() * 2)
  }
  metrics.hookExecutionCount = Math.floor(Math.random() * 500) + 100
  metrics.hookAvgLatencyMs = Math.floor(Math.random() * 50) + 10
  
  return metrics
}

export function formatMetricValue(value: number, type: 'count' | 'percent' | 'ms' | 'ratio'): string {
  switch (type) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`
    case 'ms':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`
    case 'ratio':
      return `${value.toFixed(2)}x`
    default:
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` 
           : value >= 1000 ? `${(value / 1000).toFixed(1)}K` 
           : String(Math.floor(value))
  }
}