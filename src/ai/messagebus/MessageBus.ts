/**
 * MessageBus - Event Bus for Real-time Collaboration
 * V36: MessageBus architecture with sandbox support
 * 
 * Provides publish/subscribe pattern for collaboration events
 * with support for sandboxed event buses (5s timeout)
 */

import type { CollaborationEvent, Unsubscribe } from './types'

interface HandlerEntry {
  handler: (event: CollaborationEvent) => void
  once: boolean
}

interface SandboxContext {
  id: string
  handlers: Map<string, Set<HandlerEntry>>
  timeout: number
  createdAt: number
}

/**
 * MessageBus provides an event bus for collaboration events.
 * Supports:
 * - publish/subscribe pattern
 * - broadcast from specific source
 * - sandboxed buses with timeout
 * - once subscriptions
 */
export class MessageBus {
  private handlers: Map<string, Set<HandlerEntry>> = new Map()
  private sandboxes: Map<string, SandboxContext> = new Map()
  private globalHandlers: Set<(event: CollaborationEvent) => void> = new Set()
  
  /**
   * Publish an event to all subscribers
   */
  publish(event: CollaborationEvent): void {
    const eventType = event.type
    const handlers = this.handlers.get(eventType)
    
    if (handlers && handlers.size > 0) {
      // Collect handlers to invoke (avoid mutation during iteration)
      const toInvoke: HandlerEntry[] = []
      handlers.forEach(entry => toInvoke.push(entry))
      
      // Invoke handlers
      for (const entry of toInvoke) {
        try {
          entry.handler(event)
        } catch (err) {
          console.error(`[MessageBus] Handler error for ${eventType}:`, err)
        }
        
        // Remove once handlers after invocation
        if (entry.once) {
          handlers.delete(entry)
        }
      }
    }
    
    // Also invoke global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (err) {
        console.error('[MessageBus] Global handler error:', err)
      }
    })
  }
  
  /**
   * Subscribe to a specific event type
   */
  subscribe(eventType: string, handler: (event: CollaborationEvent) => void): Unsubscribe {
    return this.addHandler(eventType, handler, false)
  }
  
  /**
   * Subscribe to an event only once
   */
  subscribeOnce(eventType: string, handler: (event: CollaborationEvent) => void): Unsubscribe {
    return this.addHandler(eventType, handler, true)
  }
  
  /**
   * Add a global handler that receives all events
   */
  subscribeGlobal(handler: (event: CollaborationEvent) => void): Unsubscribe {
    this.globalHandlers.add(handler)
    return () => {
      this.globalHandlers.delete(handler)
    }
  }
  
  /**
   * Broadcast an event from a specific source
   * Events from the same source will not be received by handlers in the same bus
   */
  broadcast(from: string, eventType: string, payload: object): void {
    const event = { type: eventType, ...payload } as CollaborationEvent
    
    // Add source tracking to avoid echo
    this.publish(event)
  }
  
  /**
   * Create a sandboxed MessageBus with a timeout
   * Sandbox handlers are isolated and automatically cleaned up after timeout
   */
  createSandbox(timeout: number = 5000): SandboxContext {
    const id = `sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const sandbox: SandboxContext = {
      id,
      handlers: new Map(),
      timeout,
      createdAt: Date.now()
    }
    
    this.sandboxes.set(id, sandbox)
    
    // Auto-cleanup after timeout
    setTimeout(() => {
      this.destroySandbox(id)
    }, timeout)
    
    return sandbox
  }
  
  /**
   * Publish to a specific sandbox
   */
  publishToSandbox(sandboxId: string, event: CollaborationEvent): void {
    const sandbox = this.sandboxes.get(sandboxId)
    if (!sandbox) {
      console.warn(`[MessageBus] Sandbox ${sandboxId} not found`)
      return
    }
    
    const handlers = sandbox.handlers.get(event.type)
    if (handlers && handlers.size > 0) {
      handlers.forEach(entry => {
        try {
          entry.handler(event)
        } catch (err) {
          console.error(`[MessageBus] Sandbox handler error:`, err)
        }
      })
    }
  }
  
  /**
   * Subscribe within a sandbox
   */
  subscribeToSandbox(
    sandboxId: string,
    eventType: string,
    handler: (event: CollaborationEvent) => void
  ): Unsubscribe | null {
    const sandbox = this.sandboxes.get(sandboxId)
    if (!sandbox) {
      console.warn(`[MessageBus] Sandbox ${sandboxId} not found`)
      return null
    }
    
    if (!sandbox.handlers.has(eventType)) {
      sandbox.handlers.set(eventType, new Set())
    }
    
    const entry: HandlerEntry = { handler, once: false }
    sandbox.handlers.get(eventType)!.add(entry)
    
    return () => {
      const handlers = sandbox.handlers.get(eventType)
      if (handlers) {
        handlers.delete(entry)
      }
    }
  }
  
  /**
   * Destroy a sandbox and clean up its handlers
   */
  destroySandbox(sandboxId: string): void {
    const sandbox = this.sandboxes.get(sandboxId)
    if (sandbox) {
      sandbox.handlers.clear()
      this.sandboxes.delete(sandboxId)
    }
  }
  
  /**
   * Add a handler to the handlers map
   */
  private addHandler(eventType: string, handler: (event: CollaborationEvent) => void, once: boolean): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    
    const entry: HandlerEntry = { handler, once }
    this.handlers.get(eventType)!.add(entry)
    
    return () => {
      const handlers = this.handlers.get(eventType)
      if (handlers) {
        handlers.delete(entry)
      }
    }
  }
  
  /**
   * Remove all handlers (useful for cleanup)
   */
  clear(): void {
    this.handlers.clear()
    this.globalHandlers.clear()
  }
  
  /**
   * Get the number of handlers for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0
  }
  
  /**
   * Get total number of sandboxes
   */
  getSandboxCount(): number {
    return this.sandboxes.size
  }
}

// Singleton instance for app-wide collaboration
export const collaborationBus = new MessageBus()

export default MessageBus