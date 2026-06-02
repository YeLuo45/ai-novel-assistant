/**
 * V553 MCPSessionManager Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MCPSessionManager, MCPSessionManagerOptions } from "./MCPSessionManager";
import { MCPServerConfig } from "./MCPClientBridgeEngine";

describe("V553 MCPSessionManager", () => {
  const createMockServerConfig = (id: string = "test-server"): MCPServerConfig => ({
    id,
    name: `Server ${id}`,
    command: "npx",
    args: ["mcp-server", id]
  });

  const createManager = (options?: Partial<MCPSessionManagerOptions>) => {
    return new MCPSessionManager(options);
  };

  describe("constructor", () => {
    it("should create manager with default options", () => {
      const manager = createManager();
      expect(manager).toBeDefined();
      expect(manager.getSessionCount()).toBe(0);
    });

    it("should create manager with custom options", () => {
      const manager = createManager({
        maxSessions: 5,
        defaultMaxInactiveTime: 60000,
        maxReconnectAttempts: 5,
        cleanupInterval: 30000
      });
      expect(manager).toBeDefined();
      expect(manager.getSessionCount()).toBe(0);
    });

    it("should use default values for undefined options", () => {
      const manager = createManager({ maxSessions: 3 });
      expect(manager).toBeDefined();
      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe("createSession", () => {
    it("should create a new session", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      expect(session).toBeDefined();
      expect(session.serverId).toBe("test-server");
      expect(session.state).toBe("active");
      expect(manager.getSessionCount()).toBe(1);
    });

    it("should create session with priority", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config, 5);

      expect(session.priority).toBe(5);
    });

    it("should auto-evict when max sessions reached", () => {
      const manager = createManager({ maxSessions: 2 });
      const config1 = createMockServerConfig("server1");
      const config2 = createMockServerConfig("server2");
      const config3 = createMockServerConfig("server3");

      manager.createSession(config1, 1);
      manager.createSession(config2, 2);
      manager.createSession(config3, 3);

      // First session should be evicted (lowest priority)
      expect(manager.getSessionCount()).toBe(2);
    });

    it("should preserve server config", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      const savedConfig = manager.getServerConfig(session.id);
      expect(savedConfig).toBeDefined();
      expect(savedConfig?.id).toBe("test-server");
    });

    it("should track session creation time", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const before = Date.now();
      const session = manager.createSession(config);
      const after = Date.now();

      expect(session.createdAt).toBeGreaterThanOrEqual(before);
      expect(session.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe("getSession", () => {
    it("should return session by id", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      const found = manager.getSession(session.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(session.id);
    });

    it("should return undefined for non-existent session", () => {
      const manager = createManager();
      const found = manager.getSession("non-existent");
      expect(found).toBeUndefined();
    });
  });

  describe("touchSession", () => {
    it("should update lastActiveAt", async () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);
      const originalLastActive = session.lastActiveAt;

      await new Promise(r => setTimeout(r, 10));
      manager.touchSession(session.id);

      const updated = manager.getSession(session.id);
      expect(updated!.lastActiveAt).toBeGreaterThan(originalLastActive);
    });

    it("should return false for non-existent session", () => {
      const manager = createManager();
      const result = manager.touchSession("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("updateSessionState", () => {
    it("should update state to idle", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      manager.updateSessionState(session.id, "idle");
      const updated = manager.getSession(session.id);
      expect(updated?.state).toBe("idle");
    });

    it("should update state to reconnecting", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      manager.updateSessionState(session.id, "reconnecting");
      const updated = manager.getSession(session.id);
      expect(updated?.state).toBe("reconnecting");
    });

    it("should return false for non-existent session", () => {
      const manager = createManager();
      const result = manager.updateSessionState("non-existent", "idle");
      expect(result).toBe(false);
    });
  });

  describe("getAllSessions", () => {
    it("should return empty array when no sessions", () => {
      const manager = createManager();
      const sessions = manager.getAllSessions();
      expect(sessions).toEqual([]);
    });

    it("should return all sessions", () => {
      const manager = createManager();
      manager.createSession(createMockServerConfig("s1"));
      manager.createSession(createMockServerConfig("s2"));
      manager.createSession(createMockServerConfig("s3"));

      const sessions = manager.getAllSessions();
      expect(sessions).toHaveLength(3);
    });
  });

  describe("getSessionsByPriority", () => {
    it("should return sessions sorted by priority descending", () => {
      const manager = createManager();
      manager.createSession(createMockServerConfig("s1"), 1);
      manager.createSession(createMockServerConfig("s2"), 3);
      manager.createSession(createMockServerConfig("s3"), 2);

      const sorted = manager.getSessionsByPriority();
      expect(sorted[0].priority).toBe(3);
      expect(sorted[1].priority).toBe(2);
      expect(sorted[2].priority).toBe(1);
    });
  });

  describe("closeSession", () => {
    it("should remove session", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      expect(manager.getSessionCount()).toBe(1);
      manager.closeSession(session.id);
      expect(manager.getSessionCount()).toBe(0);
    });

    it("should return true when session existed", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      const result = manager.closeSession(session.id);
      expect(result).toBe(true);
    });

    it("should return false when session did not exist", () => {
      const manager = createManager();
      const result = manager.closeSession("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("closeAllSessions", () => {
    it("should remove all sessions", () => {
      const manager = createManager();
      manager.createSession(createMockServerConfig("s1"));
      manager.createSession(createMockServerConfig("s2"));
      manager.createSession(createMockServerConfig("s3"));

      expect(manager.getSessionCount()).toBe(3);
      manager.closeAllSessions();
      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe("isSessionExpired", () => {
    it("should return false for active session", () => {
      const manager = createManager({ defaultMaxInactiveTime: 60000 });
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      expect(manager.isSessionExpired(session)).toBe(false);
    });

    it("should return true for session past max inactive time", async () => {
      const manager = createManager({ defaultMaxInactiveTime: 10 });
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      await new Promise(r => setTimeout(r, 20));
      expect(manager.isSessionExpired(session)).toBe(true);
    });
  });

  describe("getExpiredSessions", () => {
    it("should return empty when no expired sessions", () => {
      const manager = createManager({ defaultMaxInactiveTime: 60000 });
      manager.createSession(createMockServerConfig());
      const expired = manager.getExpiredSessions();
      expect(expired).toHaveLength(0);
    });

    it("should return expired sessions", async () => {
      const manager = createManager({ defaultMaxInactiveTime: 10 });
      manager.createSession(createMockServerConfig());
      await new Promise(r => setTimeout(r, 20));
      const expired = manager.getExpiredSessions();
      expect(expired.length).toBeGreaterThan(0);
    });
  });

  describe("reconnect handling", () => {
    it("should increment reconnect attempts", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      expect(session.reconnectAttempts).toBe(0);
      manager.incrementReconnectAttempts(session.id);
      const updated = manager.getSession(session.id);
      expect(updated?.reconnectAttempts).toBe(1);
    });

    it("should check canReconnect correctly", () => {
      const manager = createManager({ maxReconnectAttempts: 2 });
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      expect(manager.canReconnect(session.id)).toBe(true);
      manager.incrementReconnectAttempts(session.id);
      expect(manager.canReconnect(session.id)).toBe(true);
      manager.incrementReconnectAttempts(session.id);
      expect(manager.canReconnect(session.id)).toBe(false);
    });

    it("should reset reconnect attempts", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      manager.incrementReconnectAttempts(session.id);
      manager.incrementReconnectAttempts(session.id);
      manager.resetReconnectAttempts(session.id);

      const updated = manager.getSession(session.id);
      expect(updated?.reconnectAttempts).toBe(0);
    });
  });

  describe("getStats", () => {
    it("should return correct stats", () => {
      const manager = createManager();
      manager.createSession(createMockServerConfig("s1"), 1);
      manager.createSession(createMockServerConfig("s2"), 2);
      manager.createSession(createMockServerConfig("s3"), 3);

      const stats = manager.getStats();
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(3);
      expect(stats.idle).toBe(0);
      expect(stats.reconnecting).toBe(0);
      expect(stats.disconnected).toBe(0);
    });

    it("should show priority distribution", () => {
      const manager = createManager();
      manager.createSession(createMockServerConfig("s1"), 1);
      manager.createSession(createMockServerConfig("s2"), 1);
      manager.createSession(createMockServerConfig("s3"), 2);

      const stats = manager.getStats();
      expect(stats.byPriority).toHaveLength(2);
      expect(stats.byPriority.find(p => p.priority === 1)?.count).toBe(2);
      expect(stats.byPriority.find(p => p.priority === 2)?.count).toBe(1);
    });

    it("should show correct state counts", () => {
      const manager = createManager();
      const s1 = manager.createSession(createMockServerConfig("s1"));
      manager.createSession(createMockServerConfig("s2"));
      manager.createSession(createMockServerConfig("s3"));

      manager.updateSessionState(s1.id, "idle");
      const stats = manager.getStats();
      expect(stats.active).toBe(2);
      expect(stats.idle).toBe(1);
    });
  });

  describe("setSessionMaxInactiveTime", () => {
    it("should update max inactive time", () => {
      const manager = createManager();
      const config = createMockServerConfig();
      const session = manager.createSession(config);

      manager.setSessionMaxInactiveTime(session.id, 120000);
      const updated = manager.getSession(session.id);
      expect(updated?.maxInactiveTime).toBe(120000);
    });

    it("should return false for non-existent session", () => {
      const manager = createManager();
      const result = manager.setSessionMaxInactiveTime("non-existent", 60000);
      expect(result).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should clean up expired non-active sessions", async () => {
      const manager = createManager({ defaultMaxInactiveTime: 10, cleanupInterval: 999999 });
      const active = manager.createSession(createMockServerConfig("active"));
      const idle = manager.createSession(createMockServerConfig("idle"));

      manager.updateSessionState(idle.id, "idle");
      await new Promise(r => setTimeout(r, 20));

      const cleaned = manager.cleanup();
      expect(cleaned).toBe(1);
      expect(manager.getSession(active.id)).toBeDefined();
      expect(manager.getSession(idle.id)).toBeUndefined();
    });

    it("should not clean up active sessions", async () => {
      const manager = createManager({ defaultMaxInactiveTime: 10, cleanupInterval: 999999 });
      manager.createSession(createMockServerConfig());
      await new Promise(r => setTimeout(r, 20));

      const cleaned = manager.cleanup();
      expect(cleaned).toBe(0);
    });
  });

  describe("destroy", () => {
    it("should stop cleanup and close all sessions", () => {
      const manager = createManager({ cleanupInterval: 1000 });
      manager.createSession(createMockServerConfig());
      manager.createSession(createMockServerConfig());

      expect(manager.getSessionCount()).toBe(2);
      manager.destroy();
      expect(manager.getSessionCount()).toBe(0);
    });
  });
});
