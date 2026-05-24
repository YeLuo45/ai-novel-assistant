import type { InboundMessage, MessageHandler, ChannelType } from './types';

/**
 * Message router for distributing inbound messages to appropriate handlers
 */
export class MessageRouter {
  private handlers: Map<ChannelType, MessageHandler[]> = new Map();

  /**
   * Register a message handler for a channel
   */
  registerHandler(handler: MessageHandler): void {
    const existing = this.handlers.get(handler.channel) || [];
    existing.push(handler);
    existing.sort((a, b) => b.priority - a.priority);
    this.handlers.set(handler.channel, existing);
  }

  /**
   * Unregister all handlers for a channel
   */
  unregisterChannel(channel: ChannelType): void {
    this.handlers.delete(channel);
  }

  /**
   * Route an inbound message to all registered handlers
   */
  async route(msg: InboundMessage): Promise<void> {
    const handlers = this.handlers.get(msg.channel) || [];
    const promises = handlers.map(h => this.safeHandle(h, msg));
    await Promise.allSettled(promises);
  }

  /**
   * Safely invoke a handler, catching any errors
   */
  private async safeHandle(handler: MessageHandler, msg: InboundMessage): Promise<void> {
    try {
      await handler.handle(msg);
    } catch (error) {
      console.error(`Handler error for channel ${msg.channel}:`, error);
    }
  }

  /**
   * Get handler count for a channel
   */
  getHandlerCount(channel: ChannelType): number {
    return (this.handlers.get(channel) || []).length;
  }

  /**
   * Get all registered channel types
   */
  getChannels(): ChannelType[] {
    const channels: ChannelType[] = [];
    this.handlers.forEach((_, key) => channels.push(key));
    return channels;
  }
}

/**
 * Global router instance
 */
export const globalMessageRouter = new MessageRouter();