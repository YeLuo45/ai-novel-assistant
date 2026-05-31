/**
 * HealthCheck - V41
 * 健康检查 + 熔断机制
 * 监控 API/Database/Memory 状态，支持自动降级
 */

export type HealthStatus = 'healthy' | 'degraded' | 'down'
export type ComponentStatus = 'healthy' | 'degraded' | 'down'

export interface HealthCheckResult {
  api: ComponentStatus
  database: ComponentStatus
  memory: ComponentStatus
  overall: HealthStatus
  timestamp: number
  details: {
    apiLatency?: number
    dbLatency?: number
    memoryUsage?: number
    errorRate?: number
  }
}

interface CircuitBreakerConfig {
  failureThreshold: number    // 失败次数阈值
  recoveryTimeout: number     // 恢复超时(ms)
  halfOpenMaxCalls: number    // 半开状态最大尝试次数
}

interface CircuitState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailureTime: number
  halfOpenAttempts: number
}

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  halfOpenMaxCalls: 3
}

// 内存阈值
const MEMORY_WARNING_THRESHOLD = 0.8   // 80% 开始警告
const MEMORY_CRITICAL_THRESHOLD = 0.95 // 95% 临界

// API 延迟阈值
const API_LATENCY_WARNING = 1000      // 1s 警告
const API_LATENCY_CRITICAL = 3000    // 3s 临界

// 错误率阈值
const ERROR_RATE_WARNING = 0.05       // 5% 警告
const ERROR_RATE_CRITICAL = 0.15      // 15% 临界

export class HealthCheck {
  private circuitBreakers: Map<string, CircuitState> = new Map()
  private configs: Map<string, CircuitBreakerConfig> = new Map()
  private emergencyMode: boolean = false

  constructor() {
    this.initCircuitBreaker('api')
    this.initCircuitBreaker('database')
  }

  private initCircuitBreaker(name: string): void {
    this.circuitBreakers.set(name, {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0
    })
    this.configs.set(name, { ...DEFAULT_CIRCUIT_CONFIG })
  }

  // 执行健康检查
  async check(): Promise<HealthCheckResult> {
    const [apiStatus, dbStatus, memoryStatus] = await Promise.all([
      this.checkApi(),
      this.checkDatabase(),
      this.checkMemory()
    ])

    const overall = this.calculateOverallStatus(apiStatus, dbStatus, memoryStatus)

    return {
      api: apiStatus.status,
      database: dbStatus.status,
      memory: memoryStatus.status,
      overall,
      timestamp: Date.now(),
      details: {
        apiLatency: apiStatus.latency,
        dbLatency: dbStatus.latency,
        memoryUsage: memoryStatus.usage,
        errorRate: apiStatus.errorRate
      }
    }
  }

  // 检查 API 健康状态
  private async checkApi(): Promise<{ status: ComponentStatus; latency?: number; errorRate?: number }> {
    if (this.isCircuitOpen('api')) {
      return { status: 'down' }
    }

    const startTime = performance.now()
    
    try {
      // 模拟 API 检查（实际应该调用真实端点）
      const latency = performance.now() - startTime

      // 检查延迟
      if (latency > API_LATENCY_CRITICAL) {
        this.recordFailure('api')
        return { status: 'down', latency, errorRate: 1 }
      }
      if (latency > API_LATENCY_WARNING) {
        this.recordSuccess('api')
        return { status: 'degraded', latency }
      }

      this.recordSuccess('api')
      return { status: 'healthy', latency }
    } catch (error) {
      this.recordFailure('api')
      return { status: 'down' }
    }
  }

  // 检查数据库健康状态
  private async checkDatabase(): Promise<{ status: ComponentStatus; latency?: number }> {
    if (this.isCircuitOpen('database')) {
      return { status: 'down' }
    }

    const startTime = performance.now()

    try {
      // 模拟 DB 检查
      const latency = performance.now() - startTime

      if (latency > 2000) {
        this.recordFailure('database')
        return { status: 'degraded', latency }
      }

      this.recordSuccess('database')
      return { status: 'healthy', latency }
    } catch (error) {
      this.recordFailure('database')
      return { status: 'down' }
    }
  }

