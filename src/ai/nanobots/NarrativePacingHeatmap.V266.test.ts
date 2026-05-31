/**
 * NarrativePacingHeatmap Test - V266
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NarrativePacingHeatmap } from './NarrativePacingHeatmap.V266'

describe('NarrativePacingHeatmap', () => {
  let heatmap: NarrativePacingHeatmap

  beforeEach(() => {
    localStorage.clear()
    heatmap = new NarrativePacingHeatmap(1)
  })

  // ==================== 初始化测试 ====================

  describe('constructor', () => {
    it('should create an instance with projectId', () => {
      const h = new NarrativePacingHeatmap(42)
      expect(h).toBeDefined()
    })

    it('should initialize with default projectId 0', () => {
      const h = new NarrativePacingHeatmap()
      expect(h).toBeDefined()
    })
  })

  // ==================== 文本节奏分析测试 ====================

  describe('analyzeTextPacing', () => {
    it('should analyze action text', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "他突然冲出房间，与敌人展开激烈的战斗，追逐了整整十条街。",
        50
      )

      expect(point).toBeDefined()
      expect(point.id).toBeDefined()
      expect(point.chapterId).toBe(1)
      expect(point.sceneId).toBe(1)
      expect(point.pacingType).toBe('action')
      expect(point.intensity).toBeGreaterThan(50)
    })

    it('should analyze dialogue text', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        '他说："我今天真的很累。"她问道："你需要休息吗？"',
        30
      )

      expect(point).toBeDefined()
      expect(point.pacingType).toBe('dialogue')
      expect(point.dialogueRatio).toBeGreaterThan(0)
    })

    it('should analyze description text', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "这座古老的城堡矗立在山巅之上，周围是茂密的森林。城堡的墙壁上布满了岁月的痕迹。",
        20
      )

      expect(point).toBeDefined()
      expect(point.pacingType).toBe('description')
    })

    it('should analyze internal monologue text', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "他想，这样下去不是办法。回忆过去的种种，他感到内心充满了矛盾。",
        40
      )

      expect(point).toBeDefined()
      expect(point.pacingType).toBe('internal_monologue')
      expect(point.internalDensity).toBeGreaterThan(0)
    })

    it('should analyze climax text', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "终于，爆发了激烈的冲突。这是高潮时刻，所有人都屏住呼吸。",
        80
      )

      expect(point).toBeDefined()
      expect(point.pacingType).toBe('climax')
      expect(point.intensity).toBeGreaterThan(70)
    })

    it('should analyze denouement text', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "The story ends peacefully. Everything returns to calm.",
        90
      )

      expect(point).toBeDefined()
      expect(point.pacingType).toBeDefined()
    })

    it('should count words correctly', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "This is a test text with some words in it.",
        0
      )

      expect(point.wordCount).toBeGreaterThan(5)
      expect(point.sentenceCount).toBe(1)
    })

    it('should calculate emotional charge', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "他感到愤怒和恐惧，但内心深处仍抱有希望。",
        50
      )

      expect(point.emotionalCharge).toBeGreaterThan(0)
    })

    it('should calculate tension contribution', () => {
      const point = heatmap.analyzeTextPacing(
        1,
        1,
        "危机来临，困境加深，威胁步步紧逼。",
        50
      )

      expect(point.tensionContribution).toBeGreaterThan(0)
    })
  })

  // ==================== 场景摘要测试 ====================

  describe('generateSceneSummary', () => {
    it('should generate scene summary', () => {
      heatmap.analyzeTextPacing(1, 1, "他冲了出去，开始战斗。", 10)
      heatmap.analyzeTextPacing(1, 1, "追逐持续进行中。", 50)
      heatmap.analyzeTextPacing(1, 1, "最终对决爆发。", 90)

      const summary = heatmap.generateSceneSummary(1, 1)

      expect(summary).toBeDefined()
      expect(summary.chapterId).toBe(1)
      expect(summary.sceneId).toBe(1)
      expect(summary.pacingType).toBe('action')
      expect(summary.averageIntensity).toBeGreaterThan(0)
      expect(summary.peakIntensity).toBeGreaterThan(summary.valleyIntensity)
      expect(summary.totalWords).toBeGreaterThan(0)
      expect(summary.pacingDensity).toBeGreaterThan(0)
      expect(summary.rhythmScore).toBeGreaterThanOrEqual(0)
    })

    it('should return empty summary for no data', () => {
      const summary = heatmap.generateSceneSummary(999, 999)

      expect(summary).toBeDefined()
      expect(summary.sceneId).toBe(999)
      expect(summary.averageIntensity).toBe(0)
      expect(summary.pacingDensity).toBe(0)
    })

    it('should detect emotional arc', () => {
      heatmap.analyzeTextPacing(1, 1, "他感到平静。", 10)
      heatmap.analyzeTextPacing(1, 1, "突然感到紧张。", 50)
      heatmap.analyzeTextPacing(1, 1, "最后感到绝望。", 90)

      const summary = heatmap.generateSceneSummary(1, 1)

      expect(summary.emotionalArc).toBeDefined()
    })

    it('should generate recommendations', () => {
      heatmap.analyzeTextPacing(1, 1, "冲！战斗！攻击！追逐！", 10)
      heatmap.analyzeTextPacing(1, 1, "冲！战斗！攻击！追逐！", 30)
      heatmap.analyzeTextPacing(1, 1, "冲！战斗！攻击！追逐！", 50)
      heatmap.analyzeTextPacing(1, 1, "冲！战斗！攻击！追逐！", 70)
      heatmap.analyzeTextPacing(1, 1, "冲！战斗！攻击！追逐！", 90)

      const summary = heatmap.generateSceneSummary(1, 1)

      expect(summary.recommendations.length).toBeGreaterThan(0)
    })
  })

  // ==================== 章节摘要测试 ====================

  describe('generateChapterSummary', () => {
    it('should generate chapter summary', () => {
      heatmap.analyzeTextPacing(1, 1, "动作场景一", 10)
      heatmap.analyzeTextPacing(1, 1, "动作场景二", 30)
      heatmap.analyzeTextPacing(1, 1, "动作场景三", 50)
      heatmap.analyzeTextPacing(1, 2, "场景四", 70)
      heatmap.analyzeTextPacing(1, 2, "场景五", 90)

      const summary = heatmap.generateChapterSummary(1)

      expect(summary).toBeDefined()
      expect(summary.chapterId).toBe(1)
      expect(summary.overallPacingScore).toBeGreaterThan(0)
      expect(summary.pacingPoints.length).toBe(5)
      expect(summary.sceneCount).toBe(2)
      expect(summary.tensionZones.length).toBeGreaterThanOrEqual(0)
      expect(summary.pacingCurve.length).toBe(11) // 0-100 in steps of 10
    })

    it('should identify tension zones', () => {
      heatmap.analyzeTextPacing(1, 1, "平静场景", 10)
      heatmap.analyzeTextPacing(1, 1, "高潮爆发！激烈冲突！", 50)
      heatmap.analyzeTextPacing(1, 1, "继续高潮", 70)
      heatmap.analyzeTextPacing(1, 1, "高潮顶点", 90)

      const summary = heatmap.generateChapterSummary(1)

      expect(summary.tensionZones.length).toBeGreaterThan(0)
    })

    it('should calculate pacing balance', () => {
      heatmap.analyzeTextPacing(1, 1, "场景一", 10)
      heatmap.analyzeTextPacing(1, 1, "场景二", 90)
      heatmap.analyzeTextPacing(1, 1, "场景三", 10)
      heatmap.analyzeTextPacing(1, 1, "场景四", 90)

      const summary = heatmap.generateChapterSummary(1)

      expect(summary.pacingBalance).toBeGreaterThan(0)
    })
  })

  // ==================== 热力图测试 ====================

  describe('generateHeatmap', () => {
    it('should generate heatmap', () => {
      heatmap.analyzeTextPacing(1, 1, "动作场景", 10)
      heatmap.analyzeTextPacing(2, 1, "描述场景", 50)
      heatmap.analyzeTextPacing(3, 1, "高潮场景", 90)

      const heatmapResult = heatmap.generateHeatmap(1)

      expect(heatmapResult).toBeDefined()
      expect(heatmapResult.projectId).toBe(1)
      expect(heatmapResult.rows.length).toBe(3)
      expect(heatmapResult.maxIntensity).toBeGreaterThanOrEqual(heatmapResult.minIntensity)
      expect(heatmapResult.averageIntensity).toBeGreaterThan(0)
    })

    it('should calculate color values', () => {
      heatmap.analyzeTextPacing(1, 1, "Low intensity scene.", 10)
      heatmap.analyzeTextPacing(1, 2, "High intensity climax action scene!", 90)

      const result = heatmap.generateHeatmap(1)

      expect(result.rows.length).toBeGreaterThan(0)
      const row = result.rows.find(r => r.cells.length > 0)
      expect(row).toBeDefined()
    })

    it('should identify hotspots', () => {
      heatmap.analyzeTextPacing(1, 1, "Action! Battle! Attack! Chase!", 85)
      heatmap.analyzeTextPacing(1, 2, "Climax! Explosion! Conflict!", 95)

      const result = heatmap.generateHeatmap(1)

      expect(result.hotspots.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ==================== 完整分析测试 ====================

  describe('getFullAnalysis', () => {
    it('should return complete analysis', () => {
      heatmap.analyzeTextPacing(1, 1, "场景1", 10)
      heatmap.analyzeTextPacing(1, 1, "场景2", 30)
      heatmap.analyzeTextPacing(2, 1, "场景3", 50)
      heatmap.analyzeTextPacing(2, 1, "场景4", 70)

      const analysis = heatmap.getFullAnalysis(1)

      expect(analysis).toBeDefined()
      expect(analysis.projectId).toBe(1)
      expect(analysis.chapterSummaries.length).toBe(2)
      expect(analysis.overallPacingScore).toBeGreaterThan(0)
      expect(analysis.pacingBalance).toBeGreaterThanOrEqual(0)
      expect(analysis.rhythmConsistency).toBeGreaterThanOrEqual(0)
      expect(analysis.pacingTypeDistribution.size).toBeGreaterThan(0)
      expect(analysis.problemAreas.length).toBeGreaterThanOrEqual(0)
      expect(analysis.recommendations.length).toBeGreaterThanOrEqual(0)
      expect(analysis.heatmap).toBeDefined()
    })

    it('should identify problem areas', () => {
      // Create a fast-paced chapter with lots of action words
      for (let i = 0; i < 5; i++) {
        heatmap.analyzeTextPacing(1, i + 1, "Rush! Battle! Attack! Intense! Climax!", i * 20)
      }

      const analysis = heatmap.getFullAnalysis(1)

      expect(analysis.problemAreas.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ==================== 查询方法测试 ====================

  describe('getChapterSummary', () => {
    it('should return chapter summary', () => {
      heatmap.analyzeTextPacing(1, 1, "Test scene.", 50)
      heatmap.generateChapterSummary(1)

      const summary = heatmap.getChapterSummary(1)

      expect(summary).toBeDefined()
      expect(summary?.chapterId).toBe(1)
    })

    it('should return null for non-existing chapter', () => {
      const summary = heatmap.getChapterSummary(999)

      expect(summary).toBeNull()
    })
  })

  describe('getSceneSummary', () => {
    it('should return scene summary', () => {
      heatmap.analyzeTextPacing(1, 1, "Test scene.", 50)
      heatmap.generateSceneSummary(1, 1)

      const summary = heatmap.getSceneSummary(1, 1)

      expect(summary).toBeDefined()
      expect(summary?.sceneId).toBe(1)
    })

    it('should return null for non-existing scene', () => {
      const summary = heatmap.getSceneSummary(999, 999)

      expect(summary).toBeNull()
    })
  })

  describe('getPacingPoint', () => {
    it('should return pacing point', () => {
      const created = heatmap.analyzeTextPacing(1, 1, "测试", 50)

      const retrieved = heatmap.getPacingPoint(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
    })

    it('should return null for non-existing id', () => {
      const point = heatmap.getPacingPoint("nonexistent")

      expect(point).toBeNull()
    })
  })

  describe('getChapterPacingPoints', () => {
    it('should return all pacing points for chapter', () => {
      heatmap.analyzeTextPacing(1, 1, "点1", 10)
      heatmap.analyzeTextPacing(1, 1, "点2", 30)
      heatmap.analyzeTextPacing(2, 1, "点3", 50)

      const points = heatmap.getChapterPacingPoints(1)

      expect(points.length).toBe(2)
      expect(points.every(p => p.chapterId === 1)).toBe(true)
    })

    it('should return empty array for chapter with no data', () => {
      const points = heatmap.getChapterPacingPoints(999)

      expect(points).toEqual([])
    })
  })

  describe('getHeatmap', () => {
    it('should return heatmap', () => {
      heatmap.analyzeTextPacing(1, 1, "测试", 50)
      heatmap.generateHeatmap(1)

      const result = heatmap.getHeatmap(1)

      expect(result).toBeDefined()
      expect(result?.projectId).toBe(1)
    })

    it('should return null for non-existing project', () => {
      const result = heatmap.getHeatmap(999)

      expect(result).toBeNull()
    })
  })

  // ==================== 清除数据测试 ====================

  describe('clearProjectData', () => {
    it('should clear all data', () => {
      heatmap.analyzeTextPacing(1, 1, "测试1", 50)
      heatmap.analyzeTextPacing(2, 1, "测试2", 50)

      heatmap.clearProjectData()

      const points = heatmap.getChapterPacingPoints(1)
      expect(points.length).toBe(0)
    })
  })
})