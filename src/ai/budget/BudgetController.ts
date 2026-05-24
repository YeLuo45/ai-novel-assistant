/**
 * V45 BudgetController - 预算控制器
 * Manages dailyLimit, monthlyLimit, perSessionLimit with warningThreshold
 */

import { getBudgetDb, BudgetSettings } from '../../db/schema';
import type { BudgetConfig, BudgetStatus } from './types';
import { DEFAULT_BUDGET_CONFIG, BUDGET_LIMIT_DAILY, BUDGET_LIMIT_MONTHLY, BUDGET_LIMIT_SESSION } from './types';

export class BudgetController {
  private config: BudgetConfig;
  private sessionStart: number;

  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = { ...DEFAULT_BUDGET_CONFIG, ...config };
    this.sessionStart = Date.now();
  }

  /**
   * Get current budget status
   */
  async getStatus(): Promise<BudgetStatus> {
    const db = getBudgetDb();
    const now = Date.now();
    const todayStart = this.getStartOfDay(now);
    const monthStart = this.getStartOfMonth(now);
    const sessionStart = this.sessionStart;

    // Query usage data
    const [todayRecords, monthRecords, sessionRecords] = await Promise.all([
      db.token_usage.where('timestamp').aboveOrEqual(todayStart).toArray(),
      db.token_usage.where('timestamp').aboveOrEqual(monthStart).toArray(),
      db.token_usage.where('timestamp').aboveOrEqual(sessionStart).toArray(),
    ]);

    // Calculate totals
    const usedToday = todayRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const usedThisMonth = monthRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const usedThisSession = sessionRecords.reduce((sum, r) => sum + r.totalTokens, 0);

    // Calculate remaining and percentages
    const remainingToday = Math.max(0, this.config.dailyLimit - usedToday);
    const remainingThisMonth = Math.max(0, this.config.monthlyLimit - usedThisMonth);
    const remainingThisSession = Math.max(0, this.config.perSessionLimit - usedThisSession);

    const percentUsedToday = usedToday / this.config.dailyLimit;
    const percentUsedMonth = usedThisMonth / this.config.monthlyLimit;
    const percentUsedSession = usedThisSession / this.config.perSessionLimit;

    // Check for exceeded limits
    const exceededLimits: string[] = [];
    if (percentUsedToday >= 1) exceededLimits.push(BUDGET_LIMIT_DAILY);
    if (percentUsedMonth >= 1) exceededLimits.push(BUDGET_LIMIT_MONTHLY);
    if (percentUsedSession >= 1) exceededLimits.push(BUDGET_LIMIT_SESSION);

    // Check if warning threshold is reached
    const isWarning = percentUsedToday >= this.config.warningThreshold ||
                      percentUsedMonth >= this.config.warningThreshold ||
                      percentUsedSession >= this.config.warningThreshold;

    return {
      usedToday,
      usedThisMonth: usedThisMonth,
      usedThisSession,
      remainingToday,
      remainingThisMonth,
      remainingThisSession,
      percentUsedToday: Math.min(percentUsedToday, 1),
      percentUsedThisMonth: Math.min(percentUsedMonth, 1),
      percentUsedSession: Math.min(percentUsedSession, 1),
      isWarning,
      exceededLimits,
    };
  }

  /**
   * Check if a new request can be allowed
   */
  async canRequest(estimatedTokens: number): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getStatus();

    if (status.exceededLimits.includes(BUDGET_LIMIT_DAILY)) {
      return { allowed: false, reason: 'Daily limit exceeded' };
    }
    if (status.exceededLimits.includes(BUDGET_LIMIT_MONTHLY)) {
      return { allowed: false, reason: 'Monthly limit exceeded' };
    }
    if (status.exceededLimits.includes(BUDGET_LIMIT_SESSION)) {
      return { allowed: false, reason: 'Session limit exceeded' };
    }
    if (status.remainingToday < estimatedTokens) {
      return { allowed: false, reason: 'Estimated tokens exceed remaining daily budget' };
    }
    if (status.remainingThisMonth < estimatedTokens) {
      return { allowed: false, reason: 'Estimated tokens exceed remaining monthly budget' };
    }
    if (status.remainingThisSession < estimatedTokens) {
      return { allowed: false, reason: 'Estimated tokens exceed remaining session budget' };
    }

    return { allowed: true };
  }

  /**
   * Get the budget configuration
   */
  getConfig(): BudgetConfig {
    return { ...this.config };
  }

  /**
   * Update budget configuration
   */
  async updateConfig(newConfig: Partial<BudgetConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    const db = getBudgetDb();
    await db.budget_settings.put({
      id: 'user_budget_settings',
      config: this.config,
      updatedAt: Date.now(),
    });
  }

  /**
   * Load configuration from database
   */
  async loadConfig(): Promise<void> {
    const db = getBudgetDb();
    const settings = await db.budget_settings.get('user_budget_settings');
    if (settings?.config) {
      this.config = { ...DEFAULT_BUDGET_CONFIG, ...settings.config };
    }
  }

  /**
   * Get context threshold for compression
   */
  getContextThreshold(): number {
    return this.config.contextThreshold;
  }

  /**
   * Get warning threshold
   */
  getWarningThreshold(): number {
    return this.config.warningThreshold;
  }

  // Helper functions
  private getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  private getStartOfMonth(timestamp: number): number {
    const date = new Date(timestamp);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }
}

// Singleton instance
let controllerInstance: BudgetController | null = null;

export function getBudgetController(): BudgetController {
  if (!controllerInstance) {
    controllerInstance = new BudgetController();
  }
  return controllerInstance;
}