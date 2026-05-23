/**
 * useCollaboration Hook - React hook for collaboration state
 * V36: Real-time collaboration hook
 * 
 * Provides easy access to collaboration state from components
 */

import { useEffect } from 'react'
import { useCollaborationStore } from '../store/collaborationStore'
import type { AgentStatus, Activity, ConflictInfo } from '../ai/messagebus/types'

/**
 * Hook to access agent states
 */
export function useAgents(): Array<{ id: string; name: string; role: string; status: AgentStatus; isOnline: boolean; currentTask?: string }> {
  const agents = useCollaborationStore(state => state.agents)
  
  return Array.from(agents.values()).map(a => ({
    id: a.info.id,
    name: a.info.name,
    role: a.info.role,
    status: a.info.status,
    isOnline: a.isOnline,
    currentTask: a.info.currentTask
  }))
}

/**
 * Hook to access activities with optional limit
 */
export function useActivities(limit?: number): Activity[] {
  const activities = useCollaborationStore(state => state.activities)
  
  if (limit !== undefined && limit > 0) {
    return activities.slice(0, limit)
  }
  
  return activities
}

/**
 * Hook to access unresolved conflicts
 */
export function useConflicts(): ConflictInfo[] {
  const conflicts = useCollaborationStore(state => state.conflicts)
  
  return conflicts.filter(c => !c.resolvedAt)
}

/**
 * Hook to initialize collaboration store
 * Call this in a component that needs collaboration features
 */
export function useCollaborationInit(): void {
  const initialize = useCollaborationStore(state => state.initialize)
  
  useEffect(() => {
    initialize()
  }, [initialize])
}

/**
 * Hook to get online agent count
 */
export function useOnlineAgentCount(): number {
  const agents = useCollaborationStore(state => state.agents)
  
  return Array.from(agents.values()).filter(a => a.isOnline).length
}

/**
 * Hook to check if a specific agent is online
 */
export function useIsAgentOnline(agentId: string): boolean {
  const agent = useCollaborationStore(state => state.agents.get(agentId))
  
  return agent?.isOnline ?? false
}

/**
 * Combined hook for full collaboration state
 */
export function useCollaboration(): {
  agents: ReturnType<typeof useAgents>
  activities: Activity[]
  conflicts: ConflictInfo[]
  initialize: () => void
} {
  const store = useCollaborationStore()
  
  return {
    agents: useAgents(),
    activities: store.activities,
    conflicts: useConflicts(),
    initialize: store.initialize
  }
}

export default useCollaboration