import { BaseChannelAdapter, generateMessageId } from '../adapter/ChannelAdapter';
import type { OutboundMessage } from '../../channels/types';

export class HttpWebhookAdapter extends BaseChannelAdapter {
  readonly channel = 'http-webhook' as const;
  readonly webhookPath = '/api/webhooks/http-webhook';
  private webhookUrl: string;

  constructor(webhookUrl: string, enabled: boolean = false) {
    super(enabled);
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(msg: OutboundMessage): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Channels-Adapter': 'ai-novel-assistant',
      },
      body: JSON.stringify({
        id: msg.id || generateMessageId(),
        channel: this.channel,
        recipient: msg.recipient,
        content: msg.content,
        metadata: msg.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  parseInbound(payload: unknown): import('../../channels/types').InboundMessage {
    const p = payload as Record<string, unknown>;
    return {
      id: (p.id as string) || generateMessageId(),
      channel: this.channel,
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
      sender: (p.sender as string) || 'unknown',
      content: (p.content as string) || '',
      metadata: p.metadata as Record<string, unknown>,
    };
  }
}