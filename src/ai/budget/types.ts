/**
 * V45 Budget Mode Types
 * BudgetConfig, BudgetStatus, TokenRecord types for token budget management
 */

export interface BudgetConfig {
  dailyLimit: number;       // Daily token limit (default: 100000)
  monthlyLimit: number;     // Monthly token limit (default: 2000000)
  perSessionLimit: number;  // Per-session token limit (default: 50000)
  warningThreshold: number; // Warning threshold (default: 0.8 = 80%)
  contextThreshold: number; // Context compression threshold in tokens (default: 150000)
}

export interface BudgetStatus {
  usedToday: number;
  usedThisMonth: number;
  usedThisSession: number;
  remainingToday: number;
  remainingThisMonth: number;
  remainingThisSession: number;
  percentUsedToday: number;
  percentUsedThisMonth: number;
  percentUsedSession: number;
  isWarning: boolean;      // true if any limit >= warningThreshold
  exceededLimits: string[]; // List of exceeded limit names
}

export interface TokenRecord {
  id?: number;
  sessionId: string;
  projectId?: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  operation: string;       // e.g., 'generate', 'review', 'compress'
  cost?: number;            // Estimated cost in USD
}

// Default configuration
export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  dailyLimit: 100000,
  monthlyLimit: 2000000,
  perSessionLimit: 50000,
  warningThreshold: 0.8,
  contextThreshold: 150000,
};

// Budget limit names for exceededLimits array
export const BUDGET_LIMIT_DAILY = 'daily';
export const BUDGET_LIMIT_MONTHLY = 'monthly';
export const BUDGET_LIMIT_SESSION = 'session';