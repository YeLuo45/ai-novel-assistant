/**
 * security/Validation.ts (T1-T10) - 10 engines
 *
 * - T1 InputValidator: 输入验证
 * - T2 SchemaValidator: schema 验证
 * - T3 EmailValidator: email 验证
 * - T4 URLValidator: URL 验证
 * - T5 RegexValidator: 正则验证
 * - T6 OAuth2: OAuth2 flow
 * - T7 JWT: JWT sign/verify
 * - T8 CSRFToken: CSRF token
 * - T9 XSSSanitizer: XSS sanitizer
 * - T10 SQLEscape: SQL escape
 */

// =============================================================================
// T1: InputValidator
// =============================================================================

export type Validator<T = unknown> = (value: T) => true | string

export class InputValidator {
  private _validators: Map<string, Validator<unknown>> = new Map()
  private _errors: Map<string, string> = new Map()

  add(fieldName: string, validator: Validator<unknown>): void {
    this._validators.set(fieldName, validator)
  }

  validate(data: Record<string, unknown>): { valid: boolean; errors: Record<string, string> } {
    this._errors.clear()
    let valid = true
    for (const [field, validator] of this._validators) {
      const result = validator(data[field])
      if (result !== true) {
        this._errors.set(field, result)
        valid = false
      }
    }
    return { valid, errors: Object.fromEntries(this._errors) }
  }

  static required(value: unknown): true | string {
    if (value === undefined || value === null || value === '') return 'is required'
    return true
  }

  static minLength(min: number): Validator<string> {
    return (value) => (typeof value === 'string' && value.length >= min) || `must be at least ${min} characters`
  }

  static maxLength(max: number): Validator<string> {
    return (value) => (typeof value === 'string' && value.length <= max) || `must be at most ${max} characters`
  }
}

// =============================================================================
// T2: SchemaValidator
// =============================================================================

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'

export interface SchemaField {
  name: string
  type: FieldType
  required: boolean
  validator?: Validator
}

export class SchemaValidator {
  private _fields: SchemaField[] = []

  field(name: string, type: FieldType, required: boolean = true, validator?: Validator): this {
    this._fields.push({ name, type, required, validator })
    return this
  }

  validate(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    for (const f of this._fields) {
      const value = data[f.name]
      if (f.required && (value === undefined || value === null)) {
        errors.push(`${f.name} is required`)
        continue
      }
      if (value === undefined || value === null) continue
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== f.type) {
        errors.push(`${f.name} expected ${f.type}, got ${actualType}`)
        continue
      }
      if (f.validator) {
        const result = f.validator(value)
        if (result !== true) errors.push(`${f.name}: ${result}`)
      }
    }
    return { valid: errors.length === 0, errors }
  }
}

// =============================================================================
// T3: EmailValidator
// =============================================================================

export class EmailValidator {
  private static readonly PATTERN = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  static isValid(email: string): boolean {
    return this.PATTERN.test(email)
  }

  /** 检查常见错误 */
  static issues(email: string): string[] {
    const issues: string[] = []
    if (email.length > 254) issues.push('exceeds 254 chars')
    if (email.includes('..')) issues.push('consecutive dots')
    if (email.startsWith('.') || email.endsWith('.')) issues.push('starts or ends with dot')
    if (email.includes(' ')) issues.push('contains spaces')
    if (!this.PATTERN.test(email)) issues.push('invalid format')
    return issues
  }

  static domain(email: string): string | null {
    const at = email.lastIndexOf('@')
    return at >= 0 ? email.slice(at + 1) : null
  }
}

// =============================================================================
// T4: URLValidator
// =============================================================================

export class URLValidator {
  static isValid(url: string, allowedSchemes: string[] = ['http', 'https']): boolean {
    try {
      const u = new URL(url)
      return allowedSchemes.includes(u.protocol.slice(0, -1))
    } catch {
      return false
    }
  }

  static isSecure(url: string): boolean {
    try {
      return new URL(url).protocol === 'https:'
    } catch {
      return false
    }
  }

  static domain(url: string): string | null {
    try {
      return new URL(url).hostname
    } catch {
      return null
    }
  }
}

// =============================================================================
// T5: RegexValidator
// =============================================================================

export class RegexValidator {
  private _pattern: RegExp
  private _flags: string

  constructor(pattern: string | RegExp, flags: string = '') {
    this._pattern = typeof pattern === 'string' ? new RegExp(pattern, flags) : pattern
    this._flags = flags
  }

  test(value: string): boolean { return this._pattern.test(value) }
  match(value: string): RegExpMatchArray | null { return value.match(this._pattern) }
  replace(value: string, replacement: string): string { return value.replace(this._pattern, replacement) }
  pattern(): string { return this._pattern.source }
}

