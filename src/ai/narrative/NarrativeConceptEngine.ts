/**
 * V940 NarrativeConceptEngine — Direction E Iter 3/15 (Round 4)
 * Narrative concept engine: abstract concept formation
 * Sources: nanobot concept + ruflo + thunderbolt
 */

export type ConceptType = 'thematic' | 'philosophical' | 'moral' | 'psychological' | 'aesthetic' | 'structural';
export type ConceptAbstraction = 'concrete' | 'specific' | 'general' | 'abstract' | 'universal';
export type ConceptMaturity = 'seed' | 'developing' | 'formed' | 'refined' | 'crystallized';

export interface NarrativeConcept {
  conceptId: string;
  type: ConceptType;
  abstraction: ConceptAbstraction;
  maturity: ConceptMaturity;
  name: string;
  description: string;
  power: number;
  chapter: number;
}

export interface ConceptRelation {
  relationId: string;
  concept1Id: string;
  concept2Id: string;
  type: 'parent' | 'sibling' | 'opposition' | 'analogy' | 'example';
  strength: number;
}

export interface NarrativeConceptEngineState {
  concepts: Map<string, NarrativeConcept>;
  relations: Map<string, ConceptRelation>;
  totalConcepts: number;
  totalRelations: number;
  averagePower: number;
  typeCoverage: number;
  conceptDepth: number;
  conceptualMastery: number;
}

// Factory
export function createNarrativeConceptEngineState(): NarrativeConceptEngineState {
  return {
    concepts: new Map(),
    relations: new Map(),
    totalConcepts: 0,
    totalRelations: 0,
    averagePower: 0.5,
    typeCoverage: 0,
    conceptDepth: 0.5,
    conceptualMastery: 0.5,
  };
}

// Add concept
export function addConcept(
  state: NarrativeConceptEngineState,
  conceptId: string,
  type: ConceptType,
  name: string,
  description: string,
  chapter: number,
  abstraction: ConceptAbstraction = 'general',
  power: number = 0.5
): NarrativeConceptEngineState {
  const concept: NarrativeConcept = {
    conceptId, type, abstraction,
    maturity: 'seed', name, description,
    power: Math.min(1, Math.max(0, power)), chapter,
  };
  const concepts = new Map(state.concepts).set(conceptId, concept);
  return recomputeConcept({ ...state, concepts, totalConcepts: concepts.size });
}

// Mature concept
export function matureConcept(state: NarrativeConceptEngineState, conceptId: string, maturity: ConceptMaturity): NarrativeConceptEngineState {
  const concept = state.concepts.get(conceptId);
  if (!concept) return state;

  const updated: NarrativeConcept = { ...concept, maturity };
  const concepts = new Map(state.concepts).set(conceptId, updated);
  return recomputeConcept({ ...state, concepts });
}

// Add relation
export function addConceptRelation(
  state: NarrativeConceptEngineState,
  relationId: string,
  concept1Id: string,
  concept2Id: string,
  type: ConceptRelation['type'],
  strength: number = 0.5
): NarrativeConceptEngineState {
  const relation: ConceptRelation = { relationId, concept1Id, concept2Id, type, strength };
  const relations = new Map(state.relations).set(relationId, relation);
  return recomputeConcept({ ...state, relations, totalRelations: relations.size });
}

// Get concepts by type
export function getConceptsByType(state: NarrativeConceptEngineState, type: ConceptType): NarrativeConcept[] {
  return Array.from(state.concepts.values()).filter(c => c.type === type);
}

// Get concept report
export function getConceptReport(state: NarrativeConceptEngineState): {
  totalConcepts: number;
  totalRelations: number;
  averagePower: number;
  typeCoverage: number;
  conceptDepth: number;
  conceptualMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalConcepts === 0) recommendations.push('No concepts — add concepts');
  if (state.typeCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.conceptualMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalConcepts: state.totalConcepts,
    totalRelations: state.totalRelations,
    averagePower: Math.round(state.averagePower * 100) / 100,
    typeCoverage: Math.round(state.typeCoverage * 100) / 100,
    conceptDepth: Math.round(state.conceptDepth * 100) / 100,
    conceptualMastery: Math.round(state.conceptualMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeConcept(state: NarrativeConceptEngineState): NarrativeConceptEngineState {
  const concepts = Array.from(state.concepts.values());
  const averagePower = concepts.length === 0 ? 0.5
    : concepts.reduce((s, c) => s + c.power, 0) / concepts.length;
  const typeSet = new Set(concepts.map(c => c.type));
  const typeCoverage = Math.min(1, typeSet.size / 5);

  const abstractionMap: Record<ConceptAbstraction, number> = { concrete: 0.2, specific: 0.4, general: 0.6, abstract: 0.8, universal: 1.0 };
  const conceptDepth = concepts.length === 0 ? 0.5
    : concepts.reduce((s, c) => s + abstractionMap[c.abstraction], 0) / concepts.length;

  const conceptualMastery = (averagePower * 0.4 + typeCoverage * 0.3 + conceptDepth * 0.3);

  return { ...state, averagePower, typeCoverage, conceptDepth, conceptualMastery };
}

// Reset concept state
export function resetNarrativeConceptEngineState(): NarrativeConceptEngineState {
  return createNarrativeConceptEngineState();
}