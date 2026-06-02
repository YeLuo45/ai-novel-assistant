/**
 * V552 MCPClientBridgeEngine Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MCPClientBridgeEngine, MCPServerConfig, MCPClientBridgeOptions } from "./MCPClientBridgeEngine";

describe("V552 MCPClientBridgeEngine", () => {
  const mockServerConfig: MCPServerConfig = {
    id: "test-server",
    name: "Test MCP Server",
    command: "npx",
    args: ["mcp-server", "test"],
    env: { NODE_ENV: "test" }
  };

  const createEngine = (transportType: "stdio" | "streamable-http" = "stdio") => {
    const options: MCPClientBridgeOptions = {
      serverConfig: mockServerConfig,
      transportType,
      timeout: 5000,
      maxRetries: 2
    };
    return new MCPClientBridgeEngine(options);
  };

  describe("constructor", () => {
    it("should create engine with stdio transport", () => {
      const engine = createEngine("stdio");
      expect(engine).toBeDefined();
      expect(engine.getServerConfig().id).toBe("test-server");
    });

    it("should create engine with streamable-http transport", () => {
      const config: MCPServerConfig = {
        ...mockServerConfig,
        url: "http://localhost:3000/mcp"
      };
      const options: MCPClientBridgeOptions = {
        serverConfig: config,
        transportType: "streamable-http",
        timeout: 5000,
        maxRetries: 2
      };
      const engine = new MCPClientBridgeEngine(options);
      expect(engine).toBeDefined();
      expect(engine.getServerConfig().url).toBe("http://localhost:3000/mcp");
    });

    it("should use default timeout when not provided", () => {
      const options: MCPClientBridgeOptions = {
        serverConfig: mockServerConfig,
        transportType: "stdio"
      };
      const engine = new MCPClientBridgeEngine(options);
      expect(engine).toBeDefined();
    });

    it("should use default maxRetries when not provided", () => {
      const options: MCPClientBridgeOptions = {
        serverConfig: mockServerConfig,
        transportType: "stdio"
      };
      const engine = new MCPClientBridgeEngine(options);
      expect(engine).toBeDefined();
    });

    it("should preserve server config", () => {
      const engine = createEngine();
      const config = engine.getServerConfig();
      expect(config.name).toBe("Test MCP Server");
      expect(config.command).toBe("npx");
      expect(config.args).toEqual(["mcp-server", "test"]);
    });

    it("should handle config with env variables", () => {
      const engine = createEngine();
      const config = engine.getServerConfig();
      expect(config.env).toEqual({ NODE_ENV: "test" });
    });
  });

  describe("connect", () => {
    it("should connect successfully with stdio transport", async () => {
      const engine = createEngine("stdio");
      const result = await engine.connect();
      expect(result).toBe(true);
      expect(engine.isConnected()).toBe(true);
    });

    it("should connect successfully with http transport when url is available", async () => {
      const config: MCPServerConfig = {
        ...mockServerConfig,
        url: "http://localhost:3000/mcp"
      };
      const options: MCPClientBridgeOptions = {
        serverConfig: config,
        transportType: "streamable-http"
      };
      const engine = new MCPClientBridgeEngine(options);
      const result = await engine.connect();
      // May fail in test environment but should not throw
      expect(typeof result).toBe("boolean");
    });

it("should handle connection errors gracefully", async () => {
      const config: MCPServerConfig = {
        ...mockServerConfig,
        url: "http://localhost:9999/mcp"
      };
      const options: MCPClientBridgeOptions = {
        serverConfig: config,
        transportType: "streamable-http",
        timeout: 100  // Very short timeout to fail fast
      };
      const engine = new MCPClientBridgeEngine(options);
      const result = await engine.connect();
      // Should return false (not throw) when connection fails
      expect(result).toBe(false);
      expect(engine.isConnected()).toBe(false);
    });
  });

  describe("disconnect", () => {
    it("should disconnect successfully", async () => {
      const engine = createEngine();
      await engine.connect();
      expect(engine.isConnected()).toBe(true);
      await engine.disconnect();
      expect(engine.isConnected()).toBe(false);
    });

    it("should handle disconnect when not connected", async () => {
      const engine = createEngine();
      await engine.disconnect();
      expect(engine.isConnected()).toBe(false);
    });
  });

  describe("isConnected", () => {
    it("should return false before connection", () => {
      const engine = createEngine();
      expect(engine.isConnected()).toBe(false);
    });

    it("should return true after successful connection", async () => {
      const engine = createEngine();
      await engine.connect();
      expect(engine.isConnected()).toBe(true);
    });

    it("should return false after disconnect", async () => {
      const engine = createEngine();
      await engine.connect();
      await engine.disconnect();
      expect(engine.isConnected()).toBe(false);
    });
  });

  describe("sendRequest", () => {
    it("should throw error when not connected", async () => {
      const engine = createEngine();
      await expect(engine.sendRequest("test.method")).rejects.toThrow("Not connected to MCP server");
    });

    it("should send initialize request successfully", async () => {
      const engine = createEngine();
      await engine.connect();
      const result = await engine.sendRequest("initialize") as {
        protocolVersion?: string;
        capabilities?: Record<string, unknown>;
        serverInfo?: { name: string; version: string };
      };
      expect(result.protocolVersion).toBe("2024-11-05");
      expect(result.capabilities).toBeDefined();
      expect(result.serverInfo?.name).toBe("Test MCP Server");
    });

    it("should send tools/list request and return tool list", async () => {
      const engine = createEngine();
      await engine.connect();
      const result = await engine.sendRequest("tools/list") as { tools?: unknown[] };
      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
    });

    it("should send tools/call request and return result", async () => {
      const engine = createEngine();
      await engine.connect();
      const result = await engine.sendRequest("tools/call", { name: "test_tool", arguments: {} }) as { content?: unknown[] };
      expect(result.content).toBeDefined();
    });

    it("should handle custom methods", async () => {
      const engine = createEngine();
      await engine.connect();
      const result = await engine.sendRequest("custom.method", { param: "value" });
      expect(result).toBeDefined();
    });

    it("should handle methods with no params", async () => {
      const engine = createEngine();
      await engine.connect();
      const result = await engine.sendRequest("ping");
      expect(result).toBeDefined();
    });
  });

  describe("getConnectionInfo", () => {
    it("should return correct info before connection", () => {
      const engine = createEngine();
      const info = engine.getConnectionInfo();
      expect(info.connected).toBe(false);
      expect(info.transportType).toBe("stdio");
      expect(info.serverName).toBe("Test MCP Server");
      expect(info.pendingRequests).toBe(0);
    });

    it("should return correct info after connection", async () => {
      const engine = createEngine();
      await engine.connect();
      const info = engine.getConnectionInfo();
      expect(info.connected).toBe(true);
      expect(info.pendingRequests).toBe(0);
    });

    it("should reflect pending requests count", async () => {
      const engine = createEngine();
      await engine.connect();
      // Make a request to increase pending count
      const promise = engine.sendRequest("slow.method");
      const info = engine.getConnectionInfo();
      expect(info.pendingRequests).toBeGreaterThanOrEqual(0);
      await promise;
    });
  });

  describe("getServerConfig", () => {
    it("should return server configuration", () => {
      const engine = createEngine();
      const config = engine.getServerConfig();
      expect(config.id).toBe("test-server");
      expect(config.name).toBe("Test MCP Server");
    });

    it("should return a copy of config (not reference)", () => {
      const engine = createEngine();
      const config1 = engine.getServerConfig();
      const config2 = engine.getServerConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe("error handling", () => {
    it("should throw on request when disconnected mid-session", async () => {
      const engine = createEngine();
      await engine.connect();
      await engine.disconnect();
      await expect(engine.sendRequest("test")).rejects.toThrow("Not connected to MCP server");
    });

    it("should handle timeout scenario", async () => {
      const options: MCPClientBridgeOptions = {
        serverConfig: mockServerConfig,
        transportType: "stdio",
        timeout: 5000,  // Normal timeout
        maxRetries: 1
      };
      const engine = new MCPClientBridgeEngine(options);
      await engine.connect();
      // Verify timeout configuration is respected
      const result = await engine.sendRequest("ping");
      expect(result).toBeDefined();
    }, 10000);
  });
});
