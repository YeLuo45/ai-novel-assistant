/**
 * V558 MCPClientBridge Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MCPClientBridge, MCPClientBridgeConfig } from "./MCPClientBridge";
import { MCPServerConfig } from "./MCPClientBridgeEngine";

describe("V558 MCPClientBridge", () => {
  const createServerConfig = (): MCPServerConfig => ({
    id: "test-server",
    name: "Test MCP Server",
    command: "npx",
    args: ["mcp-server", "test"]
  });

  const createConfig = (): MCPClientBridgeConfig => ({
    serverConfig: createServerConfig(),
    transportType: "stdio",
    defaultTimeout: 5000,
    defaultRetries: 2,
    maxSessions: 5
  });

  let bridge: MCPClientBridge;

  beforeEach(() => {
    bridge = new MCPClientBridge(createConfig());
  });

  describe("constructor", () => {
    it("should create bridge with config", () => {
      expect(bridge).toBeDefined();
      expect(bridge.getStatus().initialized).toBe(false);
    });

    it("should initialize all components", () => {
      expect(bridge.getToolRegistry()).toBeDefined();
      expect(bridge.getSessionManager()).toBeDefined();
      expect(bridge.getToolExecutor()).toBeDefined();
      expect(bridge.getProtocolHandler()).toBeDefined();
    });
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      const result = await bridge.initialize();
      expect(result).toBe(true);
      expect(bridge.isInitialized()).toBe(true);
    });

    it("should not reinitialize if already initialized", async () => {
      await bridge.initialize();
      const result = await bridge.initialize();
      expect(result).toBe(true);
    });
  });

  describe("getStatus", () => {
    it("should return initial status", () => {
      const status = bridge.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.connected).toBe(false);
      expect(status.sessionCount).toBe(0);
      expect(status.toolCount).toBe(0);
      expect(status.totalCalls).toBe(0);
    });

    it("should return status after initialization", async () => {
      await bridge.initialize();
      const status = bridge.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.connected).toBe(true);
      expect(status.sessionCount).toBe(1);
    });
  });

  describe("callTool", () => {
    it("should throw when not initialized", async () => {
      await expect(bridge.callTool("test_tool")).rejects.toThrow("not initialized");
    });
  });

  describe("callMethod", () => {
    it("should throw when not initialized", async () => {
      await expect(bridge.callMethod("test.method")).rejects.toThrow("not initialized");
    });
  });

  describe("disconnect", () => {
    it("should disconnect successfully", async () => {
      await bridge.initialize();
      await bridge.disconnect();
      const status = bridge.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.connected).toBe(false);
    });

    it("should handle disconnect when not connected", async () => {
      await bridge.disconnect();
      // Should not throw
    });
  });

  describe("destroy", () => {
    it("should destroy all resources", async () => {
      await bridge.initialize();
      await bridge.destroy();
      const status = bridge.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.toolCount).toBe(0);
    });
  });

  describe("component access", () => {
    it("should return tool registry", () => {
      const registry = bridge.getToolRegistry();
      expect(registry).toBeDefined();
      expect(registry.isEmpty()).toBe(true);
    });

    it("should return session manager", () => {
      const manager = bridge.getSessionManager();
      expect(manager).toBeDefined();
      expect(manager.getSessionCount()).toBe(0);
    });

    it("should return tool executor", () => {
      const executor = bridge.getToolExecutor();
      expect(executor).toBeDefined();
      expect(executor.getRegisteredToolCount()).toBe(0);
    });

    it("should return protocol handler", () => {
      const handler = bridge.getProtocolHandler();
      expect(handler).toBeDefined();
      expect(handler.getVersion()).toBe("2.0");
    });
  });
});
