/**
 * security/SecurityAdvanced.ts (T11-T25) - 15 engines
 *
 * - T11 CSPBuilder
 * - T12 HeadersBuilder
 * - T13 CorsHandler
 * - T14 SameSitePolicy
 * - T15 SecureCookie
 * - T16 RateLimiter
 * - T17 IPBlocker
 * - T18 Geofence
 * - T19 Captcha
 * - T20 AuditLogger
 * - T21 ComplianceChecker
 * - T22 GDPRHelper
 * - T23 PCIDSSHelper
 * - T24 EncryptionHelper
 * - T25 KeyRotation
 */

// =============================================================================
// T11: CSPBuilder
// =============================================================================

export interface CSPConfig {
  defaultSrc: string[]
  scriptSrc: string[]
  styleSrc: string[]
  imgSrc: string[]
  connectSrc: string[]
  fontSrc: string[]
  objectSrc: string[]
  mediaSrc: string[]
  frameSrc: string[]
  reportUri?: string
}

export class CSPBuilder {
  static build(config: Partial<CSPConfig> = {}): string {
    const c: CSPConfig = {
      defaultSrc: config.defaultSrc ?? ["'self'"],
      scriptSrc: config.scriptSrc ?? ["'self'"],
      styleSrc: config.styleSrc ?? ["'self'", "'unsafe-inline'"],
      imgSrc: config.imgSrc ?? ["'self'", 'data:', 'https:'],
      connectSrc: config.connectSrc ?? ["'self'"],
      fontSrc: config.fontSrc ?? ["'self'"],
      objectSrc: config.objectSrc ?? ["'none'"],
      mediaSrc: config.mediaSrc ?? ["'self'"],
      frameSrc: config.frameSrc ?? ["'none'"],
      reportUri: config.reportUri,
    }
    const parts: string[] = []
    parts.push(`default-src ${c.defaultSrc.join(' ')}`)
    parts.push(`script-src ${c.scriptSrc.join(' ')}`)
    parts.push(`style-src ${c.styleSrc.join(' ')}`)
    parts.push(`img-src ${c.imgSrc.join(' ')}`)
    parts.push(`connect-src ${c.connectSrc.join(' ')}`)
    parts.push(`font-src ${c.fontSrc.join(' ')}`)
    parts.push(`object-src ${c.objectSrc.join(' ')}`)
    parts.push(`media-src ${c.mediaSrc.join(' ')}`)
    parts.push(`frame-src ${c.frameSrc.join(' ')}`)
    if (c.reportUri) parts.push(`report-uri ${c.reportUri}`)
    return parts.join('; ')
  }
}

// =============================================================================
// T12: HeadersBuilder
// =============================================================================

export class HeadersBuilder {
  private _headers: Record<string, string> = {}

  set(name: string, value: string): this {
    this._headers[name] = value
    return this
  }

  unset(name: string): this {
    delete this._headers[name]
    return this
  }

  /** 应用默认安全 headers */
  withDefaults(): this {
    return this
      .set('X-Content-Type-Options', 'nosniff')
      .set('X-Frame-Options', 'DENY')
      .set('X-XSS-Protection', '1; mode=block')
      .set('Referrer-Policy', 'strict-origin-when-cross-origin')
      .set('Permissions-Policy', 'geolocation=(), microphone=()')
  }

  build(): Record<string, string> { return { ...this._headers } }
}

// =============================================================================
// T13: CorsHandler
// =============================================================================

export type CORSOrigin = string | '*' | 'null'

export class CorsHandler {
  private _allowedOrigins: Set<string> = new Set()
  private _allowedMethods: Set<string> = new Set(['GET', 'POST', 'PUT', 'DELETE'])
  private _allowedHeaders: Set<string> = new Set(['Content-Type', 'Authorization'])
  private _allowCredentials: boolean = false

  addOrigin(origin: string): this {
    this._allowedOrigins.add(origin)
    return this
  }

  setCredentials(allow: boolean): this { this._allowCredentials = allow; return this }

