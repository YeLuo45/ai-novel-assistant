/**
 * protocol/UserContext.test.ts (V2416-V2425) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  UserViewRegistry,
  buildUserView,
  DEFAULT_VIEW_SELECTORS,
  UserContextProjector,
  applyRedaction,
  UserPrivacyGuard,
  UserConsentLog,
  type UserContext,
  type UserViewType,
} from './UserContext'
import { createUserBinding } from '../AgentUserBinding'

const sampleUser: UserContext = {
  userId: 'u1',
  realName: '李雷',
  penName: '青木',
  email: 'lilei@example.com',
  voiceProfile: { formality: 0.7 },
  plotOutline: { act1: '...' },
  preferences: { genre: 'scifi' },
  privacyLevel: 'private',
}

describe('UserViewRegistry + DEFAULT_VIEW_SELECTORS', () => {
  it('DEFAULT_VIEW_SELECTORS has 6 types', () => {
    expect(Object.keys(DEFAULT_VIEW_SELECTORS).length).toBe(6)
  })

  it('plotter selects plot-relevant fields', () => {
    const fields = DEFAULT_VIEW_SELECTORS.plotter(sampleUser)
    expect(fields).toContain('plotOutline')
    expect(fields).toContain('penName')
  })

  it('stylist selects style-relevant fields', () => {
    const fields = DEFAULT_VIEW_SELECTORS.stylist(sampleUser)
    expect(fields).toContain('voiceProfile')
  })

  it('generic is minimal', () => {
    const fields = DEFAULT_VIEW_SELECTORS.generic(sampleUser)
    expect(fields.length).toBeLessThan(4)
  })

  it('registry: register + get', () => {
    const r = new UserViewRegistry()
    const sel = (u: UserContext) => ['email']
    r.register('plotter', sel)
    expect(r.get('plotter')).toBe(sel)
  })

  it('registry: list', () => {
    const r = new UserViewRegistry()
    r.register('plotter', () => [])
    r.register('critic', () => [])
    expect(r.list().length).toBe(2)
  })
})

describe('buildUserView', () => {
  it('builds plotter view with only selected fields', () => {
    const v = buildUserView(sampleUser, 'plotter')
    expect(v.viewType).toBe('plotter')
    expect(v.fields.penName).toBe('青木')
    expect(v.fields.plotOutline).toBeDefined()
    expect(v.fields.email).toBeUndefined()
  })

  it('builds stylist view', () => {
    const v = buildUserView(sampleUser, 'stylist')
    expect(v.viewType).toBe('stylist')
    expect(v.fields.voiceProfile).toBeDefined()
  })

  it('includes redactedFields and aliasMap', () => {
    const v = buildUserView(sampleUser, 'generic')
    expect(Array.isArray(v.redactedFields)).toBe(true)
    expect(typeof v.aliasMap).toBe('object')
  })

  it('sets generatedAt and sourceUserId', () => {
    const v = buildUserView(sampleUser, 'generic')
    expect(v.generatedAt).toBeGreaterThan(0)
    expect(v.sourceUserId).toBe('u1')
  })
})

describe('UserContextProjector', () => {
  it('inferViewType from archetype', () => {
    const p = new UserContextProjector()
    expect(p.inferViewType('specialist')).toBe('plotter')
    expect(p.inferViewType('instructor')).toBe('stylist')
    expect(p.inferViewType('critic')).toBe('critic')
    expect(p.inferViewType('reviewer')).toBe('continuity')
    expect(p.inferViewType('unknown')).toBe('generic')
  })

  it('project uses inferred viewType', () => {
    const p = new UserContextProjector()
    const v = p.project(sampleUser, p.inferViewType('specialist'))
    expect(v.viewType).toBe('plotter')
  })

  it('projectToBinding uses binding.visibleUserFields', () => {
    const p = new UserContextProjector()
    const b = createUserBinding({ agentId: 'a1', visibleUserFields: ['penName', 'voiceProfile'], userAlias: 'X' })
    const v = p.projectToBinding(sampleUser, b)
    expect(v.fields.penName).toBe('青木')
    expect(v.fields.voiceProfile).toBeDefined()
    expect(v.fields.email).toBeUndefined()
  })
})

describe('applyRedaction', () => {
  it('mask email', () => {
    const r = applyRedaction(sampleUser)
    expect(r.email).toMatch(/^li\*+/)
  })

  it('alias realName', () => {
    const r = applyRedaction(sampleUser)
    expect(r.realName).not.toBe('李雷')
  })

  it('remove address', () => {
    const u = { ...sampleUser, address: '123 Main St' }
    const r = applyRedaction(u)
    expect(r.address).toBeUndefined()
  })

  it('custom rules', () => {
    const r = applyRedaction(sampleUser, [{ field: 'email', redaction: 'remove' }])
    expect(r.email).toBeUndefined()
  })

  it('aliasMap is consistent across calls', () => {
    const u1 = applyRedaction({ ...sampleUser })
    const u2 = applyRedaction({ ...sampleUser })
    expect(u1.realName).toBe(u2.realName)
  })
})

describe('UserPrivacyGuard', () => {
  it('shouldRedact', () => {
    const g = new UserPrivacyGuard()
    expect(g.shouldRedact('email')).toBe(true)
  })

  it('guard returns masked', () => {
    const g = new UserPrivacyGuard()
    const r = g.guard(sampleUser)
    expect(r.email).toMatch(/\*/)
  })

  it('addRule', () => {
    const g = new UserPrivacyGuard()
    g.addRule({ field: 'phone', redaction: 'remove' })
    expect(g.rules().some(r => r.field === 'phone')).toBe(true)
  })

  it('aliasMap tracks mappings', () => {
    const g = new UserPrivacyGuard()
    const r1 = g.guard({ ...sampleUser })
    const r2 = g.guard({ ...sampleUser, realName: '韩梅' })
    const m = g.aliasMap()
    expect(Object.keys(m).length).toBeGreaterThan(0)
  })
})

describe('UserConsentLog', () => {
  it('record + hasConsent', () => {
    const log = new UserConsentLog()
    log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: Date.now() })
    expect(log.hasConsent('u1', 'memory')).toBe(true)
  })

  it('not granted = false', () => {
    const log = new UserConsentLog()
    expect(log.hasConsent('u1', 'memory')).toBe(false)
  })

  it('expired consent = false', () => {
    const log = new UserConsentLog()
    log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: 0, expiresAt: 100 })
    expect(log.hasConsent('u1', 'memory', 200)).toBe(false)
  })

  it('revoke', () => {
    const log = new UserConsentLog()
    log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: Date.now() })
    expect(log.revoke('u1', 'memory')).toBe(true)
    expect(log.hasConsent('u1', 'memory')).toBe(false)
  })

  it('consentsFor', () => {
    const log = new UserConsentLog()
    log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: Date.now() })
    log.record({ userId: 'u1', consentType: 'message', granted: true, grantedAt: Date.now() })
    expect(log.consentsFor('u1').length).toBe(2)
  })

  it('clear empties', () => {
    const log = new UserConsentLog()
    log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: Date.now() })
    log.clear()
    expect(log.count()).toBe(0)
  })
})
