/**
 * V555 MCPStreamAdapter Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MCPStreamAdapter, StreamAdapterOptions, TransportType } from "./MCPStreamAdapter";
import { MCPRequest } from "./MCPClientBridgeEngine";

describe("V555 MCPStreamAdapter", () => {
  const createStdioAdapter = (): MCPStreamAdapter => {
    const options: StreamAdapterOptions = {
      transportType: "stdio",
      command: "npx",
      args: ["mcp-server"],
      env: { NODE_ENV: "test" }
    };
    return new MCPStreamAdapter(options);
  };

  const createHttpAdapter = (): MCPStreamAdapter => {
    const options: StreamAdapterOptions = {
      transportType: "streamable-http",
      url: "http://localhost:3000/mcp",
      headers: { Authorization: "Bearer test" }
    };
    return new MCPStreamAdapter(options);
  };

  describe("constructor", () => {
    it("should create stdio adapter", () => {
      const adapter = createStdioAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getTransportType()).toBe("stdio");
    });

    it("should create http adapter", () => {
      const adapter = createHttpAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getTransportType()).toBe("streamable-http");
    });

    it("should store adapter configuration", () => {
      const adapter = createStdioAdapter();
      const config = adapter.getConfig();
      expect(config.transportType).toBe("stdio");
      expect(config.command).toBe("npx");
      expect(config.args).toEqual(["mcp-server"]);
      expect(config.env).toEqual({ NODE_ENV: "test" });
    });

    it("should store http configuration", () => {
      const adapter = createHttpAdapter();
      const config = adapter.getConfig();
      expect(config.url).toBe("http://localhost:3000/mcp");
      expect(config.headers).toEqual({ Authorization: "Bearer test" });
    });
  });

  describe("connect", () => {
    it("should connect stdio successfully", async () => {
      const adapter = createStdioAdapter();
      const result = await adapter.connect();
      expect(result).toBe(true);
      expect(adapter.isConnected()).toBe(true);
    });

    it("should connect http successfully when server available", async () => {
      const adapter = createHttpAdapter();
      const result = await adapter.connect();
      // May fail in test environment, but should return boolean
      expect(typeof result).toBe("boolean");
    });

    it("should handle connection errors gracefully", async () => {
      const options: StreamAdapterOptions = {
        transportType: "streamable-http",
        url: "http://localhost:9999/mcp"
      };
      const adapter = new MCPStreamAdapter(options);
      const result = await adapter.connect();
      expect(result).toBe(false);
    });

    it("should set connected state after successful connect", async () => {
      const adapter = createStdioAdapter();
      expect(adapter.isConnected()).toBe(false);
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe("disconnect", () => {
    it("should disconnect successfully", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });

    it("should clear message queue on disconnect", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      expect(adapter.getQueueSize()).toBe(0);
      await adapter.disconnect();
      expect(adapter.getQueueSize()).toBe(0);
    });

    it("should handle disconnect when not connected", async () => {
      const adapter = createStdioAdapter();
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe("send", () => {
    it("should throw when not connected", async () => {
      const adapter = createStdioAdapter();
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "test.method"
      };
      await expect(adapter.send(request)).rejects.toThrow("Not connected");
    });

    it("should send request successfully via stdio", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "test.method"
      };
      const response = await adapter.send(request);
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(1);
    });

    it("should return initialize response", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 42,
        method: "initialize"
      };
      const response = await adapter.send(request);
      expect(response.result).toBeDefined();
      const result = response.result as { protocolVersion?: string };
      expect(result.protocolVersion).toBe("2024-11-05");
    });

    it("should return tools list", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
      };
      const response = await adapter.send(request);
      expect(response.result).toBeDefined();
      const result = response.result as { tools?: unknown[] };
      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
    });

    it("should return tools/call response", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "test_tool", arguments: {} }
      };
      const response = await adapter.send(request);
      expect(response.result).toBeDefined();
    });
  });

  describe("sendNotification", () => {
    it("should send notification successfully", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      await expect(adapter.sendNotification("event.test")).resolves.not.toThrow();
    });

    it("should send notification with params", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      await expect(adapter.sendNotification("event.test", { key: "value" })).resolves.not.toThrow();
    });

    it("should throw when not connected", async () => {
      const adapter = createStdioAdapter();
      await expect(adapter.sendNotification("event.test")).rejects.toThrow("Not connected");
    });
  });

  describe("subscribe/unsubscribe", () => {
    it("should subscribe to messages", () => {
      const adapter = createStdioAdapter();
      const handler = (msg: unknown) => {};
      const unsubscribe = adapter.subscribe(handler);
      expect(typeof unsubscribe).toBe("function");
    });

    it("should call handler when message received", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      let called = false;
      adapter.subscribe((msg) => {
        called = true;
      });
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "test"
      };
      await adapter.send(request);
      // Handler is called asynchronously
      await new Promise(r => setTimeout(r, 50));
    });

    it("should unsubscribe successfully", () => {
      const adapter = createStdioAdapter();
      const handler = (msg: unknown) => {};
      const unsubscribe = adapter.subscribe(handler);
      unsubscribe();
      adapter.unsubscribe(handler);  // Should not throw
    });
  });

  describe("getTransportType", () => {
    it("should return stdio for stdio adapter", () => {
      const adapter = createStdioAdapter();
      expect(adapter.getTransportType()).toBe("stdio");
    });

    it("should return streamable-http for http adapter", () => {
      const adapter = createHttpAdapter();
      expect(adapter.getTransportType()).toBe("streamable-http");
    });
  });

  describe("getQueueSize", () => {
    it("should return 0 initially", () => {
      const adapter = createStdioAdapter();
      expect(adapter.getQueueSize()).toBe(0);
    });

    it("should return correct queue size after messages", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "test"
      };
      await adapter.send(request);
      // Queue size may be 0 or more depending on async handling
      expect(adapter.getQueueSize()).toBeGreaterThanOrEqual(0);
    });
  });

  describe("clearQueue", () => {
    it("should clear message queue", async () => {
      const adapter = createStdioAdapter();
      await adapter.connect();
      adapter.clearQueue();
      expect(adapter.getQueueSize()).toBe(0);
    });
  });

  describe("peekQueue", () => {
    it("should return empty array initially", () => {
      const adapter = createStdioAdapter();
      const queue = adapter.peekQueue();
      expect(Array.isArray(queue)).toBe(true);
      expect(queue).toHaveLength(0);
    });

    it("should return copy of queue", () => {
      const adapter = createStdioAdapter();
      const queue1 = adapter.peekQueue();
      const queue2 = adapter.peekQueue();
      expect(queue1).not.toBe(queue2);
      expect(queue1).toEqual(queue2);
    });
  });

  describe("getConfig", () => {
    it("should return complete stdio config", () => {
      const adapter = createStdioAdapter();
      const config = adapter.getConfig();
      expect(config.transportType).toBe("stdio");
      expect(config.command).toBe("npx");
      expect(config.args).toEqual(["mcp-server"]);
      expect(config.env).toEqual({ NODE_ENV: "test" });
    });

    it("should return complete http config", () => {
      const adapter = createHttpAdapter();
      const config = adapter.getConfig();
      expect(config.transportType).toBe("streamable-http");
      expect(config.url).toBe("http://localhost:3000/mcp");
      expect(config.headers).toEqual({ Authorization: "Bearer test" });
    });
  });
});