  isOriginAllowed(origin: string): boolean {
    return this._allowedOrigins.has('*') || this._allowedOrigins.has(origin)
  }

  buildPreflightHeaders(origin: string): Record<string, string> {
    const headers: Record<string, string> = {}
    if (this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Methods'] = Array.from(this._allowedMethods).join(', ')
      headers['Access-Control-Allow-Headers'] = Array.from(this._allowedHeaders).join(', ')
      if (this._allowCredentials) headers['Access-Control-Allow-Credentials'] = 'true'
    }
    return headers
  }
}

// =============================================================================
// T14: SameSitePolicy
// =============================================================================

export type SameSiteValue = 'Strict' | 'Lax' | 'None'

export class SameSitePolicy {
  static parse(value: string): SameSiteValue | null {
    if (value === 'Strict' || value === 'Lax' || value === 'None') return value
    return null
  }

  static validateForContext(value: SameSiteValue, context: 'login' | 'analytics' | 'session' | 'marketing'): { valid: boolean; warning?: string } {
    if (value === 'None' && context === 'login') return { valid: false, warning: 'None not allowed for login cookies' }
    if (value === 'Strict' && context === 'marketing') return { valid: false, warning: 'Strict too restrictive for marketing' }
    return { valid: true }
  }
}

// =============================================================================
// T15: SecureCookie
// =============================================================================

export interface CookieConfig {
  name: string
  value: string
  maxAge: number
  httpOnly: boolean
  secure: boolean
  sameSite: SameSiteValue
  domain?: string
  path: string
}

export class SecureCookie {
  static build(config: CookieConfig): string {
    const parts: string[] = [`${config.name}=${config.value}`]
    parts.push(`Max-Age=${config.maxAge}`)
    parts.push(`Path=${config.path}`)
    if (config.httpOnly) parts.push('HttpOnly')
    if (config.secure) parts.push('Secure')
    parts.push(`SameSite=${config.sameSite}`)
    if (config.domain) parts.push(`Domain=${config.domain}`)
    return parts.join('; ')
  }

  static validateForLogin(config: CookieConfig): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    if (!config.httpOnly) issues.push('httpOnly should be true for login cookies')
    if (!config.secure) issues.push('secure should be true')
    if (config.sameSite === 'None') issues.push('sameSite=None not allowed for login')
    return { valid: issues.length === 0, issues }
  }
}

// =============================================================================
// T16: RateLimiter
// =============================================================================

export class RateLimiter {
  private _requests: Map<string, number[]> = new Map()
  private _maxRequests: number
  private _windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this._maxRequests = maxRequests
    this._windowMs = windowMs
  }

  /** 检查是否允许（并记录） */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const windowStart = now - this._windowMs
    let timestamps = this._requests.get(key) ?? []
    // 清理过期
    timestamps = timestamps.filter(t => t > windowStart)
    if (timestamps.length >= this._maxRequests) {
      this._requests.set(key, timestamps)
      const oldest = timestamps[0]!
      return { allowed: false, remaining: 0, resetAt: oldest + this._windowMs }
    }
    timestamps.push(now)
    this._requests.set(key, timestamps)
    return {
      allowed: true,
      remaining: this._maxRequests - timestamps.length,
      resetAt: now + this._windowMs,
    }
  }

  reset(key?: string): void {
    if (key) this._requests.delete(key)
    else this._requests.clear()
  }
}

// =============================================================================
// T17: IPBlocker
// =============================================================================

export class IPBlocker {
  private _blocked: Set<string> = new Set()
  private _whitelist: Set<string> = new Set()
  private _blockedSubnets: string[] = []

  block(ip: string): void { this._blocked.add(ip) }
  unblock(ip: string): boolean { return this._blocked.delete(ip) }
  whitelist(ip: string): void { this._whitelist.add(ip) }
  unwhitelist(ip: string): boolean { return this._whitelist.delete(ip) }

  isBlocked(ip: string): boolean {
    if (this._whitelist.has(ip)) return false
    return this._blocked.has(ip)
  }

  addBlockedSubnet(cidr: string): void { this._blockedSubnets.push(cidr) }

