/**
 * ui/theme/__tests__/theme-integration.test.ts (M27)
 */

import { describe, it, expect } from 'vitest'
import {
  ThemeRegistry, ThemeProvider, ThemeSwitcher, ThemePersistence,
  CustomThemeBuilder, ContrastValidator, ThemeValidator, ThemeAccessibility,
  ThemeExportImport, ThemePreview, HighContrastMode, ColorBlindSupport,
  DarkModeOptimizer, ThemeVersioning, ThemeTransition,
} from '../index'

describe('Theme — end-to-end', () => {
  it('full lifecycle: register + switch + persist + restore', () => {
    const r = new ThemeRegistry()
    const p = new ThemeProvider(r)
    const sw = new ThemeSwitcher(p)
    sw.switchTo('dark')
    sw.switchTo('sepia')

    const persister = new ThemePersistence()
    const json = persister.serialize('nord')
    sw.switchTo(persister.deserialize(json) ?? 'light')
    expect(p.currentName()).toBe('nord')
  })

  it('custom theme registration', () => {
    const r = new ThemeRegistry()
    const custom = new CustomThemeBuilder().name('x').color('bg', '#fff').build()
    r.register(custom)
    r.setActive('x')
    expect(r.getActive().name).toBe('x')
  })

  it('all 4 built-in themes have valid contrast', () => {
    const v = new ContrastValidator()
    const themes = [
      { name: 'light', bg: '#ffffff', text: '#1a1a1a' },
      { name: 'dark', bg: '#0d1117', text: '#e6edf3' },
      { name: 'sepia', bg: '#f4ecd8', text: '#5b4636' },
      { name: 'nord', bg: '#2e3440', text: '#eceff4' },
    ]
    for (const t of themes) {
      const r = v.check(t.text, t.bg)
      expect(r.AA).toBe(true)
    }
  })

  it('high contrast has stronger contrast than normal', () => {
    const v = new ContrastValidator()
    const normal = v.check('#1a1a1a', '#ffffff')
    const hc = v.check('#000000', '#ffffff')
    expect(hc.ratio).toBeGreaterThan(normal.ratio)
  })

  it('export + import roundtrip', () => {
    const e = new ThemeExportImport()
    const theme = { name: 'test', colors: { bg: '#fff', text: '#000' } }
    const json = e.export(theme, '2.0.0')
    const result = e.import(json)
    expect(result.theme?.name).toBe('test')
  })

  it('versioning tracks changes', () => {
    const v = new ThemeVersioning()
    v.addVersion('light', '1.0.0', ['init'])
    v.addVersion('light', '1.1.0', ['fix bg'])
    expect(v.latest('light')?.changes[0]).toBe('fix bg')
  })

  it('transition CSS', () => {
    const t = new ThemeTransition()
    expect(t.toCSS()).toContain('ms')
  })

  it('preview generates valid HTML', () => {
    const p = new ThemePreview()
    const html = p.renderHTML({ colors: { bg: '#fff', text: '#000', accent: '#00f', accentText: '#fff', border: '#ccc' } } as any)
    expect(html).toContain('background:')
  })

  it('color blind changes red', () => {
    const c = new ColorBlindSupport()
    c.setMode('deuteranopia')
    expect(c.apply('#ff0000')).not.toBe('#ff0000')
  })

  it('dark mode validator catches bad themes', () => {
    const a11y = new ThemeAccessibility()
    const bad = { name: 'bad', colors: { bg: '#000', text: '#000', accent: '#000', border: '#000' } }
    const r = a11y.audit(bad)
    expect(a11y.hasCriticalIssues(r)).toBe(true)
  })

  it('HighContrastMode list contains 2', () => {
    expect(HighContrastMode.list().length).toBe(2)
  })

  it('DarkModeOptimizer adjusts white bg', () => {
    const r = DarkModeOptimizer.adjust({ bg: '#ffffff' })
    expect(r.bg).not.toBe('#ffffff')
  })
})