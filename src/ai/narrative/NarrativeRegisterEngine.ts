/**
 * V1170 NarrativeRegisterEngine — Direction F Iter 13/20 (Round 5)
 * Register engine: register of voice
 * Sources: ruflo register + nanobot + thunderbolt
 */

export type RegisterType = 'formal' | 'informal' | 'colloquial' | 'archaic' | 'technical' | 'literary';
export type RegisterShift = 'static' | 'minimal' | 'moderate' | 'dramatic' | 'radical';
export type RegisterAuthenticity = 'forced' | 'uneven' | 'natural' | 'authentic' | 'effortless';

export interface Register {
  registerId: string;
  type: RegisterType;
  shift: RegisterShift;
  authenticity: RegisterAuthenticity;
  description: string;
  clarity: number;
  fit: number;
  chapter: number;
}

export interface RegisterLayer {
  layerId: string,
  registerIds: string[],
  cumulativeClarity: number,
  variation: number,
}

export interface NarrativeRegisterEngineState {
  registers: Map<string, Register>;
  layers: Map<string, RegisterLayer>;
  totalRegisters: number;
  totalLayers: number;
  averageClarity: number;
  averageFit: number;
  layerVariation: number;
  registerMastery: number;
}

// Factory
export function createNarrativeRegisterEngineState(): NarrativeRegisterEngineState {
  return {
    registers: new Map(),
    layers: new Map(),
    totalRegisters: 0,
    totalLayers: 0,
    averageClarity: 0.5,
    averageFit: 0.5,
    layerVariation: 0.5,
    registerMastery: 0.5,
  };
}

// Add register
export function addRegister(
  state: NarrativeRegisterEngineState,
  registerId: string,
  type: RegisterType,
  shift: RegisterShift,
  authenticity: RegisterAuthenticity,
  description: string,
  clarity: number,
  fit: number,
  chapter: number
): NarrativeRegisterEngineState {
  const register: Register = { registerId, type, shift, authenticity, description, clarity, fit, chapter };
  const registers = new Map(state.registers).set(registerId, register);
  return recomputeRegister({ ...state, registers, totalRegisters: registers.size });
}

// Add layer
export function addRegisterLayer(
  state: NarrativeRegisterEngineState,
  layerId: string,
  registerIds: string[]
): NarrativeRegisterEngineState {
  const registers = registerIds.map(id => state.registers.get(id)).filter((r): r is Register => r !== undefined);
  const cumulativeClarity = registers.length === 0 ? 0
    : registers.reduce((s, r) => s + r.clarity, 0) / registers.length;
  const typeSet = new Set(registers.map(r => r.type));
  const variation = Math.min(1, typeSet.size / 6);
  const layer: RegisterLayer = { layerId, registerIds, cumulativeClarity, variation };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeRegister({ ...state, layers, totalLayers: layers.size });
}

// Get registers by type
export function getRegistersByType(state: NarrativeRegisterEngineState, type: RegisterType): Register[] {
  return Array.from(state.registers.values()).filter(r => r.type === type);
}

// Get register report
export function getRegisterReport(state: NarrativeRegisterEngineState): {
  totalRegisters: number;
  totalLayers: number;
  averageClarity: number;
  averageFit: number;
  registerMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRegisters === 0) recommendations.push('No registers — add registers');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.registerMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRegisters: state.totalRegisters,
    totalLayers: state.totalLayers,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageFit: Math.round(state.averageFit * 100) / 100,
    registerMastery: Math.round(state.registerMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRegister(state: NarrativeRegisterEngineState): NarrativeRegisterEngineState {
  const registers = Array.from(state.registers.values());
  const averageClarity = registers.length === 0 ? 0.5
    : registers.reduce((s, r) => s + r.clarity, 0) / registers.length;
  const averageFit = registers.length === 0 ? 0.5
    : registers.reduce((s, r) => s + r.fit, 0) / registers.length;

  const layers = Array.from(state.layers.values());
  const layerVariation = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.variation, 0) / layers.length;

  const registerMastery = (averageClarity * 0.4 + averageFit * 0.3 + layerVariation * 0.3);

  return { ...state, averageClarity, averageFit, layerVariation, registerMastery };
}

// Reset
export function resetNarrativeRegisterEngineState(): NarrativeRegisterEngineState {
  return createNarrativeRegisterEngineState();
}