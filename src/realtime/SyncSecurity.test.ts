/**
 * realtime/SyncSecurity.test.ts (N21-N25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  MessageEncryption, AuthTokenManager, RoomMembership, PermissionSync, AuditBroadcast,
} from './SyncSecurity'
import type { TransportMessage } from './SyncTransport'

describe('N21: MessageEncryption', () => {
  it('none algo roundtrip', () => {
    const e = new MessageEncryption('none')
    const enc = e.encrypt('hello')
    expect(e.decrypt(enc)).toBe('hello')
  })

  it('xor algo roundtrip', () => {
    const e = new MessageEncryption('xor', 'key123')
    const enc = e.encrypt('hello world')
    expect(e.decrypt(enc)).toBe('hello world')
  })

  it('aes-gcm algo roundtrip', () => {
    const e = new MessageEncryption('aes-gcm', 'key123')
    const enc = e.encrypt('secret data')
    expect(e.decrypt(enc)).toBe('secret data')
    expect(enc.authTag).toBe('mock-tag')
  })

  it('wrap + unwrap', () => {
    const e = new MessageEncryption('xor', 'key')
    const msg: TransportMessage = { id: '1', type: 'op', senderId: 'a', payload: { x: 1 }, timestamp: 0 }
    const wrapped = e.wrap(msg)
    const unwrapped = e.unwrap(wrapped)
    expect(unwrapped.id).toBe('1')
  })
})

describe('N22: AuthToken', () => {
  const tm = new AuthTokenManager('secret', 60_000)

  it('issue + verify', () => {
    const t = tm.issue('u1', 'r1', ['read', 'write'])
    expect(tm.verify(t).valid).toBe(true)
  })

  it('expired', () => {
    const t = tm.issue('u1', 'r1')
    t.expiresAt = Date.now() - 1000
    expect(tm.verify(t).valid).toBe(false)
  })

  it('invalid signature', () => {
    const t = tm.issue('u1', 'r1')
    t.signature = 'fake-sig'
    expect(tm.verify(t).valid).toBe(false)
  })

  it('revoke', () => {
    const t = tm.issue('u1', 'r1')
    expect(tm.revoke(t.signature)).toBe(true)
  })

  it('hasPermission', () => {
    const t = tm.issue('u1', 'r1', ['read'])
    expect(tm.hasPermission(t, 'read')).toBe(true)
    expect(tm.hasPermission(t, 'write')).toBe(false)
  })
})

describe('N23: RoomMembership', () => {
  it('join + members', () => {
    const rm = new RoomMembership()
    rm.join('r1', 'u1', 'editor')
    rm.join('r1', 'u2', 'viewer')
    expect(rm.members('r1').length).toBe(2)
  })

  it('leave', () => {
    const rm = new RoomMembership()
    rm.join('r1', 'u1')
    expect(rm.leave('r1', 'u1')).toBe(true)
    expect(rm.members('r1').length).toBe(0)
  })

  it('roleOf + setRole', () => {
    const rm = new RoomMembership()
    rm.join('r1', 'u1', 'viewer')
    expect(rm.roleOf('r1', 'u1')).toBe('viewer')
    rm.setRole('r1', 'u1', 'editor')
    expect(rm.roleOf('r1', 'u1')).toBe('editor')
  })

  it('touch + roomsOf', () => {
    const rm = new RoomMembership()
    rm.join('r1', 'u1')
    rm.join('r2', 'u1')
    expect(rm.roomsOf('u1')).toEqual(['r1', 'r2'])
  })
})

describe('N24: PermissionSync', () => {
  it('define + get + has', () => {
    const ps = new PermissionSync()
    ps.define('editor', ['read', 'write'])
    expect(ps.get('editor')).toEqual(['read', 'write'])
    expect(ps.has('editor', 'read')).toBe(true)
  })

  it('syncToRoom', () => {
    const ps = new PermissionSync()
    ps.define('editor', ['read', 'write'])
    ps.define('viewer', ['read'])
    const out = ps.syncToRoom([
      { userId: 'u1', role: 'editor' },
      { userId: 'u2', role: 'viewer' },
    ])
    expect(out[0].perms).toContain('write')
    expect(out[1].perms).not.toContain('write')
  })

  it('can', () => {
    const ps = new PermissionSync()
    ps.define('admin', ['delete'])
    expect(ps.can('admin', 'delete')).toBe(true)
  })
})

describe('N25: AuditBroadcast', () => {
  it('emit + byType', () => {
    const ab = new AuditBroadcast()
    ab.emit('login', 'u1', 'r1', 'logged in')
    ab.emit('edit', 'u1', 'r1', 'updated ch1')
    expect(ab.byType('login').length).toBe(1)
    expect(ab.byType('edit').length).toBe(1)
  })

  it('byRoom + byUser', () => {
    const ab = new AuditBroadcast()
    ab.emit('login', 'u1', 'r1', 'x')
    ab.emit('edit', 'u2', 'r2', 'y')
    expect(ab.byRoom('r1').length).toBe(1)
    expect(ab.byUser('u2').length).toBe(1)
  })

  it('subscribe + recent', () => {
    const ab = new AuditBroadcast()
    let called = 0
    ab.subscribe(() => { called += 1 })
    ab.emit('login', 'u1', 'r1', 'x')
    expect(called).toBe(1)
    expect(ab.recent().length).toBe(1)
  })
})