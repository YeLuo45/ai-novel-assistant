/**
 * V45 BudgetController Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetController } from './BudgetController';

// Mock Dexie
vi.mock('../../db/schema', () => {
  const mockDb = {
    token_usage: {
      where: vi.fn().mockReturnThis(),
      aboveOrEqual: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    budget_settings: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  };
  return {
    getBudgetDb: () => mockDb,
    BudgetSettings: {},
  };
});

describe('BudgetController', () => {
  let controller: BudgetController;

  beforeEach(() => {
    controller = new BudgetController({
      dailyLimit: 100000,
      monthlyLimit: 2000000,
      perSessionLimit: 50000,
      warningThreshold: 0.8,
      contextThreshold: 150000,
    });
  });

  describe('getStatus', () => {
    it('should return correct initial status', async () => {
      const status = await controller.getStatus();
      
      expect(status.usedToday).toBe(0);
      expect(status.usedThisMonth).toBe(0);
      expect(status.usedThisSession).toBe(0);
      expect(status.isWarning).toBe(false);
      expect(status.exceededLimits).toEqual([]);
    });

    it('should calculate remaining tokens correctly', async () => {
      const status = await controller.getStatus();
      
      expect(status.remainingToday).toBe(100000);
      expect(status.remainingThisMonth).toBe(2000000);
      expect(status.remainingThisSession).toBe(50000);
    });
  });

  describe('canRequest', () => {
    it('should allow request when within limits', async () => {
      const result = await controller.canRequest(1000);
      expect(result.allowed).toBe(true);
    });

    it('should reject request exceeding remaining daily budget', async () => {
      const result = await controller.canRequest(200000);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('daily');
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = controller.getConfig();
      
      expect(config.dailyLimit).toBe(100000);
      expect(config.monthlyLimit).toBe(2000000);
      expect(config.perSessionLimit).toBe(50000);
      expect(config.warningThreshold).toBe(0.8);
      expect(config.contextThreshold).toBe(150000);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', async () => {
      await controller.updateConfig({ dailyLimit: 200000 });
      
      const config = controller.getConfig();
      expect(config.dailyLimit).toBe(200000);
    });
  });

  describe('getContextThreshold', () => {
    it('should return context threshold', () => {
      expect(controller.getContextThreshold()).toBe(150000);
    });
  });

  describe('getWarningThreshold', () => {
    it('should return warning threshold', () => {
      expect(controller.getWarningThreshold()).toBe(0.8);
    });
  });
});