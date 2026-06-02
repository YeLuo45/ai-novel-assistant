/**
 * V556 MCPToolRegistry
 * MCP 工具注册表 - 管理 MCP 工具的注册、发现和调用
 * 灵感来源: claude-code ToolRegistry + nanobot Tool Registry
 * 
 * 核心功能:
 * - 工具注册与注销
 * - 工具发现
 * - 工具元数据管理
 * - 调用统计
 */

import { MCPTool } from "./MCPClientBridgeEngine";

export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  version?: string;
  tags?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
}

export interface ToolRegistration {
  metadata: ToolMetadata;
  handler?: (...args: unknown[]) => unknown;
  enabled: boolean;
  callCount: number;
  lastCalledAt?: number;
  createdAt: number;
}

export interface MCPToolRegistryOptions {
  allowDuplicates: boolean;
  validateSchema: boolean;
}

export class MCPToolRegistry {
  private tools: Map<string, ToolRegistration> = new Map();
  private options: MCPToolRegistryOptions;

  constructor(options: Partial<MCPToolRegistryOptions> = {}) {
    this.options = {
      allowDuplicates: options.allowDuplicates ?? false,
      validateSchema: options.validateSchema ?? true
    };
  }

  /**
   * 注册工具
   */
  register(metadata: ToolMetadata, handler?: (...args: unknown[]) => unknown): boolean {
    const existingTool = this.tools.get(metadata.name);

    if (existingTool && !this.options.allowDuplicates) {
      return false;
    }

    if (this.options.validateSchema && metadata.inputSchema) {
      if (typeof metadata.inputSchema !== "object") {
        throw new Error("inputSchema must be an object");
      }
    }

    const registration: ToolRegistration = {
      metadata,
      handler,
      enabled: true,
      callCount: 0,
      createdAt: Date.now()
    };

    this.tools.set(metadata.name, registration);
    return true;
  }

  /**
   * 批量注册工具
   */
  registerBatch(tools: ToolMetadata[], handler?: (...args: unknown[]) => unknown): number {
    let successCount = 0;
    for (const tool of tools) {
      if (this.register(tool, handler)) {
        successCount++;
      }
    }
    return successCount;
  }

  /**
   * 注销工具
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * 获取工具
   */
  get(name: string): ToolMetadata | undefined {
    return this.tools.get(name)?.metadata;
  }

  /**
   * 获取工具注册信息
   */
  getRegistration(name: string): ToolRegistration | undefined {
    return this.tools.get(name);
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 列出所有工具
   */
  listTools(): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(reg => reg.enabled)
      .map(reg => reg.metadata);
  }

  /**
   * 列出所有工具 (包括禁用的)
   */
  listAllTools(): ToolMetadata[] {
    return Array.from(this.tools.values()).map(reg => reg.metadata);
  }

  /**
   * 获取启用的工具数量
   */
  getEnabledCount(): number {
    return Array.from(this.tools.values()).filter(reg => reg.enabled).length;
  }

  /**
   * 获取总工具数量
   */
  getTotalCount(): number {
    return this.tools.size;
  }

  /**
   * 启用工具
   */
  enable(name: string): boolean {
    const reg = this.tools.get(name);
    if (reg) {
      reg.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * 禁用工具
   */
  disable(name: string): boolean {
    const reg = this.tools.get(name);
    if (reg) {
      reg.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * 检查工具是否启用
   */
  isEnabled(name: string): boolean {
    return this.tools.get(name)?.enabled ?? false;
  }

  /**
   * 标记工具被调用
   */
  recordCall(name: string): boolean {
    const reg = this.tools.get(name);
    if (reg) {
      reg.callCount++;
      reg.lastCalledAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 获取工具调用统计
   */
  getStats(name: string): { callCount: number; lastCalledAt?: number } | undefined {
    const reg = this.tools.get(name);
    if (reg) {
      return {
        callCount: reg.callCount,
        lastCalledAt: reg.lastCalledAt
      };
    }
    return undefined;
  }

  /**
   * 获取所有工具的调用统计
   */
  getAllStats(): Map<string, { callCount: number; lastCalledAt?: number }> {
    const stats = new Map<string, { callCount: number; lastCalledAt?: number }>();
    for (const [name, reg] of Array.from(this.tools.entries())) {
      stats.set(name, {
        callCount: reg.callCount,
        lastCalledAt: reg.lastCalledAt
      });
    }
    return stats;
  }

  /**
   * 按标签搜索工具
   */
  searchByTag(tag: string): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(reg => reg.enabled && reg.metadata.tags?.includes(tag))
      .map(reg => reg.metadata);
  }

  /**
   * 按名称前缀搜索工具
   */
  searchByPrefix(prefix: string): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(reg => reg.enabled && reg.metadata.name.startsWith(prefix))
      .map(reg => reg.metadata);
  }

  /**
   * 搜索工具
   */
  search(query: string): ToolMetadata[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values())
      .filter(reg => reg.enabled)
      .filter(reg => {
        const name = reg.metadata.name.toLowerCase();
        const description = reg.metadata.description.toLowerCase();
        return name.includes(lowerQuery) || description.includes(lowerQuery);
      })
      .map(reg => reg.metadata);
  }

  /**
   * 获取最常调用的工具
   */
  getMostCalled(limit: number = 10): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(reg => reg.enabled)
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, limit)
      .map(reg => reg.metadata);
  }

  /**
   * 获取最近调用的工具
   */
  getRecentlyCalled(limit: number = 10): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(reg => reg.enabled && reg.lastCalledAt !== undefined)
      .sort((a, b) => (b.lastCalledAt ?? 0) - (a.lastCalledAt ?? 0))
      .slice(0, limit)
      .map(reg => reg.metadata);
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * 获取所有标签
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    for (const reg of Array.from(this.tools.values())) {
      if (reg.metadata.tags) {
        for (const tag of reg.metadata.tags) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags);
  }

  /**
   * 获取工具的调用者数量
   */
  getCallCountTotal(): number {
    let total = 0;
    for (const reg of Array.from(this.tools.values())) {
      total += reg.callCount;
    }
    return total;
  }

  /**
   * 检查是否有任何工具
   */
  isEmpty(): boolean {
    return this.tools.size === 0;
  }
}

export default MCPToolRegistry;
