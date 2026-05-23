/**
 * Self-Evolution Engine — 根据历史成功案例自动优化 Agent 提示词
 */

import { memoryManager, MemoryManager, Skill, Lesson } from '../memory/MemoryManager'

interface PromptVersion {
  id: string
  version: number
  basePrompt: string
  improvedPrompt: string
  insight: string
  performanceScore: number
  createdAt: number
  useCount: number
}

interface EvolutionInsight {
  pattern: string
  successRate: number
  sampleCount: number
  recommendation: string
}

export class SelfEvolutionEngine {
  private memory: MemoryManager
  private versionHistory: PromptVersion[] = []

  constructor(memory: MemoryManager) {
    this.memory = memory
  }

  /**
   * 分析成功案例，提炼优化方向
   */
  async analyzeSuccessPatterns(): Promise<EvolutionInsight[]> {
    const skills = await this.getAllSkills()
    const insights: EvolutionInsight[] = []

    // 按任务类型分组
    const taskGroups = new Map<string, Skill[]>()
    for (const skill of skills) {
      const key = this.extractTaskKey(skill.task)
      if (!taskGroups.has(key)) taskGroups.set(key, [])
      taskGroups.get(key)!.push(skill)
    }

    // 分析每组模式
    for (const [taskKey, groupSkills] of taskGroups) {
      if (groupSkills.length < 2) continue

      const avgSuccessRate = groupSkills.reduce((sum, s) => sum + s.successRate, 0) / groupSkills.length
      const totalUseCount = groupSkills.reduce((sum, s) => sum + s.useCount, 0)

      if (avgSuccessRate > 0.7 && totalUseCount > 5) {
        insights.push({
          pattern: taskKey,
          successRate: avgSuccessRate,
          sampleCount: groupSkills.length,
          recommendation: this.generateRecommendation(groupSkills),
        })
      }
    }

    return insights
  }

  /**
   * 生成改进后的提示词
   */
  async generateImprovedPrompt(lesson: Lesson): Promise<PromptVersion | null> {
    if (lesson.outcome !== 'success') return null

    const existingVersion = this.versionHistory.length > 0
      ? this.versionHistory[this.versionHistory.length - 1]
      : null

    const basePrompt = existingVersion?.improvedPrompt || this.getDefaultPrompt(lesson.task)

    // 提取成功要素
    const successFactors = this.extractSuccessFactors(lesson)

    // 生成改进提示词
    const improvedPrompt = this.enhancePrompt(basePrompt, successFactors)

    const version: PromptVersion = {
      id: `pv_${Date.now()}`,
      version: (existingVersion?.version || 0) + 1,
      basePrompt,
      improvedPrompt,
      insight: successFactors.join('; '),
      performanceScore: 0.9,
      createdAt: Date.now(),
      useCount: 0,
    }

    this.versionHistory.push(version)
    await this.saveVersion(version)

    return version
  }

  /**
   * 应用进化（创建新版本提示词）
   */
  async applyEvolution(insight: EvolutionInsight): Promise<PromptVersion> {
    const existingVersion = this.versionHistory.length > 0
      ? this.versionHistory[this.versionHistory.length - 1]
      : null

    const basePrompt = existingVersion?.improvedPrompt || this.getDefaultPrompt(insight.pattern)

    const improvedPrompt = basePrompt + `\n\n[EVOLVED] ${insight.recommendation}`

    const version: PromptVersion = {
      id: `pv_${Date.now()}`,
      version: (existingVersion?.version || 0) + 1,
      basePrompt,
      improvedPrompt,
      insight: insight.recommendation,
      performanceScore: insight.successRate,
      createdAt: Date.now(),
      useCount: 0,
    }

    this.versionHistory.push(version)
    await this.saveVersion(version)

    return version
  }

  /**
   * 回滚到历史版本
   */
  async rollbackToVersion(versionId: string): Promise<boolean> {
    const version = this.versionHistory.find(v => v.id === versionId)
    if (!version) return false

    // 移除之后的所有版本
    const idx = this.versionHistory.findIndex(v => v.id === versionId)
    this.versionHistory = this.versionHistory.slice(0, idx + 1)

    return true
  }

  /**
   * 获取当前活跃版本
   */
  getCurrentVersion(): PromptVersion | null {
    return this.versionHistory.length > 0
      ? this.versionHistory[this.versionHistory.length - 1]
      : null
  }

  private async getAllSkills(): Promise<Skill[]> {
    // @ts-ignore
    return await this.memory.db?.skills?.toArray() || []
  }

  private extractTaskKey(task: string): string {
    const words = task.split(/\s+/).filter(w => w.length > 3).slice(0, 3)
    return words.join('_')
  }

  private generateRecommendation(skills: Skill[]): string {
    const commonTriggers = this.findCommonTriggers(skills)
    const bestSteps = this.findBestSteps(skills)
    return `优先使用触发词: ${commonTriggers.join(', ')}。关键步骤: ${bestSteps.join(' -> ')}`
  }

  private findCommonTriggers(skills: Skill[]): string[] {
    const triggerCounts = new Map<string, number>()
    for (const skill of skills) {
      for (const trigger of skill.triggers) {
        triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1)
      }
    }
    return [...triggerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t)
  }

  private findBestSteps(skills: Skill[]): string[] {
    const sorted = [...skills].sort((a, b) => b.successRate - a.successRate)
    return sorted[0]?.steps.slice(0, 3) || []
  }

  private extractSuccessFactors(lesson: Lesson): string[] {
    const factors: string[] = []
    if (lesson.context?.strategy) factors.push(`策略: ${lesson.context.strategy}`)
    if (lesson.context?.tone) factors.push(`语气: ${lesson.context.tone}`)
    if (lesson.context?.structure) factors.push(`结构: ${lesson.context.structure}`)
    return factors.length > 0 ? factors : ['保持现有优秀实践']
  }

  private enhancePrompt(base: string, factors: string[]): string {
    const enhancement = factors.map(f => `- ${f}`).join('\n')
    return `${base}\n\n[SUCCESS FACTORS]\n${enhancement}`
  }

  private getDefaultPrompt(task: string): string {
    return `任务: ${task}\n\n请按照最佳实践完成写作任务，注意语言流畅性和故事逻辑。`
  }

  private async saveVersion(version: PromptVersion): Promise<void> {
    const { Dexie } = await import('dexie')
    class EvolutionDB extends Dexie {
      prompt_versions!: PromptVersion[]
      constructor() {
        super('EvolutionDB')
        this.version(1).stores({
          prompt_versions: 'id, version, createdAt',
        })
      }
    }
    const db = new EvolutionDB()
    await db.prompt_versions.add(version)
  }
}

export const selfEvolutionEngine = new SelfEvolutionEngine(memoryManager)