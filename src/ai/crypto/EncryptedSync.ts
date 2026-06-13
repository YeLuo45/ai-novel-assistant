// V2128 EncryptedSync - Direction A Iter 13/30
// 加密同步 - 端到端加密传输
// Source: nanobot (sync + crypto combo)

import { encrypt, decrypt } from '../crypto/AESGCMCipher';

export interface EncryptedMessage {
  senderId: string;
  ciphertext: string;
  aad: string;
  sentAt: number;
}

export interface EncryptedChannel {
  channelId: string;
  participants: string[];   // shared key hex per participant
  messages: EncryptedMessage[];
}

export interface EncryptedSyncState {
  channels: Map<string, EncryptedChannel>;
  localKeyHex: string;
}

export function createEncryptedSyncState(localKeyHex: string): EncryptedSyncState {
  return { channels: new Map(), localKeyHex };
}

/** Open a new channel with a set of participants sharing the same key */
export function openChannel(
  state: EncryptedSyncState,
  channelId: string,
  sharedKeyHex: string,
  participants: string[]
): EncryptedSyncState {
  const channel: EncryptedChannel = { channelId, participants, messages: [] };
  // Store shared key in state map keyed by channel id (in real impl, would be per-participant)
  const channels = new Map(state.channels);
  channels.set(channelId, channel);
  // Use sharedKeyHex as the channel key (mock: store in localKeyHex for now)
  return { channels, localKeyHex: sharedKeyHex };
}

/** Send an encrypted message on a channel */
export function sendEncrypted(
  state: EncryptedSyncState,
  channelId: string,
  senderId: string,
  plaintext: string,
  aad = ''
): EncryptedSyncState {
  const ch = state.channels.get(channelId);
  if (!ch) return state;
  const ct = encrypt(plaintext, state.localKeyHex, aad);
  const msg: EncryptedMessage = { senderId, ciphertext: ct, aad, sentAt: Date.now() };
  const updated: EncryptedChannel = { ...ch, messages: [...ch.messages, msg] };
  const channels = new Map(state.channels);
  channels.set(channelId, updated);
  return { ...state, channels };
}

/** Receive all messages from a channel as decrypted plaintext */
export function receiveAll(state: EncryptedSyncState, channelId: string): { senderId: string; plaintext: string; sentAt: number }[] {
  const ch = state.channels.get(channelId);
  if (!ch) return [];
  return ch.messages.map((m) => {
    try {
      const pt = decrypt(m.ciphertext, state.localKeyHex, m.aad);
      return { senderId: m.senderId, plaintext: pt, sentAt: m.sentAt };
    } catch {
      return { senderId: m.senderId, plaintext: '[decryption failed]', sentAt: m.sentAt };
    }
  });
}

/** Verify that a sender is in the channel participant list */
export function isParticipant(state: EncryptedSyncState, channelId: string, senderId: string): boolean {
  return state.channels.get(channelId)?.participants.includes(senderId) ?? false;
}

/** Count messages in a channel */
export function messageCount(state: EncryptedSyncState, channelId: string): number {
  return state.channels.get(channelId)?.messages.length ?? 0;
}

/** List all channel ids */
export function listChannels(state: EncryptedSyncState): string[] {
  return Array.from(state.channels.keys());
}

/** Sync health metric */
export function syncHealth(state: EncryptedSyncState): {
  channels: number;
  totalMessages: number;
  health: number;
} {
  const channels = state.channels.size;
  let total = 0;
  for (const ch of state.channels.values()) total += ch.messages.length;
  const health = channels > 0 && state.localKeyHex.length === 64 ? 1 : 0.5;
  return { channels, totalMessages: total, health };
}
