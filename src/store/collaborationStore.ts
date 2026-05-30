/**
 * Collaboration Store - Zustand store for real-time collaboration state
 * V36: Real-time collaboration + MessageBus architecture
 * 
 * Manages agent status, activities, and conflicts
 */

import { create } from 'zustand'
import { collaborationBus } from '../ai/messagebus'
import type { AgentInfo, AgentStatus, Activity, ConflictInfo, CollaborationEvent } from '../ai/messagebus/types'

interface AgentState {
  info: AgentInfo
  isOnline: boolean
}

interface CollaborationState {
  // Agent states
  agents: Map<string, AgentState>
  
  // Activity feed
  activities: Activity[]
  maxActivities: number
  
  // Conflicts
  conflicts: ConflictInfo[]
  
  // Status
  isInitialized: boolean
}

interface CollaborationActions {
  // Initialization
  initialize: () => void
  cleanup: () => void
  
  // Agent management
  updateAgentStatus: (agentId: string, status: AgentStatus, info?: Partial<AgentInfo>) => void
  registerAgent: (agentInfo: AgentInfo) => void
  unregisterAgent: (agentId: string) => void
  
  // Activity management
  addActivity: (activity: Activity) => void
  clearActivities: () => void
  
  // Conflict management
  addConflict: (conflict: ConflictInfo) => void
  resolveConflict: (conflictId: string, resolvedBy: string) => void
  clearConflicts: () => void
  
  // Getters
  getAgent: (agentId: string) => AgentState | undefined
  getOnlineAgents: () => AgentState[]
}

type CollaborationStore = CollaborationState & CollaborationActions

const DEFAULT_MAX_ACTIVITIES = 50

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  // Initial state
  agents: new Map(),
  activities: [],
  maxActivities: DEFAULT_MAX_ACTIVITIES,
  conflicts: [],
  isInitialized: false,
  
  // Initialize collaboration store with MessageBus subscriptions
  initialize: () => {
    const state = get()
    if (state.isInitialized) return
    
    // Subscribe to collaboration events
    collaborationBus.subscribe('AGENT_STATUS_CHANGE', (event) => {
      if (event.type === 'AGENT_STATUS_CHANGE') {
        get().updateAgentStatus(event.agentId, event.status, event.agentInfo)
      }
    })
    
    collaborationBus.subscribe('AGENT_REGISTER', (event) => {
      if (event.type === 'AGENT_REGISTER' && event.agentInfo) {
        get().registerAgent(event.agentInfo)
      }
    })
    
    collaborationBus.subscribe('AGENT_UNREGISTER', (event) => {
      if (event.type === 'AGENT_UNREGISTER') {
        get().unregisterAgent(event.agentId)
      }
    })
    
    collaborationBus.subscribe('WRITER_ACTIVITY', (event) => {
      if (event.type === 'WRITER_ACTIVITY' && event.activity) {
        get().addActivity(event.activity)
      }
    })
    
    collaborationBus.subscribe('CONFLICT_DETECTED', (event) => {
      if (event.type === 'CONFLICT_DETECTED' && event.conflict) {
        get().addConflict(event.conflict)
      }
    })
    
    collaborationBus.subscribe('CONFLICT_RESOLVED', (event) => {
      if (event.type === 'CONFLICT_RESOLVED') {
        get().resolveConflict(event.conflictId, 'system')
      }
    })
    
    collaborationBus.subscribe('HEARTBEAT', (event) => {
      if (event.type === 'HEARTBEAT') {
        // Update agent's last heartbeat
        const agent = get().agents.get(event.agentId)
        if (agent) {
          const updatedInfo = { ...agent.info, lastHeartbeat: event.timestamp }
          set(state => {
            const newAgents = new Map(state.agents)
            newAgents.set(event.agentId, { ...agent, info: updatedInfo })
            return { agents: newAgents }
          })
        }
      }
    })
    
    set({ isInitialized: true })
  },
  
  // Cleanup subscriptions
  cleanup: () => {
    collaborationBus.clear()
    set({
      agents: new Map(),
      activities: [],
      conflicts: [],
      isInitialized: false
    })
  },
  
  // Update agent status
  updateAgentStatus: (agentId, status, info) => {
    set(state => {
      const newAgents = new Map(state.agents)
      const existing = newAgents.get(agentId)
      
      if (existing) {
        newAgents.set(agentId, {
          ...existing,
          info: { ...existing.info, status, ...info },
          isOnline: status !== 'offline'
        })
      }
      
      return { agents: newAgents }
    })
  },
  
  // Register a new agent
  registerAgent: (agentInfo) => {
    set(state => {
      const newAgents = new Map(state.agents)
      newAgents.set(agentInfo.id, {
        info: agentInfo,
        isOnline: true
      })
      return { agents: newAgents }
    })
    
    // Publish registration event
    collaborationBus.publish({
      type: 'AGENT_REGISTER',
      agentInfo
    })
  },
  
  // Unregister an agent
  unregisterAgent: (agentId) => {
    set(state => {
      const newAgents = new Map(state.agents)
      newAgents.delete(agentId)
      return { agents: newAgents }
    })
    
    // Publish unregistration event
    collaborationBus.publish({
      type: 'AGENT_UNREGISTER',
      agentId
    })
  },
  
  // Add activity to feed
  addActivity: (activity) => {
    set(state => {
      const activities = [activity, ...state.activities]
      // Trim to max activities
      if (activities.length > state.maxActivities) {
        activities.length = state.maxActivities
      }
      return { activities }
    })
  },
  
  // Clear all activities
  clearActivities: () => {
    set({ activities: [] })
  },
  
  // Add conflict
  addConflict: (conflict) => {
    set(state => ({
      conflicts: [...state.conflicts, conflict]
    }))
  },
  
  // Resolve conflict
  resolveConflict: (conflictId, resolvedBy) => {
    set(state => ({
      conflicts: state.conflicts.map(c =>
        c.id === conflictId
          ? { ...c, resolvedAt: Date.now(), resolvedBy }
          : c
      )
    }))
  },
  
  // Clear all conflicts
  clearConflicts: () => {
    set({ conflicts: [] })
  },
  
  // Get single agent
  getAgent: (agentId) => {
    return get().agents.get(agentId)
  },
  
  // Get all online agents
  getOnlineAgents: () => {
    return Array.from(get().agents.values()).filter(a => a.isOnline)
  }
}))

export default useCollaborationStore