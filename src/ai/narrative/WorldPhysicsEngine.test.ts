/**
 * V777 WorldPhysicsEngine Tests — Direction C Iter 2/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldPhysicsEngineState,
  addWorldMechanic,
  createEnergyBudget,
  consumeEnergy,
  regenerateEnergy,
  getMechanicsByType,
  getBudgetsByCharacter,
  getWorldPhysicsReport,
  resetWorldPhysicsEngineState,
  type WorldPhysicsEngineState,
} from './WorldPhysicsEngine';

describe('WorldPhysicsEngine', () => {
  let state: WorldPhysicsEngineState;

  beforeEach(() => { state = createWorldPhysicsEngineState(); });

  describe('createWorldPhysicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.mechanics.size).toBe(0);
      expect(state.budgets.size).toBe(0);
    });
  });

  describe('addWorldMechanic', () => {
    it('should add mechanic', () => {
      const next = addWorldMechanic(state, 'm1', 'magical', 'Fireball', 'Cast fire magic');
      expect(next.mechanics.size).toBe(1);
      expect(next.totalMechanics).toBe(1);
    });

    it('should count active mechanics', () => {
      const next = addWorldMechanic(state, 'm1', 'magical', 'Fireball', 'Cast fire magic', 'strict', 'magical', 0.5, true);
      expect(next.activeMechanics).toBe(1);
    });
  });

  describe('createEnergyBudget', () => {
    it('should create budget', () => {
      const next = createEnergyBudget(state, 'b1', 'char1', 'magical', 100, 0.1);
      expect(next.budgets.size).toBe(1);
      expect(next.totalBudgets).toBe(1);
    });
  });

  describe('consumeEnergy', () => {
    it('should consume energy', () => {
      let next = createEnergyBudget(state, 'b1', 'char1', 'magical', 100);
      next = consumeEnergy(next, 'b1', 30);
      expect(next.budgets.get('b1')?.currentEnergy).toBe(70);
    });

    it('should not go below zero', () => {
      let next = createEnergyBudget(state, 'b1', 'char1', 'magical', 100);
      next = consumeEnergy(next, 'b1', 200);
      expect(next.budgets.get('b1')?.currentEnergy).toBe(0);
    });
  });

  describe('regenerateEnergy', () => {
    it('should regenerate energy', () => {
      let next = createEnergyBudget(state, 'b1', 'char1', 'magical', 100, 1);
      next = consumeEnergy(next, 'b1', 50);
      next = regenerateEnergy(next, 'b1', 10);
      expect(next.budgets.get('b1')?.currentEnergy).toBe(60);
    });

    it('should not exceed max', () => {
      let next = createEnergyBudget(state, 'b1', 'char1', 'magical', 100, 1);
      next = regenerateEnergy(next, 'b1', 200);
      expect(next.budgets.get('b1')?.currentEnergy).toBe(100);
    });
  });

  describe('getMechanicsByType', () => {
    it('should filter by type', () => {
      let next = addWorldMechanic(state, 'm1', 'magical', 'desc', 'strict', 'magical', 0.5);
      next = addWorldMechanic(next, 'm2', 'natural', 'desc', 'loose', 'kinetic', 0.2);
      const magical = getMechanicsByType(next, 'magical');
      expect(magical.length).toBe(1);
    });
  });

  describe('getBudgetsByCharacter', () => {
    it('should return character budgets', () => {
      let next = createEnergyBudget(state, 'b1', 'char1', 'magical');
      next = createEnergyBudget(next, 'b2', 'char1', 'mental');
      const budgets = getBudgetsByCharacter(next, 'char1');
      expect(budgets.length).toBe(2);
    });
  });

  describe('getWorldPhysicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldPhysicsReport(state);
      expect(report.totalMechanics).toBe(0);
      expect(typeof report.physicsComplexity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldPhysicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldPhysicsEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldMechanic(state, 'm1', 'magical', 'desc', 'strict', 'magical', 0.5);
      next = resetWorldPhysicsEngineState();
      expect(next.mechanics.size).toBe(0);
      expect(next.totalMechanics).toBe(0);
    });
  });
});