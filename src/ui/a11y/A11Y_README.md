# a11y + i18n (V3) — Direction R

**Version**: 1.0.0
**Engines**: V2836-V2865 (30 engines, 6 batches)
**Tests**: 80 tests, 100% pass

## 目标

完整无障碍 + 国际化系统：ARIA、键盘导航、屏幕阅读器、对比度检查、色盲模拟、WCAG 审计、Auto alt 文本、i18n 翻译 + 复数 + 日期格式化。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| R1-R15 | `A11yCore.ts` | A11yProvider + ARIAManager (18 roles) + LiveRegion + ScreenReaderAnnouncer (cooldown + queue) + AccessibilityPreferences (6 prefs) + KeyboardNav (10 keys) + FocusTrap + FocusVisible + SkipLink + ShortcutRegistry + I18nProvider + TranslationBundle (with fallback) + LocaleDetector + Pluralization (en/zh-CN/fr) + DateTimeFormat (4 styles + Intl.RelativeTimeFormat) |
| R16-R25 | `A11yAdvanced.ts` | HighContrastCheck (WCAG AAA ≥7:1) + ColorBlindSimulator (4 modes) + FontSizeAdjuster (clamp 0.8-2.0) + TextSpacingAdjuster + ReadingOrderValidator (heading skip + nav position) + ARIAValidator (button/img/slider rules) + AutoAltText + CaptionGenerator + SignLanguagePlaceholder + AccessibilityAudit (扣分制 100 分) |
| R26 | `index.ts` + `demo/a11y-i18n-demo.ts` | 19 端到端断言 |
| R27 | `__tests__/a11y-integration.test.ts` | 9 集成测试 |
| R28 | `A11Y_README.md` | 本文档 |
| R29 | 主 README 更新 | 验证命令 |
| R30 | 收口 commit + push | |

## 核心 API 示例

### 1. ARIA

```ts
import { ARIAManager } from '@/ui/a11y'

const aria = new ARIAManager()
aria.set('btn', { role: 'button', label: 'Submit', expanded: false })
aria.set('slider', { role: 'slider', valueNow: 50, valueMin: 0, valueMax: 100 })
const html = aria.toAttributeString('btn')  // role="button" aria-label="Submit" aria-expanded="false"
```

### 2. 键盘导航

```ts
import { KeyboardNav, FocusTrap, ShortcutRegistry } from '@/ui/a11y'

const k = new KeyboardNav()
k.setFocusable(['a', 'b', 'c'])
k.handleKey('Home')  // → 'a'
k.handleKey('End')   // → 'c'

const t = new FocusTrap()
t.activate('modal', ['btn1', 'btn2'])
t.onTab()  // → 'btn1'

const sc = new ShortcutRegistry()
sc.register('k', () => console.log('cmd-palette'), { ctrl: true })
sc.trigger({ key: 'k', ctrl: true })
```

### 3. 屏幕阅读器

```ts
import { ScreenReaderAnnouncer, LiveRegion } from '@/ui/a11y'

const sr = new ScreenReaderAnnouncer(1000)
sr.announce('Form saved', true)
sr.announce('Loading...')  // queued (within cooldown)
sr.flush()  // flush queued
```

### 4. i18n

```ts
import { I18nProvider, TranslationBundle, Pluralization, DateTimeFormat } from '@/ui/a11y'

const i = new I18nProvider()
i.setLocale('zh-CN')

const tb = new TranslationBundle()
tb.loadBundle('en', { hello: 'Hello' })
tb.loadBundle('zh-CN', { hello: '你好' })
tb.t(i.getLocale(), 'hello')  // '你好'
tb.t('fr', 'hello')          // 'Hello' (fallback to en)

const p = new Pluralization()
p.pick('en', 5, { one: 'item', other: 'items' })  // 'items'
p.pick('zh-CN', 5, { other: '个项目' })             // '5 个项目'

DateTimeFormat.format(new Date(), 'zh-CN', 'long')  // '2026年1月27日'
DateTimeFormat.relative(past, now, 'en')  // '5 minutes ago'
```

### 5. a11y Audit

```ts
import { AccessibilityAudit, HighContrastCheck, ARIAValidator } from '@/ui/a11y'

const audit = new AccessibilityAudit()
const r = audit.audit({
  contrastIssues: [{ pair: 'text/bg', ratio: 4.5, pass: true }],
  ariaIssues: [{ element: 'btn', issues: ['no label'] }],
  keyboardIssues: ['No focus indicator'],
})
// r.score = 70 (deducted 30 critical)
```

## 验证命令

```bash
npx vitest run src/ui/a11y/  # 80 passed
npx vitest run src/ui/a11y/demo/a11y-i18n-demo.test.ts
npx vitest run src/ui/a11y/__tests__/a11y-integration.test.ts
```

## 灵感

- WCAG 2.1 AA / AAA
- WAI-ARIA Authoring Practices
- Intl.* APIs (RelativeTimeFormat, PluralRules, DateTimeFormat)
- Headless UI a11y patterns
- axe-core
- Lighthouse Accessibility

## 累计

- Direction A-R: **720 engines / ~7,500 tests**
- 19 commits pushed
- 灵感: WCAG + WAI-ARIA + Intl + axe-core + Headless UI