  size(): number { return this._blocked.size }
}

// =============================================================================
// T18: Geofence
// =============================================================================

export class Geofence {
  private _allowedCountries: Set<string> = new Set()
  private _blockedCountries: Set<string> = new Set()

  allowCountry(code: string): void { this._allowedCountries.add(code.toUpperCase()) }
  blockCountry(code: string): void { this._blockedCountries.add(code.toUpperCase()) }

  isAllowed(code: string): boolean {
    const upper = code.toUpperCase()
    if (this._blockedCountries.has(upper)) return false
    if (this._allowedCountries.size === 0) return true  // empty allowlist = allow all
    return this._allowedCountries.has(upper)
  }
}

// =============================================================================
// T19: Captcha
// =============================================================================

export class Captcha {
  private _challenges: Map<string, { answer: string; createdAt: number }> = new Map()
  private _ttlMs: number

  constructor(ttlMs: number = 300_000) {
    this._ttlMs = ttlMs
  }

  /** 生成 challenge */
  generate(challengeId: string, answer: string): void {
    this._challenges.set(challengeId, { answer, createdAt: Date.now() })
  }

  /** 验证 */
  verify(challengeId: string, answer: string): boolean {
    const c = this._challenges.get(challengeId)
    if (!c) return false
    if (Date.now() - c.createdAt > this._ttlMs) {
      this._challenges.delete(challengeId)
      return false
    }
    if (c.answer !== answer) return false
    this._challenges.delete(challengeId)  // one-time
    return true
  }

  /** 简单数学题生成 */
  generateMathChallenge(): { id: string; question: string } {
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 10) + 1
    const id = `math_${Date.now()}_${Math.random()}`
    const answer = String(a + b)
    this.generate(id, answer)
    return { id, question: `${a} + ${b} = ?` }
  }
}

// =============================================================================
// T20: AuditLogger
// =============================================================================

export interface AuditEntry {
  timestamp: number
  action: string
  userId: string
  ip: string
  success: boolean
  metadata?: Record<string, unknown>
}

export class AuditLogger {
  private _entries: AuditEntry[] = []
  private _maxEntries: number

  constructor(maxEntries: number = 10_000) {
    this._maxEntries = maxEntries
  }

  log(action: string, userId: string, ip: string, success: boolean, metadata?: Record<string, unknown>): void {
    this._entries.push({ timestamp: Date.now(), action, userId, ip, success, metadata })
    if (this._entries.length > this._maxEntries) this._entries.shift()
  }

  byUser(userId: string): AuditEntry[] { return this._entries.filter(e => e.userId === userId) }
  byAction(action: string): AuditEntry[] { return this._entries.filter(e => e.action === action) }
  failures(): AuditEntry[] { return this._entries.filter(e => !e.success) }
  recent(n: number = 100): AuditEntry[] { return this._entries.slice(-n).reverse() }
  count(): number { return this._entries.length }
  clear(): void { this._entries = [] }
}

// =============================================================================
// T21: ComplianceChecker
// =============================================================================

export type ComplianceFramework = 'GDPR' | 'CCPA' | 'HIPAA' | 'PCI-DSS' | 'SOC2'

export interface ComplianceRule {
  framework: ComplianceFramework
  rule: string
  description: string
  required: boolean
}

export class ComplianceChecker {
  private _rules: ComplianceRule[] = []
  private _compliance: Map<string, boolean> = new Map()

  addRule(rule: ComplianceRule): void { this._rules.push(rule) }

  set(ruleName: string, compliant: boolean): void { this._compliance.set(ruleName, compliant) }

  audit(framework: ComplianceFramework): { framework: ComplianceFramework; rules: ComplianceRule[]; passed: number; failed: number; missing: number } {
    const rules = this._rules.filter(r => r.framework === framework)
    let passed = 0, failed = 0, missing = 0
    for (const rule of rules) {
      const status = this._compliance.get(rule.rule)
      if (status === undefined) missing += 1
      else if (status) passed += 1
      else failed += 1
    }
    return { framework, rules, passed, failed, missing }
  }

