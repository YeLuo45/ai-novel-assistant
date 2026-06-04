/**
 * V674 ThemeSymbolismEngine — Direction C Iter 5/9 (Round 2)
 * Theme and symbolism engine: thematic threads + symbolic patterns
 * Sources: chatdev thematic + thunderbolt symbolic + nanobot
 */

export type SymbolType = 'object' | 'color' | 'animal' | 'element' | 'metaphor' | 'recurring_image';
export type ThemeStrength = 'subtle' | 'moderate' | 'strong' | 'central';

export interface Symbol {
  symbolId: string;
  type: SymbolType;
  name: string;
  meaning: string;
  occurrences: number;
  scenes: string[];
  thematicWeight: number;
}

export interface Theme {
  themeId: string;
  name: string;
  description: string;
  strength: ThemeStrength;
  relatedSymbols: string[];
  evolution: string[];
  resolutionStatus: 'developing' | 'peaking' | 'resolving' | 'resolved';
}

export interface ThemeSymbolismState {
  symbols: Map<string, Symbol>;
  themes: Map<string, Theme>;
  totalSymbols: number;
  totalThemes: number;
  symbolDensity: number;
  themeCoherence: number;
  averageSymbolicWeight: number;
}

// Factory
export function createThemeSymbolismState(): ThemeSymbolismState {
  return {
    symbols: new Map(),
    themes: new Map(),
    totalSymbols: 0,
    totalThemes: 0,
    symbolDensity: 0,
    themeCoherence: 0.6,
    averageSymbolicWeight: 0.5,
  };
}

// Add symbol
export function addSymbol(
  state: ThemeSymbolismState,
  symbolId: string,
  type: SymbolType,
  name: string,
  meaning: string,
  sceneId: string,
  weight: number = 0.5
): ThemeSymbolismState {
  const existing = state.symbols.get(symbolId);
  let updated: Symbol;

  if (existing) {
    updated = {
      ...existing,
      occurrences: existing.occurrences + 1,
      scenes: [...existing.scenes, sceneId],
      thematicWeight: Math.min(1, existing.thematicWeight + 0.05),
    };
  } else {
    updated = {
      symbolId,
      type,
      name,
      meaning,
      occurrences: 1,
      scenes: [sceneId],
      thematicWeight: weight,
    };
  }

  const symbols = new Map(state.symbols).set(symbolId, updated);
  return recomputeThemeMetrics({ ...state, symbols, totalSymbols: symbols.size });
}

// Add theme
export function addTheme(
  state: ThemeSymbolismState,
  themeId: string,
  name: string,
  description: string,
  strength: ThemeStrength = 'moderate',
  relatedSymbols: string[] = []
): ThemeSymbolismState {
  const theme: Theme = {
    themeId,
    name,
    description,
    strength,
    relatedSymbols,
    evolution: [],
    resolutionStatus: 'developing',
  };

  const themes = new Map(state.themes).set(themeId, theme);
  return recomputeThemeMetrics({ ...state, themes, totalThemes: themes.size });
}

// Update theme evolution
export function updateThemeEvolution(state: ThemeSymbolismState, themeId: string, evolution: string): ThemeSymbolismState {
  const theme = state.themes.get(themeId);
  if (!theme) return state;

  const updated: Theme = { ...theme, evolution: [...theme.evolution, evolution] };
  const themes = new Map(state.themes).set(themeId, updated);
  return { ...state, themes };
}

// Set theme resolution status
export function setThemeResolution(state: ThemeSymbolismState, themeId: string, status: Theme['resolutionStatus']): ThemeSymbolismState {
  const theme = state.themes.get(themeId);
  if (!theme) return state;

  const updated: Theme = { ...theme, resolutionStatus: status };
  const themes = new Map(state.themes).set(themeId, updated);
  return { ...state, themes };
}

// Get theme-symbol associations
export function getThemeSymbolAssociations(state: ThemeSymbolismState, themeId: string): Symbol[] {
  const theme = state.themes.get(themeId);
  if (!theme) return [];
  return theme.relatedSymbols
    .map(s => state.symbols.get(s))
    .filter((s): s is Symbol => s !== undefined);
}

// Get dominant theme
export function getDominantTheme(state: ThemeSymbolismState): Theme | null {
  const strengthMap: Record<ThemeStrength, number> = {
    subtle: 0.25,
    moderate: 0.5,
    strong: 0.75,
    central: 1.0,
  };

  let dominant: Theme | null = null;
  let maxScore = -1;

  state.themes.forEach(theme => {
    const score = strengthMap[theme.strength] * theme.relatedSymbols.length;
    if (score > maxScore) {
      maxScore = score;
      dominant = theme;
    }
  });

  return dominant;
}

// Get theme report
export function getThemeReport(state: ThemeSymbolismState): {
  totalSymbols: number;
  totalThemes: number;
  symbolDensity: number;
  themeCoherence: number;
  averageSymbolicWeight: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSymbols < 3) recommendations.push('Few symbols — add recurring motifs');
  if (state.totalThemes < 1) recommendations.push('No themes defined — establish central themes');
  if (state.symbolDensity < 0.2) recommendations.push('Low symbol density — strengthen symbolic language');
  if (state.themeCoherence < 0.5) recommendations.push('Low coherence — review theme relationships');

  return {
    totalSymbols: state.totalSymbols,
    totalThemes: state.totalThemes,
    symbolDensity: Math.round(state.symbolDensity * 100) / 100,
    themeCoherence: Math.round(state.themeCoherence * 100) / 100,
    averageSymbolicWeight: Math.round(state.averageSymbolicWeight * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeThemeMetrics(state: ThemeSymbolismState): ThemeSymbolismState {
  const symbols = Array.from(state.symbols.values());
  const symbolDensity = Math.min(1, symbols.length / 20);

  const averageSymbolicWeight = symbols.length > 0
    ? symbols.reduce((s, sym) => s + sym.thematicWeight, 0) / symbols.length
    : 0.5;

  const themes = Array.from(state.themes.values());
  const themeCoherence = themes.length === 0 ? 0.5 :
    Math.min(1, themes.reduce((s, t) => s + t.relatedSymbols.length, 0) / (themes.length * 2));

  return { ...state, symbolDensity, averageSymbolicWeight, themeCoherence };
}

// Reset theme state
export function resetThemeSymbolismState(): ThemeSymbolismState {
  return createThemeSymbolismState();
}