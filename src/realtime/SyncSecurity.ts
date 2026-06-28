/**
 * realtime/SyncSecurity.ts (N21-N25) - 5 engines
 *
 * - N21 MessageEncryption: 消息加密
 * - N22 AuthToken: 认证 token
 * - N23 RoomMembership: 房间成员
 * - N24 PermissionSync: 权限同步
 * - N25 AuditBroadcast: 审计广播
 */

import type { TransportMessage } from './SyncTransport'

// =============================================================================
// N21: MessageEncryption
// =============================================================================

export type EncryptionAlgo = 'none' | 'aes-gcm' | 'chacha20-poly1305' | 'xor'

export interface EncryptedMessage {
  ciphertext: string
  iv: string
  algo: EncryptionAlgo
  authTag?: string
}

export class MessageEncryption {
  private _algo: EncryptionAlgo
  private _key: string

  constructor(algo: EncryptionAlgo = 'none', key: string = 'default-key') {
    this._algo = algo
    this._key = key
  }

  /** 加密消息 */
  encrypt(plaintext: string): EncryptedMessage {
    if (this._algo === 'none') {
      return { ciphertext: plaintext, iv: '', algo: 'none' }
    }
    if (this._algo === 'xor') {
      return { ciphertext: this._xor(plaintext, this._key), iv: '', algo: 'xor' }
    }
    // 简化：AES-GCM / ChaCha20 用 XOR 模拟（实际生产用 Web Crypto API）
    return { ciphertext: this._xor(plaintext, this._key), iv: this._generateIV(), algo: this._algo, authTag: 'mock-tag' }
  }

  /** 解密 */
  decrypt(msg: EncryptedMessage): string {
    if (msg.algo === 'none') return msg.ciphertext
    if (msg.algo === 'xor') return this._xor(msg.ciphertext, this._key)
    if (!msg.authTag) throw new Error('missing auth tag')
    return this._xor(msg.ciphertext, this._key)
  }

  /** 包装 transport 消息 */
  wrap(msg: TransportMessage): { message: TransportMessage; encryption: EncryptedMessage } {
    const json = JSON.stringify(msg)
    const enc = this.encrypt(json)
    return {
      message: { ...msg, payload: '[encrypted]' },
      encryption: enc,
    }
  }

  unwrap(wrapped: { message: TransportMessage; encryption: EncryptedMessage }): TransportMessage {
    if (wrapped.encryption.algo === 'none') return wrapped.message
    const json = this.decrypt(wrapped.encryption)
    return JSON.parse(json) as TransportMessage
  }

  private _xor(text: string, key: string): string {
    let out = ''
    for (let i = 0; i < text.length; i++) {
      out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return out
  }

  private _generateIV(): string {
    return Math.random().toString(36).slice(2, 18)
  }
}

// =============================================================================
// N22: AuthToken
// =============================================================================

export interface AuthTokenData {
  userId: string
  roomId: string
  permissions: string[]
  expiresAt: number
  issuedAt: number
  signature: string
}

export class AuthTokenManager {
  private _tokens: Map<string, AuthTokenData> = new Map()
  private _secret: string
  private _defaultTtlMs: number

  constructor(secret: string = 'secret', defaultTtlMs: number = 3_600_000) {
    this._secret = secret
    this._defaultTtlMs = defaultTtlMs
  }

  /** 生成 token */
  issue(userId: string, roomId: string, permissions: string[] = ['read', 'write']): AuthTokenData {
    const now = Date.now()
    const token: AuthTokenData = {
      userId, roomId, permissions,
      issuedAt: now, expiresAt: now + this._defaultTtlMs,
      signature: this._sign(userId, roomId, now),
    }
    this._tokens.set(token.signature, token)
    return token
  }

  /** 验证 token */
  verify(token: AuthTokenData): { valid: boolean; reason?: string } {
    if (Date.now() > token.expiresAt) return { valid: false, reason: 'expired' }
    const expected = this._sign(token.userId, token.roomId, token.issuedAt)
    if (expected !== token.signature) return { valid: false, reason: 'invalid signature' }
    return { valid: true }
  }

  revoke(signature: string): boolean {
    return this._tokens.delete(signature)
  }

  hasPermission(token: AuthTokenData, perm: string): boolean {
    return token.permissions.includes(perm)
  }

