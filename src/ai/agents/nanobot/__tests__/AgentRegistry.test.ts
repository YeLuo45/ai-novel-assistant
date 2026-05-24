/**
 * AgentRegistry.test.ts - Agent注册表测试
 * V41 多Agent协作系统测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AgentRegistry } from '../AgentRegistry'
import { WritingAgent, Message } from '../WritingAgent'

// Test implementation
class TestAgent extends WritingAgent {
  readonly role: 'plot' = 'plot'
  async process(message: Message): Promise<{ success: boolean; output?: unknown; error?: string }> {
    return { success: true }
  }
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
  })

  describe('register/unregister', () => {
    it('should register agent', () => {
      const agent = new TestAgent({ id: 'agent_1', name: 'Agent1', role: 'plot' })
      
      registry.register(agent)
      
      expect(registry.has('agent_1')).toBe(true)
      expect(registry.size()).toBe(1)
    })

    it('should unregister agent', () => {
      const agent = new TestAgent({ id: 'agent_1', name: 'Agent1', role: 'plot' })
      
      registry.register(agent)
      registry.unregister('agent_1')
      
      expect(registry.has('agent_1')).toBe(false)
      expect(registry.size()).toBe(0)
    })

    it('should warn when replacing agent', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const agent1 = new TestAgent({ id: 'agent_1', name: 'Agent1', role: 'plot' })
      const agent2 = new TestAgent({ id: 'agent_1', name: 'Agent2', role: 'plot' })
      
      registry.register(agent1)
      registry.register(agent2)
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('get', () => {
    it('should get agent by id', () => {
      const agent = new TestAgent({ id: 'get_agent', name: 'GetAgent', role: 'plot' })
      
      registry.register(agent)
      
      const retrieved = registry.get('get_agent')
      expect(retrieved).toBe(agent)
    })

    it('should return undefined for non-existent agent', () => {
      const retrieved = registry.get('nonexistent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getByRole', () => {
    it('should get agents by role', () => {
      const plotAgent = new TestAgent({ id: 'plot_1', name: 'PlotAgent', role: 'plot' })
      const plotAgent2 = new TestAgent({ id: 'plot_2', name: 'PlotAgent2', role: 'plot' })
      
      registry.register(plotAgent)
      registry.register(plotAgent2)
      
      const plotAgents = registry.getByRole('plot')
      expect(plotAgents.length).toBe(2)
    })

    it('should return empty array for role with no agents', () => {
      const agents = registry.getByRole('character')
      expect(agents.length).toBe(0)
    })
  })

  describe('getAll', () => {
    it('should get all agents', () => {
      const agent1 = new TestAgent({ id: 'agent_1', name: 'Agent1', role: 'plot' })
      const agent2 = new TestAgent({ id: 'agent_2', name: 'Agent2', role: 'character' })
      
      registry.register(agent1)
      registry.register(agent2)
      
      const all = registry.getAll()
      expect(all.length).toBe(2)
    })
  })

  describe('getAllIds', () => {
    it('should return all agent ids', () => {
      const agent1 = new TestAgent({ id: 'id_1', name: 'Agent1', role: 'plot' })
      const agent2 = new TestAgent({ id: 'id_2', name: 'Agent2', role: 'character' })
      
      registry.register(agent1)
      registry.register(agent2)
      
      const ids = registry.getAllIds()
      expect(ids).toContain('id_1')
      expect(ids).toContain('id_2')
    })
  })

  describe('clear', () => {
    it('should clear all agents', () => {
      const agent1 = new TestAgent({ id: 'clear_1', name: 'Agent1', role: 'plot' })
      const agent2 = new TestAgent({ id: 'clear_2', name: 'Agent2', role: 'character' })
      
      registry.register(agent1)
      registry.register(agent2)
      registry.clear()
      
      expect(registry.size()).toBe(0)
    })
  })

  describe('getSummary', () => {
    it('should return registry summary', () => {
      const plotAgent = new TestAgent({ id: 'plot_1', name: 'PlotAgent', role: 'plot' })
      const charAgent = new TestAgent({ id: 'char_1', name: 'CharAgent', role: 'character' })
      const dlgAgent = new TestAgent({ id: 'dlg_1', name: 'DlgAgent', role: 'dialogue' })
      
      registry.register(plotAgent)
      registry.register(charAgent)
      registry.register(dlgAgent)
      
      const summary = registry.getSummary()
      
      expect(summary.total).toBe(3)
      expect(summary.byRole.plot).toBe(1)
      expect(summary.byRole.character).toBe(1)
      expect(summary.byRole.dialogue).toBe(1)
      expect(summary.byRole.style).toBe(0)
      expect(summary.byRole.critic).toBe(0)
    })
  })
})
