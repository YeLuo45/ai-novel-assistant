/**
 * SuggestionGenerator - V38
 * Generates actionable improvement suggestions from quality issues
 */

import type { QualityIssue, ChapterContext } from './types'

export interface Suggestion {
  id: string
  issue: QualityIssue
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionableSteps: string[]
  targetChapter?: number
  targetParagraph?: number
  estimatedImpact: 'high' | 'medium' | 'low'
}

export class SuggestionGenerator {
  /**
   * Generate prioritized suggestions from quality issues
   */
  generate(issues: QualityIssue[], chapters?: ChapterContext[]): Suggestion[] {
    const suggestions: Suggestion[] = []

    // Sort issues by priority and severity
    const sortedIssues = [...issues].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const severityOrder = { error: 0, warning: 1, info: 2 }
      
      const aPriority = a.priority ? priorityOrder[a.priority] : severityOrder[a.severity]
      const bPriority = b.priority ? priorityOrder[b.priority] : severityOrder[b.severity]
      
      return aPriority - bPriority
    })

    for (const issue of sortedIssues) {
      const suggestion = this.createSuggestion(issue, chapters)
      suggestions.push(suggestion)
    }

    return suggestions
  }

  /**
   * Create a suggestion from an issue
   */
  private createSuggestion(issue: QualityIssue, chapters?: ChapterContext[]): Suggestion {
    const templates = this.getSuggestionTemplate(issue.type)
    
    return {
      id: `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      issue,
      priority: issue.priority || this.severityToPriority(issue.severity),
      title: templates.title,
      description: issue.suggestion || templates.defaultDescription,
      actionableSteps: this.generateSteps(issue, templates.steps),
      targetChapter: issue.position.chapter,
      targetParagraph: issue.position.paragraph,
      estimatedImpact: this.estimateImpact(issue)
    }
  }

  /**
   * Generate actionable steps for implementing the suggestion
   */
  private generateSteps(issue: QualityIssue, baseSteps: string[]): string[] {
    const steps: string[] = []

    // Add context-specific steps based on issue type
    if (issue.position.chapter !== undefined) {
      steps.push(`定位到第${issue.position.chapter + 1}章`)
    }
    if (issue.position.paragraph !== undefined) {
      steps.push(`找到第${issue.position.paragraph + 1}段落`)
    }

    // Add base steps from template
    steps.push(...baseSteps)

    // Add severity-based additional steps
    if (issue.severity === 'error') {
      steps.push('这是严重问题，建议优先处理')
    }

    return steps
  }

  /**
   * Get suggestion template by issue type
   */
  private getSuggestionTemplate(type: string): {
    title: string
    defaultDescription: string
    steps: string[]
  } {
    const templates: Record<string, { title: string; defaultDescription: string; steps: string[] }> = {
      consistency: {
        title: '角色一致性修复',
        defaultDescription: '保持角色行为和性格的一致性',
        steps: [
          '回顾该角色在之前章节的表现',
          '确保当前行为与角色设定相符',
          '如需改变，提供合理的转变理由'
        ]
      },
      pacing: {
        title: '节奏调整',
        defaultDescription: '优化章节节奏，避免过快或过慢',
        steps: [
          '检查章节长度是否合适',
          '评估情节发展速度',
          '添加或删除过渡内容'
        ]
      },
      tension: {
        title: '张力增强',
        defaultDescription: '增加故事张力和悬念',
        steps: [
          '在关键点添加转折',
          '引入新的冲突或悬念',
          '延长冲突持续时间'
        ]
      },
      dialogue_flow: {
        title: '对话流畅性改进',
        defaultDescription: '改善对话模式和节奏',
        steps: [
          '改变对话顺序',
          '添加动作或旁白',
          '避免同一角色连续发言'
        ]
      },
      duplicate: {
        title: '消除重复内容',
        defaultDescription: '减少或消除重复的表达',
        steps: [
          '找到相似的表达',
          '用不同的方式表达相同意思',
          '删除冗余内容'
        ]
      },
      length: {
        title: '段落长度优化',
        defaultDescription: '调整段落长度以提高可读性',
        steps: [
          '将长段落拆分',
          '添加对话或动作打断',
          '确保每段聚焦一个主题'
        ]
      },
      style: {
        title: '风格一致性调整',
        defaultDescription: '保持写作风格统一',
        steps: [
          '检查用词一致性',
          '统一叙述语气',
          '保持相同的视角'
        ]
      }
    }

    return templates[type] || {
      title: '内容改进建议',
      defaultDescription: '根据检测结果进行相应调整',
      steps: ['检查并修改相关内容']
    }
  }

  /**
   * Convert severity to priority
   */
  private severityToPriority(severity: 'error' | 'warning' | 'info'): 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'error': return 'high'
      case 'warning': return 'medium'
      case 'info': return 'low'
    }
  }

  /**
   * Estimate the impact of fixing this issue
   */
  private estimateImpact(issue: QualityIssue): 'high' | 'medium' | 'low' {
    switch (issue.type) {
      case 'consistency':
        return 'high' // Consistency issues greatly affect reader immersion
      case 'pacing':
        return 'high' // Pacing issues can make or break a story
      case 'tension':
        return 'medium'
      case 'length':
        return 'low'
      default:
        return 'medium'
    }
  }

  /**
   * Filter suggestions by priority
   */
  filterByPriority(suggestions: Suggestion[], priority: 'high' | 'medium' | 'low'): Suggestion[] {
    return suggestions.filter(s => s.priority === priority)
  }

  /**
   * Group suggestions by chapter
   */
  groupByChapter(suggestions: Suggestion[]): Record<number, Suggestion[]> {
    const grouped: Record<number, Suggestion[]> = {}
    
    for (const suggestion of suggestions) {
      const chapter = suggestion.targetChapter ?? -1
      if (!grouped[chapter]) {
        grouped[chapter] = []
      }
      grouped[chapter].push(suggestion)
    }
    
    return grouped
  }

  /**
   * Get suggestion statistics
   */
  getStats(suggestions: Suggestion[]): {
    total: number
    byPriority: Record<string, number>
    byType: Record<string, number>
  } {
    const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 }
    const byType: Record<string, number> = {}

    for (const suggestion of suggestions) {
      byPriority[suggestion.priority]++
      byType[suggestion.issue.type] = (byType[suggestion.issue.type] || 0) + 1
    }

    return {
      total: suggestions.length,
      byPriority,
      byType
    }
  }
}