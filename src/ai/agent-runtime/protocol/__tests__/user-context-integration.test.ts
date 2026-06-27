/**
 * protocol/__tests__/user-context-integration.test.ts (V2442)
 */

import { describe, it, expect } from 'vitest'
import {
  UserContextProjector,
  UserPrivacyGuard,
  UserConsentLog,
  UserPreferenceStore,
  injectPreferences,
  snapshotUserContext,
  diffUserContext,
  UserContextCache,
  validateUserContext,
  validateAgainstSchema,
  exportUserContext,
  importUserContext,
  type UserContext,
} from '../index'

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

describe('User context — end-to-end', () => {
  it('project + guard + inject: complete pipeline', () => {
    // 1. 投影
    const projector = new UserContextProjector()
    const view = projector.project(sampleUser, 'plotter')
    expect(view.viewType).toBe('plotter')
    // 2. 脱敏
    const guard = new UserPrivacyGuard()
    const redacted = guard.guard(sampleUser)
    expect(redacted.email).toMatch(/\*/)
    // 3. 注入
    const prefs = new UserPreferenceStore()
    prefs.set({ key: 'genre', value: 'scifi', category: 'meta', scope: 'global', updatedAt: 0 })
    const final = injectPreferences(redacted, prefs, [{ field: 'genrePref', sourceKey: 'genre' }])
    expect((final as Record<string, unknown>).genrePref).toBe('scifi')
  })

  it('snapshot + diff: track changes', () => {
    const prefs = new UserPreferenceStore()
    const snap1 = snapshotUserContext(sampleUser, prefs)
    const newUser = { ...sampleUser, penName: 'NewName' }
    const snap2 = snapshotUserContext(newUser, prefs)
    expect(snap1.userId).toBe(snap2.userId)
    const diff = diffUserContext(snap1.context, snap2.context)
    expect(diff.changed).toContain('penName')
  })

  it('cache + consent: privacy lifecycle', () => {
    const cache = new UserContextCache()
    const log = new UserConsentLog()
    log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: Date.now() })
    expect(log.hasConsent('u1', 'memory')).toBe(true)
    cache.set('u1', sampleUser, 1000)
    expect(cache.get('u1')?.userId).toBe('u1')
    log.revoke('u1', 'memory')
    expect(log.hasConsent('u1', 'memory')).toBe(false)
  })

  it('validate against schema passes valid', () => {
    const issues = validateAgainstSchema(sampleUser)
    expect(issues.length).toBe(0)
  })

  it('validate detects missing required', () => {
    const issues = validateAgainstSchema({} as UserContext)
    expect(issues.length).toBeGreaterThan(0)
  })

  it('validateUserContext: bad email warns', () => {
    const issues = validateUserContext({ userId: 'u', email: 'bad' })
    expect(issues.some(i => i.field === 'email' && i.severity === 'warning')).toBe(true)
  })

  it('export/import roundtrip', () => {
    const json = exportUserContext(sampleUser)
    const back = importUserContext(json)
    expect(back.userId).toBe('u1')
  })

  it('inferViewType for plotter specialist', () => {
    const p = new UserContextProjector()
    expect(p.inferViewType('specialist')).toBe('plotter')
  })
})
