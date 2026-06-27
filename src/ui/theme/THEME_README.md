# Theme System (V3) — Direction M

**Version**: 1.0.0
**Engines**: V2686-V2715 (30 engines, 6 batches)
**Tests**: 92 tests, 100% pass

## 目标

**满足 boss 风格契合度硬要求"主题可切换，至少 4 套变体（light/dark/sepia/nord 风格）"** + 完整的主题系统（a11y + 自定义 + 持久化 + 优化器）

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| M1-M10 | `DesignToken.ts` | DesignToken + 4 built-in themes (light/dark/sepia/nord) + ThemeProvider + ThemeRegistry + ThemeSwitcher + CustomThemeBuilder + ThemePersistence |
| M11-M20 | `ThemeAdvanced.ts` | ColorPalette (10-step scale) + TypographyScale (modular) + ThemeTransition (CSS) + AutoThemeDetection + ContrastValidator (WCAG) + ThemeValidator + ThemeVersioning + ThemeExportImport (JSON+CSS) + ThemePreview + ThemeAccessibility |
| M21-M25 | `ThemeSpecialized.ts` | HighContrastMode (2 themes) + ColorBlindSupport (5 modes + filter matrix) + DarkModeOptimizer + SepiaModeOptimizer + NordModeOptimizer |
| M26 | `index.ts` + `demo/theme-integration-demo.ts` | 10 端到端断言 |
| M27 | `__tests__/theme-integration.test.ts` | 12 集成测试 |
| M28 | `THEME_README.md` | 本文档 |
| M29 | 主 README 更新 | 验证命令 |
| M30 | 收口 commit + push | |

## 4 个内置主题 (boss 硬要求 ✅)

| Name | Background | Text | Accent | Mood |
|------|-----------|------|--------|------|
| **light** | #ffffff | #1a1a1a | #1976d2 | 明亮 |
| **dark** | #0d1117 | #e6edf3 | #58a6ff | 暗黑（GitHub 风）|
| **sepia** | #f4ecd8 | #5b4636 | #8b5a2b | 护眼（warm）|
| **nord** | #2e3440 | #eceff4 | #88c0d0 | 北欧（cool）|

## 核心 API 示例

### 1. 主题切换

```ts
import { ThemeProvider, ThemeSwitcher } from '@/ui/theme'

const provider = new ThemeProvider()
const switcher = new ThemeSwitcher(provider)

switcher.switchTo('dark')  // 切换到 dark
switcher.switchTo('sepia')  // 切换到 sepia
switcher.toggle()  // light ↔ dark
```

### 2. 自定义主题

```ts
import { CustomThemeBuilder, ThemeRegistry } from '@/ui/theme'

const ocean = new CustomThemeBuilder()
  .name('ocean')
  .displayName('Ocean Blue')
  .isDark(false)
  .color('bg', '#e6f3ff')
  .color('text', '#001a33')
  .color('accent', '#0066cc')
  .build()

const registry = new ThemeRegistry()
registry.register(ocean)
```

### 3. WCAG 对比度检查

```ts
import { ContrastValidator } from '@/ui/theme'

const v = new ContrastValidator()
v.check('#000000', '#ffffff')  // { ratio: 21, AA: true, AAA: true }
v.check('#cccccc', '#dddddd')  // { ratio: 1.5, AA: false }
```

### 4. 色盲支持

```ts
import { ColorBlindSupport } from '@/ui/theme'

const cb = new ColorBlindSupport()
cb.setMode('deuteranopia')  // 红绿色盲
cb.apply('#ff0000')  // → 调整后的颜色
cb.applyToTheme(theme)  // 整个主题适配色盲
```

### 5. 持久化

```ts
import { ThemePersistence } from '@/ui/theme'

const p = new ThemePersistence()
const json = p.serialize('nord')  // 序列化
const restored = p.deserialize(json)  // 反序列化
```

## 验证命令

```bash
npx vitest run src/ui/theme/  # 92 passed
npx vitest run src/ui/theme/demo/theme-integration-demo.test.ts  # 10 passed
npx vitest run src/ui/theme/__tests__/theme-integration.test.ts  # 12 passed
```

## 累计

- Direction A-M: 395 engines / 5,335 tests
- 14 commits pushed
- 灵感: GitHub Primer + Nord + VSCode themes + Material 3 + Radix Colors