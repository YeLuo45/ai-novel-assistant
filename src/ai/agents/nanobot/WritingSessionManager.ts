/**
 * WritingSessionManager — V327
 * Context-aware session state, conversation memory, task state persistence.
 * Inspired by: generic-agent (autonomous state), chatdev (conversation context)
 */

export interface WritingContext {
  projectId: string
  currentChapter: number
  sceneFocus: string
  activeCharacters: string[]
  narrativeThread: string
  readerMood: 'engaged' | 'neutral' | 'confused' | 'bored'
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  contextSnapshot?: WritingContext
  taskState?: TaskState
}

export interface TaskState {
  taskId: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  subtasks: { id: string; description: string; completed: boolean }[]
  progress: number  // 0-100
  blockedBy?: string[]
  result?: string
}

export interface WritingSessionState {
  context: WritingContext
  conversationHistory: ConversationMessage[]
  activeTasks: Map<string, TaskState>
  completedTaskIds: string[]
  sessionMetrics: {
    totalMessages: number
    tasksCompleted: number
    avgResponseTime: number
    contextSwitches: number
  }
  typeAlias: Record<string, unknown>
}

export function createEmptyState(projectId: string = 'default'): WritingSessionState {
  return {
    context: {
      projectId,
      currentChapter: 1,
      sceneFocus: '',
      activeCharacters: [],
      narrativeThread: '',
      readerMood: 'neutral',
    },
    conversationHistory: [],
    activeTasks: new Map(),
    completedTaskIds: [],
    sessionMetrics: {
      totalMessages: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      contextSwitches: 0,
    },
    typeAlias: {},
  }
}

// Update writing context
export function updateContext(
  state: WritingSessionState,
  updates: Partial<WritingContext>
): WritingSessionState {
  const newContext = { ...state.context, ...updates }
  return { ...state, context: newContext }
}

// Add conversation message
export function addMessage(
  state: WritingSessionState,
  role: ConversationMessage['role'],
  content: string
): WritingSessionState {
  const message: ConversationMessage = {
    role,
    content,
    timestamp: Date.now(),
    contextSnapshot: { ...state.context },
  }
  return {
    ...state,
    conversationHistory: [...state.conversationHistory, message],
    sessionMetrics: {
      ...state.sessionMetrics,
      totalMessages: state.sessionMetrics.totalMessages + 1,
    },
  }
}

// Create a new task
export function createTask(
  state: WritingSessionState,
  taskId: string,
  description: string,
  blockedBy: string[] = []
): WritingSessionState {
  const task: TaskState = {
    taskId,
    description,
    status: blockedBy.length > 0 ? 'blocked' : 'pending',
    subtasks: [],
    progress: 0,
    blockedBy,
  }
  const newTasks = new Map(state.activeTasks)
  newTasks.set(taskId, task)
  return { ...state, activeTasks: newTasks }
}

// Update task state
export function updateTask(
  state: WritingSessionState,
  taskId: string,
  updates: Partial<TaskState>
): WritingSessionState {
  const task = state.activeTasks.get(taskId)
  if (!task) return state

  const newTasks = new Map(state.activeTasks)
  newTasks.set(taskId, { ...task, ...updates })
  return { ...state, activeTasks: newTasks }
}

// Complete a task
export function completeTask(
  state: WritingSessionState,
  taskId: string,
  result?: string
): WritingSessionState {
  const task = state.activeTasks.get(taskId)
  if (!task) return state

  const newTasks = new Map(state.activeTasks)
  newTasks.delete(taskId)

  return {
    ...state,
    activeTasks: newTasks,
    completedTaskIds: [...state.completedTaskIds, taskId],
    sessionMetrics: {
      ...state.sessionMetrics,
      tasksCompleted: state.sessionMetrics.tasksCompleted + 1,
    },
  }
}

