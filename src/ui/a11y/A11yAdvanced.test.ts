/**
 * ui/a11y/A11yAdvanced.test.ts (R16-R25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  HighContrastCheck, ColorBlindSimulator, FontSizeAdjuster, TextSpacingAdjuster,
  ReadingOrderValidator, ARIAValidator, AutoAltText, CaptionGenerator,
  SignLanguagePlaceholder, AccessibilityAudit,
} from './A11yAdvanced'

describe('R16: HighContrastCheck', () => {
  it('checkPair AAA pass', () => {
    const c = new HighContrastCheck()
    expect(c.checkPair('#000000', '#ffffff').pass).toBe(true)
  })

  it('checkTheme all pairs', () => {
    const c = new HighContrastCheck()
    const issues = c.checkTheme({ text: '#000000', textSecondary: '#333333', bg: '#ffffff' })
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe('R17: ColorBlindSimulator', () => {
  it('simulate deuteranopia', () => {
    const c = new ColorBlindSimulator()
    const out = c.simulate({ bg: '#ff0000', text: '#000000' }, 'deuteranopia')
    expect(out.bg).not.toBe('#ff0000')
  })
})

describe('R18: FontSizeAdjuster', () => {
  it('adjust + scale', () => {
    const f = new FontSizeAdjuster()
    f.setScale(1.5)
    expect(f.scale()).toBe(1.5)
    expect(f.adjust(16)).toBe(24)
  })

  it('clamp to range', () => {
    const f = new FontSizeAdjuster()
    f.setScale(3)
    expect(f.scale()).toBe(2)
  })
})

describe('R19: TextSpacingAdjuster', () => {
  it('toCSS', () => {
    const t = new TextSpacingAdjuster()
    expect(t.toCSS()).toContain('line-height')
  })
})

describe('R20: ReadingOrderValidator', () => {
  it('valid order', () => {
    const v = new ReadingOrderValidator()
    const r = v.validate([
      { id: 'h1', type: 'heading', level: 1, order: 0 },
      { id: 'p1', type: 'paragraph', order: 1 },
      { id: 'h2', type: 'heading', level: 2, order: 2 },
      { id: 'p2', type: 'paragraph', order: 3 },
    ])
    expect(r.valid).toBe(true)
  })

  it('heading level skip', () => {
    const v = new ReadingOrderValidator()
    const r = v.validate([
      { id: 'h1', type: 'heading', level: 1, order: 0 },
      { id: 'h3', type: 'heading', level: 3, order: 1 },
    ])
    expect(r.valid).toBe(false)
  })
})

describe('R21: ARIAValidator', () => {
  it('button needs label', () => {
    const v = new ARIAValidator()
    const r = v.validate('button', {})
    expect(r.valid).toBe(false)
  })

  it('slider needs valueNow/Min/Max', () => {
    const v = new ARIAValidator()
    const r = v.validate('slider', { label: 'Volume' })
    expect(r.valid).toBe(false)
  })

  it('valid slider', () => {
    const v = new ARIAValidator()
    const r = v.validate('slider', { label: 'Volume', valueNow: 50, valueMin: 0, valueMax: 100 })
    expect(r.valid).toBe(true)
  })
})

describe('R22: AutoAltText', () => {
  it('generate from description', () => {
    const a = new AutoAltText()
    expect(a.generate({ description: 'A red rose' })).toBe('A red rose')
  })

  it('generate from filename', () => {
    const a = new AutoAltText()
    expect(a.generate({ filename: 'hero-banner.jpg' })).toBe('Hero Banner')
  })

  it('isValidAlt rejects placeholders', () => {
    const a = new AutoAltText()
    expect(a.isValidAlt('image')).toBe(false)
    expect(a.isValidAlt('A red rose')).toBe(true)
  })
})

describe('R23: CaptionGenerator', () => {
  it('wraps text', () => {
    const c = new CaptionGenerator()
    const lines = c.generate('The quick brown fox jumps over the lazy dog', 20)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines[0]!.length).toBeLessThanOrEqual(20)
  })
})

describe('R24: SignLanguagePlaceholder', () => {
  it('not supported by default', () => {
    expect(new SignLanguagePlaceholder().isSupported()).toBe(false)
  })

  it('placeholderFor', () => {
    const p = new SignLanguagePlaceholder().placeholderFor('vid1')
    expect(p.type).toBe('sign-avatar')
  })
})

describe('R25: AccessibilityAudit', () => {
  it('audit with contrast issue', () => {
    const a = new AccessibilityAudit()
    const r = a.audit({
      contrastIssues: [{ pair: 'text/bg', ratio: 2, pass: false }],
    })
    expect(r.issues.length).toBe(1)
    expect(r.score).toBeLessThan(100)
  })

  it('audit with critical issue', () => {
    const a = new AccessibilityAudit()
    const r = a.audit({ keyboardIssues: ['No focus indicator on button'] })
    expect(r.score).toBe(70)  // 100 - 30 critical
  })

  it('clean audit score 100', () => {
    const a = new AccessibilityAudit()
    expect(a.audit({}).score).toBe(100)
  })
})