/**
 * security/SecurityAdvanced.test.ts (T11-T25) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  CSPBuilder, HeadersBuilder, CorsHandler, SameSitePolicy, SecureCookie,
  RateLimiter, IPBlocker, Geofence, Captcha, AuditLogger,
  ComplianceChecker, GDPRHelper, PCIDSSHelper, EncryptionHelper, KeyRotation,
} from './SecurityAdvanced'

describe('T11: CSPBuilder', () => {
  it('build default CSP', () => {
    const csp = CSPBuilder.build()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
  })

  it('build custom CSP', () => {
    const csp = CSPBuilder.build({ defaultSrc: ["'self'", 'https://cdn.example.com'] })
    expect(csp).toContain('https://cdn.example.com')
  })
})

describe('T12: HeadersBuilder', () => {
  it('withDefaults', () => {
    const h = new HeadersBuilder().withDefaults().build()
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['X-Frame-Options']).toBe('DENY')
  })

  it('set + unset', () => {
    const h = new HeadersBuilder()
    h.set('X-Custom', 'value')
    expect(h.build()['X-Custom']).toBe('value')
    h.unset('X-Custom')
    expect(h.build()['X-Custom']).toBeUndefined()
  })
})

describe('T13: CorsHandler', () => {
  it('isOriginAllowed', () => {
    const c = new CorsHandler().addOrigin('https://app.example.com')
    expect(c.isOriginAllowed('https://app.example.com')).toBe(true)
    expect(c.isOriginAllowed('https://other.com')).toBe(false)
  })

  it('preflight headers', () => {
    const c = new CorsHandler()
      .addOrigin('https://app.example.com')
      .setCredentials(true)
    const h = c.buildPreflightHeaders('https://app.example.com')
    expect(h['Access-Control-Allow-Origin']).toBe('https://app.example.com')
    expect(h['Access-Control-Allow-Credentials']).toBe('true')
  })
})

describe('T14: SameSitePolicy', () => {
  it('parse', () => {
    expect(SameSitePolicy.parse('Strict')).toBe('Strict')
    expect(SameSitePolicy.parse('invalid')).toBeNull()
  })

  it('validateForContext', () => {
    expect(SameSitePolicy.validateForContext('None', 'login').valid).toBe(false)
    expect(SameSitePolicy.validateForContext('Lax', 'session').valid).toBe(true)
  })
})

describe('T15: SecureCookie', () => {
  it('build', () => {
    const c = SecureCookie.build({
      name: 'sid', value: 'abc', maxAge: 3600, httpOnly: true, secure: true,
      sameSite: 'Strict', path: '/',
    })
    expect(c).toContain('HttpOnly')
    expect(c).toContain('Secure')
    expect(c).toContain('SameSite=Strict')
  })

  it('validateForLogin', () => {
    const r = SecureCookie.validateForLogin({
      name: 'sid', value: 'abc', maxAge: 3600, httpOnly: true, secure: true,
      sameSite: 'Strict', path: '/',
    })
    expect(r.valid).toBe(true)
  })
})

describe('T16: RateLimiter', () => {
  it('allow under limit', () => {
    const r = new RateLimiter(3, 1000)
    expect(r.check('user-1').allowed).toBe(true)
    expect(r.check('user-1').allowed).toBe(true)
    expect(r.check('user-1').allowed).toBe(true)
  })

  it('block over limit', () => {
    const r = new RateLimiter(2, 1000)
    r.check('user-1')
    r.check('user-1')
    expect(r.check('user-1').allowed).toBe(false)
  })
})

describe('T17: IPBlocker', () => {
  it('block + isBlocked', () => {
    const b = new IPBlocker()
    b.block('1.2.3.4')
    expect(b.isBlocked('1.2.3.4')).toBe(true)
    expect(b.isBlocked('5.6.7.8')).toBe(false)
  })

  it('whitelist overrides', () => {
    const b = new IPBlocker()
    b.block('1.2.3.4')
    b.whitelist('1.2.3.4')
    expect(b.isBlocked('1.2.3.4')).toBe(false)
  })
})

describe('T18: Geofence', () => {
  it('allow list', () => {
    const g = new Geofence()
    g.allowCountry('US')
    expect(g.isAllowed('US')).toBe(true)
    expect(g.isAllowed('CN')).toBe(false)
  })

  it('block list', () => {
    const g = new Geofence()
    g.blockCountry('XX')
    expect(g.isAllowed('XX')).toBe(false)
  })

  it('empty allowlist = allow all', () => {
    expect(new Geofence().isAllowed('ANY')).toBe(true)
  })
})

describe('T19: Captcha', () => {
  it('verify correct', () => {
    const c = new Captcha()
    c.generate('c1', '42')
    expect(c.verify('c1', '42')).toBe(true)
  })

  it('verify wrong', () => {
    const c = new Captcha()
    c.generate('c1', '42')
    expect(c.verify('c1', '99')).toBe(false)
  })

  it('math challenge', () => {
    const c = new Captcha()
    const ch = c.generateMathChallenge()
    expect(ch.question).toContain(' + ')
    const parts = ch.question.split(' ')
    const answer = parseInt(parts[0]!) + parseInt(parts[2]!)
    expect(c.verify(ch.id, String(answer))).toBe(true)
  })
})

describe('T20: AuditLogger', () => {
  it('log + byUser + failures', () => {
    const a = new AuditLogger()
    a.log('login', 'u1', '1.1.1.1', true)
    a.log('login', 'u1', '1.1.1.1', false)
    expect(a.byUser('u1').length).toBe(2)
    expect(a.failures().length).toBe(1)
  })
})

describe('T21: ComplianceChecker', () => {
  it('audit GDPR', () => {
    const c = new ComplianceChecker()
    c.addRule({ framework: 'GDPR', rule: 'consent', description: 'opt-in', required: true })
    c.addRule({ framework: 'GDPR', rule: 'deletion', description: 'right to be forgotten', required: true })
    c.set('consent', true)
    expect(c.audit('GDPR').passed).toBe(1)
    expect(c.audit('GDPR').missing).toBe(1)
    expect(c.isCompliant('GDPR')).toBe(false)
  })
})

describe('T22: GDPRHelper', () => {
  it('hasPII', () => {
    const g = new GDPRHelper()
    expect(g.hasPII({ email: 'a@b.com' })).toBe(true)
    expect(g.hasPII({ count: 5 })).toBe(false)
  })

  it('deletion request', () => {
    const g = new GDPRHelper()
    const r = g.createDeletionRequest('u1')
    expect(r.userId).toBe('u1')
    expect(r.deadline).toBeGreaterThan(r.timestamp)
  })
})

describe('T23: PCIDSSHelper', () => {
  it('looksLikeCardNumber', () => {
    const p = new PCIDSSHelper()
    expect(p.looksLikeCardNumber('4111 1111 1111 1111')).toBe(true)
    expect(p.looksLikeCardNumber('not-a-card')).toBe(false)
  })

  it('mask', () => {
    const p = new PCIDSSHelper()
    expect(p.mask('4111111111111111')).toContain('*')
    expect(p.mask('4111111111111111')).toMatch(/^4111/)
  })
})

describe('T24: EncryptionHelper', () => {
  it('encrypt + decrypt', () => {
    const e = new EncryptionHelper()
    const enc = e.encrypt('hello', 'key')
    expect(e.decrypt(enc, 'key')).toBe('hello')
  })

  it('hash', () => {
    const e = new EncryptionHelper()
    expect(e.hash('test')).not.toBe(e.hash('test2'))
  })
})

describe('T25: KeyRotation', () => {
  it('add + currentKey', () => {
    const k = new KeyRotation()
    k.addKey('key-1')
    expect(k.currentKey()).toBe('key-1')
  })

  it('retire', () => {
    const k = new KeyRotation()
    const v = k.addKey('key-1')
    expect(k.retireKey(v)).toBe(true)
    expect(k.activeKeys().length).toBe(0)
  })

  it('multiple keys', () => {
    const k = new KeyRotation()
    k.addKey('key-1')
    k.addKey('key-2')
    k.addKey('key-3')
    expect(k.versionCount()).toBe(3)
  })
})