import { describe, it, expect } from 'vitest';
import {
  createEncryptedSyncState,
  openChannel,
  sendEncrypted,
  receiveAll,
  isParticipant,
  messageCount,
  listChannels,
  syncHealth,
} from './EncryptedSync';

describe('V2128 EncryptedSync', () => {
  it('should create empty sync state', () => {
    const s = createEncryptedSyncState('0'.repeat(64));
    expect(s.channels.size).toBe(0);
  });

  it('should open a channel with participants', () => {
    const s = openChannel(createEncryptedSyncState('0'.repeat(64)), 'c1', 'a'.repeat(64), ['alice', 'bob']);
    expect(listChannels(s)).toEqual(['c1']);
  });

  it('should send and receive encrypted messages', () => {
    let s = createEncryptedSyncState('a'.repeat(64));
    s = openChannel(s, 'c1', 'a'.repeat(64), ['alice', 'bob']);
    s = sendEncrypted(s, 'c1', 'alice', 'hello bob');
    s = sendEncrypted(s, 'c1', 'bob', 'hi alice');
    const received = receiveAll(s, 'c1');
    expect(received).toHaveLength(2);
    expect(received[0].plaintext).toBe('hello bob');
    expect(received[1].plaintext).toBe('hi alice');
  });

  it('should verify participant membership', () => {
    let s = createEncryptedSyncState('a'.repeat(64));
    s = openChannel(s, 'c1', 'a'.repeat(64), ['alice']);
    expect(isParticipant(s, 'c1', 'alice')).toBe(true);
    expect(isParticipant(s, 'c1', 'eve')).toBe(false);
  });

  it('should return false for unknown channel', () => {
    const s = createEncryptedSyncState('a'.repeat(64));
    expect(isParticipant(s, 'unknown', 'alice')).toBe(false);
  });

  it('should count messages', () => {
    let s = createEncryptedSyncState('a'.repeat(64));
    s = openChannel(s, 'c1', 'a'.repeat(64), ['a']);
    s = sendEncrypted(s, 'c1', 'a', '1');
    s = sendEncrypted(s, 'c1', 'a', '2');
    expect(messageCount(s, 'c1')).toBe(2);
  });

  it('should compute sync health', () => {
    let s = createEncryptedSyncState('a'.repeat(64));
    s = openChannel(s, 'c1', 'a'.repeat(64), ['a']);
    s = sendEncrypted(s, 'c1', 'a', 'x');
    const h = syncHealth(s);
    expect(h.channels).toBe(1);
    expect(h.totalMessages).toBe(1);
    expect(h.health).toBe(1);
  });

  it('should return decryption failed for wrong key', () => {
    let s = createEncryptedSyncState('a'.repeat(64));
    s = openChannel(s, 'c1', 'a'.repeat(64), ['a']);
    s = sendEncrypted(s, 'c1', 'a', 'x');
    s = { ...s, localKeyHex: 'b'.repeat(64) };
    const received = receiveAll(s, 'c1');
    expect(received[0].plaintext).toBe('[decryption failed]');
  });

  it('should return empty list for unknown channel', () => {
    const s = createEncryptedSyncState('a'.repeat(64));
    expect(receiveAll(s, 'unknown')).toEqual([]);
  });
});
