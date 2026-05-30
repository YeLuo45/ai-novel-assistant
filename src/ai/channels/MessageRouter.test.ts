import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageRouter } from './MessageRouter';
import type { InboundMessage, MessageHandler } from './types';

describe('MessageRouter', () => {
  let router: MessageRouter;

  beforeEach(() => {
    router = new MessageRouter();
  });

  it('should register a handler', () => {
    const handler: MessageHandler = {
      channel: 'http-webhook',
      priority: 1,
      handle: vi.fn(),
    };

    router.registerHandler(handler);
    expect(router.getHandlerCount('http-webhook')).toBe(1);
  });

  it('should route message to handler', async () => {
    const handleFn = vi.fn().mockResolvedValue(undefined);
    const handler: MessageHandler = {
      channel: 'http-webhook',
      priority: 1,
      handle: handleFn,
    };

    router.registerHandler(handler);

    const msg: InboundMessage = {
      id: 'test-1',
      channel: 'http-webhook',
      timestamp: Date.now(),
      sender: 'test-sender',
      content: 'Hello',
    };

    await router.route(msg);
    expect(handleFn).toHaveBeenCalledWith(msg);
  });

  it('should handle multiple handlers for same channel', async () => {
    const handleFn1 = vi.fn().mockResolvedValue(undefined);
    const handleFn2 = vi.fn().mockResolvedValue(undefined);

    const handler1: MessageHandler = {
      channel: 'http-webhook',
      priority: 2,
      handle: handleFn1,
    };
    const handler2: MessageHandler = {
      channel: 'http-webhook',
      priority: 1,
      handle: handleFn2,
    };

    router.registerHandler(handler1);
    router.registerHandler(handler2);

    const msg: InboundMessage = {
      id: 'test-1',
      channel: 'http-webhook',
      timestamp: Date.now(),
      sender: 'test-sender',
      content: 'Hello',
    };

    await router.route(msg);
    expect(handleFn1).toHaveBeenCalled();
    expect(handleFn2).toHaveBeenCalled();
  });

  it('should unregister channel handlers', () => {
    const handler: MessageHandler = {
      channel: 'http-webhook',
      priority: 1,
      handle: vi.fn(),
    };

    router.registerHandler(handler);
    expect(router.getHandlerCount('http-webhook')).toBe(1);

    router.unregisterChannel('http-webhook');
    expect(router.getHandlerCount('http-webhook')).toBe(0);
  });

  it('should get all registered channels', () => {
    const handler1: MessageHandler = {
      channel: 'http-webhook',
      priority: 1,
      handle: vi.fn(),
    };
    const handler2: MessageHandler = {
      channel: 'telegram',
      priority: 1,
      handle: vi.fn(),
    };

    router.registerHandler(handler1);
    router.registerHandler(handler2);

    const channels = router.getChannels();
    expect(channels).toContain('http-webhook');
    expect(channels).toContain('telegram');
  });

  it('should handle handler errors gracefully', async () => {
    const errorHandler: MessageHandler = {
      channel: 'http-webhook',
      priority: 1,
      handle: vi.fn().mockRejectedValue(new Error('Handler error')),
    };

    router.registerHandler(errorHandler);

    const msg: InboundMessage = {
      id: 'test-1',
      channel: 'http-webhook',
      timestamp: Date.now(),
      sender: 'test-sender',
      content: 'Hello',
    };

    // Should not throw
    await expect(router.route(msg)).resolves.not.toThrow();
  });
});