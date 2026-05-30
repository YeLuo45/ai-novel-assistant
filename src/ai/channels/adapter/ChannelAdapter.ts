import type { ChannelAdapter, OutboundMessage, InboundMessage, ChannelType } from '../types';

/**
 * Base channel adapter implementing common functionality
 */
export abstract class BaseChannelAdapter implements ChannelAdapter {
  abstract readonly channel: ChannelType;
  abstract readonly webhookPath: string;
  protected _enabled: boolean = false;

  constructor(enabled: boolean = false) {
    this._enabled = enabled;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }

  abstract sendMessage(msg: OutboundMessage): Promise<void>;
  abstract parseInbound(payload: unknown): InboundMessage;
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate inbound payload structure
 */
export function validatePayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null;
}