// Get tasks blocked by a given task
export function getBlockedTasks(
  state: WritingSessionState,
  completedTaskId: string
): string[] {
  const blocked: string[] = []
  for (const [id, task] of state.activeTasks) {
    if (task.blockedBy?.includes(completedTaskId)) {
      blocked.push(id)
    }
  }
  return blocked
}

// Unblock tasks that were waiting on completed task
export function unblockTasks(
  state: WritingSessionState,
  completedTaskId: string
): WritingSessionState {
  const blockedIds = getBlockedTasks(state, completedTaskId)
  let newState = state
  for (const id of blockedIds) {
    const task = newState.activeTasks.get(id)
    if (task) {
      const newBlockedBy = task.blockedBy?.filter(t => t !== completedTaskId) || []
      newState = updateTask(newState, id, {
        status: newBlockedBy.length > 0 ? 'blocked' : 'pending',
        blockedBy: newBlockedBy,
      })
    }
  }
  return newState
}

// Get conversation summary for context window
export function getConversationSummary(
  state: WritingSessionState,
  maxMessages: number = 10
): {
  recentMessages: ConversationMessage[]
  activeTasksCount: number
  currentChapter: number
  contextDescription: string
} {
  const recentMessages = state.conversationHistory.slice(-maxMessages)
  const contextDescription = `Chapter ${state.context.currentChapter}, ${state.context.sceneFocus || 'no scene focus'}, ${state.context.activeCharacters.length} characters active`

  return {
    recentMessages,
    activeTasksCount: state.activeTasks.size,
    currentChapter: state.context.currentChapter,
    contextDescription,
  }
}

// Detect context switch
export function detectContextSwitch(
  state: WritingSessionState,
  newChapter: number,
  newScene: string
): boolean {
  if (state.context.currentChapter !== newChapter) return true
  if (state.context.sceneFocus !== newScene && newScene !== '') return true
  return false
}

// Record context switch
export function recordContextSwitch(
  state: WritingSessionState,
  newContext: Partial<WritingContext>
): WritingSessionState {
  return {
    ...state,
    context: { ...state.context, ...newContext },
    sessionMetrics: {
      ...state.sessionMetrics,
      contextSwitches: state.sessionMetrics.contextSwitches + 1,
    },
  }
}

// Get task progress summary
export function getTaskProgress(
  state: WritingSessionState
): {
  pending: number
  inProgress: number
  blocked: number
  completed: number
  overallProgress: number
} {
  let pending = 0, inProgress = 0, blocked = 0
  for (const task of state.activeTasks.values()) {
    switch (task.status) {
      case 'pending': pending++; break
      case 'in_progress': inProgress++; break
      case 'blocked': blocked++; break
    }
  }

  const total = pending + inProgress + blocked + state.completedTaskIds.length
  const completedWeight = state.completedTaskIds.length
  const inProgressWeight = inProgress * 0.5
  const overallProgress = total > 0 ? Math.round((completedWeight + inProgressWeight) / total * 100) : 0

  return { pending, inProgress, blocked, completed: state.completedTaskIds.length, overallProgress }
}

// Search conversation history
export function searchHistory(
  state: WritingSessionState,
  query: string,
  limit: number = 5
): ConversationMessage[] {
  const q = query.toLowerCase()
  const matches = state.conversationHistory.filter(
    m => m.content.toLowerCase().includes(q)
  )
  return matches.slice(-limit)
}

// Get messages by role
export function getMessagesByRole(
  state: WritingSessionState,
  role: ConversationMessage['role']
): ConversationMessage[] {
  return state.conversationHistory.filter(m => m.role === role)
}

// Prune old messages to stay within limit
export function pruneMessages(
  state: WritingSessionState,
  maxMessages: number = 100
): WritingSessionState {
  if (state.conversationHistory.length <= maxMessages) return state
  return {
    ...state,
    conversationHistory: state.conversationHistory.slice(-maxMessages),
  }
}
