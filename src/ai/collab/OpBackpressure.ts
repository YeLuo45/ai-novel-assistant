// V2218 OpBackpressure - Direction H Iter 13/30
// Flow control + backpressure
// Source: nanobot
export interface BackpressureState {
  inFlight: number;
  capacity: number;
  highWaterMark: number;
  lowWaterMark: number;
  paused: boolean;
  totalQueued: number;
  totalProcessed: number;
  totalThrottled: number;
}

export function createBackpressureState(capacity = 100): BackpressureState {
  return { inFlight: 0, capacity, highWaterMark: Math.floor(capacity * 0.8), lowWaterMark: Math.floor(capacity * 0.2), paused: false, totalQueued: 0, totalProcessed: 0, totalThrottled: 0 };
}

export function canEnqueue(state: BackpressureState): boolean {
  return state.inFlight < state.capacity && !state.paused;
}

export function enqueueOp(state: BackpressureState): BackpressureState {
  if (!canEnqueue(state)) return { ...state, totalThrottled: state.totalThrottled + 1 };
  const inFlight = state.inFlight + 1;
  const paused = inFlight >= state.highWaterMark;
  return { ...state, inFlight, paused, totalQueued: state.totalQueued + 1 };
}

export function completeOp(state: BackpressureState): BackpressureState {
  if (state.inFlight === 0) return state;
  const inFlight = state.inFlight - 1;
  const paused = inFlight >= state.highWaterMark || (state.paused && inFlight > state.lowWaterMark);
  const resumed = state.paused && inFlight <= state.lowWaterMark;
  return { inFlight, capacity: state.capacity, highWaterMark: state.highWaterMark, lowWaterMark: state.lowWaterMark, paused: resumed ? false : paused, totalQueued: state.totalQueued, totalProcessed: state.totalProcessed + 1, totalThrottled: state.totalThrottled };
}

export function forceResume(state: BackpressureState): BackpressureState {
  return { ...state, paused: false };
}

export function backpressureHealth(state: BackpressureState): { inFlight: number; paused: boolean; processed: number; health: number } {
  return { inFlight: state.inFlight, paused: state.paused, processed: state.totalProcessed, health: state.totalProcessed > 0 ? 1 : 0.5 };
}
