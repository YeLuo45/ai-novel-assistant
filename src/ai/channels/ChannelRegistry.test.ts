import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChannelRegistry } from './ChannelRegistry';
import { HttpWebhookAdapter } from './adapters/HttpWebhookAdapter';
import type { ChannelConfig } from './types';

describe('ChannelRegistry', () => {
  let registry: ChannelRegistry;

  beforeEach(() => {
    registry = new ChannelRegistry();
  });

  it('should register a channel', () => {
    const adapter = new HttpWebhookAdapter('https://example.com/webhook');
    const config: ChannelConfig = {
      id: 'test-channel',
      name: 'Test Channel',
      channel: 'http-webhook',
      enabled: false,
      webhookPath: '/api/webhooks/http-webhook',
      auth: { type: 'none' },
      handlers: [],
    };

    registry.register(config, adapter);
    expect(registry.get('test-channel')).toBeDefined();
    expect(registry.get('test-channel')?.name).toBe('Test Channel');
  });

  it('should unregister a channel', () => {
    const adapter = new HttpWebhookAdapter('https://example.com/webhook');
    const config: ChannelConfig = {
      id: 'test-channel',
      name: 'Test Channel',
      channel: 'http-webhook',
      enabled: false,
      webhookPath: '/api/webhooks/http-webhook',
      auth: { type: 'none' },
      handlers: [],
    };

    registry.register(config, adapter);
    registry.unregister('test-channel');
    expect(registry.get('test-channel')).toBeUndefined();
  });

  it('should enable and disable a channel', () => {
    const adapter = new HttpWebhookAdapter('https://example.com/webhook', false);
    const config: ChannelConfig = {
      id: 'test-channel',
      name: 'Test Channel',
      channel: 'http-webhook',
      enabled: false,
      webhookPath: '/api/webhooks/http-webhook',
      auth: { type: 'none' },
      handlers: [],
    };

    registry.register(config, adapter);
    expect(registry.enable('test-channel')).toBe(true);
    expect(adapter.enabled).toBe(true);

    expect(registry.disable('test-channel')).toBe(true);
    expect(adapter.enabled).toBe(false);
  });

  it('should list all channels', () => {
    const adapter = new HttpWebhookAdapter('https://example.com/webhook');
    const config: ChannelConfig = {
      id: 'test-channel',
      name: 'Test Channel',
      channel: 'http-webhook',
      enabled: false,
      webhookPath: '/api/webhooks/http-webhook',
      auth: { type: 'none' },
      handlers: [],
    };

    registry.register(config, adapter);
    expect(registry.list()).toContain('test-channel');
  });

  it('should list only enabled channels', () => {
    const adapter1 = new HttpWebhookAdapter('https://example.com/webhook', true);
    const adapter2 = new HttpWebhookAdapter('https://example.com/webhook2', false);
    const config1: ChannelConfig = {
      id: 'channel-1',
      name: 'Channel 1',
      channel: 'http-webhook',
      enabled: true,
      webhookPath: '/api/webhooks/1',
      auth: { type: 'none' },
      handlers: [],
    };
    const config2: ChannelConfig = {
      id: 'channel-2',
      name: 'Channel 2',
      channel: 'http-webhook',
      enabled: false,
      webhookPath: '/api/webhooks/2',
      auth: { type: 'none' },
      handlers: [],
    };

    registry.register(config1, adapter1);
    registry.register(config2, adapter2);

    const enabled = registry.listEnabled();
    expect(enabled).toContain('channel-1');
    expect(enabled).not.toContain('channel-2');
  });

  it('should find config by channel type', () => {
    const adapter = new HttpWebhookAdapter('https://example.com/webhook');
    const config: ChannelConfig = {
      id: 'test-channel',
      name: 'Test Channel',
      channel: 'http-webhook',
      enabled: false,
      webhookPath: '/api/webhooks/http-webhook',
      auth: { type: 'none' },
      handlers: [],
    };

    registry.register(config, adapter);
    const found = registry.findByChannel('http-webhook');
    expect(found).toBeDefined();
    expect(found?.id).toBe('test-channel');
  });

  it('should return undefined for non-existent channel', () => {
    expect(registry.get('non-existent')).toBeUndefined();
  });
});