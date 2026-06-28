/**
 * ui/a11y/A11yCore.test.ts (R1-R15) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  A11yProvider, ARIAManager, LiveRegion, ScreenReaderAnnouncer, AccessibilityPreferences,
  KeyboardNav, FocusTrap, FocusVisible, SkipLink, ShortcutRegistry,
  I18nProvider, TranslationBundle, LocaleDetector, Pluralization, DateTimeFormat,
} from './A11yCore'

describe('R1: A11yProvider', () => {
  it('emit + subscribe', () => {
    const a = new A11yProvider()
    let called = 0
    a.subscribe(() => { called += 1 })
    a.emit('focus', 'a')
    expect(called).toBe(1)
  })

  it('disabled', () => {
    const a = new A11yProvider()
    a.setEnabled(false)
    let called = 0
    a.subscribe(() => { called += 1 })
    a.emit('x', 1)
    expect(called).toBe(0)
  })
})

describe('R2: ARIAManager', () => {
  it('set + get', () => {
    const a = new ARIAManager()
    a.set('btn', { role: 'button', label: 'Submit' })
    expect(a.get('btn')?.role).toBe('button')
  })

  it('toAttributeString', () => {
    const a = new ARIAManager()
    a.set('m', { role: 'menu', expanded: true, live: 'polite' })
    const s = a.toAttributeString('m')
    expect(s).toContain('role="menu"')
    expect(s).toContain('aria-expanded="true"')
    expect(s).toContain('aria-live="polite"')
  })
})

describe('R3: LiveRegion', () => {
  it('announce + messages', () => {
    const l = new LiveRegion()
    l.announce('Hi')
    expect(l.messages().length).toBe(1)
  })

  it('politeness', () => {
    expect(new LiveRegion('a', 'assertive').politeness()).toBe('assertive')
  })
})

describe('R4: ScreenReaderAnnouncer', () => {
  it('announce', () => {
    const s = new ScreenReaderAnnouncer()
    s.announce('hi')
    expect(s.currentRegion().messages().length).toBe(1)
  })

  it('queue + flush', () => {
    const s = new ScreenReaderAnnouncer(10000)
    s.announce('a')
    s.announce('b')  // queued
    s.announce('c')  // queued
    expect(s.currentRegion().messages().length).toBe(1)
    const flushed = s.flush()
    expect(flushed).toBe(2)
    expect(s.currentRegion().messages().length).toBe(3)
  })
})

describe('R5: AccessibilityPreferences', () => {
  it('set + get', () => {
    const a = new AccessibilityPreferences()
    a.set('fontSizeScale', 1.5)
    expect(a.get('fontSizeScale')).toBe(1.5)
  })

  it('reset', () => {
    const a = new AccessibilityPreferences()
    a.set('fontSizeScale', 2)
    a.reset()
    expect(a.get('fontSizeScale')).toBe(1)
  })
})

describe('R6: KeyboardNav', () => {
  it('next + prev', () => {
    const k = new KeyboardNav()
    k.setFocusable(['a', 'b', 'c'])
    expect(k.next()).toBe('a')
    expect(k.next()).toBe('b')
    expect(k.prev()).toBe('a')
  })

  it('handleKey', () => {
    const k = new KeyboardNav()
    k.setFocusable(['a', 'b', 'c'])
    expect(k.handleKey('Home')).toBe('a')
    expect(k.handleKey('End')).toBe('c')
  })
})

describe('R7: FocusTrap', () => {
  it('activate + deactivate', () => {
    const f = new FocusTrap()
    f.activate('modal', ['btn1', 'btn2'])
    expect(f.isActive()).toBe(true)
    f.deactivate()
    expect(f.isActive()).toBe(false)
  })

  it('onTab cycles', () => {
    const f = new FocusTrap()
    f.activate('modal', ['btn1', 'btn2'])
    expect(f.onTab()).toBe('btn1')  // no active → first
    expect(f.onTab()).toBe('btn2')  // cycle to next
    expect(f.onTab(true)).toBe('btn1')  // cycle back
  })
})

describe('R8: FocusVisible', () => {
  it('setUsingKeyboard', () => {
    const f = new FocusVisible()
    expect(f.isVisible()).toBe(false)
    f.setUsingKeyboard(true)
    expect(f.isVisible()).toBe(true)
  })
})

describe('R9: SkipLink', () => {
  it('add + find + remove', () => {
    const s = new SkipLink()
    s.add({ id: 'main', label: 'Skip to main' })
    s.add({ id: 'nav', label: 'Skip to nav' })
    expect(s.find('main')?.label).toBe('Skip to main')
    expect(s.remove('main')).toBe(true)
    expect(s.targets().length).toBe(1)
  })
})

describe('R10: ShortcutRegistry', () => {
  it('register + trigger', () => {
    const s = new ShortcutRegistry()
    let called = 0
    s.register('s', () => { called += 1 }, { ctrl: true })
    expect(s.trigger({ key: 's', ctrl: true })).toBe(true)
    expect(called).toBe(1)
  })

  it('trigger without match', () => {
    const s = new ShortcutRegistry()
    expect(s.trigger({ key: 'a' })).toBe(false)
  })
})

describe('R11: I18nProvider', () => {
  it('set + get', () => {
    const i = new I18nProvider()
    i.setLocale('zh-CN')
    expect(i.getLocale()).toBe('zh-CN')
  })

  it('subscribe on change', () => {
    const i = new I18nProvider()
    let called = 0
    i.subscribe(() => { called += 1 })
    i.setLocale('fr')
    i.setLocale('en')  // change
    expect(called).toBe(2)
  })
})

describe('R12: TranslationBundle', () => {
  it('t with fallback', () => {
    const tb = new TranslationBundle()
    tb.add('en', 'hello', 'Hello')
    tb.add('zh-CN', 'hello', '你好')
    expect(tb.t('zh-CN', 'hello')).toBe('你好')
    expect(tb.t('fr', 'hello')).toBe('Hello')  // fallback to en
  })

  it('loadBundle', () => {
    const tb = new TranslationBundle()
    tb.loadBundle('en', { hello: 'Hi', bye: 'Bye' })
    expect(tb.t('en', 'hello')).toBe('Hi')
  })
})

describe('R13: LocaleDetector', () => {
  it('detect en', () => {
    expect(LocaleDetector.detect('en')).toBe('en')
  })

  it('detect zh-CN', () => {
    expect(LocaleDetector.detect('zh-CN')).toBe('zh-CN')
  })

  it('detect en-US', () => {
    expect(LocaleDetector.detect('en-US')).toBe('en-US')
  })

  it('normalize', () => {
    expect(LocaleDetector.normalize('zh-CN')).toEqual({ language: 'zh', region: 'CN' })
  })
})

describe('R14: Pluralization', () => {
  it('en select one/other', () => {
    const p = new Pluralization()
    expect(p.select('en', 1)).toBe('one')
    expect(p.select('en', 2)).toBe('other')
  })

  it('zh-CN always other', () => {
    const p = new Pluralization()
    expect(p.select('zh-CN', 1)).toBe('other')
  })

  it('pick', () => {
    const p = new Pluralization()
    expect(p.pick('en', 1, { one: 'item', other: 'items' })).toBe('item')
    expect(p.pick('en', 5, { one: 'item', other: 'items' })).toBe('items')
  })
})

describe('R15: DateTimeFormat', () => {
  it('format short ISO', () => {
    const d = new Date('2026-01-27T00:00:00Z')
    expect(DateTimeFormat.format(d, 'en', 'short')).toBe('2026-01-27')
  })

  it('format medium', () => {
    const d = new Date('2026-01-27T00:00:00Z')
    expect(DateTimeFormat.format(d, 'en', 'medium')).toContain('2026')
  })

  it('relative', () => {
    const now = new Date()
    const past = new Date(now.getTime() - 60_000)
    const rel = DateTimeFormat.relative(past, now, 'en')
    expect(rel).toContain('ago')
  })
})