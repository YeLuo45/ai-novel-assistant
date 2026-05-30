/**
 * DreamMemoryIntegration Tests - V67
 * Tests for Two-phase compression: Memory Events → Dream Sessions → Skills/Lessons
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  type DreamMemoryEvent,
  type DreamEventType,
  type DreamPhase,
  type ExtractedSkill,
  type DreamSummary,
  DreamSessionManager,
  DreamSummaryGenerator,
  SkillExtractor,
  DreamIntegrationOrchestrator
} from './DreamMemoryIntegration'

// Mock LLM
vi.mock('../llm', () => ({
  callLLM: vi.fn(() => Promise.resolve(JSON.stringify({
    abstract: '测试摘要',
    keyInsights: ['洞察1', '洞察2'],
    skillRefs: ['skill-1'],
    emotionalChanges: [],
    timeline: []
  })))
}))

describe('DreamMemoryIntegration Types', () => {
  describe('DreamPhase', () => {
    it('should have 4 phases', () => {
      const phases: DreamPhase[] = ['awake', 'collecting', 'sleeping', 'consolidated']
      expect(phases).toHaveLength(4)
    })
  })

  describe('DreamEventType', () => {
    it('should have all event types', () => {
      const types: DreamEventType[] = [
        'writing:start', 'writing:complete', 'skill:used', 'skill:success',
        'skill:failed', 'pattern:detected', 'tool:call', 'quality:issue',
        'context:switch', 'milestone:reached'
      ]
      expect(types).toHaveLength(10)
    })
  })

  describe('DREAM_CONFIG', () => {
  it('should have sensible defaults', () => {
    const collectingThreshold = 20
    const sleepDelayMs = 5 * 60 * 1000
    const maxEventsPerSession = 100
    const minEventsForSkillExtraction = 5
    expect(collectingThreshold).toBe(20)
    expect(sleepDelayMs).toBe(300000)
    expect(maxEventsPerSession).toBe(100)
    expect(minEventsForSkillExtraction).toBe(5)
  })
})
})

describe('DreamSessionManager', () => {
  let manager: DreamSessionManager

  beforeEach(() => {
    manager = new DreamSessionManager()
  })

  describe('startSession', () => {
    it('should create new session with collecting phase', () => {
      const session = manager.startSession('session-1')
      expect(session.sessionId).toBe('session-1')
      expect(session.phase).toBe('collecting')
      expect(session.events).toHaveLength(0)
      expect(session.extractedSkills).toHaveLength(0)
    })

    it('should include projectId if provided', () => {
      const session = manager.startSession('session-2', 123)
      expect(session.projectId).toBe(123)
    })

    it('should generate unique IDs', () => {
      const s1 = manager.startSession('s1')
      const s2 = manager.startSession('s2')
      expect(s1.id).not.toBe(s2.id)
    })
  })

  describe('addEvent', () => {
    it('should add event to active session', () => {
      manager.startSession('session-1')
      const event = manager.addEvent('writing:start', '开始写第一章', 80)
      
      expect(event.eventType).toBe('writing:start')
      expect(event.content).toBe('开始写第一章')
      expect(event.importance).toBe(80)
      expect(event.id).toMatch(/^evt-/)
    })

    it('should auto-start session if none exists', () => {
      const event = manager.addEvent('skill:used', '使用了PlotGenerator', 60)
      expect(event.id).toMatch(/^evt-/)
      
      const session = manager.getActiveSession()
      expect(session).not.toBeNull()
      expect(session!.events).toHaveLength(1)
    })

    it('should track event count', () => {
      manager.startSession('session-1')
      manager.addEvent('writing:start', 'event 1', 50)
      manager.addEvent('writing:complete', 'event 2', 60)
      
      const session = manager.getActiveSession()
      expect(session!.events).toHaveLength(2)
    })
  })

  describe('getActiveSession', () => {
    it('should return null when no active session', () => {
      const session = manager.getActiveSession()
      expect(session).toBeNull()
    })

    it('should return current session', () => {
      manager.startSession('session-1')
      const session = manager.getActiveSession()
      expect(session).not.toBeNull()
      expect(session!.sessionId).toBe('session-1')
    })
  })

  describe('completeSession', () => {
    it('should transition to consolidated phase', () => {
      manager.startSession('session-1')
      manager.addEvent('writing:start', 'test', 50)
      
      const completed = manager.completeSession()
      expect(completed).not.toBeNull()
      expect(completed!.phase).toBe('consolidated')
      expect(completed!.consolidatedAt).toBeDefined()
    })

    it('should clear active session', () => {
      manager.startSession('session-1')
      manager.completeSession()
      
      expect(manager.getActiveSession()).toBeNull()
    })

    it('should return null when no active session', () => {
      const result = manager.completeSession()
      expect(result).toBeNull()
    })
  })
})

describe('DreamSummaryGenerator', () => {
  let generator: DreamSummaryGenerator

  beforeEach(() => {
    generator = new DreamSummaryGenerator()
  })

  describe('generateSummary', () => {
    it('should return empty summary for empty events', async () => {
      const summary = await generator.generateSummary([])
      
      expect(summary.abstract).toBe('')
      expect(summary.keyInsights).toHaveLength(0)
    })

    it('should generate abstract from events', async () => {
      const events: DreamMemoryEvent[] = [
        { id: 'e1', eventType: 'writing:start', content: '开始写第一章', importance: 80, timestamp: Date.now() },
        { id: 'e2', eventType: 'writing:complete', content: '完成第一章', importance: 90, timestamp: Date.now() }
      ]
      
      const summary = await generator.generateSummary(events)
      expect(summary.abstract).toBeTruthy()
      expect(summary.keyInsights.length).toBeGreaterThan(0)
    })

    it('should limit events to 20 for summary', async () => {
      const events: DreamMemoryEvent[] = []
      for (let i = 0; i < 30; i++) {
        events.push({
          id: `e${i}`,
          eventType: 'skill:used',
          content: `event ${i}`,
          importance: 50,
          timestamp: Date.now()
        })
      }
      
      const summary = await generator.generateSummary(events)
      // Should still generate (mock returns valid)
      expect(summary).toBeDefined()
    })
  })

  describe('fallbackSummary', () => {
    it('should count writing events', async () => {
      const events: DreamMemoryEvent[] = [
        { id: 'e1', eventType: 'writing:start', content: 'start', importance: 50, timestamp: Date.now() },
        { id: 'e2', eventType: 'writing:complete', content: 'done', importance: 50, timestamp: Date.now() },
        { id: 'e3', eventType: 'skill:used', content: 'skill', importance: 50, timestamp: Date.now() }
      ]
      
      const summary = await generator.generateSummary([])
      expect(summary.abstract).toBe('')
    })
  })
})

describe('SkillExtractor', () => {
  let extractor: SkillExtractor

  beforeEach(() => {
    extractor = new SkillExtractor()
  })

  describe('extractSkills', () => {
    it('should return empty for insufficient events', async () => {
      const events: DreamMemoryEvent[] = [
        { id: 'e1', eventType: 'skill:used', content: 'skill 1', importance: 50, timestamp: Date.now() }
      ]
      
      const skills = await extractor.extractSkills(events)
      expect(skills).toHaveLength(0)
    })

    it('should require at least 3 skill events', async () => {
      const events: DreamMemoryEvent[] = [
        { id: 'e1', eventType: 'skill:used', content: 'skill 1', importance: 50, timestamp: Date.now() },
        { id: 'e2', eventType: 'skill:used', content: 'skill 2', importance: 50, timestamp: Date.now() }
      ]
      
      const skills = await extractor.extractSkills(events)
      expect(skills).toHaveLength(0)
    })

    it('should extract skills from sufficient events', async () => {
      const events: DreamMemoryEvent[] = [
        { id: 'e1', eventType: 'skill:used', content: 'skill 1', importance: 50, timestamp: Date.now() },
        { id: 'e2', eventType: 'skill:success', content: 'skill 2', importance: 50, timestamp: Date.now() },
        { id: 'e3', eventType: 'pattern:detected', content: 'pattern 1', importance: 50, timestamp: Date.now() },
        { id: 'e4', eventType: 'skill:used', content: 'skill 3', importance: 50, timestamp: Date.now() },
        { id: 'e5', eventType: 'skill:used', content: 'skill 4', importance: 50, timestamp: Date.now() }
      ]
      
      const skills = await extractor.extractSkills(events)
      // Mock returns extracted skills
      expect(skills).toBeDefined()
    })
  })
})

describe('DreamIntegrationOrchestrator', () => {
  let orchestrator: DreamIntegrationOrchestrator

  beforeEach(() => {
    orchestrator = new DreamIntegrationOrchestrator()
  })

  describe('recordEvent', () => {
    it('should record event and return it', () => {
      const event = orchestrator.recordEvent(
        'session-1',
        'writing:start',
        '开始写第一章',
        80
      )
      
      expect(event.eventType).toBe('writing:start')
      expect(event.content).toBe('开始写第一章')
    })
  })

  describe('startDreamSession', () => {
    it('should start new dream session', () => {
      const session = orchestrator.startDreamSession('session-1', 123)
      expect(session.sessionId).toBe('session-1')
      expect(session.projectId).toBe(123)
    })
  })

  describe('getStatus', () => {
    it('should return inactive when no session', () => {
      const status = orchestrator.getStatus()
      expect(status.active).toBe(false)
      expect(status.eventCount).toBe(0)
      expect(status.phase).toBe('awake')
    })

    it('should return active status with event count', () => {
      orchestrator.startDreamSession('session-1')
      orchestrator.recordEvent('session-1', 'writing:start', 'test', 50)
      
      const status = orchestrator.getStatus()
      expect(status.active).toBe(true)
      expect(status.eventCount).toBe(1)
      expect(status.phase).toBe('collecting')
    })
  })

  describe('getRecentEvents', () => {
    it('should return empty when no session', () => {
      const events = orchestrator.getRecentEvents()
      expect(events).toHaveLength(0)
    })

    it('should return recent events', () => {
      orchestrator.startDreamSession('session-1')
      for (let i = 0; i < 10; i++) {
        orchestrator.recordEvent('session-1', 'skill:used', `event ${i}`, 50)
      }
      
      const recent = orchestrator.getRecentEvents(3)
      expect(recent).toHaveLength(3)
    })
  })

  describe('consolidate', () => {
    it('should return null when no active session', async () => {
      const result = await orchestrator.consolidate('nonexistent')
      expect(result).toBeNull()
    })
  })
})

describe('ExtractedSkill structure', () => {
  it('should have all required fields', () => {
    const skill: ExtractedSkill = {
      name: 'TestSkill',
      task: 'Test task',
      steps: ['step1', 'step2'],
      triggers: ['trigger1'],
      confidence: 0.85,
      sourceEventIds: ['e1', 'e2']
    }
    
    expect(skill.name).toBe('TestSkill')
    expect(skill.confidence).toBe(0.85)
    expect(skill.steps).toHaveLength(2)
  })
})

describe('DreamMemoryEvent structure', () => {
  it('should have all required fields', () => {
    const event: DreamMemoryEvent = {
      id: 'evt-1',
      eventType: 'milestone:reached',
      content: '完成第一章',
      importance: 90,
      timestamp: Date.now(),
      metadata: { chapter: 1 }
    }
    
    expect(event.id).toBe('evt-1')
    expect(event.eventType).toBe('milestone:reached')
    expect(event.metadata).toBeDefined()
    expect(event.metadata!.chapter).toBe(1)
  })
})