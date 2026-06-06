/**
 * V884 NarrativeOntologyEngine — Direction C Iter 5/15 (Round 4)
 * Narrative ontology engine: ontological structure of narrative
 * Sources: ruflo ontology + thunderbolt + nanobot
 */

export type EntityType = 'person' | 'place' | 'object' | 'concept' | 'event' | 'creature';
export type EntityExistence = 'real' | 'imagined' | 'remembered' | 'mythical' | 'parallel';
export type EntitySignificance = 'trivial' | 'minor' | 'major' | 'pivotal' | 'defining';

export interface NarrativeEntity {
  entityId: string;
  name: string;
  type: EntityType;
  existence: EntityExistence;
  significance: EntitySignificance;
  description: string;
  properties: Map<string, string>;
  relationships: string[];
  chapter: number;
}

export interface EntityCategory {
  categoryId: string;
  name: string;
  entityIds: string[];
  description: string;
  priority: number;
}

export interface NarrativeOntologyEngineState {
  entities: Map<string, NarrativeEntity>;
  categories: Map<string, EntityCategory>;
  totalEntities: number;
  totalCategories: number;
  typeDistribution: Map<EntityType, number>;
  significantEntities: number;
  averageSignificance: number;
  ontologyRichness: number;
  ontologicalCoherence: number;
}

// Factory
export function createNarrativeOntologyEngineState(): NarrativeOntologyEngineState {
  return {
    entities: new Map(),
    categories: new Map(),
    totalEntities: 0,
    totalCategories: 0,
    typeDistribution: new Map(),
    significantEntities: 0,
    averageSignificance: 0.5,
    ontologyRichness: 0.5,
    ontologicalCoherence: 0.5,
  };
}

// Add entity
export function addEntity(
  state: NarrativeOntologyEngineState,
  entityId: string,
  name: string,
  type: EntityType,
  existence: EntityExistence,
  description: string,
  chapter: number,
  significance: EntitySignificance = 'minor'
): NarrativeOntologyEngineState {
  const entity: NarrativeEntity = {
    entityId, name, type, existence, significance, description,
    properties: new Map(), relationships: [], chapter,
  };
  const entities = new Map(state.entities).set(entityId, entity);

  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);

  const significantEntities = (significance === 'major' || significance === 'pivotal' || significance === 'defining')
    ? state.significantEntities + 1
    : state.significantEntities;

  return recomputeOntology({ ...state, entities, typeDistribution, significantEntities, totalEntities: entities.size });
}

// Add relationship
export function addEntityRelationship(state: NarrativeOntologyEngineState, entityId: string, targetId: string): NarrativeOntologyEngineState {
  const entity = state.entities.get(entityId);
  if (!entity) return state;

  const updated: NarrativeEntity = { ...entity, relationships: [...entity.relationships, targetId] };
  const entities = new Map(state.entities).set(entityId, updated);
  return recomputeOntology({ ...state, entities });
}

// Create category
export function createEntityCategory(
  state: NarrativeOntologyEngineState,
  categoryId: string,
  name: string,
  entityIds: string[],
  description: string,
  priority: number = 1
): NarrativeOntologyEngineState {
  const category: EntityCategory = { categoryId, name, entityIds, description, priority };
  const categories = new Map(state.categories).set(categoryId, category);
  return recomputeOntology({ ...state, categories, totalCategories: categories.size });
}

// Get entities by type
export function getEntitiesByType(state: NarrativeOntologyEngineState, type: EntityType): NarrativeEntity[] {
  return Array.from(state.entities.values()).filter(e => e.type === type);
}

// Get ontology report
export function getOntologyReport(state: NarrativeOntologyEngineState): {
  totalEntities: number;
  totalCategories: number;
  significantEntities: number;
  averageSignificance: number;
  ontologyRichness: number;
  ontologicalCoherence: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntities === 0) recommendations.push('No entities — add entities');
  if (state.averageSignificance < 0.4) recommendations.push('Low significance — strengthen');
  if (state.ontologicalCoherence < 0.4) recommendations.push('Low coherence — connect entities');

  return {
    totalEntities: state.totalEntities,
    totalCategories: state.totalCategories,
    significantEntities: state.significantEntities,
    averageSignificance: Math.round(state.averageSignificance * 100) / 100,
    ontologyRichness: Math.round(state.ontologyRichness * 100) / 100,
    ontologicalCoherence: Math.round(state.ontologicalCoherence * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeOntology(state: NarrativeOntologyEngineState): NarrativeOntologyEngineState {
  const entities = Array.from(state.entities.values());
  const significanceMap: Record<EntitySignificance, number> = { trivial: 0.1, minor: 0.3, major: 0.5, pivotal: 0.8, defining: 1.0 };
  const averageSignificance = entities.length === 0 ? 0.5
    : entities.reduce((s, e) => s + significanceMap[e.significance], 0) / entities.length;

  const typeCount = state.typeDistribution.size;
  const ontologyRichness = entities.length === 0 ? 0.5
    : Math.min(1, averageSignificance * 0.5 + typeCount / 6 * 0.5);

  // Coherence: average relationships per entity
  const totalRelationships = entities.reduce((s, e) => s + e.relationships.length, 0);
  const ontologicalCoherence = entities.length === 0 ? 0.5
    : Math.min(1, totalRelationships / (entities.length * 2));

  return { ...state, averageSignificance, ontologyRichness, ontologicalCoherence };
}

// Reset ontology state
export function resetNarrativeOntologyEngineState(): NarrativeOntologyEngineState {
  return createNarrativeOntologyEngineState();
}