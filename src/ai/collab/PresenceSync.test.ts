import { describe, it, expect } from 'vitest';
import { createPresenceState, updatePresence, setCursor, setSelection, setStatus, getPresence, onlineUsers, presenceHealth } from './PresenceSync';

describe('V2213 PresenceSync', () => {
  it('should create empty state', () => {
    const s = createPresenceState();
    expect(s.presences.size).toBe(0);
  });

  it('should update presence', () => {
    let s = createPresenceState();
    s = updatePresence(s, 'alice', { status: 'online' });
    expect(s.presences.size).toBe(1);
  });

  it('should set cursor', () => {
    let s = createPresenceState();
    s = setCursor(s, 'alice', 100, 200);
    expect(s.presences.get('alice')?.cursor).toEqual({ x: 100, y: 200 });
  });

  it('should set selection', () => {
    let s = createPresenceState();
    s = setSelection(s, 'alice', 'chapter-1');
    expect(s.presences.get('alice')?.selection).toBe('chapter-1');
  });

  it('should set status', () => {
    let s = createPresenceState();
    s = setStatus(s, 'alice', 'idle');
    expect(s.presences.get('alice')?.status).toBe('idle');
  });

  it('should get presence', () => {
    let s = createPresenceState();
    s = updatePresence(s, 'alice', { status: 'online' });
    expect(getPresence(s, 'alice')?.userId).toBe('alice');
  });

  it('should return undefined for unknown user', () => {
    const s = createPresenceState();
    expect(getPresence(s, 'unknown')).toBeUndefined();
  });

  it('should list online users', () => {
    let s = createPresenceState();
    s = setStatus(s, 'alice', 'online');
    s = setStatus(s, 'bob', 'offline');
    expect(onlineUsers(s)).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createPresenceState();
    s = updatePresence(s, 'alice', { status: 'online' });
    const h = presenceHealth(s);
    expect(h.health).toBe(1);
  });
});
