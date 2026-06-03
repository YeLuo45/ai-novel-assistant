/**
 * V560 MCPEvidenceCollector
 * MCP 证据收集器 - 收集 MCP 调用证据用于可追溯性和调试
 * 灵感来源: chatdev 角色 + claude-code 调试
 * 
 * 核心功能:
 * - 调用证据记录
 * - 参数/响应捕获
 * - 证据存储和检索
 * - 调试报告生成
 */

import { MCPTool } from "./MCPClientBridgeEngine";

export interface Evidence {
  id: string;
  timestamp: number;
  toolName: string;
  arguments: Record<string, unknown>;
  response?: unknown;
  error?: {
    code: string;
    message: string;
  };
  executionTime: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface EvidenceFilter {
  toolName?: string;
  startTime?: number;
  endTime?: number;
  success?: boolean;
  limit?: number;
}

export interface EvidenceSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
  toolsUsed: string[];
  firstCallAt?: number;
  lastCallAt?: number;
}

export interface MCPEvidenceCollectorOptions {
  maxEvidence: number;
  includeArguments: boolean;
  includeResponse: boolean;
  redactSensitiveData: boolean;
  sensitiveFields: string[];
}

export class MCPEvidenceCollector {
  private evidence: Evidence[] = [];
  private options: MCPEvidenceCollectorOptions;
  private idCounter: number = 0;

