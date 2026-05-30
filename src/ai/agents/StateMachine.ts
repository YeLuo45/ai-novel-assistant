/**
 * StateMachine - 状态转换逻辑
 * V39 Generic Agent 架构核心组件
 */

/**
 * Agent 状态类型
 */
export type AgentState = 'idle' | 'planning' | 'executing' | 'reviewing' | 'done' | 'error'

/**
 * 状态转换事件
 */
export type StateEvent = 'START' | 'PLAN' | 'EXECUTE' | 'REVIEW' | 'COMPLETE' | 'FAIL' | 'RETRY' | 'RESET'

/**
 * 状态转换定义
 */
export interface StateTransition<S = string, E = string> {
  from: S
  event: E
  to: S
  guard?: (ctx: unknown) => boolean
}

/**
 * 状态转换上下文
 */
export interface StateContext {
  state: AgentState
  previousState: AgentState | null
  event: StateEvent | null
  timestamp: number
  error?: Error
}

/**
 * 状态监听器
 */
export type StateListener<S = string> = (from: S | null, to: S, event: StateEvent | null) => void

/**
 * 状态机类
 */
export class StateMachine<S = string, E = string> {
  protected transitions: Map<S, StateTransition<S, E>[]> = new Map()
  protected currentState: S
  protected history: StateContext[] = []
  protected listeners: Set<StateListener<S>> = new Set()

  constructor(initialState: S) {
    this.currentState = initialState
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): S {
    return this.currentState
  }

  /**
   * 获取状态历史
   */
  getHistory(): StateContext[] {
    return [...this.history]
  }

  /**
   * 添加状态转换规则
   */
  addTransition(transition: StateTransition<S, E>): void {
    const { from } = transition
    if (!this.transitions.has(from)) {
      this.transitions.set(from, [])
    }
    this.transitions.get(from)!.push(transition)
  }

  /**
   * 添加监听器
   */
  addListener(listener: StateListener<S>): void {
    this.listeners.add(listener)
  }

  /**
   * 移除监听器
   */
  removeListener(listener: StateListener<S>): void {
    this.listeners.delete(listener)
  }

  /**
   * 触发状态转换
   */
  transition(event: E, context?: unknown): boolean {
    const from = this.currentState
    const possibleTransitions = this.transitions.get(from) || []

    const transition = possibleTransitions.find(t => {
      if (t.event !== event) return false
      if (t.guard && !t.guard(context as never)) return false
      return true
    })

    if (!transition) {
      return false
    }

    const previousState = this.currentState
    this.currentState = transition.to

    const stateContext: StateContext = {
      state: this.currentState as AgentState,
      previousState: previousState as AgentState,
      event: event as StateEvent,
      timestamp: Date.now()
    }

    this.history.push(stateContext)
    this.notifyListeners(previousState, this.currentState, event as StateEvent)

    return true
  }

  /**
   * 检查是否可以转换
   */
  canTransition(event: E): boolean {
    const possibleTransitions = this.transitions.get(this.currentState) || []
    return possibleTransitions.some(t => t.event === event)
  }

  /**
   * 重置状态机
   */
  reset(initialState?: S): void {
    if (initialState !== undefined) {
      this.currentState = initialState
    }
    this.history = []
  }

  /**
   * 通知监听器
   */
  protected notifyListeners(from: S, to: S, event: StateEvent | null): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(from, to, event)
      } catch (e) {
        console.error('State listener error:', e)
      }
    }
  }

  /**
   * 定义标准 Agent 状态转换规则
   */
  static defineAgentTransitions<S extends AgentState, E extends StateEvent>(
    sm: StateMachine<S, E>
  ): void {
    sm.addTransition({ from: 'idle' as S, event: 'START' as E, to: 'planning' as S })
    sm.addTransition({ from: 'planning' as S, event: 'EXECUTE' as E, to: 'executing' as S })
    sm.addTransition({ from: 'executing' as S, event: 'REVIEW' as E, to: 'reviewing' as S })
    sm.addTransition({ from: 'reviewing' as S, event: 'COMPLETE' as E, to: 'done' as S })
    sm.addTransition({ from: 'reviewing' as S, event: 'RETRY' as E, to: 'planning' as S })
    sm.addTransition({ from: 'executing' as S, event: 'FAIL' as E, to: 'error' as S })
    sm.addTransition({ from: 'error' as S, event: 'RETRY' as E, to: 'planning' as S })
    sm.addTransition({ from: 'error' as S, event: 'RESET' as E, to: 'idle' as S })
    sm.addTransition({ from: 'done' as S, event: 'RESET' as E, to: 'idle' as S })
  }
}