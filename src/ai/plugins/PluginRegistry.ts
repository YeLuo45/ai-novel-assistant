/**
 * PluginRegistry — 插件注册中心
 */

import type { Plugin, PluginStatus, ToolDefinition } from './types'
import { hookManager } from '../hooks/HookManager'

export class PluginRegistry {
  private plugins = new Map<string, Plugin>()
  private enabled = new Set<string>()

  async install(plugin: Plugin, autoEnable = true): Promise<void> {
    this.plugins.set(plugin.name, plugin)
    if (autoEnable) this.enabled.add(plugin.name)
    if (plugin.onInit) await plugin.onInit()
    if (plugin.hooks) {
      for (const reg of plugin.hooks()) {
        hookManager.register(reg.type, reg.handler, 50)
      }
    }
    if (plugin.tools) {
      // Tools are registered via plugin-provided execute functions
      // ToolRegistry integration handled externally
    }
  }

  async uninstall(name: string): Promise<void> {
    this.plugins.delete(name)
    this.enabled.delete(name)
  }

  async enable(name: string): Promise<void> {
    this.enabled.add(name)
  }

  async disable(name: string): Promise<void> {
    this.enabled.delete(name)
  }

  isEnabled(name: string): boolean {
    return this.enabled.has(name)
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  listPlugins(): PluginStatus[] {
    return [...this.plugins.values()].map(p => ({
      name: p.name,
      version: p.version,
      enabled: this.enabled.has(p.name),
      loadedAt: Date.now()
    }))
  }
}

export const pluginRegistry = new PluginRegistry()