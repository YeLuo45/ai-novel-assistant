/**
 * V778 CharacterDynamicsCore — Direction C Iter 3/9 (Round 3)
 * Character dynamics core: relationship evolution + interaction patterns
 * Sources: chatdev interaction + thunderbolt dynamic + nanobot
 */

export type RelationshipType = 'family' | 'romantic' | 'friendship' | 'professional' | 'rivalry' | 'adversarial' | 'mentor';
export type RelationshipQuality = 'hostile' | 'cold' | 'neutral' | 'warm' | 'close' | 'intimate';
export type InteractionType = 'dialogue' | 'conflict' | 'cooperation' | 'support' | 'betrayal' | 'revelation';

export interface Relationship {
  relationshipId: string;
  character1Id: string;
  character2Id: string;
  type: RelationshipType;
  quality: RelationshipQuality;
  strength: number;
  history: string[];
  active: boolean;
}

export interface Interaction {
  interactionId: string;
  relationshipId: string;
  type: InteractionType;
  impact: number;
  description: string;
  chapter: number;
  timestamp: number;
}

export interface CharacterDynamicsCoreState {
  relationships: Map<string, Relationship>;
  interactions: Map<string, Interaction>;
  totalRelationships: number;
  totalInteractions: number;
  averageStrength: number;
  averageImpact: number;
  typeDistribution: Map<RelationshipType, number>;
  dynamicsComplexity: number;
  networkDensity: number;
}

// Factory
export function createCharacterDynamicsCoreState(): CharacterDynamicsCoreState {
  return {
    relationships: new Map(),
    interactions: new Map(),
    totalRelationships: 0,
    totalInteractions: 0,
    averageStrength: 0,
    averageImpact: 0,
    typeDistribution: new Map(),
    dynamicsComplexity: 0.5,
    networkDensity: 0,
  };
}

// Create relationship
export function createRelationship(
  state: CharacterDynamicsCoreState,
  relationshipId: string,
  character1Id: string,
  character2Id: string,
  type: RelationshipType,
  quality: RelationshipQuality = 'neutral',
  strength: number = 0.5
): CharacterDynamicsCoreState {
  const relationship: Relationship = {
    relationshipId, character1Id, character2Id, type, quality,
    strength: Math.min(1, Math.max(0, strength)),
    history: [],
    active: true,
  };
  const relationships = new Map(state.relationships).set(relationshipId, relationship);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputeDynamics({ ...state, relationships, typeDistribution, totalRelationships: relationships.size });
}

// Update relationship quality
export function updateRelationshipQuality(state: CharacterDynamicsCoreState, relationshipId: string, quality: RelationshipQuality, strengthDelta: number = 0): CharacterDynamicsCoreState {
  const relationship = state.relationships.get(relationshipId);
  if (!relationship) return state;

  const newStrength = Math.min(1, Math.max(0, relationship.strength + strengthDelta));
  const updated: Relationship = { ...relationship, quality, strength: newStrength };
  const relationships = new Map(state.relationships).set(relationshipId, updated);
  return recomputeDynamics({ ...state, relationships });
}

// Record interaction
export function recordInteraction(
  state: CharacterDynamicsCoreState,
  interactionId: string,
  relationshipId: string,
  type: InteractionType,
  impact: number,
  description: string,
  chapter: number
): CharacterDynamicsCoreState {
  const interaction: Interaction = { interactionId, relationshipId, type, impact, description, chapter, timestamp: Date.now() };
  const interactions = new Map(state.interactions).set(interactionId, interaction);

  // Update relationship history
  const relationship = state.relationships.get(relationshipId);
  let relationships = state.relationships;
  if (relationship) {
    const updated: Relationship = { ...relationship, history: [...relationship.history, description] };
    relationships = new Map(state.relationships).set(relationshipId, updated);
  }

  return recomputeDynamics({ ...state, relationships, interactions, totalInteractions: interactions.size });
}

// Get relationships by type
export function getRelationshipsByType(state: CharacterDynamicsCoreState, type: RelationshipType): Relationship[] {
  return Array.from(state.relationships.values()).filter(r => r.type === type);
}

// Get relationships for character
export function getRelationshipsForCharacter(state: CharacterDynamicsCoreState, characterId: string): Relationship[] {
  return Array.from(state.relationships.values()).filter(r => r.character1Id === characterId || r.character2Id === characterId);
}

// Get interactions for relationship
export function getInteractionsForRelationship(state: CharacterDynamicsCoreState, relationshipId: string): Interaction[] {
  return Array.from(state.interactions.values()).filter(i => i.relationshipId === relationshipId);
}

// Get dynamics report
export function getDynamicsCoreReport(state: CharacterDynamicsCoreState): {
  totalRelationships: number;
  totalInteractions: number;
  averageStrength: number;
  averageImpact: number;
  dynamicsComplexity: number;
  networkDensity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRelationships === 0) recommendations.push('No relationships — create relationships');
  if (state.dynamicsComplexity < 0.3) recommendations.push('Low complexity — add interactions');
  if (state.networkDensity < 0.1) recommendations.push('Low network density — connect characters');

  return {
    totalRelationships: state.totalRelationships,
    totalInteractions: state.totalInteractions,
    averageStrength: Math.round(state.averageStrength * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    dynamicsComplexity: Math.round(state.dynamicsComplexity * 100) / 100,
    networkDensity: Math.round(state.networkDensity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDynamics(state: CharacterDynamicsCoreState): CharacterDynamicsCoreState {
  const relationships = Array.from(state.relationships.values());
  const interactions = Array.from(state.interactions.values());

  const averageStrength = relationships.length === 0 ? 0
    : relationships.reduce((s, r) => s + r.strength, 0) / relationships.length;
  const averageImpact = interactions.length === 0 ? 0
    : interactions.reduce((s, i) => s + Math.abs(i.impact), 0) / interactions.length;

  const typeCount = state.typeDistribution.size;
  const dynamicsComplexity = relationships.length === 0 ? 0.5
    : Math.min(1, (relationships.length * typeCount) / 30);

  const characterSet = new Set<string>();
  relationships.forEach(r => {
    characterSet.add(r.character1Id);
    characterSet.add(r.character2Id);
  });
  const characterCount = characterSet.size;
  const maxPossible = characterCount * (characterCount - 1) / 2;
  const networkDensity = maxPossible === 0 ? 0 : relationships.length / maxPossible;

  return { ...state, averageStrength, averageImpact, dynamicsComplexity, networkDensity };
}

// Reset dynamics state
export function resetCharacterDynamicsCoreState(): CharacterDynamicsCoreState {
  return createCharacterDynamicsCoreState();
}