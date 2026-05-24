import type { ChannelConfig, MessageHandler, InboundMessage, ChannelAdapter, OutboundMessage } from './types';

/**
 * Channel registry managing all registered channels
 */
export class ChannelRegistry {
  private channels: Map<string, ChannelConfig> = new Map();
  private adapters: Map<string, ChannelAdapter> = new Map();

  /**
   * Register a new channel adapter
   */
  register(config: ChannelConfig, adapter: ChannelAdapter): void {
    this.channels.set(config.id, config);
    this.adapters.set(config.id, adapter);
  }

  /**
   * Unregister a channel
   */
  unregister(channelId: string): void {
    this.channels.delete(channelId);
    this.adapters.delete(channelId);
  }

  /**
   * Enable a channel
   */
  enable(channelId: string): boolean {
    const adapter = this.adapters.get(channelId);
    if (adapter) {
      adapter.enable();
      const config = this.channels.get(channelId);
      if (config) {
        config.enabled = true;
      }
      return true;
    }
    return false;
  }

  /**
   * Disable a channel
   */
  disable(channelId: string): boolean {
    const adapter = this.adapters.get(channelId);
    if (adapter) {
      adapter.disable();
      const config = this.channels.get(channelId);
      if (config) {
        config.enabled = false;
      }
      return true;
    }
    return false;
  }

  /**
   * Get channel config by ID
   */
  get(channelId: string): ChannelConfig | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Get all registered channel IDs
   */
  list(): string[] {
    const ids: string[] = [];
    this.channels.forEach((_, key) => ids.push(key));
    return ids;
  }

  /**
   * Get all enabled channels
   */
  listEnabled(): string[] {
    const ids: string[] = [];
    this.channels.forEach((config, key) => {
      if (config.enabled) ids.push(key);
    });
    return ids;
  }

  /**
   * Get adapter for a channel
   */
  getAdapter(channelId: string): ChannelAdapter | undefined {
    return this.adapters.get(channelId);
  }

  /**
   * Find config by channel type
   */
  findByChannel(channelType: string): ChannelConfig | undefined {
    const channelArray = Array.from(this.channels.values());
    for (const config of channelArray) {
      if (config.channel === channelType) {
        return config;
      }
    }
    return undefined;
  }
}

/**
 * Global registry instance
 */
export const globalChannelRegistry = new ChannelRegistry();