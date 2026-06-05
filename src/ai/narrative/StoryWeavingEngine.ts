/**
 * V758 StoryWeavingEngine — Direction B Iter 2/9 (Round 3)
 * Story weaving engine: threads + subplots + interweaving
 * Sources: ruflo hierarchical + thunderbolt pipeline + nanobot
 */

export type ThreadType = 'main_plot' | 'subplot' | 'character_arc' | 'theme_thread' | 'mystery_thread' | 'romance_thread';
export type ThreadStatus = 'introduced' | 'developing' | 'climaxing' | 'resolving' | 'resolved' | 'abandoned';
export type WeavePattern = 'linear' | 'parallel' | 'braided' | 'flashback' | 'convergent' | 'cyclical';

export interface StoryThread {
  threadId: string;
  name: string;
  type: ThreadType;
  status: ThreadStatus;
  currentPosition: number;
  targetPosition: number;
  progress: number;
  priority: number;
  startChapter: number;
  endChapter: number;
}

export interface ThreadConnection {
  connectionId: string;
  fromThreadId: string;
  toThreadId: string;
  type: 'cause' | 'echo' | 'contrast' | 'support' | 'conflict';
  strength: number;
  position: number;
}

export interface StoryWeavingEngineState {
  threads: Map<string, StoryThread>;
  connections: Map<string, ThreadConnection>;
  totalThreads: number;
  activeThreads: number;
  totalConnections: number;
  weavingComplexity: number;
  averageProgress: number;
  dominantThread: ThreadType | null;
  weavePattern: WeavePattern;
}

// Factory
export function createStoryWeavingEngineState(): StoryWeavingEngineState {
  return {
    threads: new Map(),
    connections: new Map(),
    totalThreads: 0,
    activeThreads: 0,
    totalConnections: 0,
    weavingComplexity: 0.5,
    averageProgress: 0,
    dominantThread: null,
    weavePattern: 'linear',
  };
}

// Add thread
export function addStoryThread(
  state: StoryWeavingEngineState,
  threadId: string,
  name: string,
  type: ThreadType,
  startChapter: number = 1,
  endChapter: number = 10,
  priority: number = 1
): StoryWeavingEngineState {
  const thread: StoryThread = {
    threadId,
    name,
    type,
    status: 'introduced',
    currentPosition: startChapter,
    targetPosition: endChapter,
    progress: 0,
    priority,
    startChapter,
    endChapter,
  };
  const threads = new Map(state.threads).set(threadId, thread);
  return recomputeWeaving({ ...state, threads, totalThreads: threads.size, activeThreads: state.activeThreads + 1 });
}

// Connect threads
export function connectThreads(
  state: StoryWeavingEngineState,
  connectionId: string,
  fromThreadId: string,
  toThreadId: string,
  type: ThreadConnection['type'],
  strength: number = 0.5,
  position: number = 0
): StoryWeavingEngineState {
  const connection: ThreadConnection = { connectionId, fromThreadId, toThreadId, type, strength: Math.min(1, Math.max(0, strength)), position };
  const connections = new Map(state.connections).set(connectionId, connection);
  return recomputeWeaving({ ...state, connections, totalConnections: connections.size });
}

// Advance thread
export function advanceThread(state: StoryWeavingEngineState, threadId: string, position: number): StoryWeavingEngineState {
  const thread = state.threads.get(threadId);
  if (!thread) return state;

  const currentPosition = Math.max(thread.startChapter, Math.min(thread.endChapter, position));
  const progress = (currentPosition - thread.startChapter) / Math.max(1, thread.endChapter - thread.startChapter);
  const status: ThreadStatus = progress === 0 ? 'introduced'
    : progress < 0.5 ? 'developing'
    : progress < 1 ? 'climaxing'
    : 'resolved';

  const updated: StoryThread = { ...thread, currentPosition, progress, status };
  const threads = new Map(state.threads).set(threadId, updated);
  return recomputeWeaving({ ...state, threads });
}

// Set weave pattern
export function setWeavePattern(state: StoryWeavingEngineState, pattern: WeavePattern): StoryWeavingEngineState {
  return { ...state, weavePattern: pattern };
}

// Get threads by type
export function getThreadsByType(state: StoryWeavingEngineState, type: ThreadType): StoryThread[] {
  return Array.from(state.threads.values()).filter(t => t.type === type);
}

// Get connections from thread
export function getConnectionsFromThread(state: StoryWeavingEngineState, threadId: string): ThreadConnection[] {
  return Array.from(state.connections.values()).filter(c => c.fromThreadId === threadId);
}

// Get weaving report
export function getWeavingReport(state: StoryWeavingEngineState): {
  totalThreads: number;
  activeThreads: number;
  totalConnections: number;
  weavingComplexity: number;
  averageProgress: number;
  dominantThread: ThreadType | null;
  weavePattern: WeavePattern;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalThreads === 0) recommendations.push('No threads — add threads');
  if (state.weavingComplexity < 0.3) recommendations.push('Low complexity — add connections');
  if (state.totalConnections === 0) recommendations.push('No connections — connect threads');

  return {
    totalThreads: state.totalThreads,
    activeThreads: state.activeThreads,
    totalConnections: state.totalConnections,
    weavingComplexity: Math.round(state.weavingComplexity * 100) / 100,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    dominantThread: state.dominantThread,
    weavePattern: state.weavePattern,
    recommendations,
  };
}

// Recompute metrics
function recomputeWeaving(state: StoryWeavingEngineState): StoryWeavingEngineState {
  const threads = Array.from(state.threads.values());
  const averageProgress = threads.length > 0
    ? threads.reduce((s, t) => s + t.progress, 0) / threads.length
    : 0;
  const weavingComplexity = state.totalConnections === 0 ? 0.5
    : Math.min(1, state.totalConnections / Math.max(1, state.totalThreads));

  let dominantThread: ThreadType | null = null;
  let maxCount = -1;
  const typeCounts = new Map<ThreadType, number>();
  threads.forEach(t => typeCounts.set(t.type, (typeCounts.get(t.type) || 0) + 1));
  typeCounts.forEach((count, t) => { if (count > maxCount) { maxCount = count; dominantThread = t; } });

  return { ...state, averageProgress, weavingComplexity, dominantThread };
}

// Reset weaving state
export function resetStoryWeavingEngineState(): StoryWeavingEngineState {
  return createStoryWeavingEngineState();
}