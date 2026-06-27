/**
 * ui/theme/types.ts — Theme types
 */

export interface ThemeColors {
  bg: string
  bgSecondary: string
  bgTertiary: string
  text: string
  textSecondary: string
  textTertiary: string
  border: string
  accent: string
  accentText: string
  error: string
  warning: string
  success: string
  info: string
}

export interface ThemeTypography {
  fontFamily: string
  fontFamilyMono: string
  fontSizeXs: string
  fontSizeSm: string
  fontSizeMd: string
  fontSizeLg: string
  fontSizeXl: string
  lineHeight: number
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ThemeRadius {
  sm: string
  md: string
  lg: string
  pill: string
}

export interface ThemeShadow {
  sm: string
  md: string
  lg: string
}

export interface Theme {
  name: string
  displayName: string
  isDark: boolean
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  radius: ThemeRadius
  shadow: ThemeShadow
}