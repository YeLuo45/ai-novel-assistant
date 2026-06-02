/**
 * V555 MCPStreamAdapter
 * MCP 流适配器 - 处理 stdio 和 streamable-http 传输层适配
 * 灵感来源: thunderbolt MCP Client + nanobot Channel Adapter
 * 
 * 核心功能:
 * - stdio 传输适配
 * - streamable-http 传输适配
 * - 消息流处理
 * - 连接状态管理
 */

import { MCPRequest, MCPResponse } from "./MCPClientBridgeEngine";

export type TransportType = "stdio" | "streamable-http";

export interface StreamAdapterOptions {
  transportType: TransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface StreamMessage {
  type: "request" | "response" | "notification" | "error";
  data: unknown;
  timestamp: number;
}

export class MCPStreamAdapter {
  private transportType: TransportType;
  private command?: string;
  private args?: string[];
  private env?: Record<string, string>;
  private url?: string;
  private headers?: Record<string, string>;
  private connected: boolean = false;
  private messageHandlers: Set<(message: StreamMessage) => void> = new Set();
  private messageQueue: StreamMessage[] = [];
  private processStdin: WritableStream<string> | null = null;
  private processStdout: ReadableStream<string> | null = null;

  constructor(options: StreamAdapterOptions) {
    this.transportType = options.transportType;
    this.command = options.command;
    this.args = options.args;
    this.env = options.env;
    this.url = options.url;
    this.headers = options.headers;
  }

  /**
   * 连接到传输层
   */
  async connect(): Promise<boolean> {
    try {
      if (this.transportType === "stdio") {
        return this.connectStdio();
      } else {
        return this.connectHttp();
      }
    } catch (error) {
      console.error("Stream adapter connection failed:", error);
      return false;
    }
  }

  private async connectStdio(): Promise<boolean> {
    // In browser environment, we simulate stdio
    // Real implementation would spawn a child process
    this.connected = true;
    return true;
  }

  private async connectHttp(): Promise<boolean> {
    if (!this.url) {
      throw new Error("URL is required for streamable-http transport");
    }

    try {
      const response = await fetch(this.url, {
        method: "GET",
        headers: this.headers
      });
      this.connected = response.ok;
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.messageQueue = [];
  }

  /**
   * 发送消息
   */
  async send(request: MCPRequest): Promise<MCPResponse> {
    if (!this.connected) {
      throw new Error("Not connected");
    }

    if (this.transportType === "stdio") {
      return this.sendStdio(request);
    } else {
      return this.sendHttp(request);
    }
  }

  private async sendStdio(request: MCPRequest): Promise<MCPResponse> {
    // Simulate stdio send
    const response = this.simulateResponse(request);
    this.emitMessage({
      type: "response",
      data: response,
      timestamp: Date.now()
    });
    return response;
  }

  private async sendHttp(request: MCPRequest): Promise<MCPResponse> {
    if (!this.url) {
      throw new Error("URL is required for HTTP transport");
    }

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.headers
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();
      const mcpResponse = data as MCPResponse;

      this.emitMessage({
        type: "response",
        data: mcpResponse,
        timestamp: Date.now()
      });

      return mcpResponse;
    } catch (error) {
      const errorResponse: MCPResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: `HTTP transport error: ${(error as Error).message}`
        }
      };
      this.emitMessage({
        type: "error",
        data: errorResponse,
        timestamp: Date.now()
      });
      return errorResponse;
    }
  }

  /**
   * 发送通知 (无响应期望)
   */
  async sendNotification(method: string, params?: Record<string, unknown>): Promise<void> {
    if (!this.connected) {
      throw new Error("Not connected");
    }

    this.emitMessage({
      type: "notification",
      data: { method, params },
      timestamp: Date.now()
    });
  }

  /**
   * 订阅消息
   */
  subscribe(handler: (message: StreamMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * 取消订阅
   */
  unsubscribe(handler: (message: StreamMessage) => void): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取传输类型
   */
  getTransportType(): TransportType {
    return this.transportType;
  }

  /**
   * 获取待处理消息数量
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * 清空消息队列
   */
  clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * 获取队列中的消息
   */
  peekQueue(): StreamMessage[] {
    return [...this.messageQueue];
  }

  /**
   * 发送消息到处理器
   */
  private emitMessage(message: StreamMessage): void {
    this.messageQueue.push(message);
    for (const handler of Array.from(this.messageHandlers)) {
      try {
        handler(message);
      } catch (error) {
        console.error("Message handler error:", error);
      }
    }
  }

  /**
   * 模拟响应
   */
  private simulateResponse(request: MCPRequest): MCPResponse {
    // Simulate network delay
    const delay = 10 + Math.random() * 20;
    const start = Date.now();
    while (Date.now() - start < delay) {}

    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id!,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {} },
            serverInfo: { name: "MCP Server", version: "1.0.0" }
          }
        };
      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id!,
          result: {
            tools: [
              { name: "tool1", description: "Test tool 1", inputSchema: {} },
              { name: "tool2", description: "Test tool 2", inputSchema: {} }
            ]
          }
        };
      case "tools/call":
        return {
          jsonrpc: "2.0",
          id: request.id!,
          result: {
            content: [{ type: "text", text: "Tool executed successfully" }]
          }
        };
      default:
        return {
          jsonrpc: "2.0",
          id: request.id!,
          result: { success: true }
        };
    }
  }

  /**
   * 获取适配器配置
   */
  getConfig(): StreamAdapterOptions {
    return {
      transportType: this.transportType,
      command: this.command,
      args: this.args,
      env: this.env,
      url: this.url,
      headers: this.headers
    };
  }
}

export default MCPStreamAdapter;
