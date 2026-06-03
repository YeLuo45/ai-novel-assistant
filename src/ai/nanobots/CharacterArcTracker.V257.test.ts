/**
 * CharacterArcTracker Test - V257
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CharacterArcTracker } from './CharacterArcTracker.V257'

describe('CharacterArcTracker', () => {
  let tracker: CharacterArcTracker

  beforeEach(() => {
    tracker = new CharacterArcTracker(1)
  })

  // ==================== 初始化测试 ====================

  describe('initCharacterArc', () => {
    it('should initialize a new character arc', () => {
      const arc = tracker.initCharacterArc('char1', '张三', {
        beliefs: ['相信正义'],
        goals: ['成为英雄'],
        skillLevel: 30,
      })

      expect(arc).toBeDefined()
      expect(arc.characterId).toBe('char1')
      expect(arc.characterName).toBe('张三')
      expect(arc.startState.beliefs).toContain('相信正义')
      expect(arc.startState.skillLevel).toBe(30)
      expect(arc.arcType).toBe('positive')
    })

    it('should use default values for missing state properties', () => {
      const arc = tracker.initCharacterArc('char2', '李四', {})

      expect(arc.startState.beliefs).toContain('相信真善美')
      expect(arc.startState.goals).toContain('实现自我价值')
      expect(arc.startState.emotionalBaseline).toBe('平静')
    })

    it('should allow multiple character arcs', () => {
      tracker.initCharacterArc('char1', '张三', { skillLevel: 30 })
      tracker.initCharacterArc('char2', '李四', { skillLevel: 50 })

      const arcs = tracker.getAllArcs()
      expect(arcs.length).toBe(2)
    })
  })

  // ==================== 里程碑测试 ====================

  describe('addMilestone', () => {
    it('should add a milestone to character arc', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      const milestone = tracker.addMilestone(
        'char1',
        5,
        'inciting_incident',
        '主角决定踏上旅程',
        '激动',
        '内心的恐惧与勇气的对抗',
        '成为英雄'
      )

      expect(milestone).toBeDefined()
      expect(milestone?.chapterId).toBe(5)
      expect(milestone?.phase).toBe('inciting_incident')
      expect(milestone?.description).toBe('主角决定踏上旅程')
    })

    it('should return null for non-existent character', () => {
      const milestone = tracker.addMilestone(
        'nonexistent',
        5,
        'inciting_incident',
        '测试',
        '平静',
        '无',
        '无'
      )

      expect(milestone).toBeNull()
    })

    it('should allow multiple milestones', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.addMilestone('char1', 5, 'inciting_incident', '第一事件', '激动', '冲突1', '目标1')
      tracker.addMilestone('char1', 10, 'rising_action', '第二事件', '紧张', '冲突2', '目标2')
      tracker.addMilestone('char1', 15, 'climax', '高潮', '高潮', '冲突3', '目标3')

      const arc = tracker.getArc('char1')
      expect(arc?.milestones.length).toBe(3)
    })
  })

  // ==================== 状态更新测试 ====================

  describe('updateCharacterState', () => {
    it('should update character beliefs', () => {
      tracker.initCharacterArc('char1', '张三', { beliefs: ['旧信念'] })
      
      tracker.updateCharacterState('char1', { beliefs: ['新信念'] })

      const arc = tracker.getArc('char1')
      expect(arc?.currentState.beliefs).toContain('新信念')
      expect(arc?.currentState.beliefs).not.toContain('旧信念')
    })

    it('should update character goals', () => {
      tracker.initCharacterArc('char1', '张三', { goals: ['旧目标'] })
      
      tracker.updateCharacterState('char1', { goals: ['新目标'] })

      const arc = tracker.getArc('char1')
      expect(arc?.currentState.goals).toContain('新目标')
    })

    it('should update skill level', () => {
      tracker.initCharacterArc('char1', '张三', { skillLevel: 50 })
      
      tracker.updateCharacterState('char1', { skillLevel: 75 })

      const arc = tracker.getArc('char1')
      expect(arc?.currentState.skillLevel).toBe(75)
    })

    it('should return null for non-existent character', () => {
      const result = tracker.updateCharacterState('nonexistent', { beliefs: ['test'] })
      expect(result).toBeNull()
    })
  })

  // ==================== 关系弧线测试 ====================

  describe('recordRelationshipChange', () => {
    it('should create new relationship arc', () => {
      tracker.initCharacterArc('char1', '张三', {})
      tracker.initCharacterArc('char2', '李四', {})

      const relArc = tracker.recordRelationshipChange(
        'char1',
        'char2',
        '李四',
        5,
        '初次相遇',
        'ally'
      )

      expect(relArc).toBeDefined()
      expect(relArc?.startState).toBe('neutral')
      expect(relArc?.currentState).toBe('ally')
      expect(relArc?.trustScore).toBeGreaterThan(0)
    })

    it('should update existing relationship', () => {
      tracker.initCharacterArc('char1', '张三', {})
      tracker.initCharacterArc('char2', '李四', {})

      tracker.recordRelationshipChange('char1', 'char2', '李四', 5, '事件1', 'ally')
      tracker.recordRelationshipChange('char1', 'char2', '李四', 10, '事件2', 'enemy')

      const relArc = tracker.getRelationshipArc('char1', 'char2')
      expect(relArc?.currentState).toBe('enemy')
      expect(relArc?.keyEvents.length).toBe(2)
    })

    it('should increase trust score for ally relationship', () => {
      tracker.initCharacterArc('char1', '张三', {})
      tracker.initCharacterArc('char2', '李四', {})

      const relArc = tracker.recordRelationshipChange(
        'char1', 'char2', '李四', 5, '帮助', 'ally'
      )

      expect(relArc?.trustScore).toBeGreaterThan(0)
    })

    it('should decrease trust score and increase conflict for enemy', () => {
      tracker.initCharacterArc('char1', '张三', {})
      tracker.initCharacterArc('char2', '李四', {})

      const relArc = tracker.recordRelationshipChange(
        'char1', 'char2', '李四', 5, '背叛', 'enemy'
      )

      expect(relArc?.trustScore).toBeLessThan(0)
      expect(relArc?.conflictScore).toBeGreaterThan(0)
    })
  })

  // ==================== 弧线类型测试 ====================

  describe('setArcType', () => {
    it('should set arc type to positive', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      const result = tracker.setArcType('char1', 'positive')
      
      expect(result).toBe(true)
      expect(tracker.getArc('char1')?.arcType).toBe('positive')
    })

    it('should set arc type to negative', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.setArcType('char1', 'negative')
      
      expect(tracker.getArc('char1')?.arcType).toBe('negative')
    })

    it('should set arc type to circular', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.setArcType('char1', 'circular')
      
      expect(tracker.getArc('char1')?.arcType).toBe('circular')
    })

    it('should return false for non-existent character', () => {
      const result = tracker.setArcType('nonexistent', 'positive')
      expect(result).toBe(false)
    })
  })

  // ==================== 章节快照测试 ====================

  describe('recordChapterSnapshot', () => {
    it('should record chapter snapshot', () => {
      const snapshot = {
        chapterId: 5,
        characterId: 'char1',
        mentions: 10,
        dialogueRatio: 0.3,
        viewpointPercentage: 50,
        emotionalIndicators: ['紧张', '期待'],
        goalsPursued: ['找到真相'],
        relationshipsMentioned: ['李四'],
      }

      tracker.recordChapterSnapshot(snapshot)

      const snapshots = tracker.getChapterSnapshots(5)
      expect(snapshots.length).toBe(1)
      expect(snapshots[0].mentions).toBe(10)
    })

    it('should update existing snapshot for same character in same chapter', () => {
      tracker.recordChapterSnapshot({
        chapterId: 5,
        characterId: 'char1',
        mentions: 10,
        dialogueRatio: 0.3,
        viewpointPercentage: 50,
        emotionalIndicators: [],
        goalsPursued: [],
        relationshipsMentioned: [],
      })

      tracker.recordChapterSnapshot({
        chapterId: 5,
        characterId: 'char1',
        mentions: 20,
        dialogueRatio: 0.4,
        viewpointPercentage: 60,
        emotionalIndicators: [],
        goalsPursued: [],
        relationshipsMentioned: [],
      })

      const snapshots = tracker.getChapterSnapshots(5)
      expect(snapshots.length).toBe(1)
      expect(snapshots[0].mentions).toBe(20)
    })
  })

  // ==================== 转型分数测试 ====================

  describe('calculateTransformationScore', () => {
    it('should calculate transformation score for character with milestones', () => {
      tracker.initCharacterArc('char1', '张三', { skillLevel: 30 })
      
      tracker.addMilestone('char1', 5, 'inciting_incident', '事件1', '激动', '信念动摇', '新目标')
      tracker.addMilestone('char1', 10, 'rising_action', '事件2', '紧张', '内心挣扎', '追求目标')
      tracker.addMilestone('char1', 15, 'climax', '事件3', '高潮', '信念重塑', '实现目标')

      const score = tracker.calculateTransformationScore('char1')
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 for non-existent character', () => {
      const score = tracker.calculateTransformationScore('nonexistent')
      expect(score).toBe(0)
    })

    it('should factor in skill level changes', () => {
      tracker.initCharacterArc('char1', '张三', { skillLevel: 30 })
      
      tracker.updateCharacterState('char1', { skillLevel: 80 })

      const score = tracker.calculateTransformationScore('char1')
      expect(score).toBeGreaterThan(0)
    })
  })

  // ==================== 弧线分析测试 ====================

  describe('analyzeArc', () => {
    it('should analyze character arc completeness', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.addMilestone('char1', 1, 'status_quo', '初始状态', '平静', '无', '目标1')
      tracker.addMilestone('char1', 5, 'inciting_incident', '触发事件', '震惊', '身份危机', '寻找答案')
      tracker.addMilestone('char1', 10, 'rising_action', '上升', '紧张', '道德困境', '做出选择')
      tracker.addMilestone('char1', 15, 'climax', '高潮', '激动', '最终抉择', '牺牲一切')

      const analysis = tracker.analyzeArc('char1')
      
      expect(analysis).toBeDefined()
      expect(analysis?.arcCompleteness).toBeGreaterThan(0)
      expect(analysis?.milestoneCount).toBe(4)
    })

    it('should identify missing phases', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.addMilestone('char1', 5, 'inciting_incident', '事件', '激动', '冲突', '目标')

      const analysis = tracker.analyzeArc('char1')
      
      expect(analysis?.missingPhases.length).toBeGreaterThan(0)
      expect(analysis?.missingPhases).toContain('status_quo')
      expect(analysis?.missingPhases).toContain('climax')
    })

    it('should return null for non-existent character', () => {
      const analysis = tracker.analyzeArc('nonexistent')
      expect(analysis).toBeNull()
    })

    it('should detect flat areas with large chapter gaps', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.addMilestone('char1', 5, 'inciting_incident', '事件1', '平静', '无', '无')
      tracker.addMilestone('char1', 25, 'rising_action', '事件2', '紧张', '冲突', '目标')

      const analysis = tracker.analyzeArc('char1')
      
      expect(analysis?.flatAreas.length).toBeGreaterThan(0)
      expect(analysis?.flatAreas[0].startChapter).toBe(5)
      expect(analysis?.flatAreas[0].endChapter).toBe(25)
    })
  })

  // ==================== 获取方法测试 ====================

  describe('getArc and getAllArcs', () => {
    it('should get specific arc', () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      const arc = tracker.getArc('char1')
      
      expect(arc).toBeDefined()
      expect(arc?.characterName).toBe('张三')
    })

    it('should return undefined for non-existent arc', () => {
      const arc = tracker.getArc('nonexistent')
      expect(arc).toBeUndefined()
    })

    it('should get all arcs', () => {
      tracker.initCharacterArc('char1', '张三', {})
      tracker.initCharacterArc('char2', '李四', {})

      const arcs = tracker.getAllArcs()
      
      expect(arcs.length).toBe(2)
    })
  })

  describe('getChapterSnapshots', () => {
    it('should return empty array for chapter with no snapshots', () => {
      const snapshots = tracker.getChapterSnapshots(999)
      expect(snapshots).toEqual([])
    })
  })

  describe('getArcSummaries', () => {
    it('should return summaries for all characters', () => {
      // Clear localStorage to ensure test isolation
      localStorage.clear()
      const freshTracker = new CharacterArcTracker(1)
      
      freshTracker.initCharacterArc('char1', '张三', { skillLevel: 30 })
      freshTracker.addMilestone('char1', 5, 'inciting_incident', '事件', '激动', '冲突', '目标')

      const summaries = freshTracker.getArcSummaries()
      
      expect(summaries.length).toBe(1)
      expect(summaries[0].characterName).toBe('张三')
      expect(summaries[0].milestoneCount).toBe(1)
    })
  })

  describe('getCharacterStateAtChapter', () => {
    it('should return current state when no chapter snapshot exists', () => {
      tracker.initCharacterArc('char1', '张三', {
        beliefs: ['信念1'],
        skillLevel: 50,
      })

      const state = tracker.getCharacterStateAtChapter('char1', 10)
      
      expect(state?.skillLevel).toBe(50)
    })

    it('should use goals from chapter snapshot if available', () => {
      tracker.initCharacterArc('char1', '张三', {
        goals: ['初始目标'],
      })

      tracker.recordChapterSnapshot({
        chapterId: 5,
        characterId: 'char1',
        mentions: 5,
        dialogueRatio: 0.3,
        viewpointPercentage: 50,
        emotionalIndicators: ['紧张'],
        goalsPursued: ['新目标'],
        relationshipsMentioned: [],
      })

      const state = tracker.getCharacterStateAtChapter('char1', 5)
      expect(state?.goals).toContain('新目标')
    })
  })

  describe('getRelationshipArc', () => {
    it('should return relationship arc between characters', () => {
      tracker.initCharacterArc('char1', '张三', {})
      tracker.initCharacterArc('char2', '李四', {})

      tracker.recordRelationshipChange('char1', 'char2', '李四', 5, '相遇', 'ally')

      const relArc = tracker.getRelationshipArc('char1', 'char2')
      
      expect(relArc).toBeDefined()
      expect(relArc?.targetCharacterName).toBe('李四')
    })

    it('should return null for non-existent relationship', () => {
      tracker.initCharacterArc('char1', '张三', {})

      const relArc = tracker.getRelationshipArc('char1', 'nonexistent')
      
      expect(relArc).toBeNull()
    })
  })

  // ==================== 结晶测试 ====================

  describe('crystallizeToLesson', () => {
    it('should return null for character with insufficient milestones', async () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.addMilestone('char1', 5, 'inciting_incident', '事件', '激动', '冲突', '目标')

      const lesson = await tracker.crystallizeToLesson(1, 'char1')
      expect(lesson).toBeNull()
    })

    it('should return null for character with low arc completeness', async () => {
      tracker.initCharacterArc('char1', '张三', {})
      
      tracker.addMilestone('char1', 5, 'inciting_incident', '事件1', '激动', '冲突1', '目标1')
      tracker.addMilestone('char1', 6, 'rising_action', '事件2', '紧张', '冲突2', '目标2')

      const lesson = await tracker.crystallizeToLesson(1, 'char1')
      expect(lesson).toBeNull()
    })

    it('should crystallize to lesson for complete arc', async () => {
      tracker.initCharacterArc('char1', '张三', { skillLevel: 30 })
      
      tracker.addMilestone('char1', 1, 'status_quo', '初始', '平静', '无', '目标')
      tracker.addMilestone('char1', 5, 'inciting_incident', '触发', '震惊', '身份危机', '寻找')
      tracker.addMilestone('char1', 10, 'rising_action', '上升', '紧张', '道德困境', '选择')
      tracker.addMilestone('char1', 15, 'climax', '高潮', '激动', '最终抉择', '牺牲')
      tracker.addMilestone('char1', 18, 'falling_action', '下降', '释然', '接受结果', '回归')
      tracker.addMilestone('char1', 20, 'resolution', '结局', '平静', '放下', '和解')

      const lesson = await tracker.crystallizeToLesson(1, 'char1')
      
      expect(lesson).toBeDefined()
      expect(lesson?.outcome).toBe('success')
      expect(lesson?.context.score).toBeGreaterThan(0.6)
    })
  })
})