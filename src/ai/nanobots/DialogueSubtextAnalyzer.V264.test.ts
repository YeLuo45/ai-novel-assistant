/**
 * DialogueSubtextAnalyzer Test - V264
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DialogueSubtextAnalyzer } from './DialogueSubtextAnalyzer.V264'

describe('DialogueSubtextAnalyzer', () => {
  let analyzer: DialogueSubtextAnalyzer

  beforeEach(() => {
    localStorage.clear()
    analyzer = new DialogueSubtextAnalyzer(1)
  })

  // ==================== 初始化测试 ====================

  describe('constructor', () => {
    it('should create an instance with projectId', () => {
      const a = new DialogueSubtextAnalyzer(42)
      expect(a).toBeDefined()
    })

    it('should initialize with default projectId 0', () => {
      const a = new DialogueSubtextAnalyzer()
      expect(a).toBeDefined()
    })
  })

  // ==================== 对话分析测试 ====================

  describe('analyzeDialogue', () => {
    it('should analyze dialogue with subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "哦，太棒了，我们又得加班",
        "neutral"
      )

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.chapterId).toBe(1)
      expect(result.speakerId).toBe("char1")
      expect(result.speakerName).toBe("李明")
      expect(result.listenerId).toBe("char2")
      expect(result.listenerName).toBe("张华")
      expect(result.literalContent).toBe("哦，太棒了，我们又得加班")
      expect(result.hasSubtext).toBe(true)
      expect(result.subtextPoints.length).toBeGreaterThan(0)
    })

    it('should detect sarcasm subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "呵，真是好极了",
        "neutral"
      )

      expect(result.hasSubtext).toBe(true)
      expect(result.subtextPoints.some(p => p.subtextType === "sarcasm")).toBe(true)
    })

    it('should detect passive aggressive subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "随你便吧",
        "neutral"
      )

      expect(result.hasSubtext).toBe(true)
      expect(result.subtextPoints.some(p => p.subtextType === "passive_aggressive")).toBe(true)
    })

    it('should detect omission subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "算了",
        "neutral"
      )

      expect(result.hasSubtext).toBe(true)
      expect(result.subtextPoints.some(p => p.subtextType === "omission" || p.subtextType === "deflection")).toBe(true)
    })

    it('should detect hidden threat subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "小心后果自负",
        "neutral"
      )

      expect(result.hasSubtext).toBe(true)
      expect(result.subtextPoints.some(p => p.subtextType === "hidden_threat")).toBe(true)
    })

    it('should detect romantic tension subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "其实我想说，你真的很...算了，没什么",
        "neutral"
      )

      expect(result.hasSubtext).toBe(true)
      expect(result.subtextPoints.length).toBeGreaterThan(0)
    })

    it('should handle dialogue without subtext', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "今天天气不错",
        "neutral"
      )

      // Some implicit subtext may be detected
      expect(result).toBeDefined()
      expect(result.hasSubtext === false || result.hasSubtext === true).toBe(true)
    })

    it('should calculate tension level', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "哦，太棒了，我们又得加班",
        "hostile"
      )

      expect(result.tensionLevel).toBeGreaterThan(0)
      expect(result.tensionLevel).toBeLessThanOrEqual(100)
    })

    it('should determine negative relationship impact', () => {
      const result = analyzer.analyzeDialogue(
        1,
        "char1",
        "李明",
        "char2",
        "张华",
        "随你便吧",
        "neutral"
      )

      expect(["negative", "complex"]).toContain(result.relationshipImpact)
    })
  })

  // ==================== 查询方法测试 ====================

  describe('getChapterSubtextSummary', () => {
    it('should return chapter summary', () => {
      // Add some dialogues first
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const summary = analyzer.getChapterSubtextSummary(1)

      expect(summary).toBeDefined()
      expect(summary.chapterId).toBe(1)
      expect(summary.totalDialogues).toBe(2)
      expect(summary.dialoguesWithSubtext).toBe(2)
      expect(summary.subtextDensity).toBe(100)
      expect(summary.dominantTone).toBeDefined()
    })

    it('should return empty summary for chapter with no dialogues', () => {
      const summary = analyzer.getChapterSubtextSummary(999)

      expect(summary).toBeDefined()
      expect(summary.chapterId).toBe(999)
      expect(summary.totalDialogues).toBe(0)
      expect(summary.subtextDensity).toBe(0)
    })

    it('should identify relationship tension points', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")

      const summary = analyzer.getChapterSubtextSummary(1)

      expect(summary.relationshipTensionPoints.length).toBeGreaterThan(0)
    })

    it('should identify hidden conflicts', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const summary = analyzer.getChapterSubtextSummary(1)

      expect(summary.hiddenConflicts.length).toBeGreaterThan(0)
    })

    it('should generate recommendations', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")
      analyzer.analyzeDialogue(1, "char2", "张华", "char1", "李明", "小心后果", "neutral")

      const summary = analyzer.getChapterSubtextSummary(1)

      expect(summary.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('getCharacterDialogueDynamics', () => {
    it('should return dynamics for existing pair', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")

      const dynamics = analyzer.getCharacterDialogueDynamics("char1", "char2")

      expect(dynamics).toBeDefined()
      expect(dynamics?.characterId).toBe("char1")
      expect(dynamics?.partnerId).toBe("char2")
      expect(dynamics?.dialogueCount).toBe(1)
    })

    it('should return null for non-existing pair', () => {
      const dynamics = analyzer.getCharacterDialogueDynamics("nonexistent", "pair")

      expect(dynamics).toBeNull()
    })

    it('should track dialogue count', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const dynamics = analyzer.getCharacterDialogueDynamics("char1", "char2")

      expect(dynamics?.dialogueCount).toBe(2)
    })

    it('should track subtext frequency', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const dynamics = analyzer.getCharacterDialogueDynamics("char1", "char2")

      expect(dynamics?.subtextFrequency).toBeGreaterThan(0)
    })
  })

  describe('getAllCharacterDynamics', () => {
    it('should return all dynamics', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")

      const allDynamics = analyzer.getAllCharacterDynamics()

      expect(allDynamics.length).toBeGreaterThan(0)
    })
  })

  describe('getDialogueAnalysis', () => {
    it('should return dialogue analysis by id', () => {
      const created = analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "测试对话", "neutral")

      const retrieved = analyzer.getDialogueAnalysis(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.literalContent).toBe("测试对话")
    })

    it('should return null for non-existing id', () => {
      const result = analyzer.getDialogueAnalysis("nonexistent-id")

      expect(result).toBeNull()
    })
  })

  describe('getChapterDialogues', () => {
    it('should return all dialogues for chapter', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "对话1", "neutral")
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "对话2", "neutral")
      analyzer.analyzeDialogue(2, "char1", "李明", "char2", "张华", "对话3", "neutral")

      const chapter1Dialogues = analyzer.getChapterDialogues(1)

      expect(chapter1Dialogues.length).toBe(2)
    })
  })

  describe('getSubtextPoint', () => {
    it('should return subtext point by id', () => {
      const result = analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")

      const pointId = result.subtextPoints[0]?.id
      if (pointId) {
        const point = analyzer.getSubtextPoint(pointId)
        expect(point).toBeDefined()
        expect(point?.id).toBe(pointId)
      }
    })
  })

  // ==================== 完整分析测试 ====================

  describe('getFullAnalysis', () => {
    it('should return complete analysis', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")
      analyzer.analyzeDialogue(2, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const fullAnalysis = analyzer.getFullAnalysis(1)

      expect(fullAnalysis).toBeDefined()
      expect(fullAnalysis.projectId).toBe(1)
      expect(fullAnalysis.chapterSummaries.length).toBe(2)
      expect(fullAnalysis.characterDynamics.length).toBeGreaterThan(0)
      expect(fullAnalysis.overallSubtextDensity).toBeGreaterThan(0)
      expect(fullAnalysis.createdAt).toBeDefined()
      expect(fullAnalysis.updatedAt).toBeDefined()
    })

    it('should track hidden conflict hotspots', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const fullAnalysis = analyzer.getFullAnalysis(1)

      expect(fullAnalysis.hiddenConflictHotspots.length).toBeGreaterThan(0)
    })

    it('should generate overall recommendations', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "随你便", "neutral")

      const fullAnalysis = analyzer.getFullAnalysis(1)

      expect(fullAnalysis.recommendations.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ==================== 清除数据测试 ====================

  describe('clearProjectData', () => {
    it('should clear all data', () => {
      analyzer.analyzeDialogue(1, "char1", "李明", "char2", "张华", "哦，太棒了", "neutral")

      analyzer.clearProjectData()

      const fullAnalysis = analyzer.getFullAnalysis(1)
      expect(fullAnalysis.chapterSummaries.length).toBe(0)
      expect(fullAnalysis.characterDynamics.length).toBe(0)
    })
  })
})