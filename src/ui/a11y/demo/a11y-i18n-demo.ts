/**
 * ui/a11y/demo/a11y-i18n-demo.ts (R26)
 */

import {
  A11yProvider, ARIAManager, LiveRegion, ScreenReaderAnnouncer, AccessibilityPreferences,
  KeyboardNav, FocusTrap, FocusVisible, SkipLink, ShortcutRegistry,
  I18nProvider, TranslationBundle, LocaleDetector, Pluralization, DateTimeFormat,
  HighContrastCheck, ColorBlindSimulator, FontSizeAdjuster, TextSpacingAdjuster,
  ReadingOrderValidator, ARIAValidator, AutoAltText, CaptionGenerator,
  SignLanguagePlaceholder, AccessibilityAudit,
} from '../index'

export interface DemoResult {
  announcements: number
  ariaRoles: number
  shortcuts: number
  locales: number
  translations: number
  fontScale: number
  textSpacingSet: boolean
  contrastPairs: number
  readingOrderValid: boolean
  ariaValidations: number
  altTextsGenerated: number
  captionLines: number
  auditScore: number
  i18n: boolean
  pluralForms: number
  skipTargets: number
  focusableCount: number
  focusTrapActive: boolean
}

export function runA11yI18nDemo(): DemoResult {
  // 1. a11y
  const a11y = new A11yProvider()
  a11y.emit('focus', 'btn1')
  const aria = new ARIAManager()
  aria.set('btn1', { role: 'button', label: 'Submit' })
  aria.set('m', { role: 'menu', expanded: false })
  aria.set('img1', { role: 'img', label: 'Logo' })
  const live = new LiveRegion()
  const sr = new ScreenReaderAnnouncer(10000)
  sr.announce('Welcome', true)
  const prefs = new AccessibilityPreferences()
  prefs.set('fontSizeScale', 1.25)
  prefs.set('prefersHighContrast', true)

  // 2. keyboard
  const kb = new KeyboardNav()
  kb.setFocusable(['a', 'b', 'c', 'd'])
  kb.next()
  kb.next()
  const trap = new FocusTrap()
  trap.activate('modal', ['x', 'y'])
  const fv = new FocusVisible()
  fv.setUsingKeyboard(true)
  const skip = new SkipLink()
  skip.add({ id: 'main', label: 'Skip to main' })
  skip.add({ id: 'nav', label: 'Skip to nav' })
  const sc = new ShortcutRegistry()
  sc.register('s', () => {}, { ctrl: true })
  sc.register('k', () => {}, { ctrl: true })
  sc.register('Escape', () => {})

  // 3. i18n
  const i18n = new I18nProvider()
  i18n.setLocale('zh-CN')
  const tb = new TranslationBundle()
  tb.loadBundle('en', { hello: 'Hello', bye: 'Bye' })
  tb.loadBundle('zh-CN', { hello: '你好', bye: '再见' })
  LocaleDetector.detect('zh-CN')
  const pl = new Pluralization()
  pl.pick('en', 1, { one: 'item', other: 'items' })
  pl.pick('zh-CN', 5, { other: '个项目' })
  DateTimeFormat.format(new Date(), 'zh-CN', 'long')

  // 4. a11y advanced
  const hc = new HighContrastCheck()
  hc.checkPair('#000000', '#ffffff')
  const cbs = new ColorBlindSimulator()
  cbs.simulate({ text: '#000000' }, 'deuteranopia')
  const fs = new FontSizeAdjuster()
  fs.setScale(1.2)
  fs.adjust(16)
  const ts = new TextSpacingAdjuster()
  ts.setLineHeight(1.5)
  ts.setLetterSpacing(1.1)
  const rov = new ReadingOrderValidator()
  const roValid = rov.validate([
    { id: 'h1', type: 'heading', level: 1, order: 0 },
    { id: 'p1', type: 'paragraph', order: 1 },
    { id: 'h2', type: 'heading', level: 2, order: 2 },
  ]).valid
  const ariaV = new ARIAValidator()
  ariaV.validate('button', { label: 'Submit' })
  ariaV.validate('slider', { valueNow: 50, valueMin: 0, valueMax: 100 })
  const autoAlt = new AutoAltText()
  autoAlt.generate({ filename: 'hero-banner.jpg' })
  autoAlt.generate({ description: 'A red rose' })
  const captions = new CaptionGenerator()
  captions.generate('The quick brown fox jumps over the lazy dog', 20)
  const signLang = new SignLanguagePlaceholder()
  signLang.placeholderFor('vid1')
  const audit = new AccessibilityAudit()
  const auditResult = audit.audit({
    contrastIssues: [{ pair: 'text/bg', ratio: 4.5, pass: true }],
  })

  return {
    announcements: sr.currentRegion().messages().length,
    ariaRoles: 3,
    shortcuts: sc.count(),
    locales: tb.locales().length,
    translations: tb.keys('zh-CN').length,
    fontScale: fs.scale(),
    textSpacingSet: ts.toCSS().length > 0,
    contrastPairs: hc.checkTheme({ text: '#000000', textSecondary: '#333333', textTertiary: '#666666', bg: '#ffffff' }).length,
    readingOrderValid: roValid,
    ariaValidations: 2,
    altTextsGenerated: 2,
    captionLines: captions.generate('Hi there', 3).length,
    auditScore: auditResult.score,
    i18n: i18n.getLocale() === 'zh-CN',
    pluralForms: 2,
    skipTargets: skip.targets().length,
    focusableCount: kb.focusable().length,
    focusTrapActive: trap.isActive(),
  }
}