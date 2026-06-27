/**
 * protocol/demo/user-context-demo.test.ts (V2441) — 6 断言
 */

import { describe, it, expect } from 'vitest'
import {
  startUserContextDemo,
  simulatePrivacyAndInjection,
  runUserContextDemo,
} from './user-context-demo'
import { UserPreferenceStore } from '../UserPreferencesAndAdapter'
import type { UserContext } from '../UserContext'

const sampleUser: UserContext = {
  userId: 'u1',
  realName: '李雷',
  penName: '青木',
  email: 'lilei@example.com',
  preferences: { genre: 'scifi' },
}

describe('user-context-demo', () => {
  it('startUserContextDemo spawns 5 agents', () => {
    const { runtime } = startUserContextDemo(sampleUser)
    expect(runtime.count()).toBe(5)
  })

  it('projects views for each agent', () => {
    const { views } = startUserContextDemo(sampleUser)
    expect(Object.keys(views).length).toBe(5)
  })

  it('redacts email', () => {
    const prefs = new UserPreferenceStore()
    const sim = simulatePrivacyAndInjection(sampleUser, prefs)
    expect(sim.redactedEmail).toMatch(/\*/)
  })

  it('aliases realName', () => {
    const prefs = new UserPreferenceStore()
    const sim = simulatePrivacyAndInjection(sampleUser, prefs)
    expect(sim.aliasedRealName).not.toBe('李雷')
  })

  it('injects preferences', () => {
    const prefs = new UserPreferenceStore()
    prefs.set({ key: 'genre', value: 'romance', category: 'meta', scope: 'global', updatedAt: 0 })
    const sim = simulatePrivacyAndInjection(sampleUser, prefs)
    expect(sim.injectedGenre).toBe('romance')
  })

  it('runUserContextDemo end-to-end', () => {
    const r = runUserContextDemo()
    expect(r.teamSize).toBe(5)
    expect(r.privacyApplied).toBe(true)
    expect(r.preferencesInjected).toBe(true)
  })
})
