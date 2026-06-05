/**
 * V776 WorldPhysicsEngine — Direction C Iter 2/9 (Round 3)
 * World physics engine: world rules + magic system + mechanics
 * Sources: ruflo physics + thunderbolt mechanics + nanobot
 */

export type PhysicsType = 'natural' | 'magical' | 'divine' | 'psychic' | 'technological' | 'hybrid';
export type PhysicsStrictness = 'loose' | 'moderate' | 'strict' | 'rigid' | 'absolute';
export type EnergyType = 'kinetic' | 'thermal' | 'magical' | 'spiritual' | 'mental' | 'quantum';

export interface WorldMechanic {
  mechanicId: string;
  type: PhysicsType;
  name: string;
  description: string;
  strictness: PhysicsStrictness;
  energyType: EnergyType;
  energyCost: number;
  active: boolean;
}

export interface EnergyBudget {
  budgetId: string;
  characterId: string;
  type: EnergyType;
  maxEnergy: number;
  currentEnergy: number;
  regenRate: number;
  lastUpdate: number;
}

export interface WorldPhysicsEngineState {
  mechanics: Map<string, WorldMechanic>;
  budgets: Map<string, EnergyBudget>;
  totalMechanics: number;
  activeMechanics: number;
  totalBudgets: number;
  averageStrictness: number;
  totalEnergyCost: number;
  averageEnergyAvailable: number;
  physicsComplexity: number;
  dominantType: PhysicsType | null;
}

// Factory
export function createWorldPhysicsEngineState(): WorldPhysicsEngineState {
  return {
    mechanics: new Map(),
    budgets: new Map(),
    totalMechanics: 0,
    activeMechanics: 0,
    totalBudgets: 0,
    averageStrictness: 0.5,
    totalEnergyCost: 0,
    averageEnergyAvailable: 1.0,
    physicsComplexity: 0.5,
    dominantType: null,
  };
}

// Add mechanic
export function addWorldMechanic(
  state: WorldPhysicsEngineState,
  mechanicId: string,
  type: PhysicsType,
  name: string,
  description: string,
  strictness: PhysicsStrictness = 'moderate',
  energyType: EnergyType = 'magical',
  energyCost: number = 0.5,
  active: boolean = true
): WorldPhysicsEngineState {
  const mechanic: WorldMechanic = { mechanicId, type, name, description, strictness, energyType, energyCost, active };
  const mechanics = new Map(state.mechanics).set(mechanicId, mechanic);
  const activeMechanics = active ? state.activeMechanics + 1 : state.activeMechanics;
  return recomputePhysics({ ...state, mechanics, totalMechanics: mechanics.size, activeMechanics });
}

// Create energy budget
export function createEnergyBudget(
  state: WorldPhysicsEngineState,
  budgetId: string,
  characterId: string,
  type: EnergyType,
  maxEnergy: number = 100,
  regenRate: number = 0.1
): WorldPhysicsEngineState {
  const budget: EnergyBudget = { budgetId, characterId, type, maxEnergy, currentEnergy: maxEnergy, regenRate, lastUpdate: Date.now() };
  const budgets = new Map(state.budgets).set(budgetId, budget);
  return recomputePhysics({ ...state, budgets, totalBudgets: budgets.size });
}

// Consume energy
export function consumeEnergy(state: WorldPhysicsEngineState, budgetId: string, amount: number): WorldPhysicsEngineState {
  const budget = state.budgets.get(budgetId);
  if (!budget) return state;

  const currentEnergy = Math.max(0, budget.currentEnergy - amount);
  const updated: EnergyBudget = { ...budget, currentEnergy, lastUpdate: Date.now() };
  const budgets = new Map(state.budgets).set(budgetId, updated);
  return recomputePhysics({ ...state, budgets });
}

// Regenerate energy
export function regenerateEnergy(state: WorldPhysicsEngineState, budgetId: string, timeDelta: number): WorldPhysicsEngineState {
  const budget = state.budgets.get(budgetId);
  if (!budget) return state;

  const currentEnergy = Math.min(budget.maxEnergy, budget.currentEnergy + budget.regenRate * timeDelta);
  const updated: EnergyBudget = { ...budget, currentEnergy, lastUpdate: Date.now() };
  const budgets = new Map(state.budgets).set(budgetId, updated);
  return recomputePhysics({ ...state, budgets });
}

// Get mechanics by type
export function getMechanicsByType(state: WorldPhysicsEngineState, type: PhysicsType): WorldMechanic[] {
  return Array.from(state.mechanics.values()).filter(m => m.type === type);
}

// Get budgets by character
export function getBudgetsByCharacter(state: WorldPhysicsEngineState, characterId: string): EnergyBudget[] {
  return Array.from(state.budgets.values()).filter(b => b.characterId === characterId);
}

// Get physics report
export function getWorldPhysicsReport(state: WorldPhysicsEngineState): {
  totalMechanics: number;
  activeMechanics: number;
  totalBudgets: number;
  averageStrictness: number;
  physicsComplexity: number;
  dominantType: PhysicsType | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMechanics === 0) recommendations.push('No mechanics — add world mechanics');
  if (state.physicsComplexity < 0.4) recommendations.push('Low complexity — add depth');
  if (state.averageStrictness < 0.4) recommendations.push('Low strictness — tighten rules');

  return {
    totalMechanics: state.totalMechanics,
    activeMechanics: state.activeMechanics,
    totalBudgets: state.totalBudgets,
    averageStrictness: Math.round(state.averageStrictness * 100) / 100,
    physicsComplexity: Math.round(state.physicsComplexity * 100) / 100,
    dominantType: state.dominantType,
    recommendations,
  };
}

// Recompute metrics
function recomputePhysics(state: WorldPhysicsEngineState): WorldPhysicsEngineState {
  const mechanics = Array.from(state.mechanics.values());
  const strictnessMap: Record<PhysicsStrictness, number> = { loose: 0.2, moderate: 0.4, strict: 0.6, rigid: 0.8, absolute: 1.0 };
  const averageStrictness = mechanics.length === 0 ? 0.5
    : mechanics.reduce((s, m) => s + strictnessMap[m.strictness], 0) / mechanics.length;

  const totalEnergyCost = mechanics.reduce((s, m) => s + m.energyCost, 0);
  const typeCount = new Set(mechanics.map(m => m.type)).size;
  const physicsComplexity = mechanics.length === 0 ? 0.5
    : Math.min(1, (mechanics.length * typeCount) / 30);

  let dominantType: PhysicsType | null = null;
  let maxCount = -1;
  const typeCounts = new Map<PhysicsType, number>();
  mechanics.forEach(m => typeCounts.set(m.type, (typeCounts.get(m.type) || 0) + 1));
  typeCounts.forEach((count, t) => { if (count > maxCount) { maxCount = count; dominantType = t; } });

  return { ...state, averageStrictness, totalEnergyCost, physicsComplexity, dominantType };
}

// Reset physics state
export function resetWorldPhysicsEngineState(): WorldPhysicsEngineState {
  return createWorldPhysicsEngineState();
}