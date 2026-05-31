/**
 * LLM 调用重试机制
 */

import type { LLMRetryOptions } from './types'
import { DEFAULT_RETRY_OPTIONS } from './types'

export interface RetryState {
  attempt: number
  lastError?: Error
  totalDuration: number
}

export type RetryPredicate = (error: Error, attempt: number, options: Required<LLMRetryOptions>) => boolean

/**
 * 判断错误是否应该重试
 */
export function shouldRetry(
  error: Error,
  attempt: number,
  options: Required<LLMRetryOptions>
): boolean {
  // 超过最大重试次数
  if (attempt >= options.maxRetries) {
    return false
  }

  // 网络错误通常可以重试
  if (error.message.includes('fetch failed') || error.message.includes('network')) {
    return true
  }

  // 超时可以重试
  if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
    return true
  }

  return false
}

/**
 * 指数退避延迟
 */
export function getRetryDelay(attempt: number, baseDelay: number): number {
  // 指数退避: 1s, 2s, 4s, 8s...
  return Math.min(baseDelay * Math.pow(2, attempt), 30000) // 最多30秒
}

/**
 * 带重试的 LLM 调用
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: LLMRetryOptions = {},
  predicate: RetryPredicate = shouldRetry
): Promise<T> {
  const opts: Required<LLMRetryOptions> = {
    maxRetries: options.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries,
    retryDelay: options.retryDelay ?? DEFAULT_RETRY_OPTIONS.retryDelay,
    retryableStatuses: options.retryableStatuses ?? DEFAULT_RETRY_OPTIONS.retryableStatuses,
    onRetry: options.onRetry ?? DEFAULT_RETRY_OPTIONS.onRetry
  }

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < opts.maxRetries && predicate(lastError, attempt, opts)) {
        const delay = getRetryDelay(attempt, opts.retryDelay)
        opts.onRetry(attempt + 1, lastError)
        await sleep(delay)
      } else if (attempt >= opts.maxRetries) {
        break
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建重试状态跟踪器
 */
export function createRetryState(): RetryState {
  return {
    attempt: 0,
    totalDuration: 0
  }
}

/**
 * 更新重试状态
 */
export function updateRetryState(
  state: RetryState,
  error?: Error
): RetryState {
  const duration = Date.now() - state.totalDuration
  return {
    attempt: state.attempt + 1,
    lastError: error,
    totalDuration: duration
  }
}
