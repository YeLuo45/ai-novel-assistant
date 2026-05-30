/**
 * Reflection - 自我反思机制
 * V39 Generic Agent 架构核心组件
 */

/**
 * 执行记录
 */
export interface ExecutionRecord {
  task: string
  result: unknown
  duration: number
  timestamp: number
  success: boolean
}

/**
 * 自我评估结果
 */
export interface SelfAssessment {
  score: number
  feedback: string
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
}

/**
 * 学习记录
 */
export interface LearningRecord {
  pattern: string
  successRate: number
  totalAttempts: number
  avgDuration: number
  lastUpdated: number
}

/**
 * 反思结果
 */
export interface ReflectionResult {
  shouldRetry: boolean
  selfAssessment: SelfAssessment
  learnedPatterns: string[]
  improvementSuggestions: string[]
}

/**
 * Reflection 自我反思机制
 */
export class Reflection {
  private executionHistory: ExecutionRecord[] = []
  private learningRecords: Map<string, LearningRecord> = new Map()
  private maxHistorySize: number

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize
  }

  /**
   * 自我评估
   */
  selfAssess(): SelfAssessment {
    if (this.executionHistory.length === 0) {
      return {
        score: 0,
        feedback: 'No execution history available',
        suggestions: [],
        strengths: [],
        weaknesses: []
      }
    }

    const recentExecutions = this.getRecentExecutions(10)
    const successCount = recentExecutions.filter(e => e.success).length
    const successRate = successCount / recentExecutions.length
    
    const totalDuration = recentExecutions.reduce((sum, e) => sum + e.duration, 0)
    const avgDuration = totalDuration / recentExecutions.length

    const score = this.calculateScore(successRate, avgDuration)
    const feedback = this.generateFeedback(successRate, avgDuration)
    const { strengths, weaknesses } = this.analyzePerformance(recentExecutions)
    const suggestions = this.generateSuggestions(strengths, weaknesses)

    return {
      score,
      feedback,
      suggestions,
      strengths,
      weaknesses
    }
  }

  /**
   * 从执行结果学习
   */
  learnFromExecution(execution: ExecutionRecord): void {
    // 添加到历史
    this.executionHistory.push(execution)
    
    // 限制历史大小
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift()
    }

    // 更新学习记录
    this.updateLearningRecord(execution)
  }

  /**
   * 从执行结果学习（简化接口）
   */
  learnFromExecutionSimplified(
    task: string,
    result: unknown,
    duration: number,
    success: boolean
  ): void {
    this.learnFromExecution({
      task,
      result,
      duration,
      timestamp: Date.now(),
      success
    })
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(error: Error): boolean {
    // 分析最近错误模式
    const recentErrors = this.executionHistory
      .slice(-5)
      .filter(e => !e.success)
      .map(e => String(e.result))

    // 如果是重复错误，不建议重试
    const errorCount = recentErrors.filter(e => e.includes(error.message)).length
    if (errorCount >= 2) {
      return false
    }

    // 网络错误建议重试
    const networkPatterns = ['fetch failed', 'network', 'timeout', 'ECONNREFUSED']
    if (networkPatterns.some(p => error.message.includes(p))) {
      return true
    }

    // 逻辑错误不建议重试
    const logicPatterns = ['invalid', 'undefined', 'null', 'parse error']
    if (logicPatterns.some(p => error.message.toLowerCase().includes(p))) {
      return false
    }

    return true
  }

  /**
   * 获取反思结果
   */
  reflect(): ReflectionResult {
    const selfAssessment = this.selfAssess()
    const learnedPatterns = this.extractPatterns()
    const improvementSuggestions = selfAssessment.suggestions

    return {
      shouldRetry: this.shouldRetry(new Error('reflection-check')),
      selfAssessment,
      learnedPatterns,
      improvementSuggestions
    }
  }

  /**
   * 获取最近执行记录
   */
  getRecentExecutions(count: number): ExecutionRecord[] {
    return this.executionHistory.slice(-count)
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.executionHistory = []
  }

  /**
   * 获取学习记录
   */
  getLearningRecords(): Map<string, LearningRecord> {
    return new Map(this.learningRecords)
  }

  /**
   * 计算评分
   */
  private calculateScore(successRate: number, avgDuration: number): number {
    // 基础分数基于成功率 (0-70)
    const baseScore = successRate * 70
    
    // 性能分数 (0-30) - 越快越高
    // 假设 10s 内是优秀的，30s+ 开始扣分
    const performanceScore = Math.max(0, 30 - Math.min(avgDuration / 1000, 30))
    
    return Math.round(baseScore + performanceScore)
  }

  /**
   * 生成反馈
   */
  private generateFeedback(successRate: number, avgDuration: number): string {
    if (successRate >= 0.9) {
      return 'Excellent performance with high success rate and good speed'
    } else if (successRate >= 0.7) {
      return 'Good performance with room for improvement'
    } else if (successRate >= 0.5) {
      return 'Moderate performance，需要优化策略'
    } else {
      return '需要显著改进，成功率偏低'
    }
  }

  /**
   * 分析性能
   */
  private analyzePerformance(executions: ExecutionRecord[]): {
    strengths: string[]
    weaknesses: string[]
  } {
    const strengths: string[] = []
    const weaknesses: string[] = []

    const successfulExecutions = executions.filter(e => e.success)
    const failedExecutions = executions.filter(e => !e.success)

    if (successfulExecutions.length > failedExecutions.length) {
      strengths.push('High success rate')
    }

    const avgDuration = executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
    if (avgDuration < 5000) {
      strengths.push('Fast execution speed')
    } else if (avgDuration > 15000) {
      weaknesses.push('Slow execution speed')
    }

    if (failedExecutions.length > executions.length * 0.3) {
      weaknesses.push('High failure rate')
    }

    return { strengths, weaknesses }
  }

  /**
   * 生成建议
   */
  private generateSuggestions(strengths: string[], weaknesses: string[]): string[] {
    const suggestions: string[] = []

    for (const weakness of weaknesses) {
      if (weakness.includes('speed')) {
        suggestions.push('Consider optimizing execution flow or caching results')
      }
      if (weakness.includes('failure')) {
        suggestions.push('Review error patterns and improve error handling')
      }
    }

    if (suggestions.length === 0 && strengths.length > 0) {
      suggestions.push('Maintain current performance levels')
    }

    return suggestions
  }

  /**
   * 更新学习记录
   */
  private updateLearningRecord(execution: ExecutionRecord): void {
    const pattern = this.extractPattern(execution.task)
    const existing = this.learningRecords.get(pattern)

    if (existing) {
      existing.totalAttempts++
      if (execution.success) {
        existing.successRate = (existing.successRate * (existing.totalAttempts - 1) + 1) / existing.totalAttempts
      }
      existing.avgDuration = (existing.avgDuration * (existing.totalAttempts - 1) + execution.duration) / existing.totalAttempts
      existing.lastUpdated = Date.now()
    } else {
      this.learningRecords.set(pattern, {
        pattern,
        successRate: execution.success ? 1 : 0,
        totalAttempts: 1,
        avgDuration: execution.duration,
        lastUpdated: Date.now()
      })
    }
  }

  /**
   * 提取模式
   */
  private extractPattern(task: string): string {
    // 简化处理：取任务描述的前50个字符作为模式标识
    return task.substring(0, 50)
  }

  /**
   * 提取学到的模式
   */
  private extractPatterns(): string[] {
    const patterns: string[] = []
    for (const [pattern, record] of Array.from(this.learningRecords.entries())) {
      if (record.successRate > 0.7) {
        patterns.push(pattern)
      }
    }
    return patterns
  }
}