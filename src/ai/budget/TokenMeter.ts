/**
 * V45 TokenMeter - Token计量器
 * Records each LLM call's token consumption to Dexie
 */

import { getBudgetDb } from '../../db/schema';
import type { TokenRecord } from './types';

export interface TokenUsageInput {
  sessionId: string;
  projectId?: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  operation: string;
  cost?: number;
}

export class TokenMeter {
  private sessionId: string;
  private projectId?: string;

  constructor(sessionId: string, projectId?: string) {
    this.sessionId = sessionId;
    this.projectId = projectId;
  }

  /**
   * Record a token usage event
   */
  async record(input: TokenUsageInput): Promise<number> {
    const db = getBudgetDb();
    const totalTokens = input.inputTokens + input.outputTokens;
    
    const record: TokenRecord = {
      sessionId: input.sessionId || this.sessionId,
      projectId: input.projectId || this.projectId,
      timestamp: Date.now(),
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens,
      model: input.model,
      operation: input.operation,
      cost: input.cost,
    };

    const id = await db.token_usage.add(record);
    return id as number;
  }

  /**
   * Estimate token count from text (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for Chinese/English mixed
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost based on model and token count
   * Uses Web Crypto API for consistent hashing
   */
  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Pricing per 1M tokens (approximate)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 30, output: 60 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'claude-3-opus': { input: 15, output: 75 },
      'claude-3-sonnet': { input: 3, output: 15 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
      'default': { input: 1, output: 3 },
    };

    const rates = pricing[model] || pricing['default'];
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    
    return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 decimal places
  }

  /**
   * Get usage for current session
   */
  async getSessionUsage(): Promise<{ total: number; records: TokenRecord[] }> {
    const db = getBudgetDb();
    const records = await db.token_usage
      .where('sessionId')
      .equals(this.sessionId)
      .toArray();
    
    const total = records.reduce((sum, r) => sum + r.totalTokens, 0);
    return { total, records };
  }

  /**
   * Get usage for current project
   */
  async getProjectUsage(): Promise<{ total: number; records: TokenRecord[] }> {
    if (!this.projectId) {
      return { total: 0, records: [] };
    }
    
    const db = getBudgetDb();
    const records = await db.token_usage
      .where('projectId')
      .equals(this.projectId)
      .toArray();
    
    const total = records.reduce((sum, r) => sum + r.totalTokens, 0);
    return { total, records };
  }

  /**
   * Get usage for today
   */
  async getTodayUsage(): Promise<number> {
    const db = getBudgetDb();
    const now = Date.now();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const records = await db.token_usage
      .where('timestamp')
      .aboveOrEqual(startOfDay.getTime())
      .toArray();
    
    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Get usage for current month
   */
  async getMonthUsage(): Promise<number> {
    const db = getBudgetDb();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const records = await db.token_usage
      .where('timestamp')
      .aboveOrEqual(startOfMonth.getTime())
      .toArray();
    
    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Clear session records
   */
  async clearSession(): Promise<void> {
    const db = getBudgetDb();
    await db.token_usage.where('sessionId').equals(this.sessionId).delete();
  }

  /**
   * Clear old records (older than specified days)
   */
  async clearOldRecords(daysOld: number = 30): Promise<number> {
    const db = getBudgetDb();
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const oldRecords = await db.token_usage.where('timestamp').below(cutoff).toArray();
    await db.token_usage.where('timestamp').below(cutoff).delete();
    return oldRecords.length;
  }
}

// Factory function
export function createTokenMeter(sessionId: string, projectId?: string): TokenMeter {
  return new TokenMeter(sessionId, projectId);
}