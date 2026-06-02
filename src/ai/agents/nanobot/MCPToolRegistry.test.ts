/**
 * V556 MCPToolRegistry Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MCPToolRegistry, ToolMetadata } from "./MCPToolRegistry";

describe("V556 MCPToolRegistry", () => {
  let registry: MCPToolRegistry;

  const createTool = (name: string, description: string = "Test tool"): ToolMetadata => ({
    name,
    description,
    inputSchema: { type: "object" },
    version: "1.0.0",
    tags: ["test"]
  });

  beforeEach(() => {
    registry = new MCPToolRegistry();
  });

  describe("constructor", () => {
    it("should create registry with default options", () => {
      const reg = new MCPToolRegistry();
      expect(reg).toBeDefined();
      expect(reg.isEmpty()).toBe(true);
    });

    it("should create registry with custom options", () => {
      const reg = new MCPToolRegistry({ allowDuplicates: true, validateSchema: false });
      expect(reg).toBeDefined();
    });
  });

  describe("register", () => {
    it("should register a tool", () => {
      const tool = createTool("test_tool");
      const result = registry.register(tool);
      expect(result).toBe(true);
      expect(registry.has("test_tool")).toBe(true);
    });

    it("should register tool with handler", () => {
      const tool = createTool("test_tool");
      const handler = () => "result";
      registry.register(tool, handler);
      const reg = registry.getRegistration("test_tool");
      expect(reg?.handler).toBeDefined();
    });

    it("should reject duplicate tool without allowDuplicates", () => {
      const tool = createTool("test_tool");
      registry.register(tool);
      const result = registry.register(tool);
      expect(result).toBe(false);
    });

    it("should allow duplicate tool with allowDuplicates", () => {
      const reg = new MCPToolRegistry({ allowDuplicates: true });
      const tool = createTool("test_tool");
      reg.register(tool);
      const result = reg.register(tool);
      expect(result).toBe(true);
    });

    it("should throw on invalid schema", () => {
      const tool: ToolMetadata = {
        name: "test_tool",
        description: "Test",
        inputSchema: "invalid" as unknown as Record<string, unknown>
      };
      expect(() => registry.register(tool)).toThrow("inputSchema must be an object");
    });

    it("should not throw on invalid schema when validateSchema is false", () => {
      const reg = new MCPToolRegistry({ validateSchema: false });
      const tool: ToolMetadata = {
        name: "test_tool",
        description: "Test",
        inputSchema: "invalid" as unknown as Record<string, unknown>
      };
      expect(() => reg.register(tool)).not.toThrow();
    });
  });

  describe("registerBatch", () => {
    it("should register multiple tools", () => {
      const tools = [
        createTool("tool1"),
        createTool("tool2"),
        createTool("tool3")
      ];
      const count = registry.registerBatch(tools);
      expect(count).toBe(3);
    });

    it("should return correct success count", () => {
      const tools = [
        createTool("tool1"),
        createTool("tool1"),  // duplicate
        createTool("tool2")
      ];
      const count = registry.registerBatch(tools);
      expect(count).toBe(2);
    });
  });

  describe("unregister", () => {
    it("should unregister existing tool", () => {
      registry.register(createTool("test_tool"));
      const result = registry.unregister("test_tool");
      expect(result).toBe(true);
      expect(registry.has("test_tool")).toBe(false);
    });

    it("should return false for non-existent tool", () => {
      const result = registry.unregister("non_existent");
      expect(result).toBe(false);
    });
  });

  describe("get", () => {
    it("should get existing tool", () => {
      registry.register(createTool("test_tool", "Test description"));
      const tool = registry.get("test_tool");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("test_tool");
    });

    it("should return undefined for non-existent tool", () => {
      const tool = registry.get("non_existent");
      expect(tool).toBeUndefined();
    });
  });

  describe("getRegistration", () => {
    it("should get registration with metadata and handler", () => {
      const tool = createTool("test_tool");
      registry.register(tool, () => "handler_result");
      const reg = registry.getRegistration("test_tool");
      expect(reg).toBeDefined();
      expect(reg?.metadata.name).toBe("test_tool");
      expect(reg?.handler).toBeDefined();
    });
  });

  describe("has", () => {
    it("should return true for existing tool", () => {
      registry.register(createTool("test_tool"));
      expect(registry.has("test_tool")).toBe(true);
    });

    it("should return false for non-existent tool", () => {
      expect(registry.has("non_existent")).toBe(false);
    });
  });

  describe("listTools", () => {
    it("should list all enabled tools", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      const tools = registry.listTools();
      expect(tools).toHaveLength(2);
    });

    it("should not include disabled tools", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.disable("tool1");
      const tools = registry.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("tool2");
    });

    it("should return empty array when no tools", () => {
      const tools = registry.listTools();
      expect(tools).toEqual([]);
    });
  });

  describe("listAllTools", () => {
    it("should list all tools including disabled", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.disable("tool1");
      const tools = registry.listAllTools();
      expect(tools).toHaveLength(2);
    });
  });

  describe("enable/disable", () => {
    it("should enable tool", () => {
      registry.register(createTool("test_tool"));
      registry.disable("test_tool");
      expect(registry.isEnabled("test_tool")).toBe(false);
      registry.enable("test_tool");
      expect(registry.isEnabled("test_tool")).toBe(true);
    });

    it("should disable tool", () => {
      registry.register(createTool("test_tool"));
      registry.disable("test_tool");
      expect(registry.isEnabled("test_tool")).toBe(false);
    });

    it("should return false when enabling non-existent tool", () => {
      const result = registry.enable("non_existent");
      expect(result).toBe(false);
    });

    it("should return false when disabling non-existent tool", () => {
      const result = registry.disable("non_existent");
      expect(result).toBe(false);
    });
  });

  describe("recordCall", () => {
    it("should record call", () => {
      registry.register(createTool("test_tool"));
      registry.recordCall("test_tool");
      const stats = registry.getStats("test_tool");
      expect(stats?.callCount).toBe(1);
    });

    it("should increment call count", () => {
      registry.register(createTool("test_tool"));
      registry.recordCall("test_tool");
      registry.recordCall("test_tool");
      registry.recordCall("test_tool");
      const stats = registry.getStats("test_tool");
      expect(stats?.callCount).toBe(3);
    });

    it("should update lastCalledAt", async () => {
      registry.register(createTool("test_tool"));
      const before = Date.now();
      registry.recordCall("test_tool");
      const stats = registry.getStats("test_tool");
      expect(stats?.lastCalledAt).toBeGreaterThanOrEqual(before);
    });

    it("should return false for non-existent tool", () => {
      const result = registry.recordCall("non_existent");
      expect(result).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return stats for existing tool", () => {
      registry.register(createTool("test_tool"));
      registry.recordCall("test_tool");
      const stats = registry.getStats("test_tool");
      expect(stats?.callCount).toBe(1);
      expect(stats?.lastCalledAt).toBeDefined();
    });

    it("should return undefined for non-existent tool", () => {
      const stats = registry.getStats("non_existent");
      expect(stats).toBeUndefined();
    });
  });

  describe("getAllStats", () => {
    it("should return stats for all tools", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.recordCall("tool1");
      registry.recordCall("tool1");
      registry.recordCall("tool2");

      const stats = registry.getAllStats();
      expect(stats.get("tool1")?.callCount).toBe(2);
      expect(stats.get("tool2")?.callCount).toBe(1);
    });
  });

  describe("search", () => {
    it("should find tools by name", () => {
      registry.register(createTool("write_novel_chapter"));
      registry.register(createTool("analyze_sentiment"));
      const results = registry.search("novel");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("write_novel_chapter");
    });

    it("should find tools by description", () => {
      registry.register(createTool("tool1", "Analyze novel content"));
      registry.register(createTool("tool2", "Write short story"));
      const results = registry.search("novel");
      expect(results).toHaveLength(1);
    });

    it("should be case insensitive", () => {
      registry.register(createTool("TestTool"));
      const results = registry.search("testtool");
      expect(results).toHaveLength(1);
    });

    it("should not find non-existent tools", () => {
      registry.register(createTool("tool1"));
      const results = registry.search("non_existent");
      expect(results).toHaveLength(0);
    });
  });

  describe("searchByTag", () => {
    it("should find tools by tag", () => {
      const tool1 = createTool("tool1");
      tool1.tags = ["writing", "novel"];
      const tool2 = createTool("tool2");
      tool2.tags = ["analysis"];
      registry.register(tool1);
      registry.register(tool2);

      const results = registry.searchByTag("writing");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("tool1");
    });

    it("should not include disabled tools", () => {
      const tool1 = createTool("tool1");
      tool1.tags = ["test"];
      registry.register(tool1);
      registry.disable("tool1");

      const results = registry.searchByTag("test");
      expect(results).toHaveLength(0);
    });
  });

  describe("searchByPrefix", () => {
    it("should find tools by prefix", () => {
      registry.register(createTool("write_chapter"));
      registry.register(createTool("write_summary"));
      registry.register(createTool("analyze_text"));

      const results = registry.searchByPrefix("write_");
      expect(results).toHaveLength(2);
    });
  });

  describe("getMostCalled", () => {
    it("should return most called tools", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.register(createTool("tool3"));
      registry.recordCall("tool1");
      registry.recordCall("tool1");
      registry.recordCall("tool2");

      const results = registry.getMostCalled(2);
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("tool1");
      expect(results[1].name).toBe("tool2");
    });
  });

  describe("getRecentlyCalled", () => {
    it("should return recently called tools", async () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.recordCall("tool1");
      await new Promise(r => setTimeout(r, 10));
      registry.recordCall("tool2");

      const results = registry.getRecentlyCalled(2);
      expect(results[0].name).toBe("tool2");
      expect(results[1].name).toBe("tool1");
    });
  });

  describe("clear", () => {
    it("should remove all tools", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.clear();
      expect(registry.isEmpty()).toBe(true);
    });
  });

  describe("getAllTags", () => {
    it("should return all unique tags", () => {
      const tool1 = createTool("tool1");
      tool1.tags = ["writing", "novel"];
      const tool2 = createTool("tool2");
      tool2.tags = ["writing", "analysis"];
      registry.register(tool1);
      registry.register(tool2);

      const tags = registry.getAllTags();
      expect(tags).toContain("writing");
      expect(tags).toContain("novel");
      expect(tags).toContain("analysis");
      expect(tags).toHaveLength(3);
    });
  });

  describe("getCallCountTotal", () => {
    it("should return total call count", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.recordCall("tool1");
      registry.recordCall("tool1");
      registry.recordCall("tool2");

      const total = registry.getCallCountTotal();
      expect(total).toBe(3);
    });
  });

  describe("isEmpty", () => {
    it("should return true when empty", () => {
      expect(registry.isEmpty()).toBe(true);
    });

    it("should return false when has tools", () => {
      registry.register(createTool("tool1"));
      expect(registry.isEmpty()).toBe(false);
    });
  });

  describe("getEnabledCount", () => {
    it("should return count of enabled tools", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.register(createTool("tool3"));
      registry.disable("tool2");

      expect(registry.getEnabledCount()).toBe(2);
    });
  });

  describe("getTotalCount", () => {
    it("should return total tool count", () => {
      registry.register(createTool("tool1"));
      registry.register(createTool("tool2"));
      registry.disable("tool1");

      expect(registry.getTotalCount()).toBe(2);
    });
  });
});
