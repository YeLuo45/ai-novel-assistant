/**
 * V960 NarrativeCognitionCore — Direction E Iter 13/15 (Round 4)
 * Narrative cognition core: integrated cognitive processing
 * Sources: nanobot cognition + thunderbolt + ruflo
 */

export type CognitionProcess = 'perception' | 'attention' | 'memory' | 'reasoning' | 'imagination' | 'judgment';
export type CognitionMode = 'automatic' | 'controlled' | 'analytical' | 'intuitive' | 'creative' | 'critical';
export type CognitionLevel = 'basic' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface CognitiveUnit {
  unitId: string;
  process: CognitionProcess;
  mode: CognitionMode;
  level: CognitionLevel;
  description: string;
  effectiveness: number;
  chapter: number;
}

export interface CognitiveSchema {
  schemaId: string,
  name: string,
  unitIds: string[],
  integration: number,
  sophistication: number,
}

export interface NarrativeCognitionCoreState {
  units: Map<string, CognitiveUnit>;
  schemas: Map<string, CognitiveSchema>;
  totalUnits: number;
  totalSchemas: number;
  averageEffectiveness: number;
  processCoverage: number;
  cognitiveSophistication: number;
  cognitionMastery: number;
}

// Factory
export function createNarrativeCognitionCoreState(): NarrativeCognitionCoreState {
  return {
    units: new Map(),
    schemas: new Map(),
    totalUnits: 0,
    totalSchemas: 0,
    averageEffectiveness: 0.5,
    processCoverage: 0,
    cognitiveSophistication: 0.5,
    cognitionMastery: 0.5,
  };
}

// Add unit
export function addCognitiveUnit(
  state: NarrativeCognitionCoreState,
  unitId: string,
  process: CognitionProcess,
  mode: CognitionMode,
  level: CognitionLevel,
  description: string,
  effectiveness: number,
  chapter: number
): NarrativeCognitionCoreState {
  const unit: CognitiveUnit = { unitId, process, mode, level, description, effectiveness, chapter };
  const units = new Map(state.units).set(unitId, unit);
  return recomputeCognition({ ...state, units, totalUnits: units.size });
}

// Add schema
export function addCognitiveSchema(
  state: NarrativeCognitionCoreState,
  schemaId: string,
  name: string,
  unitIds: string[]
): NarrativeCognitionCoreState {
  const units = unitIds.map(id => state.units.get(id)).filter((u): u is CognitiveUnit => u !== undefined);
  const integration = units.length === 0 ? 0.5
    : units.reduce((s, u) => s + u.effectiveness, 0) / units.length;
  const levelMap: Record<CognitionLevel, number> = { basic: 0.2, intermediate: 0.4, advanced: 0.6, expert: 0.8, master: 1.0 };
  const sophistication = units.length === 0 ? 0.5
    : units.reduce((s, u) => s + levelMap[u.level], 0) / units.length;
  const schema: CognitiveSchema = { schemaId, name, unitIds, integration, sophistication };
  const schemas = new Map(state.schemas).set(schemaId, schema);
  return recomputeCognition({ ...state, schemas, totalSchemas: schemas.size });
}

// Get units by process
export function getUnitsByProcess(state: NarrativeCognitionCoreState, process: CognitionProcess): CognitiveUnit[] {
  return Array.from(state.units.values()).filter(u => u.process === process);
}

// Get cognition report
export function getCognitionReport(state: NarrativeCognitionCoreState): {
  totalUnits: number;
  totalSchemas: number;
  averageEffectiveness: number;
  processCoverage: number;
  cognitionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalUnits === 0) recommendations.push('No units — add cognitive units');
  if (state.processCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.cognitionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalUnits: state.totalUnits,
    totalSchemas: state.totalSchemas,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    processCoverage: Math.round(state.processCoverage * 100) / 100,
    cognitionMastery: Math.round(state.cognitionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCognition(state: NarrativeCognitionCoreState): NarrativeCognitionCoreState {
  const units = Array.from(state.units.values());
  const averageEffectiveness = units.length === 0 ? 0.5
    : units.reduce((s, u) => s + u.effectiveness, 0) / units.length;
  const processSet = new Set(units.map(u => u.process));
  const processCoverage = Math.min(1, processSet.size / 5);

  const schemas = Array.from(state.schemas.values());
  const cognitiveSophistication = schemas.length === 0 ? 0.5
    : schemas.reduce((s, sc) => s + sc.sophistication, 0) / schemas.length;

  const cognitionMastery = (averageEffectiveness * 0.4 + processCoverage * 0.3 + cognitiveSophistication * 0.3);

  return { ...state, averageEffectiveness, processCoverage, cognitiveSophistication, cognitionMastery };
}

// Reset cognition state
export function resetNarrativeCognitionCoreState(): NarrativeCognitionCoreState {
  return createNarrativeCognitionCoreState();
}