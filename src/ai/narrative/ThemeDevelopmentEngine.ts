/**
 * V858 ThemeDevelopmentEngine — Direction B Iter 7/15 (Round 4)
 * Theme development engine: theme development + thematic depth
 * Sources: nanobot theme + thunderbolt + chatdev
 */

export type ThemeType = 'universal' | 'cultural' | 'personal' | 'philosophical' | 'moral' | 'social';
export type ThemeStage = 'seeded' | 'developing' | 'explored' | 'challenged' | 'resolved' | 'transformed';
export type ThemeClarity = 'implicit' | 'suggested' | 'clear' | 'prominent' | 'central';

export interface Theme {
  themeId: string;
  type: ThemeType;
  stage: ThemeStage;
  clarity: ThemeClarity;
  statement: string;
  question: string;
  manifestations: string[];
  chapters: number[];
  central: boolean;
}

export interface ThematicMoment {
  momentId: string;
  themeId: string;
  description: string;
  chapter: number;
  intensity: number;
  resolved: boolean;
}

export interface ThemeDevelopmentEngineState {
  themes: Map<string, Theme>;
  moments: Map<string, ThematicMoment>;
  totalThemes: number;
  totalMoments: number;
  centralThemes: number;
  resolvedMoments: number;
  averageClarity: number;
  thematicDepth: number;
  themeIntegration: number;
  thematicCoherence: number;
}

// Factory
export function createThemeDevelopmentEngineState(): ThemeDevelopmentEngineState {
  return {
    themes: new Map(),
    moments: new Map(),
    totalThemes: 0,
    totalMoments: 0,
    centralThemes: 0,
    resolvedMoments: 0,
    averageClarity: 0.5,
    thematicDepth: 0.5,
    themeIntegration: 0.5,
    thematicCoherence: 0.5,
  };
}

// Add theme
export function addTheme(
  state: ThemeDevelopmentEngineState,
  themeId: string,
  type: ThemeType,
  statement: string,
  question: string,
  central: boolean = false,
  clarity: ThemeClarity = 'suggested'
): ThemeDevelopmentEngineState {
  const theme: Theme = {
    themeId, type, stage: 'seeded', clarity, statement, question,
    manifestations: [], chapters: [], central,
  };
  const themes = new Map(state.themes).set(themeId, theme);
  const centralThemes = central ? state.centralThemes + 1 : state.centralThemes;
  return recomputeThemeDev({ ...state, themes, centralThemes, totalThemes: themes.size });
}

// Advance theme
export function advanceThemeStage(state: ThemeDevelopmentEngineState, themeId: string, stage: ThemeStage): ThemeDevelopmentEngineState {
  const theme = state.themes.get(themeId);
  if (!theme) return state;

  const updated: Theme = { ...theme, stage };
  const themes = new Map(state.themes).set(themeId, updated);
  return recomputeThemeDev({ ...state, themes });
}

// Add moment
export function addThematicMoment(
  state: ThemeDevelopmentEngineState,
  momentId: string,
  themeId: string,
  description: string,
  chapter: number,
  intensity: number = 0.5
): ThemeDevelopmentEngineState {
  const moment: ThematicMoment = { momentId, themeId, description, chapter, intensity: Math.min(1, Math.max(0, intensity)), resolved: false };
  const moments = new Map(state.moments).set(momentId, moment);

  // Update theme
  const theme = state.themes.get(themeId);
  let themes = state.themes;
  if (theme) {
    const updated: Theme = { ...theme, chapters: [...theme.chapters, chapter], manifestations: [...theme.manifestations, description] };
    themes = new Map(state.themes).set(themeId, updated);
  }

  return recomputeThemeDev({ ...state, themes, moments, totalMoments: moments.size });
}

// Resolve moment
export function resolveThematicMoment(state: ThemeDevelopmentEngineState, momentId: string): ThemeDevelopmentEngineState {
  const moment = state.moments.get(momentId);
  if (!moment) return state;

  const updated: ThematicMoment = { ...moment, resolved: true };
  const moments = new Map(state.moments).set(momentId, updated);
  const resolvedMoments = state.resolvedMoments + 1;
  return recomputeThemeDev({ ...state, moments, resolvedMoments });
}

// Get themes by type
export function getThemesByType(state: ThemeDevelopmentEngineState, type: ThemeType): Theme[] {
  return Array.from(state.themes.values()).filter(t => t.type === type);
}

// Get theme development report
export function getThemeDevelopmentReport(state: ThemeDevelopmentEngineState): {
  totalThemes: number;
  totalMoments: number;
  centralThemes: number;
  averageClarity: number;
  thematicDepth: number;
  themeIntegration: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalThemes === 0) recommendations.push('No themes — add themes');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — develop themes');
  if (state.thematicDepth < 0.4) recommendations.push('Low depth — explore deeper');

  return {
    totalThemes: state.totalThemes,
    totalMoments: state.totalMoments,
    centralThemes: state.centralThemes,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    thematicDepth: Math.round(state.thematicDepth * 100) / 100,
    themeIntegration: Math.round(state.themeIntegration * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeThemeDev(state: ThemeDevelopmentEngineState): ThemeDevelopmentEngineState {
  const themes = Array.from(state.themes.values());
  const clarityMap: Record<ThemeClarity, number> = { implicit: 0.2, suggested: 0.4, clear: 0.6, prominent: 0.8, central: 1.0 };
  const averageClarity = themes.length === 0 ? 0.5
    : themes.reduce((s, t) => s + clarityMap[t.clarity], 0) / themes.length;

  const moments = Array.from(state.moments.values());
  const totalIntensity = moments.reduce((s, m) => s + m.intensity, 0);
  const thematicDepth = moments.length === 0 ? 0.5
    : Math.min(1, totalIntensity / Math.max(1, moments.length));

  // Integration: how many moments per theme
  const themeIntegration = state.totalThemes === 0 ? 0
    : Math.min(1, state.totalMoments / Math.max(1, state.totalThemes * 3));

  // Coherence: how consistent theme stages are
  const advancedThemes = themes.filter(t => t.stage === 'explored' || t.stage === 'challenged' || t.stage === 'resolved' || t.stage === 'transformed').length;
  const thematicCoherence = themes.length === 0 ? 0.5 : advancedThemes / themes.length;

  return { ...state, averageClarity, thematicDepth, themeIntegration, thematicCoherence };
}

// Reset theme development state
export function resetThemeDevelopmentEngineState(): ThemeDevelopmentEngineState {
  return createThemeDevelopmentEngineState();
}