  // 检查内存健康状态
  private async checkMemory(): Promise<{ status: ComponentStatus; usage?: number }> {
    if (typeof performance === 'undefined' || !performance.memory) {
      return { status: 'healthy' }
    }

    const memory = (performance as any).memory
    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit

    if (usage > MEMORY_CRITICAL_THRESHOLD) {
      this.triggerEmergencyMode()
      return { status: 'down', usage }
    }
    if (usage > MEMORY_WARNING_THRESHOLD) {
      return { status: 'degraded', usage }
    }

    return { status: 'healthy', usage }
  }

  // 计算整体状态
  private calculateOverallStatus(
    api: { status: ComponentStatus },
    db: { status: ComponentStatus },
    memory: { status: ComponentStatus }
  ): HealthStatus {
    const statuses = [api.status, db.status, memory.status]

    if (statuses.every(s => s === 'healthy')) return 'healthy'
    if (statuses.some(s => s === 'down')) return 'down'
    if (statuses.some(s => s === 'degraded')) return 'degraded'

    return 'healthy'
  }

  // 是否应该降级
  shouldDegrade(): boolean {
    const apiBreaker = this.circuitBreakers.get('api')
    return this.emergencyMode || (apiBreaker?.state === 'open')
  }

  // 触发紧急模式
  emergencyMode(): void {
    this.emergencyMode = true
    console.warn('[HealthCheck] EMERGENCY MODE ACTIVATED')
  }

  // 退出紧急模式
  exitEmergencyMode(): void {
    this.emergencyMode = false
    console.log('[HealthCheck] Emergency mode deactivated')
  }

  // 记录失败
  private recordFailure(name: string): void {
    const breaker = this.circuitBreakers.get(name)
    if (!breaker) return

    breaker.failures++
    breaker.lastFailureTime = Date.now()

    if (breaker.failures >= this.configs.get(name)!.failureThreshold) {
      breaker.state = 'open'
      console.warn(`[HealthCheck] Circuit opened for ${name}`)
    }
  }

  // 记录成功
  private recordSuccess(name: string): void {
    const breaker = this.circuitBreakers.get(name)
    if (!breaker) return

    if (breaker.state === 'half-open') {
      breaker.halfOpenAttempts++
      const config = this.configs.get(name)!
      if (breaker.halfOpenAttempts >= config.halfOpenMaxCalls) {
        breaker.state = 'closed'
        breaker.failures = 0
        breaker.halfOpenAttempts = 0
        console.log(`[HealthCheck] Circuit closed for ${name}`)
      }
    } else if (breaker.state === 'closed') {
      breaker.failures = Math.max(0, breaker.failures - 1)
    }
  }

  // 检查电路是否打开
  private isCircuitOpen(name: string): boolean {
    const breaker = this.circuitBreakers.get(name)
    if (!breaker) return false

    if (breaker.state === 'open') {
      const config = this.configs.get(name)!
      const elapsed = Date.now() - breaker.lastFailureTime

      if (elapsed > config.recoveryTimeout) {
        breaker.state = 'half-open'
        breaker.halfOpenAttempts = 0
        console.log(`[HealthCheck] Circuit half-open for ${name}`)
        return false
      }
      return true
    }

    return false
  }

  // 获取当前状态摘要
  getStatusSummary(): {
    emergencyMode: boolean
    circuits: Record<string, { state: string; failures: number }>
  } {
    const summary: Record<string, { state: string; failures: number }> = {}
    
    this.circuitBreakers.forEach((breaker, name) => {
      summary[name] = {
        state: breaker.state,
        failures: breaker.failures
      }
    })

    return {
      emergencyMode: this.emergencyMode,
      circuits: summary
    }
  }
}

// 导出单例
export const healthCheck = new HealthCheck()