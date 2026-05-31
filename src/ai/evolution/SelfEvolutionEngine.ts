/**
 * Self-Evolution Engine - V40
 * Phase 1: 自我进化引擎
 * 
 * 功能：
 * - 分析成功案例，提炼优化方向
 * - 生成改进后的提示词版本
 * - 管理 PromptVersion 版本历史
 * - 支持回滚到历史版本
 */

import { db } from '../../db'
import type { MemoryEntry } from '../memory/types'

// ==================== 类型定义 ====================

/** 进化洞察 */
export interface EvolutionInsight {
  id: string
  type: 'improvement' | 'fix' | 'discovery'
  description: string
  sourceLessons: string[]  // lesson IDs that contributed
  confidence: number        // 0-100
  createdAt: number
}

/** 课程/案例（从 crystallize 产生） */
export interface Lesson {
  id: string
  task: string             // 任务描述
  approach: string         // 采用的方法
  outcome: 'success' | 'failure'
  context: {
    score: number          // 成功率 0-1
    chapterId?: number
    reviewers?: number
    [key: string]: any
  }
  createdAt: number
}

/** Prompt 版本 */
export interface PromptVersion {
  id: string
  version: number
  basePrompt: string
  improvedPrompt: string
  insight: string          // 优化原因
  performanceScore: number // 基于成功率
  useCount: number         // 使用次数
  createdAt: number
  createdFromLesson?: string
}

// ==================== 存储键 ====================

const STORAGE_KEYS = {
  PROMPT_VERSIONS: 'ai-novel-prompt-versions',
  EVOLUTION_INSIGHTS: 'ai-novel-evolution-insights',
  LESSONS: 'ai-novel-lessons',
} as const

