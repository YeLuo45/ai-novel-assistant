/**
 * V558 MCPClientBridge
 * MCP 客户端桥接门面 - 整合所有 MCP 组件提供一个统一接口
 * 灵感来源: ruflo Facade Pattern + nanobot MessageBus
 * 
 * 核心功能:
 * - 统一的客户端接口
 * - 组件整合
 * - 生命周期管理
 */

import { MCPServerConfig } from "./MCPClientBridgeEngine";
import { MCPClientBridgeEngine } from "./MCPClientBridgeEngine";
import { MCPSessionManager } from "./MCPSessionManager";
import { MCPProtocolHandler } from "./MCPProtocolHandler";
import { MCPStreamAdapter } from "./MCPStreamAdapter";
import { MCPToolRegistry } from "./MCPToolRegistry";
import { MCPToolExecutor } from "./MCPToolExecutor";

export interface MCPClientBridgeConfig {
  serverConfig: MCPServerConfig;
  transportType: "stdio" | "streamable-http";
  defaultTimeout?: number;
  defaultRetries?: number;
  maxSessions?: number;
}

export interface BridgeStatus {
  initialized: boolean;
  connected: boolean;
  sessionCount: number;
  toolCount: number;
  totalCalls: number;
}

export class MCPClientBridge {
  private config: MCPClientBridgeConfig;
  private bridgeEngine: MCPClientBridgeEngine;
  private sessionManager: MCPSessionManager;
  private protocolHandler: MCPProtocolHandler;
  private streamAdapter: MCPStreamAdapter;
  private toolRegistry: MCPToolRegistry;
  private toolExecutor: MCPToolExecutor;
  private initialized: boolean = false;
  private totalCalls: number = 0;

  constructor(config: MCPClientBridgeConfig) {
    this.config = config;

    // Initialize components
    this.bridgeEngine = new MCPClientBridgeEngine({
      serverConfig: config.serverConfig,
      transportType: config.transportType,
      timeout: config.defaultTimeout ?? 30000,
      maxRetries: config.defaultRetries ?? 3
    });

    this.sessionManager = new MCPSessionManager({
      maxSessions: config.maxSessions ?? 10,
      defaultMaxInactiveTime: 300000
    });

    this.protocolHandler = new MCPProtocolHandler();
    this.streamAdapter = new MCPStreamAdapter({
      transportType: config.transportType,
      command: config.serverConfig.command,
      args: config.serverConfig.args,
      env: config.serverConfig.env,
      url: config.serverConfig.url
    });

    this.toolRegistry = new MCPToolRegistry();
    this.toolExecutor = new MCPToolExecutor(
      config.defaultTimeout ?? 30000,
      config.defaultRetries ?? 3
    );
  }

  /**
   * 初始化客户端
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Connect to server
      const connected = await this.bridgeEngine.connect();
      if (!connected) {
        return false;
      }

      // Create session
      this.sessionManager.createSession(this.config.serverConfig, 10);

      // Discover tools
      await this.discoverTools();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize MCP Client Bridge:", error);
      return false;
    }
  }

  /**
   * 发现可用工具
   */
  private async discoverTools(): Promise<void> {
    try {
      const response = await this.bridgeEngine.sendRequest("tools/list");
      const result = response as { tools?: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> };

      if (result.tools) {
        for (const tool of result.tools) {
          this.toolRegistry.register({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          });

          // Register tool handler
          this.toolExecutor.registerTool(tool.name, async (args) => {
            const callResponse = await this.bridgeEngine.sendRequest("tools/call", {
              name: tool.name,
              arguments: args
            });
            return callResponse;
          });
        }
      }
    } catch (error) {
      console.error("Failed to discover tools:", error);
    }
  }

  /**
   * 调用工具
   */
  async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.initialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const result = await this.toolExecutor.execute({
      toolName,
      arguments: args
    });

    this.totalCalls++;

    if (!result.success) {
      throw new Error(result.error?.message ?? "Tool execution failed");
    }

    return result.result;
  }

  /**
   * 调用 MCP 方法
   */
  async callMethod(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.initialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    this.totalCalls++;
    return this.bridgeEngine.sendRequest(method, params);
  }

  /**
   * 获取桥接状态
   */
  getStatus(): BridgeStatus {
    return {
      initialized: this.initialized,
      connected: this.bridgeEngine.isConnected(),
      sessionCount: this.sessionManager.getSessionCount(),
      toolCount: this.toolRegistry.getTotalCount(),
      totalCalls: this.totalCalls
    };
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取工具注册表
   */
  getToolRegistry(): MCPToolRegistry {
    return this.toolRegistry;
  }

  /**
   * 获取会话管理器
   */
  getSessionManager(): MCPSessionManager {
    return this.sessionManager;
  }

  /**
   * 获取工具执行器
   */
  getToolExecutor(): MCPToolExecutor {
    return this.toolExecutor;
  }

  /**
   * 获取协议处理器
   */
  getProtocolHandler(): MCPProtocolHandler {
    return this.protocolHandler;
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    await this.bridgeEngine.disconnect();
    this.sessionManager.closeAllSessions();
    this.initialized = false;
  }

  /**
   * 销毁客户端
   */
  async destroy(): Promise<void> {
    await this.disconnect();
    this.toolRegistry.clear();
    this.toolExecutor.clearHistory();
  }
}

export default MCPClientBridge;
