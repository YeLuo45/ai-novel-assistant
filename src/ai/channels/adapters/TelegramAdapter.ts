import { BaseChannelAdapter, generateMessageId } from '../adapter/ChannelAdapter';
import type { OutboundMessage, InboundMessage } from '../../channels/types';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

export class TelegramAdapter extends BaseChannelAdapter {
  readonly channel = 'telegram' as const;
  readonly webhookPath = '/api/webhooks/telegram';
  private botToken: string;
  private apiBase: string;

  constructor(botToken: string, enabled: boolean = false) {
    super(enabled);
    this.botToken = botToken;
    this.apiBase = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(msg: OutboundMessage): Promise<void> {
    const chatId = msg.recipient || '';
    const response = await fetch(`${this.apiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg.content,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { description?: string };
      throw new Error(`Telegram send failed: ${error.description || response.statusText}`);
    }
  }

  parseInbound(payload: unknown): InboundMessage {
    const update = payload as TelegramUpdate;
    const msg = update.message;

    return {
      id: `tg_${update.update_id}`,
      channel: this.channel,
      timestamp: msg?.date ? msg.date * 1000 : Date.now(),
      sender: msg?.from?.username || String(msg?.from?.id || 'unknown'),
      content: msg?.text || '',
      metadata: {
        chatId: msg?.chat?.id,
        messageId: msg?.message_id,
        chatType: msg?.chat?.type,
      },
    };
  }
}