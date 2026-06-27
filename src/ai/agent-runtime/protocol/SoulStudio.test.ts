/**
 * protocol/SoulStudio.test.ts (V2466-V2470) — 20+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SOUL_STUDIO_CONFIG, buildSections, buildPreview, validateForStudio,
  exportStudioConfig, importStudioConfig,
} from './SoulStudio'
import type { SoulTemplate } from '../types'

const T: SoulTemplate = {
  templateId: 't1', displayName: 'Test Template', archetype: 'specialist',
  basePersona: {
    displayName: 'Test', tagline: 'p', principles: ['p1', 'p2'],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
  },
  baseCapabilities: ['plot', 'style'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'A test template',
}

describe('DEFAULT_SOUL_STUDIO_CONFIG + buildSections', () => {
  it('default config has 6 sections enabled', () => {
    const s = buildSections()
    expect(s.length).toBe(6)
    expect(s.every(x => x.enabled)).toBe(true)
  })

  it('disabled sections reflect config', () => {
    const s = buildSections({ ...DEFAULT_SOUL_STUDIO_CONFIG, showPreview: false })
    expect(s.find(x => x.name === 'preview')?.enabled).toBe(false)
  })
})

describe('buildPreview', () => {
  it('builds preview from template', () => {
    const p = buildPreview(T)
    expect(p.displayName).toBe('Test Template')
    expect(p.capabilities).toEqual(['plot', 'style'])
    expect(p.principles).toEqual(['p1', 'p2'])
    expect(p.archetype).toBe('specialist')
  })

  it('includes tone snapshot', () => {
    const p = buildPreview(T)
    expect(p.toneSnapshot.formality).toBe(0.5)
  })
})

describe('validateForStudio', () => {
  it('no issues for valid template', () => {
    const issues = validateForStudio(T)
    expect(issues.length).toBe(0)
  })

  it('error on short display name', () => {
    const issues = validateForStudio({ ...T, displayName: 'X' })
    expect(issues.some(i => i.field === 'displayName' && i.severity === 'error')).toBe(true)
  })

  it('error on no capabilities', () => {
    const issues = validateForStudio({ ...T, baseCapabilities: [] })
    expect(issues.some(i => i.field === 'baseCapabilities')).toBe(true)
  })

  it('warning on no principles', () => {
    const issues = validateForStudio({ ...T, basePersona: { ...T.basePersona, principles: [] } })
    expect(issues.some(i => i.field === 'principles' && i.severity === 'warning')).toBe(true)
  })
})

describe('exportStudioConfig + importStudioConfig', () => {
  it('roundtrip', () => {
    const json = exportStudioConfig(DEFAULT_SOUL_STUDIO_CONFIG)
    const back = importStudioConfig(json)
    expect(back.theme).toBe('light')
  })

  it('import fills missing fields with defaults', () => {
    const back = importStudioConfig('{"theme": "dark"}')
    expect(back.showPreview).toBe(true) // default
    expect(back.theme).toBe('dark')
  })
})
