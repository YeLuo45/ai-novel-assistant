/**
 * Orchestrator.test.ts - 主编排器测试
 * V41 多Agent协作系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Orchestrator, CHANNELS, WritingTask, WritingResult } from '../Orchestrator'
import { MessageBus } from '../MessageBus'
import { AgentRegistry } from '../AgentRegistry'

describe('Orchestrator', () => {
  let orchestrator: Orchestrator
  let messageBus: MessageBus
  let registry: AgentRegistry

  beforeEach(() => {
    messageBus = new MessageBus()
    registry = new AgentRegistry()
    orchestrator = new Orchestrator(messageBus, registry)
  })

  describe('constructor', () => {
    it('should initialize with defaults', () => {
      expect(orchestrator).toBeDefined()
    })

    it('should accept custom messageBus and registry', () => {
      const customOrchestrator = new Orchestrator(messageBus, registry)
      expect(customOrchestrator).toBeDefined()
    })
  })

  describe('coordinate', () => {
    it('should coordinate writing task successfully', async () => {
      const task: WritingTask = {
        id: 'task_1',
        title: '测试任务',
        genre: 'fantasy'
      }

      const result = await orchestrator.coordinate(task)

      expect(result.success).toBe(true)
      expect(result.taskId).toBe('task_1')
      expect(result.plotPlan).toBeDefined()
      expect(result.iterations).toBeGreaterThanOrEqual(1)
    })

    it('should create all agents during coordination', async () => {
      const task: WritingTask = {
        id: 'task_2',
        title: 'Agent创建测试'
      }

      await orchestrator.coordinate(task)

      const summary = orchestrator.getSummary()
      expect(summary.registeredAgents).toBe(5) // plot, character, dialogue, style, critic
    })

    it('should handle errors gracefully', async () => {
      // Create orchestrator without initializing agents
      const emptyOrchestrator = new Orchestrator()
      
      const task: WritingTask = {
        id: 'error_task',
        title: 'Error Test'
      }

      // This should not throw even if agents aren't properly set up
      const result = await emptyOrchestrator.coordinate(task)
      expect(result).toBeDefined()
    })
  })

  describe('getSummary', () => {
    it('should return orchestration summary', () => {
      const summary = orchestrator.getSummary()

      expect(summary.registeredAgents).toBe(0)
      expect(summary.channels).toContain(CHANNELS.PLOT_PLANNING)
      expect(summary.channels).toContain(CHANNELS.CHARACTER_UPDATE)
      expect(summary.channels).toContain(CHANNELS.DIALOGUE_REQUEST)
      expect(summary.channels).toContain(CHANNELS.STYLE_FEEDBACK)
      expect(summary.channels).toContain(CHANNELS.CRITIC_REVIEW)
    })
  })

  describe('reset', () => {
    it('should reset orchestrator state', async () => {
      const task: WritingTask = {
        id: 'reset_task',
        title: 'Reset Test'
      }

      await orchestrator.coordinate(task)
      expect(orchestrator.getSummary().registeredAgents).toBe(5)

      orchestrator.reset()
      expect(orchestrator.getSummary().registeredAgents).toBe(0)
    })
  })

  describe('CHANNELS', () => {
    it('should have all required channels', () => {
      expect(CHANNELS.PLOT_PLANNING).toBe('plot:planning')
      expect(CHANNELS.CHARACTER_UPDATE).toBe('character:update')
      expect(CHANNELS.DIALOGUE_REQUEST).toBe('dialogue:request')
      expect(CHANNELS.STYLE_FEEDBACK).toBe('style:feedback')
      expect(CHANNELS.CRITIC_REVIEW).toBe('critic:review')
      expect(CHANNELS.ORCHESTRATOR).toBe('orchestrator:coordination')
    })
  })
})