// ==================== 存储辅助 ====================

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save to localStorage: ${key}`, e)
  }
}

// ==================== Self-Evolution Engine ====================

export class SelfEvolutionEngine {
  private projectId: number
  private versions: PromptVersion[] = []
  private insights: EvolutionInsight[] = []
  private lessons: Lesson[] = []

  constructor(projectId: number = 0) {
    this.projectId = projectId
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    this.versions = getFromStorage(STORAGE_KEYS.PROMPT_VERSIONS, [])
    this.insights = getFromStorage(STORAGE_KEYS.EVOLUTION_INSIGHTS, [])
    this.lessons = getFromStorage(STORAGE_KEYS.LESSONS, [])
  }

  private persist(): void {
    saveToStorage(STORAGE_KEYS.PROMPT_VERSIONS, this.versions)
    saveToStorage(STORAGE_KEYS.EVOLUTION_INSIGHTS, this.insights)
    saveToStorage(STORAGE_KEYS.LESSONS, this.lessons)
  }

  // ==================== 核心方法 ====================

  /**
   * 记录一个课程/案例
   */
  async recordLesson(lesson: Omit<Lesson, 'id' | 'createdAt'>): Promise<Lesson> {
    const fullLesson: Lesson = {
      ...lesson,
      id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    }
    this.lessons.push(fullLesson)
    this.persist()
    return fullLesson
  }

  /**
   * 分析成功案例模式
   */
  async analyzeSuccessPatterns(): Promise<EvolutionInsight[]> {
    // 找出成功的案例
    const successLessons = this.lessons.filter(l => l.outcome === 'success' && l.context.score > 0.7)
    
    if (successLessons.length === 0) {
      return []
    }

    // 按任务类型分组
    const taskGroups = new Map<string, Lesson[]>()
    for (const lesson of successLessons) {
      const baseTask = lesson.task.split('_')[0] // e.g., "review", "generate"
      if (!taskGroups.has(baseTask)) {
        taskGroups.set(baseTask, [])
      }
      taskGroups.get(baseTask)!.push(lesson)
    }

    // 生成洞察
    const newInsights: EvolutionInsight[] = []
    for (const [taskType, lessons] of Array.from(taskGroups.entries())) {
      if (lessons.length < 1) continue

      // 提取通用的成功方法
      const approaches = lessons.map(l => l.approach).join('; ')
      const avgScore = lessons.reduce((sum, l) => sum + l.context.score, 0) / lessons.length

      const insight: EvolutionInsight = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'improvement',
        description: `成功完成 ${taskType} 任务的方法: ${approaches.slice(0, 200)}`,
        sourceLessons: lessons.map(l => l.id),
        confidence: Math.round(avgScore * 100),
        createdAt: Date.now()
      }
      newInsights.push(insight)
      this.insights.push(insight)
    }

    this.persist()
    return newInsights
  }

  /**
   * 生成改进后的提示词
   */
  async generateImprovedPrompt(lesson: Lesson): Promise<PromptVersion> {
    const latestVersion = this.versions.length > 0 
      ? Math.max(...this.versions.map(v => v.version))
      : 0

    // 基于案例生成改进提示词
    const basePrompt = latestVersion > 0 
      ? this.versions.find(v => v.version === latestVersion)?.improvedPrompt || ''
      : this.getDefaultPrompt()

    // 生成改进版本（简单的规则替换演示）
    const improvedPrompt = this.applyImprovements(basePrompt, lesson)

    const version: PromptVersion = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: latestVersion + 1,
      basePrompt,
      improvedPrompt,
      insight: `从 lesson ${lesson.id} 学到的改进: ${lesson.approach.slice(0, 100)}`,
      performanceScore: lesson.context.score,
      useCount: 0,
      createdAt: Date.now(),
      createdFromLesson: lesson.id
    }

    this.versions.push(version)
    this.persist()
    return version
  }

  /**
   * 应用进化（创建新版本提示词）
   */
  async applyEvolution(insight: EvolutionInsight): Promise<PromptVersion> {
    const latestVersion = this.versions.length > 0 
      ? Math.max(...this.versions.map(v => v.version))
      : 0

    const basePrompt = latestVersion > 0 
      ? this.versions.find(v => v.version === latestVersion)?.improvedPrompt || ''
      : this.getDefaultPrompt()

    // 基于洞察生成改进
    const improvedPrompt = basePrompt + `\n\n[改进建议] ${insight.description}`

    const version: PromptVersion = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: latestVersion + 1,
      basePrompt,
      improvedPrompt,
      insight: `应用洞察 ${insight.id}: ${insight.description.slice(0, 100)}`,
      performanceScore: insight.confidence / 100,
      useCount: 0,
      createdAt: Date.now()
    }

    this.versions.push(version)
    this.persist()
    return version
  }

  /**
   * 回滚到历史版本
   */
  async rollbackToVersion(versionId: string): Promise<PromptVersion | null> {
    const targetVersion = this.versions.find(v => v.id === versionId)
    if (!targetVersion) return null

    // 创建新的回滚版本
    const latestVersion = Math.max(...this.versions.map(v => v.version))
    
    const rollbackVersion: PromptVersion = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: latestVersion + 1,
      basePrompt: targetVersion.improvedPrompt,
      improvedPrompt: targetVersion.improvedPrompt, // 保持相同
      insight: `回滚到版本 ${targetVersion.version}`,
      performanceScore: targetVersion.performanceScore,
      useCount: 0,
      createdAt: Date.now()
    }

    this.versions.push(rollbackVersion)
    this.persist()
    return rollbackVersion
  }

  // ==================== 辅助方法 ====================

  private getDefaultPrompt(): string {
    return `你是一位专业的小说写作助手，擅长创作引人入胜的故事。`
  }

  private applyImprovements(basePrompt: string, lesson: Lesson): string {
    // 简单的规则演示：基于 lesson 方法添加改进
    let improved = basePrompt
    
    // 提取方法中的关键词作为增强指令
    const approach = lesson.approach
    if (approach.includes('描写')) {
      improved += '\n\n注重场景细节描写，让读者身临其境。'
    }
    if (approach.includes('对话')) {
      improved += '\n\n让人物对话自然流畅，体现角色性格。'
    }
    if (approach.includes('节奏')) {
      improved += '\n\n控制叙事节奏，张弛有度。'
    }
    
    return improved
  }

  // ==================== 获取方法 ====================

  getVersions(): PromptVersion[] {
    return [...this.versions].sort((a, b) => b.version - a.version)
  }

  getInsights(): EvolutionInsight[] {
    return [...this.insights].sort((a, b) => b.createdAt - a.createdAt)
  }

  getLessons(): Lesson[] {
    return [...this.lessons].sort((a, b) => b.createdAt - a.createdAt)
  }

  getCurrentPrompt(): string {
    if (this.versions.length === 0) return this.getDefaultPrompt()
    const latest = this.versions.reduce((latest, v) => 
      v.version > latest.version ? v : latest
    )
    return latest.improvedPrompt
  }

  incrementUseCount(versionId: string): void {
    const version = this.versions.find(v => v.id === versionId)
    if (version) {
      version.useCount++
      this.persist()
    }
  }

  // ==================== 静态便捷方法 ====================

  static async onLessonCrystallized(
    projectId: number,
    lesson: Lesson
  ): Promise<PromptVersion | null> {
    // 如果成功率足够高，触发进化
    if (lesson.outcome === 'success' && lesson.context.score > 0.8) {
      const engine = new SelfEvolutionEngine(projectId)
      await engine.analyzeSuccessPatterns()
      return await engine.generateImprovedPrompt(lesson)
    }
    return null
  }
}

// 导出单例
export const selfEvolutionEngine = new SelfEvolutionEngine()