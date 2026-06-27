/**
 * ui/theme/ThemeAdvanced.test.ts (M11-M20) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  BLUE_SCALE, ColorPalette, TypographyScale, ThemeTransition, AutoThemeDetection,
  ContrastValidator, ThemeValidator, ThemeVersioning, ThemeExportImport, ThemePreview, ThemeAccessibility,
} from './ThemeAdvanced'
import { LIGHT_THEME, DARK_THEME } from './DesignToken'

describe('M11: ColorPalette', () => {
  it('addScale + get', () => {
    const p = new ColorPalette()
    p.addScale('blue', BLUE_SCALE)
    expect(p.get('blue', 500)).toBe('#2196f3')
  })

  it('BLUE_SCALE has 10 steps', () => {
    expect(Object.keys(BLUE_SCALE).length).toBe(10)
  })

  it('list scales', () => {
    const p = new ColorPalette()
    p.addScale('a', BLUE_SCALE)
    p.addScale('b', BLUE_SCALE)
    expect(p.list().length).toBe(2)
  })
})

describe('M12: TypographyScale', () => {
  it('modular scale', () => {
    const s = new TypographyScale()
    const tokens = s.modularScale(16, 1.25, 5)
    expect(tokens.length).toBe(6)  // -1 to 4
  })

  it('define + get', () => {
    const s = new TypographyScale()
    s.define({ name: 'h1', fontSize: 32, lineHeight: 1.2, fontWeight: 700, letterSpacing: 0 })
    expect(s.get('h1')?.fontSize).toBe(32)
  })
})

describe('M13: ThemeTransition', () => {
  it('toCSS', () => {
    const t = new ThemeTransition()
    expect(t.toCSS()).toContain('ease-in-out')
  })

  it('toObject', () => {
    const t = new ThemeTransition()
    const obj = t.toObject()
    expect(obj['background-color']).toBeDefined()
  })

  it('setDuration', () => {
    const t = new ThemeTransition()
    t.setDuration(500)
    expect(t.config().durationMs).toBe(500)
  })
})

describe('M14: AutoThemeDetection', () => {
  it('detect initial', () => {
    expect(new AutoThemeDetection().detect()).toBe('no-preference')
  })

  it('setPreference + subscribe', () => {
    const d = new AutoThemeDetection()
    let called = 0
    d.subscribe(() => { called += 1 })
    d.setPreference('dark')
    expect(called).toBe(1)
    expect(d.current()).toBe('dark')
  })
})

describe('M15: ContrastValidator', () => {
  const v = new ContrastValidator()

  it('hexToRgb', () => {
    expect(v.hexToRgb('#000000')?.r).toBe(0)
    expect(v.hexToRgb('#ffffff')?.r).toBe(255)
  })

  it('contrast white on black is max', () => {
    expect(v.contrast('#ffffff', '#000000')).toBeCloseTo(21, 0)
  })

  it('check AA pass for high contrast', () => {
    const r = v.check('#000000', '#ffffff')
    expect(r.AA).toBe(true)
    expect(r.AAA).toBe(true)
  })

  it('check AA fail for low contrast', () => {
    const r = v.check('#cccccc', '#dddddd')
    expect(r.AA).toBe(false)
  })
})

describe('M16: ThemeValidator', () => {
  it('missing name', () => {
    const issues = new ThemeValidator().validate({})
    expect(issues.some(i => i.field === 'name')).toBe(true)
  })

  it('valid theme', () => {
    const issues = new ThemeValidator().validate(LIGHT_THEME)
    expect(issues.filter(i => i.severity === 'error').length).toBe(0)
  })
})

describe('M17: ThemeVersioning', () => {
  it('addVersion + latest', () => {
    const v = new ThemeVersioning()
    v.addVersion('light', '1.0.0', ['init'])
    v.addVersion('light', '1.1.0', ['fix bug'])
    expect(v.latest('light')?.version).toBe('1.1.0')
  })
})

describe('M18: ThemeExportImport', () => {
  it('export + import roundtrip', () => {
    const e = new ThemeExportImport()
    const json = e.export(LIGHT_THEME)
    const r = e.import(json)
    expect(r.ok).toBe(true)
    expect(r.theme?.name).toBe('light')
  })

  it('import invalid', () => {
    const r = new ThemeExportImport().import('bad json')
    expect(r.ok).toBe(false)
  })

  it('toCSS', () => {
    const e = new ThemeExportImport()
    const css = e.toCSS(LIGHT_THEME)
    expect(css).toContain('--color-bg')
  })
})

describe('M19: ThemePreview', () => {
  it('generate', () => {
    const p = new ThemePreview().generate(LIGHT_THEME)
    expect(p.background).toBe(LIGHT_THEME.colors.bg)
  })

  it('renderHTML', () => {
    const html = new ThemePreview().renderHTML(LIGHT_THEME, 'Test')
    expect(html).toContain('Test')
    expect(html).toContain('background:')
  })
})

describe('M20: ThemeAccessibility', () => {
  it('audit valid theme', () => {
    const r = new ThemeAccessibility().audit(LIGHT_THEME)
    expect(r.contrastIssues.length).toBeGreaterThan(0)
  })

  it('audit invalid contrast', () => {
    const bad = { ...LIGHT_THEME, colors: { ...LIGHT_THEME.colors, text: '#cccccc', bg: '#dddddd' } }
    const r = new ThemeAccessibility().audit(bad)
    expect(r.contrastIssues.some(c => !c.pass)).toBe(true)
  })

  it('hasCriticalIssues', () => {
    const a = new ThemeAccessibility()
    const r = a.audit({})
    expect(a.hasCriticalIssues(r)).toBe(true)
  })
})