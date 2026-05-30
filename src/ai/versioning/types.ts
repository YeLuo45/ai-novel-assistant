/**
 * 多版本生成与对比 - 类型定义
 * V16 Phase 1
 */

export type VersionStrategy = 
  | 'style_variation'    // 风格差异（文艺/口语/简洁）
  | 'plot_branch'         // 情节分支（不同发展路线）
  | 'pov_switch'          // 视角切换（主角/配角/旁观者）
  | 'tone_shift'          // 语气变化（严肃/幽默/抒情）
  | 'mixed'               // 混合策略

export type CompareMode = 
  | 'side_by_side'        // 并排对比
  | 'unified_diff'        // 差异高亮
  | 'sequential'          // 顺序浏览

export interface VersionOptions {
  count: 2 | 3 | 4
  strategy: VersionStrategy
  compareMode: CompareMode
}

export interface WritingVersion {
  id: string
  versionNumber: number
  createdAt: number
  content: string
  title?: string
  metadata: {
    strategy: VersionStrategy
    wordCount: number
    keyDifferences: string[]
    strengths: string[]
    weaknesses: string[]
  }
  analysis: VersionAnalysis
  userSelection?: {
    selected: boolean
    reason?: string
  }
}

export interface VersionAnalysis {
  tone: 'formal' | 'casual' | 'lively' | 'serious' | 'humorous'
  pacing: 'fast' | 'moderate' | 'slow'
  emotionalIntensity: number
  dialogueRatio: number
  descriptionDensity: number
  conflictLevel: number
  genreMetrics?: Record<string, number | string>
}

export interface VersionComparison {
  versions: WritingVersion[]
  differences: VersionDifference[]
  recommendations: VersionRecommendation[]
}

export interface VersionDifference {
  type: 'plot' | 'style' | 'tone' | 'character'
  location: { paragraph: number }
  versions: { [versionId: string]: string }
  highlightText: string
}

export interface VersionRecommendation {
  versionId: string
  reason: string
  score: number
  mergeSuggestions?: MergeSuggestion[]
}

export interface MergeSuggestion {
  fromVersion: string
  toVersion: string
  section: { start: number; end: number }
  reason: string
}
