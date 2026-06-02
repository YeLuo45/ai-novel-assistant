/**
 * V557 MCPToolExecutor
 * MCP 工具执行器 - 执行 MCP 工具调用，支持超时和重试
 * 灵感来源: claude-code Tool System + thunderbolt MCP Client
 * 
 * 核心功能:
 * - 工具执行
 * - 超时控制
 * - 重试机制
 * - 执行统计
 */

import { MCPTool, MCPRequest, MCPResponse } from "./MCPClientBridgeEngine";

export interface ToolExecutionRequest {
  toolName: string;
  arguments: Record<string, unknown>;
  timeout?: number;
  retries?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  executionTime: number;
  attempts: number;
}

export interface ExecutionStats {
  toolName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalExecutionTime: number;
  avgExecutionTime: number;
  lastExecutedAt?: number;
}

export class MCPToolExecutor {
  private toolHandlers: Map<string, (args: Record<string, unknown>) => unknown> = new Map();
  private executionHistory: Array<{
    toolName: string;
    success: boolean;
    executionTime: number;
    timestamp: number;
  }> = [];
  private defaultTimeout: number = 30000;
  private defaultRetries: number = 3;
  private maxHistorySize: number = 1000;

  constructor(defaultTimeout?: number, defaultRetries?: number) {
    if (defaultTimeout) this.defaultTimeout = defaultTimeout;
    if (defaultRetries) this.defaultRetries = defaultRetries;
  }

  /**
   * 注册工具处理器
   */
  registerTool(name: string, handler: (args: Record<string, unknown>) => unknown): void {
    this.toolHandlers.set(name, handler);
  }

  /**
   * 批量注册工具
   */
  registerTools(tools: Record<string, (args: Record<string, unknown>) => unknown>): void {
    for (const [name, handler] of Object.entries(tools)) {
      this.registerTool(name, handler);
    }
  }

  /**
   * 执行工具
   */
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const { toolName, arguments: args, timeout, retries } = request;
    const actualTimeout = timeout ?? this.defaultTimeout;
    const actualRetries = retries ?? this.defaultRetries;

    const handler = this.toolHandlers.get(toolName);
    if (!handler) {
      return {
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool '${toolName}' not found`,
          retryable: false
        },
        executionTime: 0,
        attempts: 0
      };
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= actualRetries + 1; attempt++) {
      const attemptStartTime = Date.now();

      try {
        const result = await this.executeWithTimeout(handler, args, actualTimeout);

        const executionTime = Date.now() - startTime;
        this.recordExecution(toolName, true, executionTime);

        return {
          success: true,
          result,
          executionTime,
          attempts: attempt
        };
      } catch (error) {
        lastError = error as Error;
        const attemptTime = Date.now() - attemptStartTime;

        // Check if error is retryable
        if (!this.isRetryable(error) || attempt > actualRetries) {
          const executionTime = Date.now() - startTime;
          this.recordExecution(toolName, false, executionTime);

          return {
            success: false,
            error: {
              code: this.getErrorCode(error),
              message: lastError.message,
              retryable: this.isRetryable(error) && attempt <= actualRetries
            },
            executionTime,
            attempts: attempt
          };
        }

        // Wait before retry (exponential backoff)
        if (attempt <= actualRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 100);
        }
      }
    }

    // Should not reach here
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: lastError?.message ?? "Unknown error",
        retryable: false
      },
      executionTime: Date.now() - startTime,
      attempts: actualRetries + 1
    };
  }

  /**
   * 执行工具调用 (带超时)
   */
  private executeWithTimeout(
    handler: (args: Record<string, unknown>) => unknown,
    args: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = handler(args);
        clearTimeout(timeoutId);

        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 检查错误是否可重试
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors and timeouts are retryable
      const message = error.message.toLowerCase();
      return (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("econnreset") ||
        message.includes("etimedout")
      );
    }
    return false;
  }

  /**
   * 获取错误代码
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes("timeout")) return "TIMEOUT";
      if (message.includes("network")) return "NETWORK_ERROR";
      if (message.includes("not found")) return "NOT_FOUND";
      if (message.includes("permission")) return "PERMISSION_DENIED";
    }
    return "EXECUTION_ERROR";
  }

  /**
   * 睡眠工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录执行历史
   */
  private recordExecution(toolName: string, success: boolean, executionTime: number): void {
    this.executionHistory.push({
      toolName,
      success,
      executionTime,
      timestamp: Date.now()
    });

    // Trim history if needed
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * 获取执行统计
   */
  getStats(toolName: string): ExecutionStats | undefined {
    const history = this.executionHistory.filter(e => e.toolName === toolName);
    if (history.length === 0) return undefined;

    const totalCalls = history.length;
    const successfulCalls = history.filter(e => e.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalExecutionTime = history.reduce((sum, e) => sum + e.executionTime, 0);

    return {
      toolName,
      totalCalls,
      successfulCalls,
      failedCalls,
      totalExecutionTime,
      avgExecutionTime: totalExecutionTime / totalCalls,
      lastExecutedAt: history[history.length - 1]?.timestamp
    };
  }

  /**
   * 获取所有工具的统计
   */
  getAllStats(): ExecutionStats[] {
    const toolNames = new Set(this.executionHistory.map(e => e.toolName));
    const stats: ExecutionStats[] = [];

    for (const toolName of Array.from(toolNames)) {
      const toolStats = this.getStats(toolName);
      if (toolStats) {
        stats.push(toolStats);
      }
    }

    return stats;
  }

  /**
   * 获取最近执行历史
   */
  getRecentHistory(limit: number = 100): Array<{
    toolName: string;
    success: boolean;
    executionTime: number;
    timestamp: number;
  }> {
    return this.executionHistory.slice(-limit);
  }

  /**
   * 清空执行历史
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * 检查工具是否已注册
   */
  hasTool(name: string): boolean {
    return this.toolHandlers.has(name);
  }

  /**
   * 获取已注册工具数量
   */
  getRegisteredToolCount(): number {
    return this.toolHandlers.size;
  }

  /**
   * 列出所有已注册工具
   */
  listTools(): string[] {
    return Array.from(this.toolHandlers.keys());
  }

  /**
   * 移除工具
   */
  unregisterTool(name: string): boolean {
    return this.toolHandlers.delete(name);
  }
}

export default MCPToolExecutor;
