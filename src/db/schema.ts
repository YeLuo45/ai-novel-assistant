/**
 * V45 Budget Database Schema
 * Dexie schema for token_usage table (version 45)
 * Append-only: never rewrite existing stores
 */

import Dexie, { Table } from 'dexie';
import type { TokenRecord, BudgetConfig } from '../ai/budget/types';

export interface BudgetSettings {
  id: string;  // 'user_budget_settings'
  config: BudgetConfig;
  updatedAt: number;
}

export class BudgetDatabase extends Dexie {
  token_usage!: Table<TokenRecord, number>;
  budget_settings!: Table<BudgetSettings, string>;

  constructor() {
    super('BudgetDB');
    
    // Version 45: Append token_usage table (never rewrite existing stores)
    this.version(45).stores({
      token_usage: '++id, sessionId, projectId, timestamp, model, operation',
      budget_settings: 'id, updatedAt',
    });
  }
}

// Singleton instance
let dbInstance: BudgetDatabase | null = null;

export function getBudgetDb(): BudgetDatabase {
  if (!dbInstance) {
    dbInstance = new BudgetDatabase();
  }
  return dbInstance;
}

export function closeBudgetDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}