// =============================================================================
// T6: OAuth2
// =============================================================================

export interface OAuth2Token {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope: string[]
}

export class OAuth2Client {
  private _clientId: string
  private _clientSecret: string
  private _redirectUri: string
  private _token: OAuth2Token | null = null

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._redirectUri = redirectUri
  }

  /** 生成授权 URL */
  authUrl(scope: string[], state: string): string {
    const params = new URLSearchParams({
      client_id: this._clientId,
      redirect_uri: this._redirectUri,
      scope: scope.join(' '),
      state,
      response_type: 'code',
    })
    return `https://oauth.example.com/authorize?${params.toString()}`
  }

  /** 交换 code 为 token (mock) */
  exchangeCode(code: string): OAuth2Token {
    this._token = {
      accessToken: `access_${code}`,
      refreshToken: `refresh_${code}`,
      expiresAt: Date.now() + 3_600_000,
      scope: ['read', 'write'],
    }
    return this._token
  }

  /** 刷新 token */
  refresh(): OAuth2Token | null {
    if (!this._token?.refreshToken) return null
    return this.exchangeCode(this._token.refreshToken)
  }

  token(): OAuth2Token | null { return this._token }

  isExpired(): boolean { return !this._token || Date.now() >= this._token.expiresAt }
}

// =============================================================================
// T7: JWT
// =============================================================================

export interface JWTPayload {
  sub: string
  iat: number
  exp: number
  [key: string]: unknown
}

export class JWT {
  private _secret: string

  constructor(secret: string) {
    this._secret = secret
  }

  /** 模拟 JWT sign (实际生产用 Web Crypto API) */
  sign(payload: JWTPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' }
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const signature = this._sign(`${enc(header)}.${enc(payload)}`)
    return `${enc(header)}.${enc(payload)}.${signature}`
  }

  /** 模拟 JWT verify */
  verify(token: string): JWTPayload | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, payload, signature] = parts
    const expected = this._sign(`${header}.${payload}`)
    if (expected !== signature) return null
    const data = JSON.parse(Buffer.from(payload!, 'base64url').toString())
    if (data.exp && Date.now() / 1000 >= data.exp) return null
    return data
  }

  private _sign(data: string): string {
    const combined = data + ':' + this._secret
    let h = 5381
    for (let i = 0; i < combined.length; i++) {
      h = ((h << 5) + h) + combined.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h).toString(36)
  }
}

// =============================================================================
// T8: CSRFToken
// =============================================================================

export class CSRFToken {
  private _tokens: Map<string, { token: string; createdAt: number }> = new Map()
  private _ttlMs: number

  constructor(ttlMs: number = 3_600_000) {
    this._ttlMs = ttlMs
  }

  generate(sessionId: string): string {
    const token = Math.random().toString(36).slice(2, 18)
    this._tokens.set(sessionId, { token, createdAt: Date.now() })
    return token
  }

  /** 验证 token (one-time use, then consumed) */
  verify(sessionId: string, token: string): boolean {
    const stored = this._tokens.get(sessionId)
    if (!stored) return false
    if (Date.now() - stored.createdAt > this._ttlMs) {
      this._tokens.delete(sessionId)
      return false
    }
    if (stored.token !== token) return false
    this._tokens.delete(sessionId)  // one-time use
    return true
  }

  invalidate(sessionId: string): boolean { return this._tokens.delete(sessionId) }
}

// =============================================================================
// T9: XSSSanitizer
// =============================================================================

export class XSSSanitizer {
  /** 转义 HTML 特殊字符 */
  static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    }
    return text.replace(/[&<>"'/]/g, (m) => map[m]!)
  }

  /** 移除危险 script 标签 */
  static stripScripts(html: string): string {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  /** 移除危险 attrs (onclick, onerror 等) */
  static stripDangerousAttrs(html: string): string {
    return html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  }

  /** 完整 sanitize */
  static sanitize(html: string): string {
    return XSSSanitizer.stripDangerousAttrs(XSSSanitizer.stripScripts(html))
  }
}

// =============================================================================
// T10: SQLEscape
// =============================================================================

export class SQLEscape {
  static escape(value: string): string {
    return value.replace(/'/g, "''")
  }

  /** 危险字符检测 */
  static hasDangerousChars(value: string): boolean {
    return /['";\\]|--|\bOR\b|\bAND\b|\bDROP\b|\bDELETE\b/i.test(value)
  }

  /** 参数化占位符生成（仅模拟） */
  static paramPlaceholder(index: number): string {
    return `$${index}`
  }
}