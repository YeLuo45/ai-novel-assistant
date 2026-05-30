/**
 * BaseAgent - Agent 基类（状态机驱动）
 * V39 Generic Agent 架构核心组件
 */

import { StateMachine, AgentState, StateEvent, StateContext } from './StateMachine'

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
 * Agent 配置
 */
export interface AgentConfig {
  name: string
  maxRetries?: number
  timeout?: number
}

/**
 * Agent 状态变更回调
 */
export type StateChangeCallback = (from: AgentState | null, to: AgentState, event: StateEvent | null) => void

/**
 * 执行结果
 */
export interface AgentResult {
  success: boolean
  output?: string
  error?: string
  state: AgentState
  context: AgentContext
}

/**
 * BaseAgent 基类
 */
export abstract class BaseAgent {
  protected stateMachine: StateMachine<AgentState, StateEvent>
  protected context: AgentContext
  protected config: AgentConfig
  protected onStateChangeCallback?: StateChangeCallback

  constructor(config: AgentConfig) {
    this.config = config
    this.context = {
      taskId: '',
      input: '',
      retryCount: 0,
      maxRetries: config.maxRetries ?? 3
    }
    
    this.stateMachine = new StateMachine<AgentState, StateEvent>('idle')
    StateMachine.defineAgentTransitions(this.stateMachine)
    
    this.setupDefaultListeners()
  }

  /**
   * 设置默认监听器
   */
  protected setupDefaultListeners(): void {
    this.stateMachine.addListener((from, to) => {
      if (from !== to) {
        console.debug(`[${this.config.name}] State: ${from} -> ${to}`)
      }
    })
  }

  /**
   * 注册状态变更回调
   */
  onStateChange(callback: StateChangeCallback): void {
    this.onStateChangeCallback = callback
    this.stateMachine.addListener((from, to, event) => {
      callback(from as AgentState | null, to as AgentState, event)
    })
  }

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.stateMachine.getCurrentState()
  }

  /**
   * 获取上下文
   */
  getContext(): AgentContext {
    return { ...this.context }
  }

  /**
   * 获取状态历史
   */
  getHistory(): StateContext[] {
    return this.stateMachine.getHistory()
  }

  /**
   * 执行任务 - Template Method 模式
   */
  async execute(input: string, context?: Partial<AgentContext>): Promise<AgentResult> {
    this.context = {
      ...this.context,
      ...context,
      input,
      startTime: Date.now()
    }

    try {
      this.stateMachine.transition('START')
      
      // Planning 阶段
      this.stateMachine.transition('PLAN')
      await this.onPlanning()
      
      // Executing 阶段
      this.stateMachine.transition('EXECUTE')
      await this.onExecuting()
      
      // Reviewing 阶段
      this.stateMachine.transition('REVIEW')
      await this.onReviewing()
      
      this.stateMachine.transition('COMPLETE')
      this.context.endTime = Date.now()
      
      return {
        success: true,
        output: this.context.output,
        state: this.getState(),
        context: this.getContext()
      }
    } catch (error) {
      this.handleError(error as Error)
      
      return {
        success: false,
        error: (error as Error).message,
        state: this.getState(),
        context: this.getContext()
      }
    }
  }

  /**
   * 规划阶段 - 子类实现
   */
  protected abstract onPlanning(): Promise<void>

  /**
   * 执行阶段 - 子类实现
   */
  protected abstract onExecuting(): Promise<void>

  /**
   * 评审阶段 - 子类实现
   */
  protected abstract onReviewing(): Promise<void>

  /**
   * 状态变更钩子
   */
  protected onStateChanged(from: AgentState | null, to: AgentState): void {
    // 可被子类重写
  }

  /**
   * 错误处理
   */
  protected handleError(error: Error): void {
    this.stateMachine.transition('FAIL')
    this.context.metadata = {
      ...this.context.metadata,
      error: error.message
    }
    
    const shouldRetry = this.shouldRetry(error)
    if (shouldRetry && (this.context.retryCount ?? 0) < (this.context.maxRetries ?? 3)) {
      this.context.retryCount = (this.context.retryCount ?? 0) + 1
      this.stateMachine.transition('RETRY')
    }
  }

  /**
   * 判断是否应该重试 - 可被子类重写
   */
  protected shouldRetry(error: Error): boolean {
    // 默认策略：网络错误和超时可以重试
    const retriablePatterns = ['fetch failed', 'network', 'timeout', 'ECONNREFUSED']
    return retriablePatterns.some(p => error.message.includes(p))
  }

  /**
   * 重置 Agent
   */
  reset(): void {
    this.stateMachine.reset('idle')
    this.context = {
      taskId: '',
      input: '',
      retryCount: 0,
      maxRetries: this.config.maxRetries ?? 3
    }
  }
}