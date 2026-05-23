/**
 * ErrorHandler - 错误处理
 * V39 Generic Agent 架构核心组件
 */

/**
 * Agent 上下文
 */
export interface AgentContext {
  taskId: string
  input: string
  output?: string
  metadata?: Record<string, unknown>
  startTime?: number
  endTime?: number
  retryCount?: number
  maxRetries?: number
}

/**
 * 错误分类
 */
export type ErrorCategory = 'retry' | 'escalate' | 'ignore'

/**
 * 错误动作
 */
export interface ErrorAction {
  category: ErrorCategory
  retryable: boolean
  retryAfter?: number
  fallback?: string
  message: string
}

/**
 * 错误记录
 */
export interface ErrorRecord {
  error: Error
  category: ErrorCategory
  timestamp: number
  context: AgentContext
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  pattern: string
  category: ErrorCategory
  maxRetries: number
  retryAfter?: number
}

/**
 * ErrorHandler 错误处理类
 */
export class ErrorHandler {
  private errorHistory: ErrorRecord[] = []
  private strategies: RecoveryStrategy[] = []
  private maxHistorySize: number

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize
    this.registerDefaultStrategies()
  }

  /**
   * 注册默认恢复策略
   */
  private registerDefaultStrategies(): void {
    // 网络相关错误 - 可重试
    this.strategies.push({
      pattern: 'fetch failed',
      category: 'retry',
      maxRetries: 3,
      retryAfter: 1000
    })
    this.strategies.push({
      pattern: 'network',
      category: 'retry',
      maxRetries: 3,
      retryAfter: 1000
    })
    this.strategies.push({
      pattern: 'ECONNREFUSED',
      category: 'retry',
      maxRetries: 2,
      retryAfter: 2000
    })
    this.strategies.push({
      pattern: 'timeout',
      category: 'retry',
      maxRetries: 3,
      retryAfter: 500
    })

    // API 相关错误 - 需要升级
    this.strategies.push({
      pattern: 'rate limit',
      category: 'escalate',
      maxRetries: 1
    })
    this.strategies.push({
      pattern: 'quota exceeded',
      category: 'escalate',
      maxRetries: 1
    })
    this.strategies.push({
      pattern: '401',
      category: 'escalate',
      maxRetries: 0
    })
    this.strategies.push({
      pattern: '403',
      category: 'escalate',
      maxRetries: 0
    })

    // 忽略的错误 - 静默处理
    this.strategies.push({
      pattern: 'deprecated',
      category: 'ignore',
      maxRetries: 0
    })
  }

  /**
   * 处理错误
   */
  handle(error: Error, context: AgentContext): ErrorAction {
    const category = this.categorize(error)
    const action = this.determineAction(error, category, context)

    // 记录错误
    this.recordError(error, category, context)

    return action
  }

  /**
   * 分类错误
   */
  categorize(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()

    for (const strategy of this.strategies) {
      if (message.includes(strategy.pattern.toLowerCase())) {
        return strategy.category
      }
    }

    // 默认归类为升级处理
    return 'escalate'
  }

  /**
   * 确定错误动作
   */
  determineAction(
    error: Error,
    category: ErrorCategory,
    context: AgentContext
  ): ErrorAction {
    const message = error.message

    switch (category) {
      case 'retry': {
        const strategy = this.findStrategy(error.message)
        const retryAfter = strategy?.retryAfter ?? 1000
        return {
          category: 'retry',
          retryable: true,
          retryAfter,
          message: `Retriable error: ${message}`
        }
      }

      case 'escalate':
        return {
          category: 'escalate',
          retryable: false,
          message: `Escalation required: ${message}`
        }

      case 'ignore':
        return {
          category: 'ignore',
          retryable: false,
          message: `Ignored error: ${message}`
        }

      default:
        return {
          category: 'escalate',
          retryable: false,
          message: `Unknown error: ${message}`
        }
    }
  }

  /**
   * 执行恢复
   */
  async recover(action: ErrorAction): Promise<void> {
    if (action.category === 'ignore') {
      return
    }

    if (action.category === 'retry' && action.retryAfter) {
      await this.delay(action.retryAfter)
    }
  }

  /**
   * 记录错误
   */
  private recordError(
    error: Error,
    category: ErrorCategory,
    context: AgentContext
  ): void {
    const record: ErrorRecord = {
      error,
      category,
      timestamp: Date.now(),
      context: { ...context }
    }

    this.errorHistory.push(record)

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
  }

  /**
   * 查找策略
   */
  private findStrategy(errorMessage: string): RecoveryStrategy | undefined {
    const lowerMessage = errorMessage.toLowerCase()
    return this.strategies.find(s => lowerMessage.includes(s.pattern.toLowerCase()))
  }

  /**
   * 延迟等待
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(): ErrorRecord[] {
    return [...this.errorHistory]
  }

  /**
   * 获取最近错误
   */
  getRecentErrors(count: number): ErrorRecord[] {
    return this.errorHistory.slice(-count)
  }

  /**
   * 添加自定义策略
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy)
  }

  /**
   * 清除错误历史
   */
  clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number
    byCategory: Record<ErrorCategory, number>
    mostCommon: string[]
  } {
    const byCategory: Record<ErrorCategory, number> = {
      retry: 0,
      escalate: 0,
      ignore: 0
    }

    const errorMessages: string[] = []

    for (const record of this.errorHistory) {
      byCategory[record.category]++
      if (!errorMessages.includes(record.error.message)) {
        errorMessages.push(record.error.message)
      }
    }

    return {
      total: this.errorHistory.length,
      byCategory,
      mostCommon: errorMessages.slice(0, 5)
    }
  }
}