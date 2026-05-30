/**
 * CharacterRelationshipDynamicsEngine — V521
 * Models complex character relationship evolution over narrative time.
 * Inspired by: nanobot (mesh network dynamics) + chatdev (role-based interactions)
 */

export interface CharacterRelationship {
  characterId: string
  targetId: string
  trustLevel: number        // -100 to 100
  conflictLevel: number      // 0 to 100
  dependencyLevel: number    // 0 to 100
  emotionalBond: number     // -50 to 50
  powerBalance: number      // -100 to 100 (negative = target has more power)
  sharedHistory: string[]
  relationshipType: 'alliance' | 'rivalry' | 'neutral' | 'romantic' | 'familial' | 'mentor' | 'adversarial'
  status: 'stable' | 'evolving' | 'conflictual' | 'dissolving'
}

export interface RelationshipEvent {
  id: string
  timestamp: number
  characterId: string
  targetId: string
  eventType: 'trust_change' | 'conflict_event' | 'shared_experience' | 'power_shift' | 'betrayal' | 'reconciliation'
  magnitude: number        // intensity of the event
  description: string
}

export interface RelationshipState {
  relationships: Record<string, CharacterRelationship>  // key: "charId_targetId"
  events: RelationshipEvent[]
  characterProfiles: Record<string, { name: string, archetype: string }>
}

function relationshipKey(charId: string, targetId: string): string {
  return [charId, targetId].sort().join('_')
}

export function createEmptyState(): RelationshipState {
  return {
    relationships: {},
    events: [],
    characterProfiles: {}
  }
}

export function registerCharacter(state: RelationshipState, characterId: string, name: string, archetype: string): RelationshipState {
  return {
    ...state,
    characterProfiles: {
      ...state.characterProfiles,
      [characterId]: { name, archetype }
    }
  }
}

export function initializeRelationship(state: RelationshipState, characterId: string, targetId: string, relationshipType: CharacterRelationship['relationshipType']): RelationshipState {
  const key = relationshipKey(characterId, targetId)
  if (state.relationships[key]) return state
  
  return {
    ...state,
    relationships: {
      ...state.relationships,
      [key]: {
        characterId,
        targetId,
        trustLevel: 0,
        conflictLevel: 0,
        dependencyLevel: 0,
        emotionalBond: 0,
        powerBalance: 0,
        sharedHistory: [],
        relationshipType,
        status: 'stable'
      }
    }
  }
}

export function recordRelationshipEvent(state: RelationshipState, characterId: string, targetId: string, eventType: RelationshipEvent['eventType'], magnitude: number, description: string): RelationshipState {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const timestamp = Date.now()
  
  const updatedRelationships = { ...state.relationships }
  const key = relationshipKey(characterId, targetId)
  
  if (updatedRelationships[key]) {
    const rel = { ...updatedRelationships[key] }
    rel.sharedHistory = [...rel.sharedHistory, description]
    
    switch (eventType) {
      case 'trust_change':
        rel.trustLevel = Math.max(-100, Math.min(100, rel.trustLevel + magnitude))
        break
      case 'conflict_event':
        rel.conflictLevel = Math.min(100, rel.conflictLevel + Math.abs(magnitude))
        rel.trustLevel = Math.max(-100, rel.trustLevel - Math.abs(magnitude) * 0.5)
        break
      case 'shared_experience':
        rel.emotionalBond = Math.max(-50, Math.min(50, rel.emotionalBond + magnitude * 0.3))
        rel.trustLevel = Math.min(100, rel.trustLevel + magnitude * 0.2)
        break
      case 'power_shift':
        rel.powerBalance = Math.max(-100, Math.min(100, rel.powerBalance + magnitude))
        break
      case 'betrayal':
        rel.trustLevel = Math.max(-100, rel.trustLevel - Math.abs(magnitude))
        rel.conflictLevel = Math.max(rel.conflictLevel + Math.abs(magnitude), 70)
        break
      case 'reconciliation':
        rel.trustLevel = Math.min(100, rel.trustLevel + magnitude * 0.5)
        rel.conflictLevel = Math.max(0, rel.conflictLevel - magnitude * 0.3)
        rel.status = rel.conflictLevel < 20 ? 'stable' : 'evolving'
        break
    }
    
    // Update status
    if (rel.conflictLevel > 60) rel.status = 'conflictual'
    else if (rel.conflictLevel > 30) rel.status = 'evolving'
    else if (Math.abs(rel.trustLevel) < 20) rel.status = 'evolving'
    else rel.status = 'stable'
    updatedRelationships[key] = rel
  }
  
  return {
    ...state,
    relationships: updatedRelationships,
    events: [...state.events, { id: eventId, timestamp, characterId, targetId, eventType, magnitude, description }]
  }
}

