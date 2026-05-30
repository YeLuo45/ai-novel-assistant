/**
 * HeartbeatPlugin - Agent Heartbeat Detection for MessageBus
 * V36: Real-time collaboration heartbeat monitoring
 * 
 * Monitors agent health with configurable intervals.
 * Agents that don't send heartbeats for 30 seconds are marked offline.
 */

import { collaborationBus, MessageBus } from '../MessageBus'
import type { CollaborationEvent, AgentInfo } from '../types'

interface HeartbeatState {
  agentId: string
  lastHeartbeat: number
  intervalId: ReturnType<typeof setInterval> | null
}

const DEFAULT_HEARTBEAT_INTERVAL = 5000 // 5 seconds
const DEFAULT_OFFLINE_THRESHOLD = 30000 // 30 seconds

/**
 * HeartbeatPlugin monitors agent liveliness through regular heartbeat events.
 */
export class HeartbeatPlugin {
  private bus: MessageBus
  private agentStates: Map<string, HeartbeatState> = new Map()
  private heartbeatInterval: number
  private offlineThreshold: number
  private isRunning: boolean = false
  private monitorIntervalId: ReturnType<typeof setInterval> | null = null
  
  constructor(
    bus: MessageBus = collaborationBus,
    heartbeatInterval: number = DEFAULT_HEARTBEAT_INTERVAL,
    offlineThreshold: number = DEFAULT_OFFLINE_THRESHOLD
  ) {
    this.bus = bus
    this.heartbeatInterval = heartbeatInterval
    this.offlineThreshold = offlineThreshold
  }
  
  /**
   * Start the heartbeat plugin
   */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    
    // Subscribe to heartbeat events
    this.bus.subscribe('HEARTBEAT', (event) => this.handleHeartbeat(event))
    this.bus.subscribe('AGENT_REGISTER', (event) => this.handleAgentRegister(event))
    this.bus.subscribe('AGENT_UNREGISTER', (event) => this.handleAgentUnregister(event))
    
    // Start monitoring loop
    this.monitorIntervalId = setInterval(() => {
      this.checkOfflineAgents()
    }, this.heartbeatInterval)
  }
  
  /**
   * Stop the heartbeat plugin
   */
  stop(): void {
    if (!this.isRunning) return
    this.isRunning = false
    
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId)
      this.monitorIntervalId = null
    }
    
    // Clear all agent states
    this.agentStates.forEach((state) => {
      if (state.intervalId) {
        clearInterval(state.intervalId)
      }
    })
    this.agentStates.clear()
  }
  
  /**
   * Register an agent and start heartbeat monitoring
   */
  registerAgent(agentInfo: AgentInfo): void {
    const existing = this.agentStates.get(agentInfo.id)
    if (existing?.intervalId) {
      clearInterval(existing.intervalId)
    }
    
    const state: HeartbeatState = {
      agentId: agentInfo.id,
      lastHeartbeat: Date.now(),
      intervalId: null
    }
    
    // Set up self-heartbeat for this agent
    state.intervalId = setInterval(() => {
      this.sendHeartbeat(agentInfo.id)
    }, this.heartbeatInterval)
    
    this.agentStates.set(agentInfo.id, state)
  }
  
  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    const state = this.agentStates.get(agentId)
    if (state) {
      if (state.intervalId) {
        clearInterval(state.intervalId)
      }
      this.agentStates.delete(agentId)
    }
  }
  
  /**
   * Send a heartbeat for an agent
   */
  sendHeartbeat(agentId: string): void {
    const event: CollaborationEvent = {
      type: 'HEARTBEAT',
      agentId,
      timestamp: Date.now()
    }
    this.bus.publish(event)
  }
  
  /**
   * Handle incoming heartbeat event
   */
  private handleHeartbeat(event: CollaborationEvent): void {
    if (event.type !== 'HEARTBEAT') return
    
    const { agentId, timestamp } = event
    const state = this.agentStates.get(agentId)
    
    if (state) {
      state.lastHeartbeat = timestamp
    }
  }
  
  /**
   * Handle agent registration
   */
  private handleAgentRegister(event: CollaborationEvent): void {
    if (event.type !== 'AGENT_REGISTER') return
    
    const { agentInfo } = event
    if (agentInfo && agentInfo.id) {
      this.registerAgent(agentInfo)
    }
  }
  
  /**
   * Handle agent unregistration
   */
  private handleAgentUnregister(event: CollaborationEvent): void {
    if (event.type !== 'AGENT_UNREGISTER') return
    
    const { agentId } = event
    if (agentId) {
      this.unregisterAgent(agentId)
    }
  }
  
  /**
   * Check for offline agents (no heartbeat for threshold period)
   */
  private checkOfflineAgents(): void {
    const now = Date.now()
    
    this.agentStates.forEach((state, agentId) => {
      const timeSinceHeartbeat = now - state.lastHeartbeat
      
      if (timeSinceHeartbeat > this.offlineThreshold) {
        // Agent is offline - publish status change
        const offlineEvent: CollaborationEvent = {
          type: 'AGENT_STATUS_CHANGE',
          agentId,
          status: 'offline'
        }
        this.bus.publish(offlineEvent)
      }
    })
  }
  
  /**
   * Get all tracked agent states
   */
  getAgentStates(): Map<string, { lastHeartbeat: number; isOnline: boolean }> {
    const now = Date.now()
    const result = new Map<string, { lastHeartbeat: number; isOnline: boolean }>()
    
    this.agentStates.forEach((state, agentId) => {
      result.set(agentId, {
        lastHeartbeat: state.lastHeartbeat,
        isOnline: now - state.lastHeartbeat <= this.offlineThreshold
      })
    })
    
    return result
  }
}

// Singleton instance
export const heartbeatPlugin = new HeartbeatPlugin()

export default HeartbeatPlugin