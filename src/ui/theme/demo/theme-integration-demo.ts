/**
 * ui/theme/demo/theme-integration-demo.ts (M26)
 */

import {
  ThemeRegistry, ThemeProvider, ThemeSwitcher, ThemePersistence,
  CustomThemeBuilder, ContrastValidator, ThemeValidator, ThemeAccessibility,
  ThemeExportImport, ThemePreview, HighContrastMode, ColorBlindSupport,
  DarkModeOptimizer,
} from '../index'

export interface DemoResult {
  registeredThemes: number
  activeTheme: string
  switched: number
  hasHC: number
  hasColorBlind: number
  contrastChecks: number
  validationErrors: number
  exported: boolean
  previewed: boolean
  darkOptimized: boolean
}

export function runThemeDemo(): DemoResult {
  // 1. Registry + Provider
  const registry = new ThemeRegistry()
  const provider = new ThemeProvider(registry)
  const switcher = new ThemeSwitcher(provider)

  // 2. Switch through all 4 themes
  switcher.switchTo('dark')
  switcher.switchTo('sepia')
  switcher.switchTo('nord')
  switcher.switchTo('light')

  // 3. Custom theme
  const custom = new CustomThemeBuilder()
    .name('ocean')
    .displayName('Ocean Blue')
    .isDark(false)
    .color('bg', '#e6f3ff')
    .color('text', '#001a33')
    .color('accent', '#0066cc')
    .build()
  registry.register(custom)

  // 4. High contrast
  const hc = HighContrastMode.list()
  registry.register(hc[0])

  // 5. Color blind
  const cb = new ColorBlindSupport()
  cb.setMode('deuteranopia')
  const cbTheme = cb.applyToTheme({ name: 'cb', colors: { bg: '#ff0000', text: '#000000' } } as any)

  // 6. Contrast check
  const validator = new ContrastValidator()
  const contrastChecks = [
    validator.check('#000000', '#ffffff'),
    validator.check('#ffffff', '#000000'),
    validator.check('#1976d2', '#ffffff'),
  ]

  // 7. Theme validation
  const themeValidator = new ThemeValidator()
  const valid = themeValidator.validate({ name: 'x' })  // missing colors
  const invalidErrors = valid.filter(i => i.severity === 'error').length

  // 8. Export
  const exporter = new ThemeExportImport()
  const json = exporter.export(custom)
  const imported = exporter.import(json)

  // 9. Preview
  const previewer = new ThemePreview()
  const previewHTML = previewer.renderHTML(custom, 'Demo')

  // 10. Dark mode optimizer
  const optimized = DarkModeOptimizer.adjust({ bg: '#ffffff', text: '#000000' })

  // 11. Accessibility audit
  const a11y = new ThemeAccessibility()
  const audit = a11y.audit(custom)

  return {
    registeredThemes: registry.count(),
    activeTheme: provider.currentName(),
    switched: switcher.history().length,
    hasHC: hc.length,
    hasColorBlind: cbTheme.colors ? 1 : 0,
    contrastChecks: contrastChecks.length,
    validationErrors: invalidErrors,
    exported: imported.ok,
    previewed: previewHTML.length > 0,
    darkOptimized: optimized.bg === '#1a1a1a',
  }
}