/**
 * security/Validation.test.ts (T1-T10) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  InputValidator, SchemaValidator, EmailValidator, URLValidator, RegexValidator,
  OAuth2Client, JWT, CSRFToken, XSSSanitizer, SQLEscape,
} from './Validation'

describe('T1: InputValidator', () => {
  it('required + minLength', () => {
    const v = new InputValidator()
    v.add('name', InputValidator.required)
    v.add('name', InputValidator.minLength(3))
    expect(v.validate({ name: 'ab' }).valid).toBe(false)
    expect(v.validate({ name: 'Alice' }).valid).toBe(true)
  })
})

describe('T2: SchemaValidator', () => {
  it('required field missing', () => {
    const s = new SchemaValidator().field('name', 'string', true)
    expect(s.validate({}).valid).toBe(false)
  })

  it('type mismatch', () => {
    const s = new SchemaValidator().field('age', 'number')
    expect(s.validate({ age: '30' }).valid).toBe(false)
  })

  it('valid', () => {
    const s = new SchemaValidator().field('name', 'string').field('age', 'number', false)
    expect(s.validate({ name: 'Alice', age: 30 }).valid).toBe(true)
  })
})

describe('T3: EmailValidator', () => {
  it('valid', () => {
    expect(EmailValidator.isValid('a@b.com')).toBe(true)
  })

  it('invalid', () => {
    expect(EmailValidator.isValid('not-an-email')).toBe(false)
  })

  it('domain', () => {
    expect(EmailValidator.domain('a@b.com')).toBe('b.com')
  })

  it('issues', () => {
    expect(EmailValidator.issues('a..b@c.com')).toContain('consecutive dots')
  })
})

describe('T4: URLValidator', () => {
  it('valid https', () => {
    expect(URLValidator.isValid('https://example.com')).toBe(true)
  })

  it('invalid scheme', () => {
    expect(URLValidator.isValid('javascript:alert(1)')).toBe(false)
  })

  it('isSecure', () => {
    expect(URLValidator.isSecure('https://x.com')).toBe(true)
    expect(URLValidator.isSecure('http://x.com')).toBe(false)
  })

  it('domain', () => {
    expect(URLValidator.domain('https://api.example.com/path')).toBe('api.example.com')
  })
})

describe('T5: RegexValidator', () => {
  it('test + match + replace', () => {
    const r = new RegexValidator('\\d+')
    expect(r.test('abc123')).toBe(true)
    expect(r.match('abc123')?.[0]).toBe('123')
    expect(r.replace('abc123', 'X')).toBe('abcX')
  })
})

describe('T6: OAuth2Client', () => {
  it('authUrl', () => {
    const c = new OAuth2Client('id', 'secret', 'https://app.example.com/cb')
    const url = c.authUrl(['read', 'write'], 'state-1')
    expect(url).toContain('client_id=id')
    expect(url).toContain('scope=read+write')
  })

  it('exchangeCode + isExpired', () => {
    const c = new OAuth2Client('id', 'secret', 'https://app.example.com/cb')
    const t = c.exchangeCode('auth-code')
    expect(t.accessToken).toContain('auth-code')
    expect(c.isExpired()).toBe(false)
  })
})

describe('T7: JWT', () => {
  it('sign + verify', () => {
    const jwt = new JWT('secret')
    const token = jwt.sign({ sub: 'user-1', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
    const payload = jwt.verify(token)
    expect(payload?.sub).toBe('user-1')
  })

  it('verify expired', () => {
    const jwt = new JWT('secret')
    const token = jwt.sign({ sub: 'u', iat: 0, exp: 1 })  // expired
    expect(jwt.verify(token)).toBeNull()
  })

  it('verify wrong signature', () => {
    const jwt1 = new JWT('secret1')
    const jwt2 = new JWT('secret2')
    const token = jwt1.sign({ sub: 'u', iat: 0, exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(jwt2.verify(token)).toBeNull()
  })
})

describe('T8: CSRFToken', () => {
  it('generate + verify', () => {
    const c = new CSRFToken()
    const token = c.generate('session-1')
    expect(c.verify('session-1', token)).toBe(true)
  })

  it('one-time use', () => {
    const c = new CSRFToken()
    const token = c.generate('s1')
    expect(c.verify('s1', token)).toBe(true)
    expect(c.verify('s1', token)).toBe(false)  // already consumed
  })

  it('wrong token', () => {
    const c = new CSRFToken()
    c.generate('s1')
    expect(c.verify('s1', 'wrong')).toBe(false)
  })
})

describe('T9: XSSSanitizer', () => {
  it('escapeHTML', () => {
    expect(XSSSanitizer.escapeHTML('<script>alert(1)</script>')).toContain('&lt;')
  })

  it('stripScripts', () => {
    expect(XSSSanitizer.stripScripts('<p>Hi</p><script>x()</script>')).not.toContain('<script>')
  })

  it('stripDangerousAttrs', () => {
    expect(XSSSanitizer.stripDangerousAttrs('<a onclick="x()">y</a>')).not.toContain('onclick')
  })

  it('sanitize full', () => {
    const html = '<p onclick="x()">Hi<script>x()</script></p>'
    const clean = XSSSanitizer.sanitize(html)
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('<script>')
  })
})

describe('T10: SQLEscape', () => {
  it('escape', () => {
    expect(SQLEscape.escape("O'Brien")).toBe("O''Brien")
  })

  it('detect dangerous chars', () => {
    expect(SQLEscape.hasDangerousChars("a'; DROP TABLE users;--")).toBe(true)
  })

  it('placeholder', () => {
    expect(SQLEscape.paramPlaceholder(1)).toBe('$1')
  })
})