/**
 * ChannelRegistry - Global Channel Registration and Discovery
 * V42: Auto-discovers and manages all channel instances
 */

import { Channel, InMemoryChannel } from './Channel'
import type { CollaborationEvent } from '../types'

/**
 * Registry for managing all channels
 */
export class ChannelRegistry {
  private channels: Map<string, Channel> = new Map()
  private static instance: ChannelRegistry | null = null

  /**
   * Get the singleton instance
   */
  static getInstance(): ChannelRegistry {
    if (!ChannelRegistry.instance) {
      ChannelRegistry.instance = new ChannelRegistry()
    }
    return ChannelRegistry.instance
  }

  /**
   * Register a channel
   */
  register(channel: Channel): void {
    if (this.channels.has(channel.name)) {
      console.warn(`[ChannelRegistry] Channel "${channel.name}" already registered, skipping`)
      return
    }
    this.channels.set(channel.name, channel)
  }

  /**
   * Unregister a channel by name
   */
  unregister(name: string): boolean {
    return this.channels.delete(name)
  }

  /**
   * Get a channel by name
   */
  get(name: string): Channel | undefined {
    return this.channels.get(name)
  }

  /**
   * Check if a channel exists
   */
  has(name: string): boolean {
    return this.channels.has(name)
  }

  /**
   * Get all channel names
   */
  getChannelNames(): string[] {
    return Array.from(this.channels.keys())
  }

  /**
   * Get all channels
   */
  getChannels(): Channel[] {
    return Array.from(this.channels.values())
  }

  /**
   * Publish an event to a specific channel
   */
  publish(channelName: string, event: CollaborationEvent): boolean {
    const channel = this.channels.get(channelName)
    if (!channel) {
      console.warn(`[ChannelRegistry] Channel "${channelName}" not found`)
      return false
    }
    channel.publish(event)
    return true
  }

  /**
   * Broadcast an event to all channels
   */
  broadcast(event: CollaborationEvent): void {
    for (const channel of Array.from(this.channels.values())) {
      channel.publish(event)
    }
  }

  /**
   * Create and register a new channel
   */
  createChannel(name: string): Channel {
    const channel = new InMemoryChannel(name)
    this.register(channel)
    return channel
  }

  /**
   * Clear all channels
   */
  clear(): void {
    this.channels.clear()
  }

  /**
   * Get the total number of channels
   */
  count(): number {
    return this.channels.size
  }

  /**
   * Discover and load built-in channels
   * This method is called automatically during initialization
   */
  async discover(): Promise<void> {
    // Built-in channels are imported statically
    // This method can be extended for dynamic discovery
    const builtInChannels = [
      'write',
      'chapter', 
      'dialogue',
      'review',
      'agent'
    ]

    // Register channel singletons if not already registered
    for (const name of builtInChannels) {
      if (!this.has(name)) {
        this.createChannel(name)
      }
    }
  }
}

// Export singleton instance
export const channelRegistry = ChannelRegistry.getInstance()

export default channelRegistry