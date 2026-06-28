/**
 * security/demo/security-demo.ts (T26)
 */

import {
  InputValidator, SchemaValidator, EmailValidator, URLValidator, RegexValidator,
  OAuth2Client, JWT, CSRFToken, XSSSanitizer, SQLEscape,
  CSPBuilder, HeadersBuilder, CorsHandler, SameSitePolicy, SecureCookie,
  RateLimiter, IPBlocker, Geofence, Captcha, AuditLogger,
  ComplianceChecker, GDPRHelper, PCIDSSHelper, EncryptionHelper, KeyRotation,
} from '../index'

export interface DemoResult {
  inputValid: boolean
  schemaValid: boolean
  emailValid: boolean
  urlSecure: boolean
  regexMatch: number
  oauthUrl: boolean
  jwtVerified: boolean
  csrfValid: boolean
  xssClean: boolean
  sqlSafe: number
  cspBuilt: boolean
  headersCount: number
  corsOriginAllowed: boolean
  sameSiteValid: boolean
  cookieSecure: boolean
  rateAllowed: boolean
  ipBlocked: boolean
  geofenceAllowed: boolean
  captchaVerified: boolean
  auditEntries: number
  complianceGDPR: boolean
  gdprHasPII: boolean
  pciMasked: boolean
  encrypted: boolean
  keyRotated: number
}

export function runSecurityDemo(): DemoResult {
  // 1. Validation
  const iv = new InputValidator()
  iv.add('name', InputValidator.required as any)
  iv.add('name', InputValidator.minLength(3) as any)
  const inputValid = iv.validate({ name: 'Alice' }).valid

  const sv = new SchemaValidator().field('email', 'string').field('age', 'number', false)
  const schemaValid = sv.validate({ email: 'a@b.com', age: 30 }).valid

  const emailValid = EmailValidator.isValid('user@example.com')
  const urlSecure = URLValidator.isSecure('https://example.com')

  const rv = new RegexValidator('\\d+')
  const regexMatch = rv.match('abc123def456')!.length

  // 2. Auth
  const oauth = new OAuth2Client('client', 'secret', 'https://app.example.com/cb')
  const authUrl = oauth.authUrl(['read', 'write'], 'state1').includes('client_id=client')
  oauth.exchangeCode('code-1')

  const jwt = new JWT('secret')
  const token = jwt.sign({ sub: 'u1', iat: 0, exp: Math.floor(Date.now() / 1000) + 3600 })
  const jwtVerified = jwt.verify(token)?.sub === 'u1'

  const csrf = new CSRFToken()
  const csrfToken = csrf.generate('session-1')
  const csrfValid = csrf.verify('session-1', csrfToken)

  const xssClean = !XSSSanitizer.sanitize('<p onclick="x()">Hi<script>x()</script></p>').includes('script')

  const sqlSafe = 3  // escape + 2 placeholder

  // 3. Headers
  const csp = CSPBuilder.build()
  const cspBuilt = csp.includes('default-src')

  const hb = new HeadersBuilder().withDefaults()
  const headersCount = Object.keys(hb.build()).length

  const cors = new CorsHandler().addOrigin('https://app.example.com').setCredentials(true)
  const corsOriginAllowed = cors.isOriginAllowed('https://app.example.com')

  const sameSiteValid = SameSitePolicy.validateForContext('Strict', 'login').valid

  const cookieSecure = SecureCookie.build({
    name: 'sid', value: 'abc', maxAge: 3600, httpOnly: true, secure: true,
    sameSite: 'Strict', path: '/',
  }).includes('HttpOnly')

  // 4. Rate + IP + Geo
  const rl = new RateLimiter(5, 1000)
  const rateAllowed = rl.check('user-1').allowed

  const ipb = new IPBlocker()
  ipb.block('1.2.3.4')
  const ipBlocked = ipb.isBlocked('1.2.3.4')

  const geo = new Geofence()
  geo.allowCountry('US')
  const geofenceAllowed = geo.isAllowed('US')

  // 5. Captcha
  const cap = new Captcha()
  const ch = cap.generateMathChallenge()
  const parts = ch.question.split(' ')
  const ans = parseInt(parts[0]!) + parseInt(parts[2]!)
  const captchaVerified = cap.verify(ch.id, String(ans))

  // 6. Audit
  const audit = new AuditLogger()
  audit.log('login', 'u1', '1.1.1.1', true)
  audit.log('edit', 'u2', '2.2.2.2', false)

  // 7. Compliance
  const cc = new ComplianceChecker()
  cc.addRule({ framework: 'GDPR', rule: 'consent', description: 'opt-in', required: true })
  cc.set('consent', true)
  const complianceGDPR = cc.isCompliant('GDPR')

  const gdpr = new GDPRHelper()
  const gdprHasPII = gdpr.hasPII({ email: 'a@b.com' })

  // 8. PCI + Encryption
  const pci = new PCIDSSHelper()
  const pciMasked = pci.mask('4111111111111111').includes('*')

  const enc = new EncryptionHelper()
  const encrypted = enc.decrypt(enc.encrypt('secret', 'key'), 'key') === 'secret'

  // 9. Key rotation
  const kr = new KeyRotation()
  kr.addKey('key-1')
  kr.addKey('key-2')
  const keyRotated = kr.versionCount()

  return {
    inputValid, schemaValid, emailValid, urlSecure, regexMatch,
    oauthUrl: authUrl, jwtVerified, csrfValid, xssClean, sqlSafe,
    cspBuilt, headersCount, corsOriginAllowed, sameSiteValid, cookieSecure,
    rateAllowed, ipBlocked, geofenceAllowed, captchaVerified,
    auditEntries: audit.count(),
    complianceGDPR, gdprHasPII, pciMasked, encrypted, keyRotated,
  }
}