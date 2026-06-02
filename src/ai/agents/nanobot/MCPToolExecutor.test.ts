/**
 * V557 MCPToolExecutor Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MCPToolExecutor, ToolExecutionRequest } from "./MCPToolExecutor";

describe("V557 MCPToolExecutor", () => {
  let executor: MCPToolExecutor;

  beforeEach(() => {
    executor = new MCPToolExecutor(5000, 2);
  });

  describe("constructor", () => {
    it("should create executor with default options", () => {
      const exec = new MCPToolExecutor();
      expect(exec).toBeDefined();
    });

    it("should create executor with custom timeout and retries", () => {
      const exec = new MCPToolExecutor(10000, 5);
      expect(exec).toBeDefined();
    });
  });

  describe("registerTool", () => {
    it("should register a tool", () => {
      executor.registerTool("test_tool", () => "result");
      expect(executor.hasTool("test_tool")).toBe(true);
    });

    it("should register multiple tools", () => {
      executor.registerTools({
        tool1: () => "result1",
        tool2: () => "result2"
      });
      expect(executor.hasTool("tool1")).toBe(true);
      expect(executor.hasTool("tool2")).toBe(true);
    });

    it("should allow overwriting tool", () => {
      executor.registerTool("test_tool", () => "result1");
      executor.registerTool("test_tool", () => "result2");
      expect(executor.hasTool("test_tool")).toBe(true);
    });
  });

  describe("execute", () => {
    it("should execute registered tool successfully", async () => {
      executor.registerTool("test_tool", (args) => `Hello ${args.name}`);
      const request: ToolExecutionRequest = {
        toolName: "test_tool",
        arguments: { name: "World" }
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(true);
      expect(result.result).toBe("Hello World");
    });

    it("should return error for non-existent tool", async () => {
      const request: ToolExecutionRequest = {
        toolName: "non_existent",
        arguments: {}
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TOOL_NOT_FOUND");
    });

    it("should track execution time", async () => {
      executor.registerTool("slow_tool", async () => {
        await new Promise(r => setTimeout(r, 50));
        return "done";
      });
      const request: ToolExecutionRequest = {
        toolName: "slow_tool",
        arguments: {}
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(50);
    });

    it("should track attempts", async () => {
      executor.registerTool("test_tool", () => "result");
      const request: ToolExecutionRequest = {
        toolName: "test_tool",
        arguments: {}
      };
      const result = await executor.execute(request);
      expect(result.attempts).toBe(1);
    });

    it("should handle async tool", async () => {
      executor.registerTool("async_tool", async () => {
        await new Promise(r => setTimeout(r, 10));
        return "async result";
      });
      const request: ToolExecutionRequest = {
        toolName: "async_tool",
        arguments: {}
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(true);
      expect(result.result).toBe("async result");
    });

    it("should handle tool that throws", async () => {
      executor.registerTool("failing_tool", () => {
        throw new Error("Tool failed");
      });
      const request: ToolExecutionRequest = {
        toolName: "failing_tool",
        arguments: {}
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Tool failed");
    });
  });

  describe("retry logic", () => {
    it("should retry on network errors", async () => {
      let attempts = 0;
      executor.registerTool("retry_tool", () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error("network error");
          (error as Error & { code: string }).code = "NETWORK_ERROR";
          throw error;
        }
        return "success";
      });
      const request: ToolExecutionRequest = {
        toolName: "retry_tool",
        arguments: {},
        retries: 3
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it("should not retry on non-retryable errors", async () => {
      executor.registerTool("fatal_tool", () => {
        throw new Error("Permission denied");
      });
      const request: ToolExecutionRequest = {
        toolName: "fatal_tool",
        arguments: {},
        retries: 3
      };
      const result = await executor.execute(request);
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should return stats for executed tool", async () => {
      executor.registerTool("test_tool", () => "result");
      await executor.execute({ toolName: "test_tool", arguments: {} });
      const stats = executor.getStats("test_tool");
      expect(stats).toBeDefined();
      expect(stats?.totalCalls).toBe(1);
      expect(stats?.successfulCalls).toBe(1);
      expect(stats?.failedCalls).toBe(0);
    });

    it("should return undefined for non-executed tool", () => {
      const stats = executor.getStats("non_existent");
      expect(stats).toBeUndefined();
    });

    it("should track failed calls", async () => {
      executor.registerTool("failing_tool", () => {
        throw new Error("Failed");
      });
      await executor.execute({ toolName: "failing_tool", arguments: {} }).catch(() => {});
      const stats = executor.getStats("failing_tool");
      expect(stats?.failedCalls).toBe(1);
    });
  });

  describe("getAllStats", () => {
    it("should return stats for all tools", async () => {
      executor.registerTool("tool1", () => "result1");
      executor.registerTool("tool2", () => "result2");
      await executor.execute({ toolName: "tool1", arguments: {} });
      await executor.execute({ toolName: "tool2", arguments: {} });

      const allStats = executor.getAllStats();
      expect(allStats).toHaveLength(2);
    });
  });

  describe("getRecentHistory", () => {
    it("should return recent execution history", async () => {
      executor.registerTool("test_tool", () => "result");
      await executor.execute({ toolName: "test_tool", arguments: {} });

      const history = executor.getRecentHistory(10);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].toolName).toBe("test_tool");
    });

    it("should limit history size", async () => {
      executor.registerTool("test_tool", () => "result");
      for (let i = 0; i < 150; i++) {
        await executor.execute({ toolName: "test_tool", arguments: {} });
      }

      const history = executor.getRecentHistory(10);
      expect(history.length).toBeLessThanOrEqual(100);  // maxHistorySize
    });
  });

  describe("clearHistory", () => {
    it("should clear execution history", async () => {
      executor.registerTool("test_tool", () => "result");
      await executor.execute({ toolName: "test_tool", arguments: {} });
      executor.clearHistory();
      const history = executor.getRecentHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe("listTools", () => {
    it("should list registered tools", () => {
      executor.registerTool("tool1", () => "result1");
      executor.registerTool("tool2", () => "result2");
      const tools = executor.listTools();
      expect(tools).toContain("tool1");
      expect(tools).toContain("tool2");
    });
  });

  describe("unregisterTool", () => {
    it("should unregister tool", () => {
      executor.registerTool("test_tool", () => "result");
      executor.unregisterTool("test_tool");
      expect(executor.hasTool("test_tool")).toBe(false);
    });

    it("should return false when tool not found", () => {
      const result = executor.unregisterTool("non_existent");
      expect(result).toBe(false);
    });
  });

  describe("getRegisteredToolCount", () => {
    it("should return correct count", () => {
      expect(executor.getRegisteredToolCount()).toBe(0);
      executor.registerTool("tool1", () => "result");
      expect(executor.getRegisteredToolCount()).toBe(1);
      executor.registerTool("tool2", () => "result");
      expect(executor.getRegisteredToolCount()).toBe(2);
    });
  });
});