export function evolveRelationships(state: RelationshipState): RelationshipState {
  const updated = { ...state.relationships }
  
  for (const key of Object.keys(updated)) {
    const rel = { ...updated[key] }
    
    // Gradual natural drift
    if (rel.conflictLevel > 10) {
      rel.conflictLevel = Math.max(0, rel.conflictLevel - 2)
    }
    if (rel.trustLevel > 0) {
      rel.trustLevel = Math.min(100, rel.trustLevel + 1)
    } else if (rel.trustLevel < 0) {
      rel.trustLevel = Math.max(-100, rel.trustLevel - 1)
    }
    
    // Relationship type determines baseline dynamics
    switch (rel.relationshipType) {
      case 'alliance':
        if (rel.trustLevel < 30) rel.status = 'dissolving'
        break
      case 'adversarial':
        if (rel.conflictLevel < 20) rel.status = 'evolving'
        break
      case 'romantic':
        if (rel.emotionalBond < -20) rel.status = 'dissolving'
        break
    }
    
    updated[key] = rel
  }
  
  return { ...state, relationships: updated }
}

export function calculateRelationshipStrength(state: RelationshipState, characterId: string, targetId: string): number {
  const key = relationshipKey(characterId, targetId)
  const rel = state.relationships[key]
  if (!rel) return 0
  
  const trustScore = (rel.trustLevel + 100) / 200          // 0-1
  const conflictScore = 1 - rel.conflictLevel / 100        // 1-0 (inverted)
  const bondScore = (rel.emotionalBond + 50) / 100        // 0-1
  const historyBonus = Math.min(rel.sharedHistory.length * 2, 20) / 100  // 0-0.2
  
  return Math.round((trustScore * 0.4 + conflictScore * 0.3 + bondScore * 0.3 + historyBonus) * 100)
}

export function predictRelationshipTrajectory(state: RelationshipState, characterId: string, targetId: string, steps: number): Array<{ step: number, trustLevel: number, conflictLevel: number }> {
  const key = relationshipKey(characterId, targetId)
  const rel = state.relationships[key]
  if (!rel) return []
  
  let current = { trustLevel: rel.trustLevel, conflictLevel: rel.conflictLevel }
  const trajectory = []
  
  for (let s = 1; s <= steps; s++) {
    current = {
      trustLevel: Math.max(-100, Math.min(100, current.trustLevel + (current.trustLevel > 0 ? 0.5 : current.trustLevel < 0 ? -0.3 : 0))),
      conflictLevel: Math.max(0, Math.min(100, current.conflictLevel - 0.5))
    }
    trajectory.push({ step: s, ...current })
  }
  
  return trajectory
}

export function getRelationshipSummary(state: RelationshipState, characterId: string): {
  totalRelationships: number
  closestAllies: string[]
  primaryRivals: string[]
  averageTrust: number
} {
  const rels = Object.values(state.relationships).filter(
    r => r.characterId === characterId || r.targetId === characterId
  )
  
  const allies = rels
    .filter(r => r.relationshipType === 'alliance' && r.trustLevel > 30)
    .map(r => r.characterId === characterId ? r.targetId : r.characterId)
  
  const rivals = rels
    .filter(r => r.conflictLevel > 50)
    .map(r => r.characterId === characterId ? r.targetId : r.characterId)
  
  const avgTrust = rels.length > 0
    ? Math.round(rels.reduce((sum, r) => sum + r.trustLevel, 0) / rels.length)
    : 0
  
  return {
    totalRelationships: rels.length,
    closestAllies: allies,
    primaryRivals: rivals,
    averageTrust: avgTrust
  }
}

export function getRelationshipById(state: RelationshipState, characterId: string, targetId: string): CharacterRelationship | null {
  return state.relationships[relationshipKey(characterId, targetId)] || null
}

export function getAllRelationships(state: RelationshipState): CharacterRelationship[] {
  return Object.values(state.relationships)
}

export function getRelationshipEvents(state: RelationshipState, characterId: string, targetId: string): RelationshipEvent[] {
  return state.events.filter(
    e => (e.characterId === characterId && e.targetId === targetId) ||
         (e.characterId === targetId && e.targetId === characterId)
  )
}

export function getConflictedRelationships(state: RelationshipState): CharacterRelationship[] {
  return Object.values(state.relationships).filter(r => r.status === 'conflictual')
}