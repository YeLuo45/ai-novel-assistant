/**
 * ui/theme/ThemeSpecialized.test.ts (M21-M25) - 20+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  HighContrastMode, ColorBlindSupport, COLOR_BLIND_FILTERS, DarkModeOptimizer,
  SepiaModeOptimizer, NordModeOptimizer, HIGH_CONTRAST_LIGHT,
  HIGH_CONTRAST_DARK, OPTIMIZED_DARK,
} from './ThemeSpecialized'
import { LIGHT_THEME } from './DesignToken'

describe('M21: HighContrastMode', () => {
  it('fromTheme returns HC variant', () => {
    const hc = HighContrastMode.fromTheme(LIGHT_THEME, false)
    expect(HighContrastMode.isHighContrast(hc)).toBe(true)
  })

  it('list contains both HC variants', () => {
    expect(HighContrastMode.list().length).toBe(2)
    expect(HighContrastMode.list().map(t => t.name)).toContain('hc-light')
    expect(HighContrastMode.list().map(t => t.name)).toContain('hc-dark')
  })

  it('HC light has pure black text', () => {
    expect(HIGH_CONTRAST_LIGHT.colors.text).toBe('#000000')
  })

  it('HC dark has pure white text', () => {
    expect(HIGH_CONTRAST_DARK.colors.text).toBe('#ffffff')
  })

  it('isHighContrast negative', () => {
    expect(HighContrastMode.isHighContrast(LIGHT_THEME)).toBe(false)
  })
})

describe('M22: ColorBlindSupport', () => {
  it('default mode is normal', () => {
    expect(new ColorBlindSupport().current()).toBe('normal')
  })

  it('setMode', () => {
    const c = new ColorBlindSupport()
    c.setMode('deuteranopia')
    expect(c.current()).toBe('deuteranopia')
  })

  it('apply normal returns same', () => {
    const c = new ColorBlindSupport()
    expect(c.apply('#ff0000')).toBe('#ff0000')
  })

  it('apply with mode changes color', () => {
    const c = new ColorBlindSupport()
    c.setMode('protanopia')
    const result = c.apply('#ff0000')
    expect(result).not.toBe('#ff0000')
  })

  it('COLOR_BLIND_FILTERS has 5 modes', () => {
    expect(Object.keys(COLOR_BLIND_FILTERS).length).toBe(5)
  })

  it('apply protanopia to red', () => {
    const c = new ColorBlindSupport()
    c.setMode('protanopia')
    // Apply to individual color (proves filter works)
    expect(c.apply('#ff0000')).not.toBe('#ff0000')
  })

  it('applyToTheme applies to all colors', () => {
    const c = new ColorBlindSupport()
    c.setMode('deuteranopia')
    const customTheme = { ...LIGHT_THEME, colors: { ...LIGHT_THEME.colors, bg: '#ff0000' } }
    const t = c.applyToTheme(customTheme)
    expect(t.colors.bg).not.toBe('#ff0000')
  })
})

describe('M23: DarkModeOptimizer', () => {
  it('isTooBright for #ffffff', () => {
    expect(DarkModeOptimizer.isTooBright('#ffffff')).toBe(true)
  })

  it('isTooBright for #1a1a1a', () => {
    expect(DarkModeOptimizer.isTooBright('#1a1a1a')).toBe(false)
  })

  it('adjust converts white bg to dark', () => {
    const result = DarkModeOptimizer.adjust({ bg: '#ffffff', text: '#000000' })
    expect(result.bg).toBe('#1a1a1a')
    expect(result.text).toBe('#000000')  // unchanged
  })

  it('isValid for DARK_THEME', async () => {
    const { DARK_THEME } = await import('./DesignToken')
    expect(DarkModeOptimizer.isValid(DARK_THEME)).toBe(true)
  })
})

describe('M24: SepiaModeOptimizer', () => {
  it('isSepia detection', () => {
    expect(SepiaModeOptimizer.isSepia(LIGHT_THEME)).toBe(false)
  })

  it('adjust bg to sepia', () => {
    const result = SepiaModeOptimizer.adjust({ bg: '#ffffff' })
    expect(result.bg).toBe('#f4ecd8')
  })
})

describe('M25: NordModeOptimizer', () => {
  it('isNord detection', () => {
    expect(NordModeOptimizer.isNord(LIGHT_THEME)).toBe(false)
  })

  it('adjust bg to nord', () => {
    const result = NordModeOptimizer.adjust({ bg: '#ffffff' })
    expect(result.bg).toBe('#2e3440')
  })

  it('OPTIMIZED_DARK has dark bg', () => {
    expect(OPTIMIZED_DARK.bg).toBe('#1a1a1a')
  })
})