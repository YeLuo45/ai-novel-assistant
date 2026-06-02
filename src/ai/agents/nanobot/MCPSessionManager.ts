/**
 * V553 MCPSessionManager
 * MCP 会话管理器 - 管理多个 MCP 服务器会话生命周期
 * 灵感来源: nanobot MessageBus + claude-code Tool System
 * 
 * 核心功能:
 * - 多会话管理
 * - 会话优先级
 * - 自动重连
 * - 会话驱逐策略
 */

import { MCPServerConfig } from "./MCPClientBridgeEngine";

export interface MCPSession {
  id: string;
  serverId: string;
  createdAt: number;
  lastActiveAt: number;
  priority: number;
  maxInactiveTime: number;  // ms
  state: "active" | "idle" | "reconnecting" | "disconnected";
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface MCPSessionManagerOptions {
  maxSessions: number;
  defaultMaxInactiveTime: number;
  maxReconnectAttempts: number;
  cleanupInterval: number;
}

export class MCPSessionManager {
  private sessions: Map<string, MCPSession> = new Map();
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private options: MCPSessionManagerOptions;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private sessionCounter: number = 0;

  constructor(options: Partial<MCPSessionManagerOptions> = {}) {
    this.options = {
      maxSessions: options.maxSessions ?? 10,
      defaultMaxInactiveTime: options.defaultMaxInactiveTime ?? 300000,  // 5 minutes
      maxReconnectAttempts: options.maxReconnectAttempts ?? 3,
      cleanupInterval: options.cleanupInterval ?? 60000  // 1 minute
    };
    this.startCleanupTimer();
  }

  /**
   * 创建新会话
   */
  createSession(serverConfig: MCPServerConfig, priority: number = 0): MCPSession {
    // Check if we need to evict old sessions
    if (this.sessions.size >= this.options.maxSessions) {
      this.evictOldestSession();
    }

    const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;
    const session: MCPSession = {
      id: sessionId,
      serverId: serverConfig.id,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      priority,
      maxInactiveTime: this.options.defaultMaxInactiveTime,
      state: "active",
      reconnectAttempts: 0,
      maxReconnectAttempts: this.options.maxReconnectAttempts
    };

    this.sessions.set(sessionId, session);
    this.serverConfigs.set(sessionId, serverConfig);

    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): MCPSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 更新会话活跃时间
   */
  touchSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActiveAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 更新会话状态
   */
  updateSessionState(sessionId: string, state: MCPSession["state"]): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = state;
      return true;
    }
    return false;
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): MCPSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 按优先级排序的会话
   */
  getSessionsByPriority(): MCPSession[] {
    return this.getAllSessions().sort((a, b) => b.priority - a.priority);
  }

  /**
   * 关闭会话
   */
  closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 关闭所有会话
   */
  closeAllSessions(): void {
    this.sessions.clear();
    this.serverConfigs.clear();
  }

  /**
   * 获取会话数量
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 检查会话是否过期
   */
  isSessionExpired(session: MCPSession): boolean {
    const now = Date.now();
    return (now - session.lastActiveAt) > session.maxInactiveTime;
  }

  /**
   * 获取过期会话
   */
  getExpiredSessions(): MCPSession[] {
    return this.getAllSessions().filter(s => this.isSessionExpired(s));
  }

  /**
   * 驱逐最老的低优先级会话
   */
  private evictOldestSession(): boolean {
    // First try to find idle sessions
    const idleSessions = this.getAllSessions()
      .filter(s => s.state === "idle")
      .sort((a, b) => a.lastActiveAt - b.lastActiveAt);

    if (idleSessions.length > 0) {
      return this.closeSession(idleSessions[0].id);
    }

    // If no idle sessions, find lowest priority active session
    const activeSessions = this.getAllSessions()
      .filter(s => s.state === "active")
      .sort((a, b) => {
        // First sort by priority (lower first), then by lastActiveAt (older first)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.lastActiveAt - b.lastActiveAt;
      });

    if (activeSessions.length > 0) {
      return this.closeSession(activeSessions[0].id);
    }

    return false;
  }

  /**
   * 增加重连尝试次数
   */
  incrementReconnectAttempts(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.reconnectAttempts++;
      return true;
    }
    return false;
  }

  /**
   * 检查是否可以重连
   */
  canReconnect(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return session.reconnectAttempts < session.maxReconnectAttempts;
  }

  /**
   * 重置重连计数
   */
  resetReconnectAttempts(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.reconnectAttempts = 0;
      return true;
    }
    return false;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * 清理过期会话
   */
  cleanup(): number {
    const expiredSessions = this.getExpiredSessions();
    let cleanedCount = 0;

    for (const session of expiredSessions) {
      if (session.state !== "active") {
        this.closeSession(session.id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 停止清理定时器
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 获取会话统计
   */
  getStats(): {
    total: number;
    active: number;
    idle: number;
    reconnecting: number;
    disconnected: number;
    byPriority: { priority: number; count: number }[];
  } {
    const sessions = this.getAllSessions();
    const byPriorityMap = new Map<number, number>();

    for (const session of sessions) {
      const count = byPriorityMap.get(session.priority) ?? 0;
      byPriorityMap.set(session.priority, count + 1);
    }

    return {
      total: sessions.length,
      active: sessions.filter(s => s.state === "active").length,
      idle: sessions.filter(s => s.state === "idle").length,
      reconnecting: sessions.filter(s => s.state === "reconnecting").length,
      disconnected: sessions.filter(s => s.state === "disconnected").length,
      byPriority: Array.from(byPriorityMap.entries())
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => a.priority - b.priority)
    };
  }

  /**
   * 设置会话最大不活跃时间
   */
  setSessionMaxInactiveTime(sessionId: string, maxInactiveTime: number): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.maxInactiveTime = maxInactiveTime;
      return true;
    }
    return false;
  }

  /**
   * 获取服务器配置
   */
  getServerConfig(sessionId: string): MCPServerConfig | undefined {
    return this.serverConfigs.get(sessionId);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopCleanup();
    this.closeAllSessions();
  }
}

export default MCPSessionManager;
