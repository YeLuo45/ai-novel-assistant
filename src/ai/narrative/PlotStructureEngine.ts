/**
 * V868 PlotStructureEngine — Direction B Iter 12/15 (Round 4)
 * Plot structure engine: plot architecture + structural analysis
 * Sources: thunderbolt plot + ruflo + nanobot
 */

export type StructureType = 'three_act' | 'hero_journey' | 'freytag' | 'save_cat' | 'seven_point' | 'kishotenketsu';
export type StructurePhase = 'exposition' | 'rising_action' | 'climax' | 'falling_action' | 'denouement';
export type StructuralHealth = 'rigid' | 'loose' | 'balanced' | 'organic' | 'masterful';

export interface StructureBeat {
  beatId: string;
  structureType: StructureType;
  phase: StructurePhase;
  name: string;
  description: string;
  chapter: number;
  required: boolean;
}

export interface StructureNode {
  nodeId: string;
  structureType: StructureType;
  beatIds: string[];
  coherence: number;
  innovation: number;
  effectiveness: number;
}

export interface PlotStructureEngineState {
  beats: Map<string, StructureBeat>;
  nodes: Map<string, StructureNode>;
  totalBeats: number;
  totalStructures: number;
  averageCoherence: number;
  averageInnovation: number;
  structuralHealth: StructuralHealth;
  structureMastery: number;
  plotComplexity: number;
}

// Factory
export function createPlotStructureEngineState(): PlotStructureEngineState {
  return {
    beats: new Map(),
    nodes: new Map(),
    totalBeats: 0,
    totalStructures: 0,
    averageCoherence: 0.5,
    averageInnovation: 0.5,
    structuralHealth: 'balanced',
    structureMastery: 0.5,
    plotComplexity: 0.5,
  };
}

// Add beat
export function addStructureBeat(
  state: PlotStructureEngineState,
  beatId: string,
  structureType: StructureType,
  phase: StructurePhase,
  name: string,
  description: string,
  chapter: number,
  required: boolean = true
): PlotStructureEngineState {
  const beat: StructureBeat = { beatId, structureType, phase, name, description, chapter, required };
  const beats = new Map(state.beats).set(beatId, beat);
  return recomputePlotStruct({ ...state, beats, totalBeats: beats.size });
}

// Create structure node
export function createStructureNode(
  state: PlotStructureEngineState,
  nodeId: string,
  structureType: StructureType,
  beatIds: string[],
  coherence: number = 0.5,
  innovation: number = 0.5
): PlotStructureEngineState {
  const node: StructureNode = { nodeId, structureType, beatIds, coherence, innovation, effectiveness: 0 };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputePlotStruct({ ...state, nodes, totalStructures: nodes.size });
}

// Update effectiveness
export function updateStructureEffectiveness(state: PlotStructureEngineState, nodeId: string, effectiveness: number): PlotStructureEngineState {
  const node = state.nodes.get(nodeId);
  if (!node) return state;

  const updated: StructureNode = { ...node, effectiveness };
  const nodes = new Map(state.nodes).set(nodeId, updated);
  return recomputePlotStruct({ ...state, nodes });
}

// Get beats by type
export function getBeatsByType(state: PlotStructureEngineState, type: StructureType): StructureBeat[] {
  return Array.from(state.beats.values()).filter(b => b.structureType === type);
}

// Get plot structure report
export function getPlotStructureReport(state: PlotStructureEngineState): {
  totalBeats: number;
  totalStructures: number;
  averageCoherence: number;
  averageInnovation: number;
  structuralHealth: StructuralHealth;
  structureMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBeats === 0) recommendations.push('No beats — add structure beats');
  if (state.averageCoherence < 0.5) recommendations.push('Low coherence — strengthen structure');
  if (state.structureMastery < 0.5) recommendations.push('Low mastery — refine structure');

  return {
    totalBeats: state.totalBeats,
    totalStructures: state.totalStructures,
    averageCoherence: Math.round(state.averageCoherence * 100) / 100,
    averageInnovation: Math.round(state.averageInnovation * 100) / 100,
    structuralHealth: state.structuralHealth,
    structureMastery: Math.round(state.structureMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePlotStruct(state: PlotStructureEngineState): PlotStructureEngineState {
  const nodes = Array.from(state.nodes.values());
  const averageCoherence = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.coherence, 0) / nodes.length;
  const averageInnovation = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.innovation, 0) / nodes.length;

  const totalEffectiveness = nodes.reduce((s, n) => s + n.effectiveness, 0);
  const structureMastery = nodes.length === 0 ? 0.5
    : totalEffectiveness / nodes.length;

  const typeSet = new Set(nodes.map(n => n.structureType));
  const plotComplexity = Math.min(1, typeSet.size / 5);

  const avgCoherence = averageCoherence;
  const structuralHealth: StructuralHealth = avgCoherence < 0.4 ? 'loose'
    : avgCoherence < 0.6 ? 'balanced'
    : avgCoherence < 0.8 ? 'organic'
    : 'masterful';

  return { ...state, averageCoherence, averageInnovation, structuralHealth, structureMastery, plotComplexity };
}

// Reset plot structure state
export function resetPlotStructureEngineState(): PlotStructureEngineState {
  return createPlotStructureEngineState();
}