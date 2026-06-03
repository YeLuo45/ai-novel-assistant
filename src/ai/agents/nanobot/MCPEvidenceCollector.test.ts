/**
 * V560 MCPEvidenceCollector Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MCPEvidenceCollector, Evidence, EvidenceFilter } from "./MCPEvidenceCollector";

describe("V560 MCPEvidenceCollector", () => {
  let collector: MCPEvidenceCollector;

  beforeEach(() => {
    collector = new MCPEvidenceCollector();
  });

  describe("constructor", () => {
    it("should create with default options", () => {
      const c = new MCPEvidenceCollector();
      expect(c).toBeDefined();
      expect(c.getCount()).toBe(0);
    });

    it("should create with custom options", () => {
      const c = new MCPEvidenceCollector({
        maxEvidence: 500,
        includeArguments: false,
        includeResponse: false,
        redactSensitiveData: false,
        sensitiveFields: ["key", "pass"]
      });
      expect(c).toBeDefined();
    });
  });

  describe("record", () => {
    it("should record evidence", () => {
      const id = collector.record({
        toolName: "test_tool",
        arguments: { arg1: "value1" },
        response: { result: "success" },
        executionTime: 100,
        success: true
      });
      expect(id).toMatch(/^ev_/);
      expect(collector.getCount()).toBe(1);
    });

    it("should record failed call", () => {
      collector.record({
        toolName: "failing_tool",
        arguments: {},
        error: { code: "ERR_001", message: "Tool failed" },
        executionTime: 50,
        success: false
      });
      expect(collector.getCount()).toBe(1);
    });

    it("should store arguments and response", () => {
      collector.record({
        toolName: "test_tool",
        arguments: { name: "test", value: 123 },
        response: { output: "result" },
        executionTime: 100,
        success: true
      });
      const evidence = collector.getRecent(1)[0];
      expect(evidence.arguments).toEqual({ name: "test", value: 123 });
      expect(evidence.response).toEqual({ output: "result" });
    });

    it("should include metadata", () => {
      collector.record({
        toolName: "test_tool",
        arguments: {},
        executionTime: 100,
        success: true,
        metadata: { sessionId: "abc123", userId: "user1" }
      });
      const evidence = collector.getRecent(1)[0];
      expect(evidence.metadata).toEqual({ sessionId: "abc123", userId: "user1" });
    });
  });

  describe("redact sensitive data", () => {
    it("should redact password fields", () => {
      const c = new MCPEvidenceCollector({ redactSensitiveData: true });
      c.record({
        toolName: "auth_tool",
        arguments: { username: "user", password: "secret123" },
        executionTime: 100,
        success: true
      });
      const evidence = c.getRecent(1)[0];
      expect(evidence.arguments.password).toBe("***REDACTED***");
      expect(evidence.arguments.username).toBe("user");
    });

    it("should redact token fields", () => {
      const c = new MCPEvidenceCollector({ redactSensitiveData: true });
      c.record({
        toolName: "api_tool",
        arguments: { apiKey: "key123", endpoint: "/api/test" },
        executionTime: 100,
        success: true
      });
      const evidence = c.getRecent(1)[0];
      expect(evidence.arguments.apiKey).toBe("***REDACTED***");
      expect(evidence.arguments.endpoint).toBe("/api/test");
    });

    it("should redact nested sensitive fields", () => {
      const c = new MCPEvidenceCollector({ redactSensitiveData: true });
      c.record({
        toolName: "auth_tool",
        arguments: { user: { name: "test", password: "secret" } },
        executionTime: 100,
        success: true
      });
      const evidence = c.getRecent(1)[0];
      expect((evidence.arguments as any).user.password).toBe("***REDACTED***");
    });

    it("should not redact when disabled", () => {
      const c = new MCPEvidenceCollector({ redactSensitiveData: false });
      c.record({
        toolName: "auth_tool",
        arguments: { password: "secret123" },
        executionTime: 100,
        success: true
      });
      const evidence = c.getRecent(1)[0];
      expect(evidence.arguments.password).toBe("secret123");
    });
  });

  describe("get", () => {
    it("should get evidence by id", () => {
      const id = collector.record({
        toolName: "test_tool",
        arguments: {},
        executionTime: 100,
        success: true
      });
      const evidence = collector.get(id);
      expect(evidence).toBeDefined();
      expect(evidence?.toolName).toBe("test_tool");
    });

    it("should return undefined for non-existent id", () => {
      const evidence = collector.get("non_existent_id");
      expect(evidence).toBeUndefined();
    });
  });

  describe("getRecent", () => {
    it("should return recent evidence", () => {
      for (let i = 0; i < 10; i++) {
        collector.record({
          toolName: `tool_${i}`,
          arguments: {},
          executionTime: 100,
          success: true
        });
      }
      const recent = collector.getRecent(5);
      expect(recent).toHaveLength(5);
      expect(recent[0].toolName).toBe("tool_5");
      expect(recent[4].toolName).toBe("tool_9");
    });

    it("should return all if limit exceeds count", () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      const recent = collector.getRecent(100);
      expect(recent).toHaveLength(1);
    });
  });

  describe("filter", () => {
    beforeEach(() => {
      // Record different types of evidence
      collector.record({ toolName: "tool_a", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool_b", arguments: {}, executionTime: 200, success: true });
      collector.record({ toolName: "tool_a", arguments: {}, executionTime: 300, success: false });
    });

    it("should filter by tool name", () => {
      const filtered = collector.filter({ toolName: "tool_a" });
      expect(filtered).toHaveLength(2);
    });

    it("should filter by success", () => {
      const filtered = collector.filter({ success: true });
      expect(filtered).toHaveLength(2);
    });

    it("should filter by limit", () => {
      const filtered = collector.filter({ limit: 2 });
      expect(filtered).toHaveLength(2);
    });

    it("should combine multiple filters", () => {
      const filtered = collector.filter({ toolName: "tool_a", success: false });
      expect(filtered).toHaveLength(1);
    });
  });

  describe("getSummary", () => {
    it("should return correct summary", () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool2", arguments: {}, executionTime: 200, success: true });
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 150, success: false });

      const summary = collector.getSummary();
      expect(summary.totalCalls).toBe(3);
      expect(summary.successfulCalls).toBe(2);
      expect(summary.failedCalls).toBe(1);
      expect(summary.toolsUsed).toContain("tool1");
      expect(summary.toolsUsed).toContain("tool2");
      expect(summary.averageExecutionTime).toBe(150);
    });

    it("should handle empty collector", () => {
      const summary = collector.getSummary();
      expect(summary.totalCalls).toBe(0);
      expect(summary.successfulCalls).toBe(0);
      expect(summary.averageExecutionTime).toBe(0);
    });
  });

  describe("getStatsByTool", () => {
    it("should return stats per tool", () => {
      collector.record({ toolName: "tool_a", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool_a", arguments: {}, executionTime: 200, success: true });
      collector.record({ toolName: "tool_a", arguments: {}, executionTime: 150, success: false });

      const stats = collector.getStatsByTool();
      const toolAStats = stats.get("tool_a");
      expect(toolAStats).toBeDefined();
      expect(toolAStats?.count).toBe(3);
      expect(toolAStats?.successCount).toBe(2);
      expect(toolAStats?.failedCount).toBe(1);
      expect(toolAStats?.avgExecutionTime).toBe(150);
    });
  });

  describe("generateReport", () => {
    it("should generate report", () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool2", arguments: {}, executionTime: 200, success: false });

      const report = collector.generateReport();
      expect(report).toContain("MCP Evidence Report");
      expect(report).toContain("Total Calls: 2");
      expect(report).toContain("Successful: 1");
      expect(report).toContain("Failed: 1");
      expect(report).toContain("tool1");
      expect(report).toContain("tool2");
    });

    it("should generate filtered report", () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool2", arguments: {}, executionTime: 200, success: false });

      const report = collector.generateReport({ toolName: "tool1" });
      expect(report).toContain("Evidence Count: 1");
      expect(report).toContain("tool1");
    });

    it("should show recent failures", () => {
      collector.record({ toolName: "failing", arguments: {}, executionTime: 50, success: false, error: { code: "ERR", message: "Failed" } });
      const report = collector.generateReport();
      expect(report).toContain("Recent Failures");
      expect(report).toContain("Failed");
    });
  });

  describe("clear", () => {
    it("should clear all evidence", () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool2", arguments: {}, executionTime: 200, success: true });
      collector.clear();
      expect(collector.getCount()).toBe(0);
    });
  });

  describe("clearOlderThan", () => {
    it("should clear old evidence", async () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      await new Promise(r => setTimeout(r, 50));
      const now = Date.now();
      collector.record({ toolName: "tool2", arguments: {}, executionTime: 200, success: true });

      const cleared = collector.clearOlderThan(now);
      expect(cleared).toBe(1);
      expect(collector.getCount()).toBe(1);
    });
  });

  describe("export/import", () => {
    it("should export evidence", () => {
      collector.record({ toolName: "tool1", arguments: {}, executionTime: 100, success: true });
      collector.record({ toolName: "tool2", arguments: {}, executionTime: 200, success: true });

      const exported = collector.export();
      expect(exported).toHaveLength(2);
    });

    it("should import evidence", () => {
      const evidence: Evidence[] = [
        { id: "ev_1", timestamp: Date.now(), toolName: "imported_tool", arguments: {}, executionTime: 100, success: true }
      ];

      collector.import(evidence);
      expect(collector.getCount()).toBe(1);
      const retrieved = collector.get("ev_1");
      expect(retrieved?.toolName).toBe("imported_tool");
    });

    it("should respect max evidence limit on import", () => {
      const collector2 = new MCPEvidenceCollector({ maxEvidence: 5 });
      const evidence: Evidence[] = Array.from({ length: 10 }, (_, i) => ({
        id: `ev_${i}`,
        timestamp: Date.now(),
        toolName: `tool_${i}`,
        arguments: {},
        executionTime: 100,
        success: true
      }));

      collector2.import(evidence);
      expect(collector2.getCount()).toBe(5);
    });
  });

  describe("getOptions", () => {
    it("should return options copy", () => {
      const options = collector.getOptions();
      expect(options.maxEvidence).toBe(10000);
      expect(options.includeArguments).toBe(true);
      expect(options.includeResponse).toBe(true);
      expect(options.redactSensitiveData).toBe(true);
    });
  });
});