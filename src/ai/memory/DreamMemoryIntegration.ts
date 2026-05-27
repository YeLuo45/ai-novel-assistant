/**
 * DreamMemoryIntegration - V67
 * Two-phase compression: Memory Events → Dream Sessions → Skills/Lessons
 * Inspired by nanobot-design's Dream Memory system
 * 
 * Phase 1 (Collecting): Wake phase - collect MemoryEvents online
 * Phase 2 (Sleeping): Sleep phase - compress events to DreamSession summaries
 * Phase 3 (Consolidated): Extract skills/lessons from consolidated sessions
 */

import { callLLM } from '../llm'

// ===============================================================================
// Types
// ============================================================================

export type DreamPhase = 'awake' | 'collecting' | 'sleeping' | 'consolidated'

export interface DreamSessionV2 {
  id: string
  sessionId: string
  projectId?: number
  phase: DreamPhase
  events: DreamMemoryEvent[]
  summary?: DreamSummary
  extractedSkills: ExtractedSkill[]
  consolidatedAt?: number
  createdAt: number
}

export interface DreamMemoryEvent {
  id: string
  eventType: DreamEventType
  content: string
  importance: number // 0-100
  timestamp: number
  metadata?: Record<string, unknown>
}

export type DreamEventType =
  | 'writing:start'
  | 'writing:complete'
  | 'skill:used'
  | 'skill:success'
  | 'skill:failed'
  | 'pattern:detected'
  | 'tool:call'
  | 'quality:issue'
  | 'context:switch'
  | 'milestone:reached'

export interface DreamSummary {
  abstract: string       // 50字的抽象描述
  keyInsights: string[]  // 3-5个关键洞察
  skillRefs: string[]    // 引用的技能ID
  emotionalChanges: EmotionalChange[]
  timeline: TimelineEvent[]
}

export interface EmotionalChange {
  character: string
  before: string
  after: string
  chapter: number
}

export interface TimelineEvent {
  chapter: number
  event: string
  significance: number // 0-100
}

export interface ExtractedSkill {
  name: string
  task: string
  steps: string[]
  triggers: string[]
  confidence: number
  sourceEventIds: string[]
}

// ============================================================================
// Constants
// ============================================================================

const DREAM_CONFIG = {
  // 收集阶段：积累多少事件后进入sleeping
  collectingThreshold: 20, // 20 events
  
  // Sleeping阶段：多久没新事件就进入sleeping
  sleepDelayMs: 5 * 60 * 1000, // 5 minutes no new events
  
  // 合并阈值：超过此值就强制consolidate
  maxEventsPerSession: 100,
  
  // 提取技能的最少事件数
  minEventsForSkillExtraction: 5,
}

const EMOTIONAL_ARCHETYPES = [
  '成长型', '堕落型', '循环型', '觉醒型', '牺牲型'
]

// ============================================================================
// DreamSessionManager
// ============================================================================

export class DreamSessionManager {
  private activeSession: DreamSessionV2 | null = null
  private sleepTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {}

