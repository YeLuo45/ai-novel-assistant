/**
 * Provider 注册表
 * 支持 OpenAI / Anthropic / MiniMax / DeepSeek / SiliconFlow
 */

import type { ProviderConfig, ModelConfig, ModelCapabilities, ThinkingCapability } from './types'

// ============ Provider 默认配置 ============

export const PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    type: 'openai-compatible',
    defaultModel: 'gpt-4o-mini',
    models: []
  },

  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    type: 'anthropic-compatible',
    defaultModel: 'claude-sonnet-4-20250514',
    models: []
  },

  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    type: 'anthropic-compatible',
    defaultModel: 'abab5.5-chat',
    models: []
  },

  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    type: 'openai-compatible',
    defaultModel: 'deepseek-chat',
    models: []
  },

  siliconflow: {
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    type: 'openai-compatible',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    models: []
  }
}

// ============ 模型配置 ============

const TEXT_CAPABILITIES: ModelCapabilities = { text: true }

const THINKING_CAPABILITY: ThinkingCapability = {
  supported: true,
  minBudgetTokens: 1024,
  maxBudgetTokens: 32000,
  defaultBudgetTokens: 4000
}

export const MODELS: Record<string, ModelConfig> = {
  // OpenAI
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    capabilities: { ...TEXT_CAPABILITIES, vision: true, functionCalling: true, jsonMode: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true
  },
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    capabilities: { ...TEXT_CAPABILITIES, vision: true, functionCalling: true, jsonMode: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    capabilities: { ...TEXT_CAPABILITIES, vision: true, functionCalling: true, jsonMode: true },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    capabilities: { ...TEXT_CAPABILITIES, jsonMode: true },
    contextWindow: 16385,
    maxOutputTokens: 4096,
    supportsStreaming: true
  },

  // Anthropic
  'claude-sonnet-4-20250514': {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    name: 'Claude Sonnet 4',
    capabilities: { ...TEXT_CAPABILITIES, vision: true, functionCalling: true },
    thinking: { ...THINKING_CAPABILITY, minBudgetTokens: 1024, maxBudgetTokens: 20000 },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true
  },
  'claude-opus-4-20250514': {
    id: 'claude-opus-4-20250514',
    provider: 'anthropic',
    name: 'Claude Opus 4',
    capabilities: { ...TEXT_CAPABILITIES, vision: true, functionCalling: true },
    thinking: { ...THINKING_CAPABILITY, minBudgetTokens: 1024, maxBudgetTokens: 32000 },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true
  },
  'claude-3-5-sonnet-latest': {
    id: 'claude-3-5-sonnet-latest',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    capabilities: { ...TEXT_CAPABILITIES, vision: true },
    thinking: { ...THINKING_CAPABILITY, minBudgetTokens: 1024, maxBudgetTokens: 10000 },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    capabilities: { ...TEXT_CAPABILITIES, vision: true },
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true
  },

  // MiniMax
  'abab5.5-chat': {
    id: 'abab5.5-chat',
    provider: 'minimax',
    name: 'ABAB 5.5 Chat',
    capabilities: TEXT_CAPABILITIES,
    contextWindow: 245000,
    maxOutputTokens: 8000,
    supportsStreaming: true
  },
  'abab5.5s-chat': {
    id: 'abab5.5s-chat',
    provider: 'minimax',
    name: 'ABAB 5.5S Chat',
    capabilities: TEXT_CAPABILITIES,
    contextWindow: 245000,
    maxOutputTokens: 8000,
    supportsStreaming: true
  },

  // DeepSeek
  'deepseek-chat': {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    capabilities: { ...TEXT_CAPABILITIES, functionCalling: true },
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true
  },
  'deepseek-coder': {
    id: 'deepseek-coder',
    provider: 'deepseek',
    name: 'DeepSeek Coder',
    capabilities: TEXT_CAPABILITIES,
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true
  },

  // SiliconFlow
  'Qwen/Qwen2.5-7B-Instruct': {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    provider: 'siliconflow',
    name: 'Qwen 2.5 7B',
    capabilities: TEXT_CAPABILITIES,
    contextWindow: 32000,
    maxOutputTokens: 4096,
    supportsStreaming: true
  },
  'deepseek-ai/DeepSeek-V2.5': {
    id: 'deepseek-ai/DeepSeek-V2.5',
    provider: 'siliconflow',
    name: 'DeepSeek V2.5',
    capabilities: { ...TEXT_CAPABILITIES, functionCalling: true },
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true
  }
}

// ============ Provider 注册表操作 ============

export function getProvider(providerId: string): ProviderConfig | undefined {
  return PROVIDERS[providerId]
}

export function getModel(modelId: string): ModelConfig | undefined {
  return MODELS[modelId]
}

export function getProviderModels(providerId: string): ModelConfig[] {
  return Object.values(MODELS).filter(m => m.provider === providerId)
}

export function registerProvider(provider: ProviderConfig): void {
  const id = (provider as any).provider || provider.name.toLowerCase()
  PROVIDERS[id] = provider
}

export function registerModel(model: ModelConfig): void {
  MODELS[model.id] = model
}
