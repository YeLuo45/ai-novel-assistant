/**
 * protocol/demo/user-context-demo.ts (V2441)
 */

import {
  ManagedAgentRuntime,
  createBuiltinTeamIds,
  builtinTemplateByIndex,
} from '../../index'
import { UserContextProjector, UserPrivacyGuard, UserConsentLog, type UserContext } from '../UserContext'
import { UserPreferenceStore, injectPreferences } from '../UserPreferencesAndAdapter'
import { buildUserView } from '../UserContext'

/** 启动 5 agent user context 投影 demo */
export function startUserContextDemo(sampleUser: UserContext): {
  runtime: ManagedAgentRuntime
  projector: UserContextProjector
  guard: UserPrivacyGuard
  consent: UserConsentLog
  prefs: UserPreferenceStore
  views: Record<string, ReturnType<typeof buildUserView>>
} {
  const runtime = new ManagedAgentRuntime()
  const projector = new UserContextProjector()
  const guard = new UserPrivacyGuard()
  const consent = new UserConsentLog()
  const prefs = new UserPreferenceStore()

  const teamIds = createBuiltinTeamIds()
  for (let i = 0; i < teamIds.length; i++) {
    runtime.spawn({ template: builtinTemplateByIndex(i), agentId: teamIds[i] })
  }

  // user consent
  consent.record({ userId: sampleUser.userId, consentType: 'memory', granted: true, grantedAt: Date.now() })
  consent.record({ userId: sampleUser.userId, consentType: 'sharing', granted: true, grantedAt: Date.now() })

  // 添加偏好
  prefs.set({ key: 'genre', value: 'scifi', category: 'meta', scope: 'global', updatedAt: Date.now() })

  // 投影到每个 agent
  const views: Record<string, ReturnType<typeof buildUserView>> = {}
  for (let i = 0; i < teamIds.length; i++) {
    const agent = runtime.list()[i]
    const viewType = projector.inferViewType(agent.archetype)
    views[agent.agentId] = projector.project(sampleUser, viewType)
  }
  return { runtime, projector, guard, consent, prefs, views }
}

/** 模拟隐私脱敏 + 偏好注入 */
export function simulatePrivacyAndInjection(
  user: UserContext,
  prefs: UserPreferenceStore,
): {
  redactedEmail: string
  aliasedRealName: string
  injectedGenre: string
} {
  // 1. 脱敏
  const guard = new UserPrivacyGuard()
  const redacted = guard.guard(user)
  // 2. 注入偏好
  const injected = injectPreferences(redacted, prefs, [
    { field: 'genrePref', sourceKey: 'genre' },
  ])
  return {
    redactedEmail: redacted.email ?? '',
    aliasedRealName: redacted.realName ?? '',
    injectedGenre: (injected as Record<string, unknown>).genrePref as string,
  }
}

/** 完整 demo */
export function runUserContextDemo(): {
  teamSize: number
  viewCount: number
  consent: number
  privacyApplied: boolean
  preferencesInjected: boolean
} {
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
  const { runtime, consent, prefs } = startUserContextDemo(sampleUser)
  const sim = simulatePrivacyAndInjection(sampleUser, prefs)
  return {
    teamSize: runtime.count(),
    viewCount: 5,
    consent: consent.count(),
    privacyApplied: sim.aliasedRealName !== '李雷',
    preferencesInjected: sim.injectedGenre === 'scifi',
  }
}
