/**
 * V708 StyleAdaptationEngine — Direction D Iter 4/9 (Round 2)
 * Style adaptation engine: tone + voice + register adaptation
 * Sources: chatdev style + thunderbolt adaptation + nanobot
 */

export type StyleElement = 'vocabulary' | 'syntax' | 'imagery' | 'tone' | 'pacing' | 'register';
export type RegisterType = 'formal' | 'informal' | 'academic' | 'colloquial' | 'archaic' | 'modern';
export type ToneType = 'serious' | 'humorous' | 'satirical' | 'ironic' | 'sincere' | 'detached';

export interface StyleProfile {
  profileId: string;
  name: string;
  elements: Map<StyleElement, number>;
  register: RegisterType;
  tone: ToneType;
  intensity: number;
  targetAudience: string;
}

export interface StyleAdaptationState {
  profiles: Map<string, StyleProfile>;
  activeProfile: string | null;
  totalProfiles: number;
  averageIntensity: number;
  profileDiversity: number;
  dominantRegister: RegisterType | null;
  dominantTone: ToneType | null;
}

// Factory
export function createStyleAdaptationState(): StyleAdaptationState {
  return {
    profiles: new Map(),
    activeProfile: null,
    totalProfiles: 0,
    averageIntensity: 0.5,
    profileDiversity: 0.5,
    dominantRegister: null,
    dominantTone: null,
  };
}

// Create profile
export function createProfile(
  state: StyleAdaptationState,
  profileId: string,
  name: string,
  register: RegisterType,
  tone: ToneType,
  intensity: number = 0.5,
  targetAudience: string = 'general',
  elements: Partial<Record<StyleElement, number>> = {}
): StyleAdaptationState {
  const defaultElements: Record<StyleElement, number> = {
    vocabulary: 0.5,
    syntax: 0.5,
    imagery: 0.5,
    tone: 0.5,
    pacing: 0.5,
    register: 0.5,
  };

  const mergedElements = new Map<StyleElement, number>();
  Object.entries(defaultElements).forEach(([k, v]) => {
    mergedElements.set(k as StyleElement, (elements[k as StyleElement] ?? v));
  });

  const profile: StyleProfile = {
    profileId,
    name,
    elements: mergedElements,
    register,
    tone,
    intensity: Math.min(1, Math.max(0, intensity)),
    targetAudience,
  };

  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeStyle({ ...state, profiles, totalProfiles: profiles.size });
}

// Set active profile
export function setActiveStyleProfile(state: StyleAdaptationState, profileId: string): StyleAdaptationState {
  return { ...state, activeProfile: profileId };
}

// Update element
export function updateStyleElement(
  state: StyleAdaptationState,
  profileId: string,
  element: StyleElement,
  value: number
): StyleAdaptationState {
  const profile = state.profiles.get(profileId);
  if (!profile) return state;

  const updated: StyleProfile = {
    ...profile,
    elements: new Map(profile.elements).set(element, Math.min(1, Math.max(0, value))),
  };
  const profiles = new Map(state.profiles).set(profileId, updated);
  return { ...state, profiles };
}

// Get profile by register
export function getProfilesByRegister(state: StyleAdaptationState, register: RegisterType): StyleProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.register === register);
}

// Get profiles by tone
export function getProfilesByTone(state: StyleAdaptationState, tone: ToneType): StyleProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.tone === tone);
}

// Get style report
export function getStyleAdaptationReport(state: StyleAdaptationState): {
  totalProfiles: number;
  averageIntensity: number;
  profileDiversity: number;
  dominantRegister: RegisterType | null;
  dominantTone: ToneType | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles === 0) recommendations.push('No style profiles — create profiles');
  if (state.profileDiversity < 0.3) recommendations.push('Low profile diversity — vary styles');

  return {
    totalProfiles: state.totalProfiles,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    profileDiversity: Math.round(state.profileDiversity * 100) / 100,
    dominantRegister: state.dominantRegister,
    dominantTone: state.dominantTone,
    recommendations,
  };
}

// Recompute metrics
function recomputeStyle(state: StyleAdaptationState): StyleAdaptationState {
  const profiles = Array.from(state.profiles.values());
  if (profiles.length === 0) return state;

  const averageIntensity = profiles.reduce((s, p) => s + p.intensity, 0) / profiles.length;

  const registers = new Map<RegisterType, number>();
  const tones = new Map<ToneType, number>();
  profiles.forEach(p => {
    registers.set(p.register, (registers.get(p.register) || 0) + 1);
    tones.set(p.tone, (tones.get(p.tone) || 0) + 1);
  });

  const uniqueRegisters = registers.size;
  const uniqueTones = tones.size;
  const profileDiversity = Math.min(1, (uniqueRegisters + uniqueTones) / 12);

  let dominantRegister: RegisterType | null = null;
  let dominantTone: ToneType | null = null;
  let maxR = -1;
  let maxT = -1;

  registers.forEach((count, reg) => {
    if (count > maxR) { maxR = count; dominantRegister = reg; }
  });
  tones.forEach((count, tone) => {
    if (count > maxT) { maxT = count; dominantTone = tone; }
  });

  return { ...state, averageIntensity, profileDiversity, dominantRegister, dominantTone };
}

// Reset style state
export function resetStyleAdaptationState(): StyleAdaptationState {
  return createStyleAdaptationState();
}