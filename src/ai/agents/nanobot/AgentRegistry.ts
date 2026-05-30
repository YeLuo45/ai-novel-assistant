/**
 * AgentRegistry.ts - Agent注册表
 * V41 多Agent协作系统核心组件
 */

import { WritingAgent, AgentRole } from './WritingAgent'

export class AgentRegistry {
  private agents: Map<string, WritingAgent> = new Map()
  private roleIndex: Map<AgentRole, Set<string>> = new Map()

  constructor() {
    const roles: AgentRole[] = ['plot', 'character', 'dialogue', 'style', 'critic']
    for (const role of roles) {
      this.roleIndex.set(role, new Set())
    }
  }

  register(agent: WritingAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`[AgentRegistry] Agent ${agent.id} already registered, replacing`)
    }
    this.agents.set(agent.id, agent)
    this.roleIndex.get(agent.role)?.add(agent.id)
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      this.agents.delete(agentId)
      this.roleIndex.get(agent.role)?.delete(agentId)
    }
  }

  get(agentId: string): WritingAgent | undefined {
    return this.agents.get(agentId)
  }

  getByRole(role: AgentRole): WritingAgent[] {
    const agentIds = this.roleIndex.get(role)
    if (!agentIds) return []
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is WritingAgent => agent !== undefined)
  }

  getAll(): WritingAgent[] {
    return Array.from(this.agents.values())
  }

  getAllIds(): string[] {
    return Array.from(this.agents.keys())
  }

  size(): number {
    return this.agents.size
  }

  has(agentId: string): boolean {
    return this.agents.has(agentId)
  }

  clear(): void {
    this.agents.clear()
    for (const roleSet of this.roleIndex.values()) {
      roleSet.clear()
    }
  }

  getSummary(): { total: number; byRole: Record<AgentRole, number> } {
    const byRole: Record<AgentRole, number> = {
      plot: this.roleIndex.get('plot')?.size ?? 0,
      character: this.roleIndex.get('character')?.size ?? 0,
      dialogue: this.roleIndex.get('dialogue')?.size ?? 0,
      style: this.roleIndex.get('style')?.size ?? 0,
      critic: this.roleIndex.get('critic')?.size ?? 0
    }
    return { total: this.agents.size, byRole }
  }
}

export const agentRegistry = new AgentRegistry()
