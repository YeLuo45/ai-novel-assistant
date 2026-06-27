/**
 * ui/theme/demo/theme-integration-demo.test.ts (M26)
 */

import { describe, it, expect } from 'vitest'
import { runThemeDemo } from './theme-integration-demo'

describe('theme-integration-demo', () => {
  it('registers 6 themes (4 built-in + 1 custom + 1 HC)', () => {
    expect(runThemeDemo().registeredThemes).toBe(6)
  })

  it('active theme is light', () => {
    expect(runThemeDemo().activeTheme).toBe('light')
  })

  it('switched 4 times', () => {
    expect(runThemeDemo().switched).toBe(4)
  })

  it('has 2 high contrast themes', () => {
    expect(runThemeDemo().hasHC).toBe(2)
  })

  it('has color blind support', () => {
    expect(runThemeDemo().hasColorBlind).toBe(1)
  })

  it('3 contrast checks', () => {
    expect(runThemeDemo().contrastChecks).toBe(3)
  })

  it('1 validation error (missing colors)', () => {
    expect(runThemeDemo().validationErrors).toBe(1)
  })

  it('exported successfully', () => {
    expect(runThemeDemo().exported).toBe(true)
  })

  it('previewed successfully', () => {
    expect(runThemeDemo().previewed).toBe(true)
  })

  it('dark optimization works', () => {
    expect(runThemeDemo().darkOptimized).toBe(true)
  })
})