/**
 * Plugin 系统类型定义
 */

import type { HookRegistration } from '../hooks/types'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  execute(params: Record<string, unknown>): Promise<unknown>
}

export interface Plugin {
  name: string
  version: string
  description?: string
  onInit?(): Promise<void>
  tools?(): ToolDefinition[]
  hooks?(): Omit<HookRegistration, 'priority'>[]
}

export interface PluginStatus {
  name: string
  version: string
  enabled: boolean
  loadedAt: number
}