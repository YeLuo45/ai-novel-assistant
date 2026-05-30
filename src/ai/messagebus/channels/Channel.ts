/**
 * Channel Interface for Event-Driven Architecture
 * V42: nanobot-style async channel system
 */

import type { CollaborationEvent, Unsubscribe } from '../types'

/**
 * Channel interface for typed event publishing/subscribing
 */
export interface Channel {
  /** Channel name identifier */
  name: string
  
  /**
   * Publish an event to all subscribers
   */
  publish(event: CollaborationEvent): void
  
  /**
   * Subscribe to events on this channel
   * @returns Unsubscribe function
   */
  subscribe(handler: (event: CollaborationEvent) => void): Unsubscribe
  
  /**
   * Subscribe to an event only once
   * @returns Unsubscribe function
   */
  once(handler: (event: CollaborationEvent) => void): Unsubscribe
}

/**
 * Channel configuration options
 */
export interface ChannelOptions {
  /** Whether to enable event buffering */
  buffered?: boolean
  /** Maximum buffer size */
  bufferSize?: number
  /** Enable event logging */
  logging?: boolean
}

/**
 * Create a channel instance with common configuration
 */
export function createChannel(name: string, options?: ChannelOptions): Channel {
  return new InMemoryChannel(name, options)
}

/**
 * In-memory channel implementation
 */
export class InMemoryChannel implements Channel {
  name: string
  private handlers: Set<(event: CollaborationEvent) => void> = new Set()
  private onceHandlers: Set<(event: CollaborationEvent) => void> = new Set()
  private options: Required<ChannelOptions>

  constructor(name: string, options: ChannelOptions = {}) {
    this.name = name
    this.options = {
      buffered: options.buffered ?? false,
      bufferSize: options.bufferSize ?? 100,
      logging: options.logging ?? false
    }
  }

  publish(event: CollaborationEvent): void {
    if (this.options.logging) {
      console.debug(`[Channel:${this.name}] Publishing:`, event.type)
    }

    // Process regular handlers
    const handlersCopy = Array.from(this.handlers)
    for (const handler of handlersCopy) {
      try {
        handler(event)
      } catch (err) {
        console.error(`[Channel:${this.name}] Handler error:`, err)
      }
    }

    // Process once handlers and remove them
    const onceCopy = Array.from(this.onceHandlers)
    this.onceHandlers.clear()
    for (const handler of onceCopy) {
      try {
        handler(event)
      } catch (err) {
        console.error(`[Channel:${this.name}] Once handler error:`, err)
      }
    }
  }

  subscribe(handler: (event: CollaborationEvent) => void): Unsubscribe {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  once(handler: (event: CollaborationEvent) => void): Unsubscribe {
    this.onceHandlers.add(handler)
    return () => {
      this.onceHandlers.delete(handler)
    }
  }

  /** Get the number of subscribers */
  getSubscriberCount(): number {
    return this.handlers.size
  }
}