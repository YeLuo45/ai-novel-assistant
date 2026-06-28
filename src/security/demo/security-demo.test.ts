/**
 * security/demo/security-demo.test.ts (T26)
 */

import { describe, it, expect } from 'vitest'
import { runSecurityDemo } from './security-demo'

describe('security-demo', () => {
  it('input valid', () => expect(runSecurityDemo().inputValid).toBe(true))
  it('schema valid', () => expect(runSecurityDemo().schemaValid).toBe(true))
  it('email valid', () => expect(runSecurityDemo().emailValid).toBe(true))
  it('url secure', () => expect(runSecurityDemo().urlSecure).toBe(true))
  it('regex match returns array', () => expect(runSecurityDemo().regexMatch).toBeGreaterThan(0))
  it('oauth url', () => expect(runSecurityDemo().oauthUrl).toBe(true))
  it('jwt verified', () => expect(runSecurityDemo().jwtVerified).toBe(true))
  it('csrf valid', () => expect(runSecurityDemo().csrfValid).toBe(true))
  it('xss clean', () => expect(runSecurityDemo().xssClean).toBe(true))
  it('sql 3 helpers', () => expect(runSecurityDemo().sqlSafe).toBe(3))
  it('csp built', () => expect(runSecurityDemo().cspBuilt).toBe(true))
  it('5 default headers', () => expect(runSecurityDemo().headersCount).toBe(5))
  it('cors allowed', () => expect(runSecurityDemo().corsOriginAllowed).toBe(true))
  it('sameSite valid', () => expect(runSecurityDemo().sameSiteValid).toBe(true))
  it('cookie secure', () => expect(runSecurityDemo().cookieSecure).toBe(true))
  it('rate allowed', () => expect(runSecurityDemo().rateAllowed).toBe(true))
  it('ip blocked', () => expect(runSecurityDemo().ipBlocked).toBe(true))
  it('geofence allowed', () => expect(runSecurityDemo().geofenceAllowed).toBe(true))
  it('captcha verified', () => expect(runSecurityDemo().captchaVerified).toBe(true))
  it('2 audit entries', () => expect(runSecurityDemo().auditEntries).toBe(2))
  it('GDPR compliant', () => expect(runSecurityDemo().complianceGDPR).toBe(true))
  it('gdpr has PII', () => expect(runSecurityDemo().gdprHasPII).toBe(true))
  it('PCI masked', () => expect(runSecurityDemo().pciMasked).toBe(true))
  it('encrypted', () => expect(runSecurityDemo().encrypted).toBe(true))
  it('2 keys rotated', () => expect(runSecurityDemo().keyRotated).toBe(2))
  it('end-to-end summary', () => {
    const r = runSecurityDemo()
    expect(r.auditEntries + r.headersCount + r.keyRotated).toBeGreaterThan(7)
  })
})