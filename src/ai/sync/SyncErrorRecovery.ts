// V2123 SyncErrorRecovery - Direction A Iter 8/30
// 同步错误恢复 - 指数退避 + 熔断
// Source: thunderbolt (resilience patterns)

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface RecoveryConfig {
  maxRetries: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  failureThreshold: number;
  cooldownMs: number;
}

export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxRetries: 5,
  baseBackoffMs: 100,
  maxBackoffMs: 30000,
  failureThreshold: 3,
  cooldownMs: 10000,
};

export interface RecoveryState {
  circuit: CircuitState;
  consecutiveFailures: number;
  lastFailureAt: number;
  totalRetries: number;
  config: RecoveryConfig;
}

export function createRecoveryState(): RecoveryState {
  return {
    circuit: 'closed',
    consecutiveFailures: 0,
    lastFailureAt: 0,
    totalRetries: 0,
    config: { ...DEFAULT_RECOVERY_CONFIG },
  };
}

export function computeBackoff(state: RecoveryState, attempt: number): number {
  const exp = state.config.baseBackoffMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exp;
  return Math.min(exp + jitter, state.config.maxBackoffMs);
}

export function recordSuccess(state: RecoveryState): RecoveryState {
  return {
    ...state,
    circuit: 'closed',
    consecutiveFailures: 0,
    lastFailureAt: 0,
  };
}

export function recordFailure(state: RecoveryState): RecoveryState {
  const newFailures = state.consecutiveFailures + 1;
  const shouldOpen = newFailures >= state.config.failureThreshold;
  return {
    ...state,
    circuit: shouldOpen ? 'open' : state.circuit,
    consecutiveFailures: newFailures,
    lastFailureAt: Date.now(),
    totalRetries: state.totalRetries + 1,
  };
}

export function canAttempt(state: RecoveryState, now = Date.now()): boolean {
  if (state.circuit === 'closed') return true;
  if (state.circuit === 'open') {
    return now - state.lastFailureAt >= state.config.cooldownMs;
  }
  return true; // half_open
}

export function transitionCircuit(state: RecoveryState, now = Date.now()): RecoveryState {
  if (state.circuit === 'open' && now - state.lastFailureAt >= state.config.cooldownMs) {
    return { ...state, circuit: 'half_open' };
  }
  return state;
}

export function canRetry(state: RecoveryState, attempt: number): boolean {
  return attempt <= state.config.maxRetries;
}

export function recoveryHealth(state: RecoveryState): {
  circuit: CircuitState;
  consecutiveFailures: number;
  health: number;
} {
  const health = state.circuit === 'closed' ? 1 : state.circuit === 'half_open' ? 0.5 : 0;
  return { circuit: state.circuit, consecutiveFailures: state.consecutiveFailures, health };
}
