/**
 * ui/theme/DesignToken.test.ts (M1-M10) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  DesignTokenRegistry, LIGHT_THEME, DARK_THEME, SEPIA_THEME, NORD_THEME,
  ThemeRegistry, ThemeProvider, CustomThemeBuilder, ThemePersistence, ThemeSwitcher,
  type ThemeName,
} from './DesignToken'

describe('M1: DesignTokenRegistry', () => {
  it('set + get + has', () => {
    const r = new DesignTokenRegistry<string>()
    r.set('color-primary', '#1976d2')
    expect(r.get('color-primary')).toBe('#1976d2')
    expect(r.has('color-primary')).toBe(true)
  })

  it('all + toObject', () => {
    const r = new DesignTokenRegistry<number>()
    r.set('size-1', 4)
    r.set('size-2', 8)
    const obj = r.toObject()
    expect(obj['size-1']).toBe(4)
  })
})

describe('M4-M7: 4 built-in themes', () => {
  it('light theme is not dark', () => {
    expect(LIGHT_THEME.isDark).toBe(false)
    expect(LIGHT_THEME.name).toBe('light')
  })

  it('dark theme is dark', () => {
    expect(DARK_THEME.isDark).toBe(true)
    expect(DARK_THEME.name).toBe('dark')
  })

  it('sepia theme is warm', () => {
    expect(SEPIA_THEME.isDark).toBe(false)
    expect(SEPIA_THEME.colors.bg).toContain('ecd8')  // #f4ecd8
  })

  it('nord theme is dark + cool', () => {
    expect(NORD_THEME.isDark).toBe(true)
    expect(NORD_THEME.colors.bg).toBe('#2e3440')
  })

  it('all 4 themes have required fields', () => {
    for (const t of [LIGHT_THEME, DARK_THEME, SEPIA_THEME, NORD_THEME]) {
      expect(t.colors).toBeDefined()
      expect(t.typography).toBeDefined()
      expect(t.spacing).toBeDefined()
      expect(t.radius).toBeDefined()
      expect(t.shadow).toBeDefined()
    }
  })
})

describe('M3: ThemeRegistry', () => {
  it('registers 4 built-in', () => {
    const r = new ThemeRegistry()
    expect(r.count()).toBe(4)
  })

  it('list all', () => {
    const r = new ThemeRegistry()
    expect(r.list().length).toBe(4)
  })

  it('get + setActive', () => {
    const r = new ThemeRegistry()
    r.setActive('dark')
    expect(r.getActive().name).toBe('dark')
    expect(r.activeId()).toBe('dark')
  })

  it('register custom + unregister', () => {
    const r = new ThemeRegistry()
    r.register({ name: 'test', displayName: 'Test', isDark: false, colors: LIGHT_THEME.colors, typography: LIGHT_THEME.typography, spacing: LIGHT_THEME.spacing, radius: LIGHT_THEME.radius, shadow: LIGHT_THEME.shadow })
    expect(r.count()).toBe(5)
    expect(r.unregister('test')).toBe(true)
  })
})

describe('M2: ThemeProvider', () => {
  it('setTheme + current', () => {
    const p = new ThemeProvider()
    p.setTheme('dark')
    expect(p.currentName()).toBe('dark')
    expect(p.current().name).toBe('dark')
  })

  it('system theme resolves to systemPreference', () => {
    const p = new ThemeProvider()
    p.setSystemPreference('dark')
    p.setTheme('system')
    expect(p.current().name).toBe('dark')
  })

  it('subscribe + notify', () => {
    const p = new ThemeProvider()
    let called = 0
    p.subscribe(() => { called += 1 })
    p.setTheme('sepia')
    expect(called).toBe(1)
  })

  it('availableThemes', () => {
    const p = new ThemeProvider()
    expect(p.availableThemes().length).toBe(4)
  })
})

describe('M9: CustomThemeBuilder', () => {
  it('build custom theme', () => {
    const t = new CustomThemeBuilder()
      .name('ocean')
      .displayName('Ocean Blue')
      .isDark(false)
      .color('bg', '#e6f3ff')
      .color('accent', '#0066cc')
      .build()
    expect(t.name).toBe('ocean')
    expect(t.colors.bg).toBe('#e6f3ff')
    expect(t.colors.accent).toBe('#0066cc')
  })

  it('inherits defaults', () => {
    const t = new CustomThemeBuilder().name('x').build()
    expect(t.colors.text).toBeDefined()
    expect(t.typography.fontFamily).toBeDefined()
  })
})

describe('M10: ThemePersistence', () => {
  it('serialize + deserialize', () => {
    const p = new ThemePersistence()
    const s = p.serialize('nord')
    expect(p.deserialize(s)).toBe('nord')
  })

  it('invalid JSON returns null', () => {
    expect(new ThemePersistence().deserialize('bad json')).toBeNull()
  })

  it('invalid theme returns null', () => {
    expect(new ThemePersistence().deserialize('{"theme":"foo"}')).toBeNull()
  })

  it('storageKey', () => {
    expect(new ThemePersistence('custom-key').storageKey()).toBe('custom-key')
  })
})

describe('M8: ThemeSwitcher', () => {
  it('switchTo + history', () => {
    const p = new ThemeProvider()
    const sw = new ThemeSwitcher(p)
    sw.switchTo('dark')
    sw.switchTo('sepia')
    expect(sw.history()).toEqual(['dark', 'sepia'])
  })

  it('toggle', () => {
    const p = new ThemeProvider()
    const sw = new ThemeSwitcher(p)
    expect(sw.toggle()).toBe('dark')
    expect(sw.toggle()).toBe('light')
  })

  it('available', () => {
    const sw = new ThemeSwitcher(new ThemeProvider())
    expect(sw.available().length).toBe(4)
  })
})