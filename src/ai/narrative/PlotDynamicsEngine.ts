/**
 * V882 PlotDynamicsEngine — Direction C Iter 4/15 (Round 4)
 * Plot dynamics engine: dynamic plot + force interactions
 * Sources: thunderbolt dynamics + ruflo + nanobot
 */

export type PlotForce = 'desire' | 'fear' | 'duty' | 'love' | 'ambition' | 'destiny';
export type ForceVector = 'positive' | 'negative' | 'neutral' | 'oscillating';
export type PlotVelocity = 'static' | 'slow' | 'moderate' | 'fast' | 'accelerating';

export interface PlotForceData {
  forceId: string;
  characterId: string;
  type: PlotForce;
  vector: ForceVector;
  magnitude: number;
  target: string;
  chapter: number;
}

export interface PlotEvent {
  eventId: string;
  name: string;
  forceIds: string[];
  result: 'advancement' | 'reversal' | 'stasis' | 'transformation';
  velocity: PlotVelocity;
  magnitude: number;
  chapter: number;
}

export interface PlotDynamicsEngineState {
  forces: Map<string, PlotForceData>;
  events: Map<string, PlotEvent>;
  totalForces: number;
  totalEvents: number;
  averageMagnitude: number;
  totalNetForce: number;
  plotVelocity: PlotVelocity;
  dynamicsBalance: number;
  plotMomentum: number;
}

// Factory
export function createPlotDynamicsEngineState(): PlotDynamicsEngineState {
  return {
    forces: new Map(),
    events: new Map(),
    totalForces: 0,
    totalEvents: 0,
    averageMagnitude: 0.5,
    totalNetForce: 0,
    plotVelocity: 'moderate',
    dynamicsBalance: 0.5,
    plotMomentum: 0.5,
  };
}

// Add force
export function addPlotForce(
  state: PlotDynamicsEngineState,
  forceId: string,
  characterId: string,
  type: PlotForce,
  vector: ForceVector,
  target: string,
  chapter: number,
  magnitude: number = 0.5
): PlotDynamicsEngineState {
  const force: PlotForceData = { forceId, characterId, type, vector, magnitude, target, chapter };
  const forces = new Map(state.forces).set(forceId, force);
  return recomputePlotDyn({ ...state, forces, totalForces: forces.size });
}

// Add event
export function addPlotEvent(
  state: PlotDynamicsEngineState,
  eventId: string,
  name: string,
  forceIds: string[],
  result: PlotEvent['result'],
  velocity: PlotVelocity,
  chapter: number,
  magnitude: number = 0.5
): PlotDynamicsEngineState {
  const event: PlotEvent = { eventId, name, forceIds, result, velocity, magnitude, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputePlotDyn({ ...state, events, totalEvents: events.size });
}

// Get forces by type
export function getForcesByType(state: PlotDynamicsEngineState, type: PlotForce): PlotForce[] {
  return Array.from(state.forces.values()).filter(f => f.type === type);
}

// Get plot dynamics report
export function getPlotDynamicsReport(state: PlotDynamicsEngineState): {
  totalForces: number;
  totalEvents: number;
  averageMagnitude: number;
  totalNetForce: number;
  plotVelocity: PlotVelocity;
  plotMomentum: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalForces === 0) recommendations.push('No forces — add forces');
  if (state.averageMagnitude < 0.4) recommendations.push('Low magnitude — strengthen');
  if (state.plotMomentum < 0.4) recommendations.push('Low momentum — accelerate');

  return {
    totalForces: state.totalForces,
    totalEvents: state.totalEvents,
    averageMagnitude: Math.round(state.averageMagnitude * 100) / 100,
    totalNetForce: Math.round(state.totalNetForce * 100) / 100,
    plotVelocity: state.plotVelocity,
    plotMomentum: Math.round(state.plotMomentum * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePlotDyn(state: PlotDynamicsEngineState): PlotDynamicsEngineState {
  const forces = Array.from(state.forces.values());
  const averageMagnitude = forces.length === 0 ? 0.5
    : forces.reduce((s, f) => s + f.magnitude, 0) / forces.length;

  // Net force: positive forces minus negative forces
  const totalNetForce = forces.reduce((s, f) => {
    const multiplier = f.vector === 'positive' ? 1 : f.vector === 'negative' ? -1 : 0;
    return s + f.magnitude * multiplier;
  }, 0);

  const events = Array.from(state.events.values());
  const velocityMap: Record<PlotVelocity, number> = { static: 0.1, slow: 0.3, moderate: 0.5, fast: 0.7, accelerating: 0.9 };
  const avgVelocity = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + velocityMap[e.velocity], 0) / events.length;

  const plotVelocity: PlotVelocity = avgVelocity < 0.2 ? 'static'
    : avgVelocity < 0.4 ? 'slow'
    : avgVelocity < 0.6 ? 'moderate'
    : avgVelocity < 0.8 ? 'fast'
    : 'accelerating';

  const dynamicsBalance = forces.length === 0 ? 0.5
    : Math.max(0, 1 - Math.abs(totalNetForce) / Math.max(1, forces.length));

  const plotMomentum = (averageMagnitude * 0.5 + avgVelocity * 0.5);

  return { ...state, averageMagnitude, totalNetForce, plotVelocity, dynamicsBalance, plotMomentum };
}

// Reset plot dynamics state
export function resetPlotDynamicsEngineState(): PlotDynamicsEngineState {
  return createPlotDynamicsEngineState();
}