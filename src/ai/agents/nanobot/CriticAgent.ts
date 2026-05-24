/**
 * CriticAgent.ts - 评审Agent
 * V41 多Agent协作系统核心组件
 * 复用V38的评审逻辑
 */

import { WritingAgent, AgentConfig, Message, ProcessingResult } from './WritingAgent'

export interface ReviewResult {
  score: number
  issues: string[]
  suggestions: string[]
  approved: boolean
}

export interface ReviewContext {
  plotPlan?: import('./PlotAgent').PlotPlan
  characterSheet?: import('./CharacterAgent').CharacterSheet
  dialoguePlan?: import('./DialogueAgent').DialoguePlan
  styleGuide?: import('./StyleAgent').StyleGuide
}

export class CriticAgent extends WritingAgent {
  readonly role: 'critic' = 'critic'
  private lastReview?: ReviewResult

  constructor(config: AgentConfig, messageBusInstance?: import('./MessageBus').MessageBus) {
    super(config, messageBusInstance)
  }

  async process(message: Message): Promise<ProcessingResult> {
    this.setState('working')

    try {
      const payload = message.payload as { context?: ReviewContext }

      switch (message.type) {
        case 'request':
          return await this.handleReviewRequest(payload)
        case 'event':
          return await this.handleReviewEvent(payload)
        default:
          return { success: false, error: `Unsupported message type: ${message.type}` }
      }
    } catch (error) {
      this.setState('error')
      return { success: false, error: (error as Error).message }
    }
  }

  private async handleReviewRequest(payload: { context?: ReviewContext }): Promise<ProcessingResult> {
    const { context } = payload

    const result = this.performReview(context)
    this.lastReview = result

    this.broadcast('critic:review', {
      channel: 'critic:review',
      type: 'event',
      payload: result,
      timestamp: Date.now()
    })

    this.setState('done')
    return { success: true, output: result }
  }

  private async handleReviewEvent(payload: unknown): Promise<ProcessingResult> {
    return { success: true }
  }

  private performReview(context?: ReviewContext): ReviewResult {
    const issues: string[] = []
    const suggestions: string[] = []

    // 基础检查
    if (!context?.plotPlan) {
      issues.push('缺少情节计划')
    }
    if (!context?.characterSheet) {
      issues.push('缺少角色设定')
    }

    // 计算分数
    let score = 100
    score -= issues.length * 10

    // 检查情节连贯性
    if (context?.plotPlan) {
      const outline = context.plotPlan.outline
      if (outline.length < 3) {
        issues.push('情节点太少')
        score -= 10
      }
    }

    // 检查角色一致性
    if (context?.characterSheet) {
      const chars = context.characterSheet.characters
      const mainChars = chars.filter(c => c.role === 'protagonist' || c.role === 'antagonist')
      if (mainChars.length < 1) {
        issues.push('缺少主要角色')
        score -= 15
      }
    }

    // 生成建议
    if (score < 80) {
      suggestions.push('建议增加更多情节转折点')
      suggestions.push('建议丰富角色背景故事')
    }
    if (issues.includes('缺少情节计划')) {
      suggestions.push('请先创建情节计划')
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      approved: score >= 70
    }
  }

  getLastReview(): ReviewResult | undefined {
    return this.lastReview
  }

  reset(): void {
    super.reset()
    this.lastReview = undefined
  }
}
