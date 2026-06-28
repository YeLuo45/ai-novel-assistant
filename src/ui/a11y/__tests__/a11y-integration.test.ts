/**
 * ui/a11y/__tests__/a11y-integration.test.ts (R27)
 */

import { describe, it, expect } from 'vitest'
import {
  ARIAManager, LiveRegion, ScreenReaderAnnouncer, KeyboardNav, FocusTrap,
  SkipLink, ShortcutRegistry, I18nProvider, TranslationBundle, LocaleDetector,
  Pluralization, DateTimeFormat, HighContrastCheck, ColorBlindSimulator,
  FontSizeAdjuster, ARIAValidator, AutoAltText, CaptionGenerator,
  AccessibilityAudit,
} from '../index'

describe('A11y & i18n — end-to-end', () => {
  it('ARIA pipeline: set + serialize', () => {
    const a = new ARIAManager()
    a.set('btn', { role: 'button', label: 'OK', expanded: false, live: 'polite' })
    expect(a.toAttributeString('btn')).toContain('aria-label="OK"')
  })

  it('SR announce + queue + flush', () => {
    const s = new ScreenReaderAnnouncer(10000)
    s.announce('a', true)
    s.announce('b')  // queued
    expect(s.flush()).toBe(1)
    expect(s.currentRegion().messages().length).toBe(2)
  })

  it('keyboard nav + focus trap', () => {
    const k = new KeyboardNav()
    k.setFocusable(['a', 'b', 'c'])
    expect(k.handleKey('Home')).toBe('a')
    expect(k.handleKey('End')).toBe('c')

    const t = new FocusTrap()
    t.activate('m', ['x', 'y'])
    expect(t.onTab()).toBe('x')
    expect(t.onTab()).toBe('y')
  })

  it('i18n: locale + translate + plural', () => {
    const i = new I18nProvider()
    i.setLocale('zh-CN')
    const tb = new TranslationBundle()
    tb.loadBundle('en', { greeting: 'Hello' })
    tb.loadBundle('zh-CN', { greeting: '你好' })
    expect(tb.t(i.getLocale(), 'greeting')).toBe('你好')
    expect(LocaleDetector.detect('zh-CN')).toBe('zh-CN')

    const p = new Pluralization()
    expect(p.pick('zh-CN', 5, { other: '个' })).toBe('个')
  })

  it('date format by locale', () => {
    const d = new Date('2026-01-27T00:00:00Z')
    const en = DateTimeFormat.format(d, 'en', 'short')
    const zh = DateTimeFormat.format(d, 'zh-CN', 'short')
    expect(en).toContain('2026')
    expect(zh).toContain('2026')
  })

  it('a11y validator + audit', () => {
    const ariaV = new ARIAValidator()
    expect(ariaV.validate('button', {}).valid).toBe(false)
    expect(ariaV.validate('button', { label: 'OK' }).valid).toBe(true)

    const audit = new AccessibilityAudit()
    const r = audit.audit({
      contrastIssues: [{ pair: 'a', ratio: 2, pass: false }],
      ariaIssues: [{ element: 'btn', issues: ['no label'] }],
    })
    expect(r.issues.length).toBe(2)
    expect(r.score).toBeLessThan(100)
  })

  it('contrast + colorblind + font size', () => {
    const hc = new HighContrastCheck()
    expect(hc.checkPair('#000000', '#ffffff').pass).toBe(true)

    const cbs = new ColorBlindSimulator()
    expect(cbs.simulate({ bg: '#ff0000' }, 'deuteranopia').bg).not.toBe('#ff0000')

    const fs = new FontSizeAdjuster()
    fs.setScale(1.5)
    expect(fs.adjust(16)).toBe(24)
  })

  it('auto alt + caption generator', () => {
    const a = new AutoAltText()
    expect(a.generate({ filename: 'hero.jpg' })).toBe('Hero')
    expect(a.isValidAlt('image')).toBe(false)

    const c = new CaptionGenerator()
    expect(c.generate('Hi there world', 5).length).toBeGreaterThan(1)
  })

  it('shortcut registry + skip link', () => {
    const sc = new ShortcutRegistry()
    let called = 0
    sc.register('a', () => { called += 1 })
    expect(sc.trigger({ key: 'a' })).toBe(true)
    expect(called).toBe(1)

    const sl = new SkipLink()
    sl.add({ id: 'main', label: 'Skip' })
    expect(sl.find('main')?.label).toBe('Skip')
  })
})