  /**
   * 开始新的梦境会话
   */
  startSession(sessionId: string, projectId?: number): DreamSessionV2 {
    this.clearSleepTimer()
    
    this.activeSession = {
      id: `dream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      projectId,
      phase: 'collecting',
      events: [],
      extractedSkills: [],
      createdAt: Date.now()
    }
    
    return this.activeSession
  }

  /**
   * 添加记忆事件
   */
  addEvent(
    eventType: DreamEventType,
    content: string,
    importance: number = 50,
    metadata?: Record<string, unknown>
  ): DreamMemoryEvent {
    if (!this.activeSession) {
      this.startSession('default')
    }
    
    const event: DreamMemoryEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      content,
      importance,
      timestamp: Date.now(),
      metadata
    }
    
    this.activeSession.events.push(event)
    
    // 检查是否需要转换到sleeping
    if (this.activeSession.events.length >= DREAM_CONFIG.collectingThreshold) {
      this.scheduleSleep()
    } else {
      this.scheduleSleep() // reset timer
    }
    
    return event
  }

  /**
   * 计划进入sleeping阶段
   */
  private scheduleSleep(): void {
    this.clearSleepTimer()
    this.sleepTimer = setTimeout(() => {
      if (this.activeSession && this.activeSession.phase === 'collecting') {
        this.activeSession.phase = 'sleeping'
      }
    }, DREAM_CONFIG.sleepDelayMs)
  }

  private clearSleepTimer(): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer)
      this.sleepTimer = null
    }
  }

  /**
   * 获取当前活跃会话
   */
  getActiveSession(): DreamSessionV2 | null {
    return this.activeSession
  }

  /**
   * 进入consolidated阶段
   */
  completeSession(): DreamSessionV2 | null {
    if (!this.activeSession) return null
    
    this.activeSession.phase = 'consolidated'
    this.activeSession.consolidatedAt = Date.now()
    
    const completed = this.activeSession
    this.activeSession = null
    this.clearSleepTimer()
    
    return completed
  }
}

// ============================================================================
// DreamSummaryGenerator
// ============================================================================

export class DreamSummaryGenerator {
  /**
   * 生成梦境摘要（Phase 2压缩）
   * 将20+个事件压缩为一个结构化摘要
   */
  async generateSummary(events: DreamMemoryEvent[]): Promise<DreamSummary> {
    if (events.length === 0) {
      return {
        abstract: '',
        keyInsights: [],
        skillRefs: [],
        emotionalChanges: [],
        timeline: []
      }
    }
    
    const eventList = events
      .slice(-20) // 只用最近20个
      .map(e => `[${e.eventType}] ${e.content}`)
      .join('\n')
    
    const prompt = `你是专业的小说创作分析师。请分析以下记忆事件，生成结构化摘要。

【记忆事件】
${eventList}

请生成JSON格式的摘要：
{
  "abstract": "50字的抽象描述，说明这个创作会话的核心主题",
  "keyInsights": ["洞察1", "洞察2", "洞察3"],
  "skillRefs": ["相关技能ID列表（从事件中提取）"],
  "emotionalChanges": [{"character": "角色名", "before": "变化前", "after": "变化后", "chapter": 章节号}],
  "timeline": [{"chapter": 章节号, "event": "事件描述", "significance": 重要性}]
}

只输出JSON，不要其他文字。`

    try {
      const response = await callLLM({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 2000
      }, 'dream-summary-generator')
      
      const parsed = JSON.parse(response)
      return {
        abstract: parsed.abstract || '',
        keyInsights: parsed.keyInsights || [],
        skillRefs: parsed.skillRefs || [],
        emotionalChanges: parsed.emotionalChanges || [],
        timeline: parsed.timeline || []
      }
    } catch (error) {
      console.error('生成梦境摘要失败:', error)
      return this.fallbackSummary(events)
    }
  }

  /**
   * 回退摘要生成（当LLM调用失败时）
   */
  private fallbackSummary(events: DreamMemoryEvent[]): DreamSummary {
    const writingEvents = events.filter(e => e.eventType.startsWith('writing'))
    const skillEvents = events.filter(e => e.eventType.startsWith('skill'))
    
    return {
      abstract: `创作会话：${events.length}个事件，其中${writingEvents.length}个写作事件，${skillEvents.length}个技能事件`,
      keyInsights: [
        `完成${writingEvents.length}个写作片段`,
        `使用${skillEvents.length}个技能`
      ],
      skillRefs: events
        .filter(e => e.eventType === 'skill:used' && e.metadata?.skillId)
        .map(e => String(e.metadata?.skillId)),
      emotionalChanges: [],
      timeline: []
    }
  }
}

// ============================================================================
// SkillExtractor
// ============================================================================

export class SkillExtractor {
  /**
   * 从梦境会话中提取技能（Phase 3）
   * 基于事件模式识别可复用的技能
   */
  async extractSkills(events: DreamMemoryEvent[]): Promise<ExtractedSkill[]> {
    if (events.length < DREAM_CONFIG.minEventsForSkillExtraction) {
      return []
    }
    
    const skillEvents = events.filter(e => 
      e.eventType === 'skill:used' || 
      e.eventType === 'skill:success' ||
      e.eventType === 'pattern:detected'
    )
    
    if (skillEvents.length < 3) {
      return []
    }
    
    const eventList = skillEvents
      .map(e => `[${e.eventType}] ${e.content}`)
      .join('\n')
    
    const prompt = `你是专业的小说创作技能分析师。请从以下技能使用事件中，提取可复用的技能模式。

【技能事件】
${eventList}

请生成JSON格式的技能列表：
{
  "skills": [
    {
      "name": "技能名称（如：玄幻战斗场景描写）",
      "task": "适用任务描述",
      "steps": ["步骤1", "步骤2"],
      "triggers": ["触发关键词1", "触发关键词2"],
      "confidence": 0.8
    }
  ]
}

只输出JSON，不要其他文字。`

    try {
      const response = await callLLM({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 1500
      }, 'skill-extractor')
      
      const parsed = JSON.parse(response)
      return (parsed.skills || []).map((s: Record<string, unknown>) => ({
        name: String(s.name || ''),
        task: String(s.task || ''),
        steps: Array.isArray(s.steps) ? s.steps.map(String) : [],
        triggers: Array.isArray(s.triggers) ? s.triggers.map(String) : [],
        confidence: Number(s.confidence || 0.5),
        sourceEventIds: skillEvents.slice(0, 5).map(e => e.id)
      }))
    } catch (error) {
      console.error('提取技能失败:', error)
      return []
    }
  }
}

// ============================================================================
// DreamIntegration Orchestrator
// ============================================================================

export class DreamIntegrationOrchestrator {
  private sessionManager: DreamSessionManager
  private summaryGenerator: DreamSummaryGenerator
  private skillExtractor: SkillExtractor

  constructor() {
    this.sessionManager = new DreamSessionManager()
    this.summaryGenerator = new DreamSummaryGenerator()
    this.skillExtractor = new SkillExtractor()
  }

  /**
   * 记录记忆事件（Wake阶段）
   */
  recordEvent(
    sessionId: string,
    eventType: DreamEventType,
    content: string,
    importance: number = 50,
    metadata?: Record<string, unknown>
  ): DreamMemoryEvent {
    return this.sessionManager.addEvent(eventType, content, importance, metadata)
  }

  /**
   * 开始新的梦境会话
   */
  startDreamSession(sessionId: string, projectId?: number): DreamSessionV2 {
    return this.sessionManager.startSession(sessionId, projectId)
  }

  /**
   * 执行梦境压缩（Collecting → Sleeping → Consolidated）
   */
  async consolidate(sessionId: string): Promise<DreamSessionV2 | null> {
    const session = this.sessionManager.getActiveSession()
    if (!session || session.sessionId !== sessionId) return null
    
    // Phase 2: 生成摘要
    session.summary = await this.summaryGenerator.generateSummary(session.events)
    
    // Phase 3: 提取技能
    session.extractedSkills = await this.skillExtractor.extractSkills(session.events)
    
    // 完成会话
    return this.sessionManager.completeSession()
  }

  /**
   * 获取活跃会话状态
   */
  getStatus(): { active: boolean; eventCount: number; phase: DreamPhase } {
    const session = this.sessionManager.getActiveSession()
    if (!session) {
      return { active: false, eventCount: 0, phase: 'awake' }
    }
    return {
      active: true,
      eventCount: session.events.length,
      phase: session.phase
    }
  }

  /**
   * 获取最近的事件（用于实时显示）
   */
  getRecentEvents(count: number = 5): DreamMemoryEvent[] {
    const session = this.sessionManager.getActiveSession()
    if (!session) return []
    return session.events.slice(-count)
  }
}

// Export singleton
export const dreamIntegration = new DreamIntegrationOrchestrator()