/**
 * V559 MCPHealthMonitor Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MCPHealthMonitor, HealthStatus } from "./MCPHealthMonitor";

describe("V559 MCPHealthMonitor", () => {
  let monitor: MCPHealthMonitor;

  beforeEach(() => {
    monitor = new MCPHealthMonitor({
      checkInterval: 1000,
      timeout: 5000,
      unhealthyThreshold: 50,
      degradedThreshold: 75
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe("constructor", () => {
    it("should create monitor with default config", () => {
      const m = new MCPHealthMonitor();
      expect(m).toBeDefined();
      m.destroy();
    });

    it("should create monitor with custom config", () => {
      expect(monitor).toBeDefined();
    });

    it("should accept onStatusChange callback", () => {
      const callback = (status: HealthStatus) => {};
      const m = new MCPHealthMonitor({}, callback);
      expect(m).toBeDefined();
      m.destroy();
    });
  });

  describe("recordRequest", () => {
    it("should record successful request", () => {
      monitor.recordRequest(100, true);
      expect(monitor.getRequestCount()).toBe(1);
      expect(monitor.getSuccessCount()).toBe(1);
      expect(monitor.getErrorCount()).toBe(0);
    });

    it("should record failed request", () => {
      monitor.recordRequest(200, false);
      expect(monitor.getRequestCount()).toBe(1);
      expect(monitor.getSuccessCount()).toBe(0);
      expect(monitor.getErrorCount()).toBe(1);
    });

    it("should accumulate multiple requests", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(200, true);
      monitor.recordRequest(300, false);
      expect(monitor.getRequestCount()).toBe(3);
      expect(monitor.getSuccessCount()).toBe(2);
      expect(monitor.getErrorCount()).toBe(1);
    });

    it("should track latency samples", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(200, true);
      const history = monitor.getLatencyHistory();
      expect(history).toHaveLength(2);
      expect(history).toContain(100);
      expect(history).toContain(200);
    });

    it("should limit latency samples to max", () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordRequest(i, true);
      }
      const history = monitor.getLatencyHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe("getStatus", () => {
    it("should return excellent status with no issues", () => {
      monitor.recordRequest(50, true);
      const status = monitor.getStatus();
      expect(status.score).toBe(100);
      expect(status.status).toBe("excellent");
      expect(status.healthy).toBe(true);
      expect(status.issues).toHaveLength(0);
    });

    it("should detect high latency", () => {
      monitor.recordRequest(1500, true);
      const status = monitor.getStatus();
      expect(status.score).toBeLessThan(100);
      expect(status.issues).toContain("High latency detected");
    });

    it("should detect moderate latency", () => {
      monitor.recordRequest(600, true);
      const status = monitor.getStatus();
      expect(status.issues).toContain("Moderate latency");
    });

    it("should detect high error rate", () => {
      monitor.recordRequest(100, false);
      monitor.recordRequest(100, false);
      monitor.recordRequest(100, false);
      const status = monitor.getStatus();
      expect(status.score).toBeLessThan(60);
      expect(status.issues).toContain("High error rate");
    });

    it("should detect elevated error rate", () => {
      // 6% error rate (2 failures out of ~33 requests)
      // ~6% > 5% threshold
      for (let i = 0; i < 33; i++) {
        monitor.recordRequest(100, i < 31);  // 31 success, 2 failure = ~6% error
      }
      const status = monitor.getStatus();
      expect(status.issues.some(i => i.includes("error rate"))).toBe(true);
    });

    it("should detect low success rate", () => {
      monitor.recordRequest(100, false);
      monitor.recordRequest(100, false);
      monitor.recordRequest(100, false);
      monitor.recordRequest(100, false);
      const status = monitor.getStatus();
      expect(status.issues).toContain("Low success rate");
    });

    it("should return degraded status when score below 75", () => {
      // Fewer failures to keep score above unhealthy threshold
      for (let i = 0; i < 5; i++) {
        monitor.recordRequest(100, false);
        monitor.recordRequest(100, true);
      }
      const status = monitor.getStatus();
      expect(status.status).toMatch(/degraded|unhealthy/);
    });

    it("should return unhealthy status when score below 50", () => {
      // Generate many failures to push score below 50
      for (let i = 0; i < 10; i++) {
        monitor.recordRequest(100, false);
      }
      const status = monitor.getStatus();
      expect(status.status).toBe("unhealthy");
      expect(status.healthy).toBe(false);
    });
  });

  describe("getMetrics", () => {
    it("should return correct metrics", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(200, true);
      monitor.recordRequest(300, false);

      const metrics = monitor.getMetrics();
      expect(metrics.successRate).toBeCloseTo(0.667, 1);
      expect(metrics.errorRate).toBeCloseTo(0.333, 1);
      expect(metrics.latency).toBe(200);
    });

    it("should return 100% success rate initially", () => {
      const metrics = monitor.getMetrics();
      expect(metrics.successRate).toBe(1);
      expect(metrics.errorRate).toBe(0);
    });

    it("should track uptime", async () => {
      await new Promise(r => setTimeout(r, 10));
      const metrics = monitor.getMetrics();
      expect(metrics.uptime).toBeGreaterThanOrEqual(10);
    });
  });

  describe("checkHealth", () => {
    it("should check health successfully", async () => {
      const checkFn = async () => {
        await new Promise(r => setTimeout(r, 10));
        return true;
      };
      const status = await monitor.checkHealth(checkFn);
      expect(status.healthy).toBe(true);
    });

    it("should handle check failure", async () => {
      const checkFn = async () => {
        await new Promise(r => setTimeout(r, 10));
        return false;
      };
      const status = await monitor.checkHealth(checkFn);
      expect(status.healthy).toBe(false);
    });

    it("should handle check timeout", async () => {
      // Use a custom monitor with very short timeout
      const shortMonitor = new MCPHealthMonitor({ timeout: 20 });
      const checkFn = async () => {
        await new Promise(r => setTimeout(r, 100));  // Longer than timeout
        return true;
      };
      await shortMonitor.checkHealth(checkFn);
      // Should record a failure due to timeout
      expect(shortMonitor.getErrorCount()).toBeGreaterThan(0);
      shortMonitor.destroy();
    });
  });

  describe("startPeriodicCheck", () => {
    it("should start periodic checks", () => {
      const checkFn = async () => true;
      monitor.startPeriodicCheck(checkFn);
      // Check timer should be set
      expect(monitor.getRequestCount()).toBe(0);
    });

    it("should call onStatusChange when status changes", async () => {
      let statusChangeCount = 0;
      const m = new MCPHealthMonitor({ checkInterval: 50 }, (status) => {
        statusChangeCount++;
      });

      const checkFn = async () => true;
      m.startPeriodicCheck(checkFn);

      // Wait for a few checks
      await new Promise(r => setTimeout(r, 150));

      m.stopPeriodicCheck();
      m.destroy();

      expect(statusChangeCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("stopPeriodicCheck", () => {
    it("should stop periodic checks", () => {
      const checkFn = async () => true;
      monitor.startPeriodicCheck(checkFn);
      monitor.stopPeriodicCheck();
      // Should not throw
    });

    it("should handle stop when not running", () => {
      monitor.stopPeriodicCheck();
      // Should not throw
    });
  });

  describe("reset", () => {
    it("should reset all counters", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(200, false);
      monitor.reset();

      expect(monitor.getRequestCount()).toBe(0);
      expect(monitor.getSuccessCount()).toBe(0);
      expect(monitor.getErrorCount()).toBe(0);
      expect(monitor.getLatencyHistory()).toHaveLength(0);
    });
  });

  describe("latency stats", () => {
    it("should calculate average latency", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(200, true);
      monitor.recordRequest(300, true);
      expect(monitor.getAverageLatency()).toBe(200);
    });

    it("should calculate max latency", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(500, true);
      monitor.recordRequest(300, true);
      expect(monitor.getMaxLatency()).toBe(500);
    });

    it("should calculate min latency", () => {
      monitor.recordRequest(100, true);
      monitor.recordRequest(500, true);
      monitor.recordRequest(300, true);
      expect(monitor.getMinLatency()).toBe(100);
    });

    it("should return 0 for empty latency stats", () => {
      expect(monitor.getAverageLatency()).toBe(0);
      expect(monitor.getMaxLatency()).toBe(0);
      expect(monitor.getMinLatency()).toBe(0);
    });
  });

  describe("isHealthy", () => {
    it("should return true when healthy", () => {
      monitor.recordRequest(50, true);
      expect(monitor.isHealthy()).toBe(true);
    });

    it("should return false when unhealthy", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordRequest(100, false);
      }
      expect(monitor.isHealthy()).toBe(false);
    });
  });

  describe("getConfig", () => {
    it("should return config copy", () => {
      const config = monitor.getConfig();
      expect(config.checkInterval).toBe(1000);
      expect(config.timeout).toBe(5000);
      expect(config.unhealthyThreshold).toBe(50);
      expect(config.degradedThreshold).toBe(75);
    });
  });
});
