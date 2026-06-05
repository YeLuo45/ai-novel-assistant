/**
 * V724 NarrativeContextEngine — Direction E Iter 3/9 (Round 2)
 * Narrative context engine: contextual understanding + frame tracking
 * Sources: chatdev context + nanobot frame + thunderbolt
 */

export type ContextFrame = 'narrative' | 'descriptive' | 'dialogue' | 'action' | 'introspection' | 'historical';
export type ContextType = 'global' | 'local' | 'immediate' | 'historical';
export type ContextRelevance = 'primary' | 'secondary' | 'tangential' | 'irrelevant';

export interface ContextElement {
  elementId: string;
  frame: ContextFrame;
  type: ContextType;
  content: string;
  relevance: ContextRelevance;
  weight: number;
  timestamp: number;
  decayRate: number;
}

export interface ContextFrameState {
  frameId: string;
  type: ContextFrame;
  elements: string[];
  attention: number;
  cohesion: number;
}

export interface NarrativeContextEngineState {
  elements: Map<string, ContextElement>;
  frames: Map<string, ContextFrameState>;
  totalElements: number;
  totalFrames: number;
  averageWeight: number;
  averageAttention: number;
  contextCoherence: number;
  dominantFrame: ContextFrame | null;
}

// Factory
export function createNarrativeContextEngineState(): NarrativeContextEngineState {
  return {
    elements: new Map(),
    frames: new Map(),
    totalElements: 0,
    totalFrames: 0,
    averageWeight: 0.5,
    averageAttention: 0.5,
    contextCoherence: 0.5,
    dominantFrame: null,
  };
}

// Add context element
export function addContextElement(
  state: NarrativeContextEngineState,
  elementId: string,
  frame: ContextFrame,
  type: ContextType,
  content: string,
  relevance: ContextRelevance = 'secondary',
  weight: number = 0.5,
  decayRate: number = 0.1
): NarrativeContextEngineState {
  const element: ContextElement = { elementId, frame, type, content, relevance, weight, timestamp: Date.now(), decayRate };
  const elements = new Map(state.elements).set(elementId, element);

  // Add to frame
  const frameState = state.frames.get(frame);
  let frames = state.frames;
  if (frameState) {
    const updated: ContextFrameState = { ...frameState, elements: [...frameState.elements, elementId] };
    frames = new Map(state.frames).set(frame, updated);
  } else {
    const newFrame: ContextFrameState = { frameId: frame, type: frame, elements: [elementId], attention: 0.5, cohesion: 0.5 };
    frames = new Map(state.frames).set(frame, newFrame);
  }

  return recomputeContext({ ...state, elements, frames, totalElements: elements.size, totalFrames: frames.size });
}

// Update frame attention
export function updateFrameAttention(state: NarrativeContextEngineState, frame: ContextFrame, attention: number): NarrativeContextEngineState {
  const frameState = state.frames.get(frame);
  if (!frameState) return state;

  const updated: ContextFrameState = { ...frameState, attention: Math.min(1, Math.max(0, attention)) };
  const frames = new Map(state.frames).set(frame, updated);
  return recomputeContext({ ...state, frames });
}

// Decay context
export function decayContext(state: NarrativeContextEngineState, timeDelta: number): NarrativeContextEngineState {
  const elements = new Map(state.elements);
  elements.forEach((element, id) => {
    const newWeight = Math.max(0, element.weight - element.decayRate * timeDelta);
    elements.set(id, { ...element, weight: newWeight });
  });
  return recomputeContext({ ...state, elements });
}

// Get elements by frame
export function getElementsByFrame(state: NarrativeContextEngineState, frame: ContextFrame): ContextElement[] {
  return Array.from(state.elements.values()).filter(e => e.frame === frame);
}

// Get elements by relevance
export function getElementsByRelevance(state: NarrativeContextEngineState, relevance: ContextRelevance): ContextElement[] {
  return Array.from(state.elements.values()).filter(e => e.relevance === relevance);
}

// Get frame state
export function getFrameState(state: NarrativeContextEngineState, frame: ContextFrame): ContextFrameState | null {
  return state.frames.get(frame) || null;
}

// Get context report
export function getContextReport(state: NarrativeContextEngineState): {
  totalElements: number;
  totalFrames: number;
  averageWeight: number;
  averageAttention: number;
  contextCoherence: number;
  dominantFrame: ContextFrame | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements < 3) recommendations.push('Few context elements — add more');
  if (state.contextCoherence < 0.4) recommendations.push('Low coherence — strengthen frame connections');
  if (state.averageWeight < 0.3) recommendations.push('Low weights — context may be stale');

  return {
    totalElements: state.totalElements,
    totalFrames: state.totalFrames,
    averageWeight: Math.round(state.averageWeight * 100) / 100,
    averageAttention: Math.round(state.averageAttention * 100) / 100,
    contextCoherence: Math.round(state.contextCoherence * 100) / 100,
    dominantFrame: state.dominantFrame,
    recommendations,
  };
}

// Recompute metrics
function recomputeContext(state: NarrativeContextEngineState): NarrativeContextEngineState {
  const elements = Array.from(state.elements.values());
  const averageWeight = elements.length > 0
    ? elements.reduce((s, e) => s + e.weight, 0) / elements.length
    : 0.5;

  const frames = Array.from(state.frames.values());
  const averageAttention = frames.length > 0
    ? frames.reduce((s, f) => s + f.attention, 0) / frames.length
    : 0.5;

  let contextCoherence = 0.5;
  if (frames.length > 0 && elements.length > 0) {
    contextCoherence = Math.min(1, elements.length / (frames.length * 3));
  }

  let dominantFrame: ContextFrame | null = null;
  let maxAttention = -1;
  frames.forEach((f) => {
    if (f.attention > maxAttention) {
      maxAttention = f.attention;
      dominantFrame = f.type;
    }
  });

  return { ...state, averageWeight, averageAttention, contextCoherence, dominantFrame };
}

// Reset context state
export function resetNarrativeContextEngineState(): NarrativeContextEngineState {
  return createNarrativeContextEngineState();
}