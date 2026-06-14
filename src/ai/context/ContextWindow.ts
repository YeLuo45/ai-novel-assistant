// V2279 ContextWindow - Direction J Iter 14/30
// Sliding context window
// Source: nanobot
export interface WindowedContext {
  id: number;
  key: string;
  tokens: number;
  ts: number;
}

export interface ContextWindowState {
  window: WindowedContext[];
  maxTokens: number;
  totalTokens: number;
  counter: number;
}

export function createContextWindowState(maxTokens = 4096): ContextWindowState {
  return { window: [], maxTokens, totalTokens: 0, counter: 0 };
}

export function pushContext(state: ContextWindowState, key: string, tokens: number): ContextWindowState {
  state.counter++;
  const entry: WindowedContext = { id: state.counter, key, tokens, ts: Date.now() };
  let window = [...state.window, entry];
  let totalTokens = state.totalTokens + tokens;
  while (totalTokens > state.maxTokens && window.length > 0) {
    totalTokens -= window[0].tokens;
    window = window.slice(1);
  }
  return { ...state, window, totalTokens };
}

export function getContextWindow(state: ContextWindowState): WindowedContext[] {
  return [...state.window];
}

export function getWindowTokens(state: ContextWindowState): number {
  return state.totalTokens;
}

export function isContextWindowFull(state: ContextWindowState): boolean {
  return state.totalTokens >= state.maxTokens;
}

export function clearContextWindow(state: ContextWindowState): ContextWindowState {
  return { ...state, window: [], totalTokens: 0 };
}

export function contextWindowHealth(state: ContextWindowState): { items: number; tokens: number; health: number } {
  return { items: state.window.length, tokens: state.totalTokens, health: state.window.length > 0 ? 1 : 0.5 };
}