  /** 检查是否全部 required rule 都通过 */
  isCompliant(framework: ComplianceFramework): boolean {
    const result = this.audit(framework)
    const failedRequired = result.rules.filter(r => r.required).filter(r => this._compliance.get(r.rule) !== true)
    return failedRequired.length === 0
  }
}

// =============================================================================
// T22: GDPRHelper
// =============================================================================

export class GDPRHelper {
  /** 检查是否收集 PII */
  hasPII(data: Record<string, unknown>): boolean {
    const piiFields = ['email', 'phone', 'ssn', 'address', 'name', 'birthday', 'ip']
    return Object.keys(data).some(k => piiFields.includes(k.toLowerCase()))
  }

  /** 生成 consent record */
  generateConsent(userId: string, purposes: string[], granted: boolean): { userId: string; purposes: string[]; granted: boolean; timestamp: number } {
    return { userId, purposes, granted, timestamp: Date.now() }
  }

  /** 数据删除请求 */
  createDeletionRequest(userId: string): { requestId: string; userId: string; timestamp: number; deadline: number } {
    return {
      requestId: `del_${Date.now()}`,
      userId,
      timestamp: Date.now(),
      deadline: Date.now() + 30 * 24 * 3600 * 1000,  // 30 days
    }
  }
}

// =============================================================================
// T23: PCIDSSHelper
// =============================================================================

export class PCIDSSHelper {
  /** 检查 PAN-like 数据 */
  looksLikeCardNumber(s: string): boolean {
    return /^\d{13,19}$/.test(s.replace(/\s/g, ''))
  }

  /** mask 卡号（保留前6 后4） */
  mask(s: string): string {
    if (!this.looksLikeCardNumber(s)) return s
    const clean = s.replace(/\s/g, '')
    return clean.slice(0, 6) + '*'.repeat(clean.length - 10) + clean.slice(-4)
  }

  /** 是否需要 PCI 合规 */
  requiresCompliance(amount: number, currency: string = 'USD'): boolean {
    return amount > 0 && currency.length === 3
  }
}

// =============================================================================
// T24: EncryptionHelper
// =============================================================================

export class EncryptionHelper {
  /** 模拟 AES encrypt (xor + base64) */
  encrypt(plaintext: string, key: string): string {
    let out = ''
    for (let i = 0; i < plaintext.length; i++) {
      out += String.fromCharCode(plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return Buffer.from(out, 'binary').toString('base64')
  }

  decrypt(ciphertext: string, key: string): string {
    const bin = Buffer.from(ciphertext, 'base64').toString('binary')
    let out = ''
    for (let i = 0; i < bin.length; i++) {
      out += String.fromCharCode(bin.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return out
  }

  /** 生成 hash (SHA-like 简化) */
  hash(text: string): string {
    let h = 5381
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) + h) + text.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h).toString(36)
  }
}

// =============================================================================
// T25: KeyRotation
// =============================================================================

export interface KeyVersion {
  version: number
  key: string
  createdAt: number
  retiredAt?: number
}

export class KeyRotation {
  private _keys: Map<number, KeyVersion> = new Map()
  private _currentVersion: number = 0
  private _nextId: number = 0

  addKey(key: string): number {
    this._nextId += 1
    const v: KeyVersion = { version: this._nextId, key, createdAt: Date.now() }
    this._keys.set(v.version, v)
    this._currentVersion = v.version
    return v.version
  }

  retireKey(version: number): boolean {
    const k = this._keys.get(version)
    if (!k) return false
    k.retiredAt = Date.now()
    return true
  }

  currentKey(): string | null {
    const k = this._keys.get(this._currentVersion)
    return k?.key ?? null
  }

  getKey(version: number): string | null {
    return this._keys.get(version)?.key ?? null
  }

  /** 取所有 active keys (用于解密旧数据) */
  activeKeys(): Array<{ version: number; key: string }> {
    return Array.from(this._keys.values())
      .filter(k => !k.retiredAt)
      .map(k => ({ version: k.version, key: k.key }))
  }

  versionCount(): number { return this._keys.size }
}