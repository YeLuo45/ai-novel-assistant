/**
 * 类型小说垂直优化 - 类型定义
 * V15 Phase 1
 */

export type GenreId = 'mystery' | 'romance' | 'scifi' | 'fanfiction' | 'urban' | 'fantasy'

export interface GenreConfig {
  id: GenreId
  name: string
  description: string
  icon: string
  
  // Agent增强提示词
  agentEnhancements: {
    plotExpert: string[]
    dialogueMaster: string[]
    styleGuard: string[]
    criticAgent: string[]
  }
  
  // 检测规则
  detectors: {
    enabled: boolean
    rules: DetectionRule[]
  }
  
  // 输出格式
  outputFormat: {
    plotStructure: 'three_act' | 'five_act' | 'mystery' | 'relationship'
    includeMetrics: string[]
  }
}

export interface DetectionRule {
  id: string
  name: string
  description: string
  severity: 'minor' | 'major' | 'critical'
  checkFunction: string
}

// 检测结果类型
export interface GenreDetectionResult {
  genreId: GenreId
  issues: GenreIssue[]
  metrics: Record<string, number | string>
}

export interface GenreIssue {
  type: string
  severity: 'minor' | 'major' | 'critical'
  description: string
  location?: { paragraph: number }
  suggestion?: string
}
