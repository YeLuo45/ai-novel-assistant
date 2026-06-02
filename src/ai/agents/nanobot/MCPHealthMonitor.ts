/**
 * V559 MCPHealthMonitor
 * MCP 健康监控器 - 监控 MCP 连接健康状态和性能指标
 * 灵感来源: thunderbolt PowerSync + nanobot 监控
 * 
 * 核心功能:
 * - 连接健康检查
 * - 性能指标收集
 * - 健康状态报告
 * - 自动恢复触发
 */

export interface HealthMetrics {
  latency: number;
  successRate: number;
  errorRate: number;
  lastCheckAt: number;
  uptime: number;
}

export interface HealthStatus {
  healthy: boolean;
  score: number;  // 0-100
  status: "excellent" | "good" | "degraded" | "unhealthy";
  metrics: HealthMetrics;
  issues: string[];
}

export interface HealthCheckConfig {
  checkInterval: number;
  timeout: number;
  unhealthyThreshold: number;
  degradedThreshold: number;
}

export class MCPHealthMonitor {
  private config: HealthCheckConfig;
  private lastCheckAt: number = 0;
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private successCount: number = 0;
  private errorCount: number = 0;
  private recentLatencies: number[] = [];
  private maxLatencySamples: number = 100;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private onStatusChange?: (status: HealthStatus) => void;

  constructor(
    config: Partial<HealthCheckConfig> = {},
    onStatusChange?: (status: HealthStatus) => void
  ) {
    this.config = {
      checkInterval: config.checkInterval ?? 30000,  // 30 seconds
      timeout: config.timeout ?? 5000,
      unhealthyThreshold: config.unhealthyThreshold ?? 50,  // score below 50 is unhealthy
      degradedThreshold: config.degradedThreshold ?? 75   // score below 75 is degraded
    };
    this.onStatusChange = onStatusChange;
  }

  /**
   * 记录请求
   */
  recordRequest(latency: number, success: boolean): void {
    this.requestCount++;
    this.recentLatencies.push(latency);

    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }

    // Trim latency samples
    if (this.recentLatencies.length > this.maxLatencySamples) {
      this.recentLatencies.shift();
    }
  }

  /**
   * 获取健康状态
   */
  getStatus(): HealthStatus {
    const metrics = this.getMetrics();
    const issues: string[] = [];

    // Calculate score based on metrics
    let score = 100;

    // Deduct for high latency
    if (metrics.latency > 1000) {
      score -= 30;
      issues.push("High latency detected");
    } else if (metrics.latency > 500) {
      score -= 15;
      issues.push("Moderate latency");
    }

    // Deduct for errors
    if (metrics.errorRate > 0.1) {
      score -= 40;
      issues.push("High error rate");
    } else if (metrics.errorRate > 0.05) {
      score -= 20;
      issues.push("Elevated error rate");
    }

    // Deduct for low success rate
    if (metrics.successRate < 0.8) {
      score -= 30;
      issues.push("Low success rate");
    }

    score = Math.max(0, Math.min(100, score));

    let status: HealthStatus["status"];
    if (score >= 90) {
      status = "excellent";
    } else if (score >= this.config.degradedThreshold) {
      status = "good";
    } else if (score >= this.config.unhealthyThreshold) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    return {
      healthy: status !== "unhealthy",
      score,
      status,
      metrics,
      issues
    };
  }

  /**
   * 获取性能指标
   */
  getMetrics(): HealthMetrics {
    const avgLatency = this.recentLatencies.length > 0
      ? this.recentLatencies.reduce((a, b) => a + b, 0) / this.recentLatencies.length
      : 0;

    return {
      latency: Math.round(avgLatency),
      successRate: this.requestCount > 0 ? this.successCount / this.requestCount : 1,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      lastCheckAt: this.lastCheckAt,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 执行健康检查
   */
  async checkHealth(checkFn: () => Promise<boolean>): Promise<HealthStatus> {
    this.lastCheckAt = Date.now();

    try {
      const start = Date.now();
      const result = await Promise.race([
        checkFn(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), this.config.timeout)
        )
      ]);

      const latency = Date.now() - start;
      this.recordRequest(latency, result);
    } catch {
      this.recordRequest(this.config.timeout, false);
    }

    return this.getStatus();
  }

  /**
   * 启动定期健康检查
   */
  startPeriodicCheck(checkFn: () => Promise<boolean>): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(async () => {
      const prevStatus = this.getStatus();
      await this.checkHealth(checkFn);
      const newStatus = this.getStatus();

      if (prevStatus.status !== newStatus.status && this.onStatusChange) {
        this.onStatusChange(newStatus);
      }
    }, this.config.checkInterval);
  }

  /**
   * 停止定期健康检查
   */
  stopPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.recentLatencies = [];
    this.lastCheckAt = 0;
    this.startTime = Date.now();
  }

  /**
   * 获取请求计数
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * 获取成功计数
   */
  getSuccessCount(): number {
    return this.successCount;
  }

  /**
   * 获取错误计数
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * 获取运行时间
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 获取配置
   */
  getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  /**
   * 检查是否健康
   */
  isHealthy(): boolean {
    return this.getStatus().healthy;
  }

  /**
   * 获取历史延迟样本
   */
  getLatencyHistory(): number[] {
    return [...this.recentLatencies];
  }

  /**
   * 获取平均延迟
   */
  getAverageLatency(): number {
    if (this.recentLatencies.length === 0) return 0;
    return this.recentLatencies.reduce((a, b) => a + b, 0) / this.recentLatencies.length;
  }

  /**
   * 获取最大延迟
   */
  getMaxLatency(): number {
    if (this.recentLatencies.length === 0) return 0;
    return Math.max(...this.recentLatencies);
  }

  /**
   * 获取最小延迟
   */
  getMinLatency(): number {
    if (this.recentLatencies.length === 0) return 0;
    return Math.min(...this.recentLatencies);
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.stopPeriodicCheck();
    this.reset();
  }
}

export default MCPHealthMonitor;
