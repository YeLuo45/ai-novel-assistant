# Security & Compliance (V3) — Direction T

**Version**: 1.0.0
**Engines**: V2896-V2925 (30 engines, 6 batches)
**Tests**: 91 tests, 100% pass

## 目标

完整安全 + 合规：输入验证、OAuth2/JWT/CSRF、XSS/SQL 转义、CSP/HSTS/Secure Cookie、Rate Limit/IP Block/Geofence/Captcha、Audit Log、GDPR/PCI-DSS/Encryption/KeyRotation。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| T1-T10 | `Validation.ts` | InputValidator (5 validators) + SchemaValidator + EmailValidator + URLValidator + RegexValidator + OAuth2Client (auth + refresh) + JWT (HMAC-like) + CSRFToken (one-time) + XSSSanitizer (escape + strip scripts/attrs) + SQLEscape |
| T11-T25 | `SecurityAdvanced.ts` | CSPBuilder (9 directives) + HeadersBuilder (5 default) + CorsHandler (origin + credentials) + SameSitePolicy + SecureCookie + RateLimiter + IPBlocker + Geofence + Captcha (math) + AuditLogger + ComplianceChecker (GDPR/CCPA/HIPAA/PCI-DSS/SOC2) + GDPRHelper + PCIDSSHelper + EncryptionHelper + KeyRotation |
| T26 | `index.ts` + `demo/security-demo.ts` | 25 端到端断言 |
| T27 | `__tests__/security-integration.test.ts` | 6 集成测试 |
| T28 | `SECURITY_README.md` | 本文档 |
| T29 | 主 README 更新 | 验证命令 |
| T30 | 收口 commit + push | |

## 核心 API 示例

### 1. Input + Schema Validation

```ts
import { InputValidator, SchemaValidator, EmailValidator, URLValidator } from '@/security'

const iv = new InputValidator()
iv.add('email', InputValidator.required as any)
iv.add('email', InputValidator.minLength(3) as any)
iv.validate({ email: 'a@b.com' })

const sv = new SchemaValidator().field('email', 'string').field('age', 'number', false)
sv.validate({ email: 'a@b.com', age: 30 })

EmailValidator.isValid('a@b.com')
URLValidator.isSecure('https://example.com')
```

### 2. Auth (OAuth2 / JWT / CSRF)

```ts
import { OAuth2Client, JWT, CSRFToken } from '@/security'

const oauth = new OAuth2Client('id', 'secret', 'https://app.com/cb')
const authUrl = oauth.authUrl(['read', 'write'], 'state-1')
const token = oauth.exchangeCode('auth-code')

const jwt = new JWT('secret')
const t = jwt.sign({ sub: 'user-1', iat: 0, exp: Math.floor(Date.now() / 1000) + 3600 })
jwt.verify(t)

const csrf = new CSRFToken()
const token = csrf.generate('session-1')
csrf.verify('session-1', token)  // one-time use
```

### 3. XSS / SQL Sanitization

```ts
import { XSSSanitizer, SQLEscape } from '@/security'

XSSSanitizer.escapeHTML('<script>alert(1)</script>')
XSSSanitizer.sanitize('<p onclick="x()">Hi<script>x()</script></p>')
SQLEscape.escape("O'Brien")
SQLEscape.hasDangerousChars("a'; DROP TABLE users;--")
```

### 4. Security Headers

```ts
import { CSPBuilder, HeadersBuilder, CorsHandler, SecureCookie } from '@/security'

CSPBuilder.build({ defaultSrc: ["'self'", 'https://cdn.example.com'] })
new HeadersBuilder().withDefaults().build()  // X-Content-Type-Options, X-Frame-Options, etc.

const cors = new CorsHandler().addOrigin('https://app.com').setCredentials(true)
cors.isOriginAllowed('https://app.com')

SecureCookie.build({ name: 'sid', value: 'abc', maxAge: 3600, httpOnly: true, secure: true, sameSite: 'Strict', path: '/' })
```

### 5. Rate Limit / IP / Geo / Captcha

```ts
import { RateLimiter, IPBlocker, Geofence, Captcha } from '@/security'

const rl = new RateLimiter(5, 60_000)
rl.check('user-1')

const ip = new IPBlocker()
ip.block('1.2.3.4')
ip.whitelist('1.2.3.4')  // override

const geo = new Geofence()
geo.allowCountry('US')

const cap = new Captcha()
const ch = cap.generateMathChallenge()
cap.verify(ch.id, '8')
```

### 6. Audit + Compliance

```ts
import { AuditLogger, ComplianceChecker, GDPRHelper, PCIDSSHelper, EncryptionHelper, KeyRotation } from '@/security'

const audit = new AuditLogger()
audit.log('login', 'u1', '1.1.1.1', true)

const cc = new ComplianceChecker()
cc.addRule({ framework: 'GDPR', rule: 'consent', description: 'opt-in', required: true })
cc.set('consent', true)
cc.isCompliant('GDPR')

new GDPRHelper().hasPII({ email: 'a@b.com' })
new PCIDSSHelper().mask('4111111111111111')

const enc = new EncryptionHelper()
enc.decrypt(enc.encrypt('secret', 'key'), 'key')  // 'secret'

const kr = new KeyRotation()
kr.addKey('key-1')  // active
kr.addKey('key-2')  // current
kr.retireKey(1)      // retire old
```

## 验证命令

```bash
npx vitest run src/security/  # 91 passed
npx vitest run src/security/demo/security-demo.test.ts
npx vitest run src/security/__tests__/security-integration.test.ts
```

## 灵感

- OWASP Top 10
- OAuth 2.0 + JWT spec
- CSP Level 3 / HSTS
- Web Crypto API
- Helmet.js
- Snyk / SonarQube
- GDPR / CCPA / HIPAA / PCI-DSS

## 累计

- Direction A-T: **785 engines / ~7,672 tests**
- 21 commits pushed
- 灵感: OWASP + OAuth2 + JWT + CSP + Web Crypto + Helmet + GDPR/PCI-DSS