  private _sign(userId: string, roomId: string, ts: number): string {
    const data = `${userId}:${roomId}:${ts}:${this._secret}`
    let h = 0
    for (let i = 0; i < data.length; i++) {
      h = ((h << 5) - h) + data.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h).toString(36)
  }
}

// =============================================================================
// N23: RoomMembership
// =============================================================================

export type RoomRole = 'owner' | 'editor' | 'commenter' | 'viewer'

export interface RoomMemberInfo {
  userId: string
  roomId: string
  role: RoomRole
  joinedAt: number
  lastActive: number
}

export class RoomMembership {
  private _members: Map<string, RoomMemberInfo[]> = new Map()  // roomId → members

  join(roomId: string, userId: string, role: RoomRole = 'editor'): RoomMemberInfo {
    const member: RoomMemberInfo = {
      userId, roomId, role, joinedAt: Date.now(), lastActive: Date.now(),
    }
    const members = this._members.get(roomId) ?? []
    if (!members.find(m => m.userId === userId)) {
      members.push(member)
      this._members.set(roomId, members)
    }
    return member
  }

  leave(roomId: string, userId: string): boolean {
    const members = this._members.get(roomId)
    if (!members) return false
    const before = members.length
    this._members.set(roomId, members.filter(m => m.userId !== userId))
    return this._members.get(roomId)!.length < before
  }

  members(roomId: string): RoomMemberInfo[] {
    return [...(this._members.get(roomId) ?? [])]
  }

  /** 更新 lastActive */
  touch(roomId: string, userId: string): boolean {
    const m = this._members.get(roomId)?.find(m => m.userId === userId)
    if (!m) return false
    m.lastActive = Date.now()
    return true
  }

  /** 角色 of user in room */
  roleOf(roomId: string, userId: string): RoomRole | null {
    return this._members.get(roomId)?.find(m => m.userId === userId)?.role ?? null
  }

  /** 设置角色 */
  setRole(roomId: string, userId: string, role: RoomRole): boolean {
    const m = this._members.get(roomId)?.find(m => m.userId === userId)
    if (!m) return false
    m.role = role
    return true
  }

  /** 用户的所有房间 */
  roomsOf(userId: string): string[] {
    const out: string[] = []
    for (const [roomId, members] of this._members) {
      if (members.find(m => m.userId === userId)) out.push(roomId)
    }
    return out
  }
}

// =============================================================================
// N24: PermissionSync
// =============================================================================

export class PermissionSync {
  private _rolePermissions: Map<string, Set<string>> = new Map()

  define(role: string, permissions: string[]): void {
    this._rolePermissions.set(role, new Set(permissions))
  }

  get(role: string): string[] {
    return Array.from(this._rolePermissions.get(role) ?? [])
  }

  has(role: string, perm: string): boolean {
    return this._rolePermissions.get(role)?.has(perm) ?? false
  }

  /** 同步到 room members */
  syncToRoom(members: Array<{ userId: string; role: string }>): Array<{ userId: string; perms: string[] }> {
    return members.map(m => ({ userId: m.userId, perms: this.get(m.role) }))
  }

  /** 检查 user 是否能在 room 中做 action */
  can(role: string, action: string): boolean {
    return this.has(role, action)
  }
}

// =============================================================================
// N25: AuditBroadcast
// =============================================================================

export type AuditEventType = 'login' | 'logout' | 'edit' | 'delete' | 'permission-change' | 'sync-error'

export interface AuditEvent {
  eventId: string
  type: AuditEventType
  userId: string
  roomId: string
  action: string
  target?: string
  metadata?: Record<string, unknown>
  timestamp: number
}

export class AuditBroadcast {
  private _events: AuditEvent[] = []
  private _subscribers: Set<(e: AuditEvent) => void> = new Set()
  private _nextId: number = 0

  emit(type: AuditEventType, userId: string, roomId: string, action: string, target?: string, metadata?: Record<string, unknown>): AuditEvent {
    const event: AuditEvent = {
      eventId: `audit_${++this._nextId}`,
      type, userId, roomId, action, target, metadata,
      timestamp: Date.now(),
    }
    this._events.push(event)
    for (const s of this._subscribers) {
      try { s(event) } catch { /* swallow */ }
    }
    return event
  }

  byType(type: AuditEventType): AuditEvent[] {
    return this._events.filter(e => e.type === type)
  }

  byRoom(roomId: string): AuditEvent[] {
    return this._events.filter(e => e.roomId === roomId)
  }

  byUser(userId: string): AuditEvent[] {
    return this._events.filter(e => e.userId === userId)
  }

  recent(n: number = 50): AuditEvent[] {
    return this._events.slice(-n).reverse()
  }

  subscribe(fn: (e: AuditEvent) => void): () => void {
    this._subscribers.add(fn)
    return () => this._subscribers.delete(fn)
  }

  count(): number {
    return this._events.length
  }
}