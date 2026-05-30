// Channel types for multi-channel access system
export type ChannelType = 'http-webhook' | 'telegram' | 'email' | 'wecom' | 'feishu';

export interface InboundMessage {
  id: string;
  channel: ChannelType;
  timestamp: number;
  sender: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface OutboundMessage {
  id?: string;
  channel: ChannelType;
  recipient?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelAuth {
  type: 'none' | 'api-key' | 'oauth' | 'signature';
  credentials?: Record<string, string>;
}

export interface MessageHandler {
  channel: ChannelType;
  priority: number;
  handle(msg: InboundMessage): Promise<void>;
}

export interface ChannelConfig {
  id: string;
  name: string;
  channel: ChannelType;
  enabled: boolean;
  webhookPath: string;
  auth: ChannelAuth;
  handlers: MessageHandler[];
}

export interface ChannelAdapter {
  readonly channel: ChannelType;
  readonly enabled: boolean;
  readonly webhookPath: string;
  enable(): void;
  disable(): void;
  sendMessage(msg: OutboundMessage): Promise<void>;
  parseInbound(payload: unknown): InboundMessage;
}

export interface WebhookPayload {
  channel: ChannelType;
  timestamp: number;
  sender: string;
  content: string;
  signature?: string;
  raw?: unknown;
}