/**
 * Self-Evolution Engine 类型定义
 */

export interface PromptVersion {
  id: string
  version: number
  basePrompt: string
  improvedPrompt: string
  insight: string
  performanceScore: number
  createdAt: number
  useCount: number
  taskType: string
}

export interface EvolutionInsight {
  pattern: string
  successRate: number
  sampleCount: number
  recommendation: string
}