/**
 * V1182 NarrativeStyleFingerprintEngine — Direction F Iter 19/20 (Round 5)
 * Style fingerprint engine: unique style fingerprint
 * Sources: nanobot fingerprint + thunderbolt + ruflo
 */

export type StyleFingerprintType = 'lexical' | 'syntactic' | 'rhythmic' | 'tonal' | 'thematic' | 'composite';
export type StyleFingerprintDistinctiveness = 'generic' | 'common' | 'distinct' | 'unique' | 'singular';
export type StyleFingerprintStability = 'shifting' | 'variable' | 'mostly' | 'stable' | 'fixed';

export interface StyleFingerprint {
  fingerprintId: string;
  type: StyleFingerprintType;
  distinctiveness: StyleFingerprintDistinctiveness;
  stability: StyleFingerprintStability;
  description: string;
  identity: number;
  recognition: number;
  chapter: number;
}

export interface StyleFingerprintPattern {
  patternId: string,
  fingerprintIds: string[],
  cumulativeIdentity: number,
  singularity: number,
}

export interface NarrativeStyleFingerprintEngineState {
  fingerprints: Map<string, StyleFingerprint>;
  patterns: Map<string, StyleFingerprintPattern>;
  totalFingerprints: number;
  totalPatterns: number;
  averageIdentity: number;
  averageRecognition: number;
  patternSingularity: number;
  styleFingerprintMastery: number;
}

// Factory
export function createNarrativeStyleFingerprintEngineState(): NarrativeStyleFingerprintEngineState {
  return {
    fingerprints: new Map(),
    patterns: new Map(),
    totalFingerprints: 0,
    totalPatterns: 0,
    averageIdentity: 0.5,
    averageRecognition: 0.5,
    patternSingularity: 0.5,
    styleFingerprintMastery: 0.5,
  };
}

// Add fingerprint
export function addStyleFingerprint(
  state: NarrativeStyleFingerprintEngineState,
  fingerprintId: string,
  type: StyleFingerprintType,
  distinctiveness: StyleFingerprintDistinctiveness,
  stability: StyleFingerprintStability,
  description: string,
  identity: number,
  recognition: number,
  chapter: number
): NarrativeStyleFingerprintEngineState {
  const fingerprint: StyleFingerprint = { fingerprintId, type, distinctiveness, stability, description, identity, recognition, chapter };
  const fingerprints = new Map(state.fingerprints).set(fingerprintId, fingerprint);
  return recomputeStyleFingerprint({ ...state, fingerprints, totalFingerprints: fingerprints.size });
}

// Add pattern
export function addStyleFingerprintPattern(
  state: NarrativeStyleFingerprintEngineState,
  patternId: string,
  fingerprintIds: string[]
): NarrativeStyleFingerprintEngineState {
  const fingerprints = fingerprintIds.map(id => state.fingerprints.get(id)).filter((f): f is StyleFingerprint => f !== undefined);
  const cumulativeIdentity = fingerprints.length === 0 ? 0
    : fingerprints.reduce((s, f) => s + f.identity, 0) / fingerprints.length;
  const typeSet = new Set(fingerprints.map(f => f.type));
  const singularity = Math.min(1, typeSet.size / 6);
  const pattern: StyleFingerprintPattern = { patternId, fingerprintIds, cumulativeIdentity, singularity };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeStyleFingerprint({ ...state, patterns, totalPatterns: patterns.size });
}

// Get fingerprints by type
export function getStyleFingerprintsByType(state: NarrativeStyleFingerprintEngineState, type: StyleFingerprintType): StyleFingerprint[] {
  return Array.from(state.fingerprints.values()).filter(f => f.type === type);
}

// Get style fingerprint report
export function getStyleFingerprintReport(state: NarrativeStyleFingerprintEngineState): {
  totalFingerprints: number;
  totalPatterns: number;
  averageIdentity: number;
  averageRecognition: number;
  styleFingerprintMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFingerprints === 0) recommendations.push('No fingerprints — add style fingerprints');
  if (state.averageIdentity < 0.5) recommendations.push('Low identity — strengthen');
  if (state.styleFingerprintMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFingerprints: state.totalFingerprints,
    totalPatterns: state.totalPatterns,
    averageIdentity: Math.round(state.averageIdentity * 100) / 100,
    averageRecognition: Math.round(state.averageRecognition * 100) / 100,
    styleFingerprintMastery: Math.round(state.styleFingerprintMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStyleFingerprint(state: NarrativeStyleFingerprintEngineState): NarrativeStyleFingerprintEngineState {
  const fingerprints = Array.from(state.fingerprints.values());
  const averageIdentity = fingerprints.length === 0 ? 0.5
    : fingerprints.reduce((s, f) => s + f.identity, 0) / fingerprints.length;
  const averageRecognition = fingerprints.length === 0 ? 0.5
    : fingerprints.reduce((s, f) => s + f.recognition, 0) / fingerprints.length;

  const patterns = Array.from(state.patterns.values());
  const patternSingularity = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.singularity, 0) / patterns.length;

  const styleFingerprintMastery = (averageIdentity * 0.4 + averageRecognition * 0.3 + patternSingularity * 0.3);

  return { ...state, averageIdentity, averageRecognition, patternSingularity, styleFingerprintMastery };
}

// Reset
export function resetNarrativeStyleFingerprintEngineState(): NarrativeStyleFingerprintEngineState {
  return createNarrativeStyleFingerprintEngineState();
}