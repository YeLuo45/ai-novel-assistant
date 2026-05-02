/**
 * Thinking 配置适配器
 * 将 ThinkingConfig 转换为各 Provider 所需的格式
 */

import type { ThinkingConfig, ThinkingCapability } from './types'
import { getModel } from './providers'

/**
 * Thinking 参数输出格式
 */
export interface ThinkingParams {
  provider: string
  body: Record<string, unknown>
}

/**
 * 检查模型是否支持 Thinking
 */
export function modelSupportsThinking(modelId: string): boolean {
  const model = getModel(modelId)
  return model?.thinking?.supported ?? false
}

/**
 * 获取模型的 Thinking 能力
 */
export function getThinkingCapability(modelId: string): ThinkingCapability | undefined {
  const model = getModel(modelId)
  return model?.thinking
}

/**
 * 验证并修正 Thinking 配置
 */
export function normalizeThinkingConfig(
  modelId: string,
  config?: ThinkingConfig
): ThinkingConfig | undefined {
  if (!config || !config.enabled) {
    return undefined
  }

  const capability = getThinkingCapability(modelId)
  if (!capability?.supported) {
    return undefined
  }

  // 验证 budgetTokens 范围
  let budgetTokens = config.budgetTokens ?? capability.defaultBudgetTokens ?? 4000
  const minBudget = capability.minBudgetTokens ?? 1024
  const maxBudget = capability.maxBudgetTokens ?? 32000
  budgetTokens = Math.max(minBudget, Math.min(maxBudget, budgetTokens))

  return {
    enabled: true,
    budgetTokens
  }
}

/**
 * 为 Anthropic 格式生成 Thinking 参数
 */
export function adaptThinkingForAnthropic(
  config: ThinkingConfig,
  capability: ThinkingCapability
): ThinkingParams {
  return {
    provider: 'anthropic',
    body: {
      thinking: {
        type: 'enabled',
        budget_tokens: config.budgetTokens ?? capability.defaultBudgetTokens
      }
    }
  }
}

/**
 * 为 OpenAI 兼容格式生成 Thinking 参数（如果有）
 */
export function adaptThinkingForOpenAI(
  _config: ThinkingConfig,
  _capability: ThinkingCapability
): ThinkingParams | undefined {
  // OpenAI 官方目前没有 Thinking API，部分第三方可能支持
  // 返回 undefined 表示不支持
  return undefined
}

/**
 * 为 MiniMax 格式生成 Thinking 参数
 */
export function adaptThinkingForMiniMax(
  config: ThinkingConfig,
  _capability: ThinkingCapability
): ThinkingParams {
  return {
    provider: 'minimax',
    body: {
      extra: {
        thinking: {
          type: 'step',
          budget: config.budgetTokens ?? 4000
        }
      }
    }
  }
}

/**
 * 通用 Thinking 配置适配器
 */
export function adaptThinking(
  modelId: string,
  config: ThinkingConfig
): ThinkingParams | undefined {
  if (!config.enabled) {
    return undefined
  }

  const capability = getThinkingCapability(modelId)
  if (!capability?.supported) {
    return undefined
  }

  // 根据 provider 类型选择适配方式
  const model = getModel(modelId)
  if (!model) {
    return undefined
  }

  switch (model.provider) {
    case 'anthropic':
      return adaptThinkingForAnthropic(config, capability)
    case 'minimax':
      return adaptThinkingForMiniMax(config, capability)
    case 'openai':
    case 'deepseek':
    case 'siliconflow':
      return adaptThinkingForOpenAI(config, capability)
    default:
      return undefined
  }
}
