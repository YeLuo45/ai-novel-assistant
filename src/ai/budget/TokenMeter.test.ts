/**
 * V45 TokenMeter Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenMeter, createTokenMeter } from './TokenMeter';

// Mock Dexie
const mockWhere = vi.fn();
const mockToArray = vi.fn().mockResolvedValue([]);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockAdd = vi.fn().mockResolvedValue(1);

vi.mock('../../db/schema', () => {
  return {
    getBudgetDb: () => ({
      token_usage: {
        add: mockAdd,
        where: () => ({
          aboveOrEqual: () => ({ toArray: mockToArray }),
          equals: () => ({ toArray: mockToArray }),
          below: () => ({ toArray: mockToArray, delete: mockDelete }),
          toArray: mockToArray,
          delete: mockDelete,
        }),
      },
    }),
  };
});

describe('TokenMeter', () => {
  let meter: TokenMeter;
  const sessionId = 'test-session-123';
  const projectId = 'test-project-456';

  beforeEach(() => {
    vi.clearAllMocks();
    meter = new TokenMeter(sessionId, projectId);
  });

  describe('constructor', () => {
    it('should create instance with sessionId and projectId', () => {
      expect(meter).toBeInstanceOf(TokenMeter);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for Chinese text', () => {
      // Chinese characters are typically 1 token each
      expect(meter.estimateTokens('你好世界')).toBe(1);
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(400);
      expect(meter.estimateTokens(longText)).toBe(100);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for GPT-4', () => {
      const cost = meter.estimateCost('gpt-4', 1000, 1000);
      // (1000/1M * 30) + (1000/1M * 60) = 0.03 + 0.06 = 0.09
      expect(cost).toBe(0.09);
    });

    it('should estimate cost for Claude', () => {
      const cost = meter.estimateCost('claude-3-opus', 1000, 1000);
      // (1000/1M * 15) + (1000/1M * 75) = 0.015 + 0.075 = 0.09
      expect(cost).toBe(0.09);
    });

    it('should use default pricing for unknown model', () => {
      const cost = meter.estimateCost('unknown-model', 1000, 1000);
      // (1000/1M * 1) + (1000/1M * 3) = 0.001 + 0.003 = 0.004
      expect(cost).toBe(0.004);
    });
  });

  describe('record', () => {
    it('should record token usage', async () => {
      const id = await meter.record({
        sessionId: 'session-1',
        inputTokens: 100,
        outputTokens: 200,
        model: 'gpt-4',
        operation: 'generate',
      });

      expect(id).toBe(1);
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe('getSessionUsage', () => {
    it('should return session usage', async () => {
      const usage = await meter.getSessionUsage();
      expect(usage.total).toBe(0);
      expect(usage.records).toEqual([]);
    });
  });

  describe('getProjectUsage', () => {
    it('should return project usage', async () => {
      const usage = await meter.getProjectUsage();
      expect(usage.total).toBe(0);
      expect(usage.records).toEqual([]);
    });
  });

  describe('getTodayUsage', () => {
    it('should return today usage', async () => {
      const usage = await meter.getTodayUsage();
      expect(usage).toBe(0);
    });
  });

  describe('getMonthUsage', () => {
    it('should return month usage', async () => {
      const usage = await meter.getMonthUsage();
      expect(usage).toBe(0);
    });
  });

  describe('createTokenMeter', () => {
    it('should create TokenMeter instance', () => {
      const m = createTokenMeter('session', 'project');
      expect(m).toBeInstanceOf(TokenMeter);
    });
  });
});