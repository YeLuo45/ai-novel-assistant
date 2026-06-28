/**
 * ui/a11y/demo/a11y-i18n-demo.test.ts (R26)
 */

import { describe, it, expect } from 'vitest'
import { runA11yI18nDemo } from './a11y-i18n-demo'

describe('a11y-i18n-demo', () => {
  it('1 announcement', () => expect(runA11yI18nDemo().announcements).toBe(1))
  it('3 ARIA roles', () => expect(runA11yI18nDemo().ariaRoles).toBe(3))
  it('3 shortcuts', () => expect(runA11yI18nDemo().shortcuts).toBe(3))
  it('2 locales (en, zh-CN)', () => expect(runA11yI18nDemo().locales).toBe(2))
  it('2 translations per locale', () => expect(runA11yI18nDemo().translations).toBe(2))
  it('font scale 1.2', () => expect(runA11yI18nDemo().fontScale).toBe(1.2))
  it('text spacing set', () => expect(runA11yI18nDemo().textSpacingSet).toBe(true))
  it('3 contrast pairs', () => expect(runA11yI18nDemo().contrastPairs).toBe(3))
  it('reading order valid', () => expect(runA11yI18nDemo().readingOrderValid).toBe(true))
  it('2 ARIA validations', () => expect(runA11yI18nDemo().ariaValidations).toBe(2))
  it('2 alt texts', () => expect(runA11yI18nDemo().altTextsGenerated).toBe(2))
  it('caption lines > 0', () => expect(runA11yI18nDemo().captionLines).toBeGreaterThan(0))
  it('audit score 100', () => expect(runA11yI18nDemo().auditScore).toBe(100))
  it('i18n zh-CN', () => expect(runA11yI18nDemo().i18n).toBe(true))
  it('2 plural forms', () => expect(runA11yI18nDemo().pluralForms).toBe(2))
  it('2 skip targets', () => expect(runA11yI18nDemo().skipTargets).toBe(2))
  it('4 focusable items', () => expect(runA11yI18nDemo().focusableCount).toBe(4))
  it('focus trap active', () => expect(runA11yI18nDemo().focusTrapActive).toBe(true))
  it('end-to-end summary', () => {
    const r = runA11yI18nDemo()
    expect(r.locales + r.translations + r.shortcuts).toBeGreaterThan(5)
  })
})