/**
 * security/__tests__/security-integration.test.ts (T27)
 */

import { describe, it, expect } from 'vitest'
import {
  InputValidator, SchemaValidator, EmailValidator, URLValidator,
  JWT, CSRFToken, XSSSanitizer, SQLEscape,
  CSPBuilder, HeadersBuilder, CorsHandler, SecureCookie,
  RateLimiter, IPBlocker, Geofence, AuditLogger,
  ComplianceChecker, GDPRHelper, PCIDSSHelper, EncryptionHelper, KeyRotation,
} from '../index'

describe('Security — end-to-end', () => {
  it('input validation pipeline', () => {
    const iv = new InputValidator()
    iv.add('email', InputValidator.required as any)
    const r = iv.validate({ email: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.email).toBeDefined()
  })

  it('schema + email + URL validation', () => {
    const s = new SchemaValidator().field('email', 'string').field('age', 'number')
    expect(s.validate({ email: 'a@b.com', age: 30 }).valid).toBe(true)
    expect(EmailValidator.isValid('a@b.com')).toBe(true)
    expect(URLValidator.isSecure('https://x.com')).toBe(true)
  })

  it('JWT + CSRF + XSS + SQL', () => {
    const jwt = new JWT('secret')
    const token = jwt.sign({ sub: 'u', iat: 0, exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(jwt.verify(token)?.sub).toBe('u')

    const csrf = new CSRFToken()
    const t = csrf.generate('s')
    expect(csrf.verify('s', t)).toBe(true)

    expect(XSSSanitizer.escapeHTML('<script>')).toContain('&lt;')
    expect(SQLEscape.escape("O'Brien")).toBe("O''Brien")
  })

  it('CSP + headers + CORS + cookie', () => {
    expect(CSPBuilder.build()).toContain("object-src 'none'")
    expect(new HeadersBuilder().withDefaults().build()['X-Frame-Options']).toBe('DENY')

    const c = new CorsHandler().addOrigin('https://app.com')
    expect(c.isOriginAllowed('https://app.com')).toBe(true)

    expect(SecureCookie.build({
      name: 'a', value: 'b', maxAge: 60, httpOnly: true, secure: true,
      sameSite: 'Strict', path: '/',
    })).toContain('HttpOnly')
  })

  it('rate limit + IP block + geofence', () => {
    const r = new RateLimiter(1, 1000)
    expect(r.check('u').allowed).toBe(true)
    expect(r.check('u').allowed).toBe(false)

    const ip = new IPBlocker()
    ip.block('1.1.1.1')
    expect(ip.isBlocked('1.1.1.1')).toBe(true)

    const g = new Geofence()
    g.allowCountry('US')
    expect(g.isAllowed('US')).toBe(true)
  })

  it('audit log + compliance + GDPR + PCI + encryption + key rotation', () => {
    const a = new AuditLogger()
    a.log('login', 'u1', '1.1.1.1', true)
    expect(a.count()).toBe(1)

    const c = new ComplianceChecker()
    c.addRule({ framework: 'GDPR', rule: 'consent', description: 'opt-in', required: true })
    c.set('consent', true)
    expect(c.isCompliant('GDPR')).toBe(true)

    expect(new GDPRHelper().hasPII({ email: 'a@b.com' })).toBe(true)
    expect(new PCIDSSHelper().mask('4111111111111111')).toContain('*')

    const enc = new EncryptionHelper()
    expect(enc.decrypt(enc.encrypt('x', 'k'), 'k')).toBe('x')

    const kr = new KeyRotation()
    kr.addKey('k1')
    kr.addKey('k2')
    expect(kr.versionCount()).toBe(2)
  })
})