  constructor(options: Partial<MCPEvidenceCollectorOptions> = {}) {
    this.options = {
      maxEvidence: options.maxEvidence ?? 10000,
      includeArguments: options.includeArguments ?? true,
      includeResponse: options.includeResponse ?? true,
      redactSensitiveData: options.redactSensitiveData ?? true,
      sensitiveFields: options.sensitiveFields ?? ["password", "token", "apiKey", "secret", "credential"]
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    this.idCounter++;
    return `ev_${Date.now()}_${this.idCounter}`;
  }

  /**
   * 脱敏数据
   */
  private redact(data: Record<string, unknown>): Record<string, unknown> {
    if (!this.options.redactSensitiveData) {
      return data;
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = this.options.sensitiveFields.some(
        field => key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        redacted[key] = "***REDACTED***";
      } else if (typeof value === "object" && value !== null) {
        redacted[key] = this.redact(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  /**
   * 记录证据
   */
  record(params: {
    toolName: string;
    arguments?: Record<string, unknown>;
    response?: unknown;
    error?: { code: string; message: string };
    executionTime: number;
    success: boolean;
    metadata?: Record<string, unknown>;
  }): string {
    const id = this.generateId();

    const evidence: Evidence = {
      id,
      timestamp: Date.now(),
      toolName: params.toolName,
      arguments: this.options.includeArguments && params.arguments
        ? this.redact(params.arguments)
        : {},
      response: this.options.includeResponse && params.response
        ? params.response
        : undefined,
      error: params.error,
      executionTime: params.executionTime,
      success: params.success,
      metadata: params.metadata
    };

    this.evidence.push(evidence);

    // Trim if exceeds max
    if (this.evidence.length > this.options.maxEvidence) {
      this.evidence = this.evidence.slice(-this.options.maxEvidence);
    }

    return id;
  }

  /**
   * 获取证据
   */
  get(id: string): Evidence | undefined {
    return this.evidence.find(e => e.id === id);
  }

  /**
   * 获取最近的证据
   */
  getRecent(limit: number = 100): Evidence[] {
    return this.evidence.slice(-limit);
  }

  /**
   * 过滤证据
   */
  filter(filter: EvidenceFilter): Evidence[] {
    let result = this.evidence;

    if (filter.toolName) {
      result = result.filter(e => e.toolName === filter.toolName);
    }

    if (filter.startTime !== undefined) {
      result = result.filter(e => e.timestamp >= filter.startTime!);
    }

    if (filter.endTime !== undefined) {
      result = result.filter(e => e.timestamp <= filter.endTime!);
    }

    if (filter.success !== undefined) {
      result = result.filter(e => e.success === filter.success);
    }

    if (filter.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * 获取摘要
   */
  getSummary(): EvidenceSummary {
    const totalCalls = this.evidence.length;
    const successfulCalls = this.evidence.filter(e => e.success).length;
    const failedCalls = totalCalls - successfulCalls;

    const totalExecutionTime = this.evidence.reduce(
      (sum, e) => sum + e.executionTime,
      0
    );

    const toolsUsed = [...new Set(this.evidence.map(e => e.toolName))];

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageExecutionTime: totalCalls > 0 ? totalExecutionTime / totalCalls : 0,
      toolsUsed,
      firstCallAt: this.evidence[0]?.timestamp,
      lastCallAt: this.evidence[this.evidence.length - 1]?.timestamp
    };
  }

  /**
   * 按工具名统计
   */
  getStatsByTool(): Map<string, {
    count: number;
    successCount: number;
    failedCount: number;
    avgExecutionTime: number;
  }> {
    const stats = new Map<string, {
      count: number;
      successCount: number;
      failedCount: number;
      avgExecutionTime: number;
    }>();

    for (const e of this.evidence) {
      const existing = stats.get(e.toolName) ?? {
        count: 0,
        successCount: 0,
        failedCount: 0,
        avgExecutionTime: 0,
        totalExecutionTime: 0
      };

      existing.count++;
      if (e.success) {
        existing.successCount++;
      } else {
        existing.failedCount++;
      }
      existing.totalExecutionTime = (existing.totalExecutionTime || 0) + e.executionTime;
      existing.avgExecutionTime = existing.totalExecutionTime / existing.count;

      stats.set(e.toolName, existing);
    }

    // Convert to return format (remove internal totalExecutionTime)
    const result = new Map<string, {
      count: number;
      successCount: number;
      failedCount: number;
      avgExecutionTime: number;
    }>();

    for (const [name, data] of stats.entries()) {
      const { totalExecutionTime: _, ...rest } = data;
      result.set(name, rest);
    }

    return result;
  }

  /**
   * 生成调试报告
   */
  generateReport(filter?: EvidenceFilter): string {
    const evidence = filter ? this.filter(filter) : this.evidence;
    const summary = this.getSummary();

    let report = "=== MCP Evidence Report ===\n\n";
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Evidence Count: ${evidence.length}\n\n`;

    report += "--- Summary ---\n";
    report += `Total Calls: ${summary.totalCalls}\n`;
    report += `Successful: ${summary.successfulCalls}\n`;
    report += `Failed: ${summary.failedCalls}\n`;
    report += `Avg Execution Time: ${summary.averageExecutionTime.toFixed(2)}ms\n`;
    report += `Tools Used: ${summary.toolsUsed.join(", ") || "none"}\n\n";

    if (summary.firstCallAt) {
      report += `First Call: ${new Date(summary.firstCallAt).toISOString()}\n`;
    }
    if (summary.lastCallAt) {
      report += `Last Call: ${new Date(summary.lastCallAt).toISOString()}\n`;
    }

    report += "\n--- Recent Failures ---\n";
    const failures = evidence.filter(e => !e.success).slice(-10);
    if (failures.length === 0) {
      report += "No failures\n";
    } else {
      for (const f of failures) {
        report += `[${new Date(f.timestamp).toISOString()}] ${f.toolName}\n`;
        report += `  Error: ${f.error?.message || "Unknown"}\n`;
        report += `  Execution Time: ${f.executionTime}ms\n`;
      }
    }

    return report;
  }

  /**
   * 清除证据
   */
  clear(): void {
    this.evidence = [];
  }

  /**
   * 清除旧证据
   */
  clearOlderThan(timestamp: number): number {
    const initialCount = this.evidence.length;
    this.evidence = this.evidence.filter(e => e.timestamp >= timestamp);
    return initialCount - this.evidence.length;
  }

  /**
   * 获取证据数量
   */
  getCount(): number {
    return this.evidence.length;
  }

  /**
   * 导出证据
   */
  export(): Evidence[] {
    return [...this.evidence];
  }

  /**
   * 导入证据
   */
  import(evidence: Evidence[]): number {
    const initialCount = this.evidence.length;
    this.evidence.push(...evidence);

    // Trim if exceeds max
    if (this.evidence.length > this.options.maxEvidence) {
      this.evidence = this.evidence.slice(-this.options.maxEvidence);
    }

    return this.evidence.length - initialCount;
  }

  /**
   * 获取配置
   */
  getOptions(): MCPEvidenceCollectorOptions {
    return { ...this.options };
  }
}

export default MCPEvidenceCollector;