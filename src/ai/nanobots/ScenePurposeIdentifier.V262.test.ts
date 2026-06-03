/**
 * ScenePurposeIdentifier - V262 Tests
 * 场景目的识别引擎测试套件
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Lesson } from '../evolution/SelfEvolutionEngine'
import { ScenePurposeIdentifier } from './ScenePurposeIdentifier.V262'

// ==================== 测试数据 ====================

const SAMPLE_SCENES = {
  characterDevScene: {
    sceneId: 1,
    chapterId: 1,
    content: `John stood at the edge of the cliff, looking down at the valley below. He had learned so much since leaving home. The trials had changed him fundamentally - he now understood what true courage meant. 
    Maria approached quietly. "You're different now," she said with a knowing smile. "The journey has shaped you."
    John nodded slowly, feeling the weight of his transformed beliefs. He had decided to embrace his new destiny, no matter the cost.`,
    characters: [
      { id: 'char_1', name: 'John', state: 'determined' },
      { id: 'char_2', name: 'Maria', state: 'supportive' },
    ],
  },

  plotAdvancementScene: {
    sceneId: 2,
    chapterId: 1,
    content: `The next morning, the messenger arrived at the gates. He found Elena waiting.
    "紧急情报！" he announced breathlessly. "敌军已经越过边境，正在向首都推进。"
    Elena's face hardened. She immediately sent word to the generals and prepared for war.
    Meanwhile, in the eastern province, the rebels found the hidden documents that would change everything.`,
    characters: [
      { id: 'char_3', name: 'Elena', state: 'determined' },
    ],
  },

  worldBuildingScene: {
    sceneId: 3,
    chapterId: 1,
    content: `The Grand Library of Solmoria had stood for three thousand years. Its massive dome reflected the setting sun, casting an amber glow across the marble floors.
    According to tradition, only the keepers were allowed to read the forbidden texts. The society's customs dated back to the First Age, when magic still flowed freely through the world.`,
    characters: [],
  },

  conflictScene: {
    sceneId: 4,
    chapterId: 1,
    content: `"You have betrayed everything we fought for!" Marcus shouted, his voice echoing off the stone walls.
    Daniel stood his ground, facing his former friend. "I did what I had to do. You'll never understand."
    The tension between them was palpable. Both knew a fight was inevitable.
    "Then we settle this now," Marcus replied, drawing his sword.`,
    characters: [
      { id: 'char_4', name: 'Marcus', state: 'angry' },
      { id: 'char_5', name: 'Daniel', state: 'defiant' },
    ],
  },

  romanticScene: {
    sceneId: 5,
    chapterId: 1,
    content: `As the moonlight filtered through the window, Sarah felt her heart racing. James turned to face her, their eyes meeting across the candlelit room.
    She felt a rush of attraction she couldn't deny. The way he looked at her made her pulse quicken.
    They stood close, the air between them charged with unspoken words.`,
    characters: [
      { id: 'char_6', name: 'Sarah', state: 'romantic' },
      { id: 'char_7', name: 'James', state: 'romantic' },
    ],
  },

  transitionScene: {
    sceneId: 6,
    chapterId: 1,
    content: `Meanwhile, far to the north, the winter winds began to blow.
    Three weeks passed. The snow had melted by the time Alex returned to the village.
    Later that evening, the travelers made their way back to the inn.`,
    characters: [],
  },

  mysteryScene: {
    sceneId: 7,
    chapterId: 2,
    content: `Something strange had happened that night. The villagers whispered about the mysterious lights in the forest.
    Why did the animals behave so strangely? What was hidden in the old temple?
    The questions swirled in Eleanor's mind as she approached the forbidden grove.`,
    characters: [
      { id: 'char_8', name: 'Eleanor', state: 'curious' },
    ],
  },

  tensionBuildScene: {
    sceneId: 8,
    chapterId: 2,
    content: `The clock ticked loudly. Time was running out.
    Rachel felt the pressure mounting with every passing second. The explosion would happen in minutes.
    The situation was critical. Everyone needed to act fast.
    Her heart was racing as she made the desperate decision.`,
    characters: [
      { id: 'char_9', name: 'Rachel', state: 'panicked' },
    ],
  },

  shortScene: {
    sceneId: 9,
    chapterId: 2,
    content: `John woke up. It was morning.`,
    characters: [{ id: 'char_1', name: 'John', state: 'neutral' }],
  },
}

// ==================== 测试套件 ====================

describe("ScenePurposeIdentifier - V262", () => {
  let identifier: ScenePurposeIdentifier

  beforeEach(() => {
    identifier = new ScenePurposeIdentifier(1)
  })

  // ─── 基础功能测试 ─────────────────────────────────────────────────────────

  describe("基础功能", () => {
    it("应该创建ScenePurposeIdentifier实例", () => {
      expect(identifier).toBeDefined()
      expect(identifier instanceof ScenePurposeIdentifier).toBe(true)
    })

    it("应该为空时返回undefined查询", () => {
      expect(identifier.getScenePurpose(999)).toBeUndefined()
    })
  })

  // ─── 场景目的识别测试 ──────────────────────────────────────────────────

  describe("场景目的识别", () => {
    it("应该识别角色发展场景", () => {
      const scene = SAMPLE_SCENES.characterDevScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result).toBeDefined()
      expect(result.primaryPurpose).toBe("character_development")
      expect(result.necessityLevel).toBeDefined()
      expect(result.overallImpact).toBeGreaterThan(0)
    })

    it("应该识别情节推进场景", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("plot_advancement")
    })

    it("应该识别世界观构建场景", () => {
      const scene = SAMPLE_SCENES.worldBuildingScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("world_building")
    })

    it("应该识别冲突建立场景", () => {
      const scene = SAMPLE_SCENES.conflictScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("conflict_establishment")
    })

    it("应该识别情感发展场景", () => {
      const scene = SAMPLE_SCENES.romanticScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("romantic_development")
    })

    it("应该识别转场场景", () => {
      const scene = SAMPLE_SCENES.transitionScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("transition")
    })

    it("应该识别悬念场景", () => {
      const scene = SAMPLE_SCENES.mysteryScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("mystery_setup")
    })

    it("应该识别张力构建场景", () => {
      const scene = SAMPLE_SCENES.tensionBuildScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.primaryPurpose).toBe("tension_build")
    })
  })

  // ─── 必要性评估测试 ───────────────────────────────────────────────────

  describe("必要性评估", () => {
    it("应该计算合理的必要性得分 (0-100)", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.necessityScore).toBeGreaterThanOrEqual(0)
      expect(result.necessityScore).toBeLessThanOrEqual(100)
    })

    it("应该返回正确的必要性级别", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      const validLevels = ["essential", "important", "supportive", "optional", "redundant"]
      expect(validLevels).toContain(result.necessityLevel)
    })

    it("短内容应该降低必要性得分", () => {
      const longScene = SAMPLE_SCENES.plotAdvancementScene
      const shortScene = SAMPLE_SCENES.shortScene

      const longResult = identifier.identifyScenePurpose(
        longScene.sceneId,
        longScene.chapterId,
        longScene.content,
        { characters: longScene.characters }
      )

      const shortResult = identifier.identifyScenePurpose(
        shortScene.sceneId,
        shortScene.chapterId,
        shortScene.content,
        { characters: shortScene.characters }
      )

      expect(longResult.necessityScore).toBeGreaterThan(shortResult.necessityScore)
    })

    it("重复场景应该降低必要性", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene

      const result1 = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      const result2 = identifier.identifyScenePurpose(
        scene.sceneId + 100,
        scene.chapterId,
        scene.content,
        { characters: scene.characters, existingPurposes: [result1] }
      )

      expect(result2.necessityScore).toBeLessThanOrEqual(result1.necessityScore)
    })
  })

  // ─── 影响力评估测试 ───────────────────────────────────────────────────

  describe("影响力评估", () => {
    it("应该返回所有影响力维度", () => {
      const scene = SAMPLE_SCENES.characterDevScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.impactDimensions).toBeDefined()
      expect(typeof result.impactDimensions.characterGrowth).toBe("number")
      expect(typeof result.impactDimensions.plotProgression).toBe("number")
      expect(typeof result.impactDimensions.emotionalResonance).toBe("number")
      expect(typeof result.impactDimensions.themeConnection).toBe("number")
      expect(typeof result.impactDimensions.pacingEffect).toBe("number")
    })

    it("影响力值应该在0-100范围内", () => {
      const scene = SAMPLE_SCENES.characterDevScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      const dims = result.impactDimensions
      expect(dims.characterGrowth).toBeGreaterThanOrEqual(0)
      expect(dims.characterGrowth).toBeLessThanOrEqual(100)
    })

    it("应该计算综合影响力", () => {
      const scene = SAMPLE_SCENES.characterDevScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      expect(result.overallImpact).toBeGreaterThanOrEqual(0)
      expect(result.overallImpact).toBeLessThanOrEqual(100)
    })
  })

  // ─── 场景关联测试 ─────────────────────────────────────────────────────

  describe("场景关联", () => {
    it("应该为有前后场景的上下文创建关联", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        {
          characters: scene.characters,
          previousSceneId: 1,
          nextSceneId: 3,
        }
      )

      expect(result.connections.length).toBeGreaterThanOrEqual(2)
    })

    it("应该正确识别关联类型", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        {
          characters: scene.characters,
          previousSceneId: 1,
          nextSceneId: 3,
        }
      )

      const validTypes = ["causal", "thematic", "character", "emotional", "temporal", "contrast", "foreshadow"]
      for (const conn of result.connections) {
        expect(validTypes).toContain(conn.connectionType)
      }
    })

    it("关联强度应该在0-100之间", () => {
      const scene = SAMPLE_SCENES.plotAdvancementScene
      const result = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        {
          characters: scene.characters,
          previousSceneId: 1,
          nextSceneId: 3,
        }
      )

      for (const conn of result.connections) {
        expect(conn.strength).toBeGreaterThanOrEqual(0)
        expect(conn.strength).toBeLessThanOrEqual(100)
      }
    })
  })

  // ─── 批量分析测试 ─────────────────────────────────────────────────────

  describe("批量分析", () => {
    it("应该分析章节内所有场景", () => {
      const scenes = [
        {
          sceneId: 1,
          content: SAMPLE_SCENES.characterDevScene.content,
          previousSceneId: undefined,
          nextSceneId: 2,
          characters: SAMPLE_SCENES.characterDevScene.characters,
        },
        {
          sceneId: 2,
          content: SAMPLE_SCENES.plotAdvancementScene.content,
          previousSceneId: 1,
          nextSceneId: 3,
          characters: SAMPLE_SCENES.plotAdvancementScene.characters,
        },
        {
          sceneId: 3,
          content: SAMPLE_SCENES.worldBuildingScene.content,
          previousSceneId: 2,
          nextSceneId: undefined,
          characters: SAMPLE_SCENES.worldBuildingScene.characters,
        },
      ]

      const result = identifier.analyzeChapterScenes(1, scenes)

      expect(result.chapterId).toBe(1)
      expect(result.sceneCount).toBe(3)
      expect(result.purposes.length).toBe(3)
      expect(result.redundantScenes).toBeDefined()
    })

    it("应该计算章节整体必要性得分", () => {
      const scenes = [
        {
          sceneId: 1,
          content: SAMPLE_SCENES.plotAdvancementScene.content,
          characters: SAMPLE_SCENES.plotAdvancementScene.characters,
        },
        {
          sceneId: 2,
          content: SAMPLE_SCENES.plotAdvancementScene.content,
          characters: SAMPLE_SCENES.plotAdvancementScene.characters,
        },
      ]

      const result = identifier.analyzeChapterScenes(1, scenes)
      expect(result.totalNecessityScore).toBeGreaterThanOrEqual(0)
      expect(result.totalNecessityScore).toBeLessThanOrEqual(100)
    })

    it("应该生成章节建议", () => {
      const scenes = [
        {
          sceneId: 1,
          content: SAMPLE_SCENES.plotAdvancementScene.content,
          characters: SAMPLE_SCENES.plotAdvancementScene.characters,
        },
      ]

      const result = identifier.analyzeChapterScenes(1, scenes)
      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it("应该检测冗余场景", () => {
      const scenes = [
        {
          sceneId: 1,
          content: SAMPLE_SCENES.plotAdvancementScene.content,
          characters: SAMPLE_SCENES.plotAdvancementScene.characters,
        },
        {
          sceneId: 2,
          content: SAMPLE_SCENES.transitionScene.content, // 低分场景
          characters: SAMPLE_SCENES.transitionScene.characters,
        },
      ]

      const result = identifier.analyzeChapterScenes(1, scenes)
      expect(result.redundantScenes).toBeDefined()
    })
  })

  // ─── 查询接口测试 ─────────────────────────────────────────────────────

  describe("查询接口", () => {
    it("应该通过sceneId查询场景目的", () => {
      const scene = SAMPLE_SCENES.characterDevScene
      identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      const result = identifier.getScenePurpose(scene.sceneId)
      expect(result).toBeDefined()
      expect(result?.sceneId).toBe(scene.sceneId)
    })

    it("应该查询章节所有场景目的", () => {
      identifier.identifyScenePurpose(
        1, 1,
        SAMPLE_SCENES.characterDevScene.content,
        { characters: SAMPLE_SCENES.characterDevScene.characters }
      )
      identifier.identifyScenePurpose(
        2, 1,
        SAMPLE_SCENES.plotAdvancementScene.content,
        { characters: SAMPLE_SCENES.plotAdvancementScene.characters }
      )

      const results = identifier.getChapterPurposes(1)
      expect(results.length).toBe(2)
    })

    it("应该返回摘要列表", () => {
      identifier.identifyScenePurpose(
        1, 1,
        SAMPLE_SCENES.characterDevScene.content,
        { characters: SAMPLE_SCENES.characterDevScene.characters }
      )

      const summaries = identifier.getSummary()
      expect(summaries.length).toBeGreaterThan(0)
      expect(summaries[0].sceneId).toBeDefined()
      expect(summaries[0].necessityLevel).toBeDefined()
    })
  })

  // ─── 自我进化测试 ─────────────────────────────────────────────────────

  describe("自我进化", () => {
    it("应该从Lesson学习并调整参数", () => {
      const scene = SAMPLE_SCENES.characterDevScene
      const original = identifier.identifyScenePurpose(
        scene.sceneId,
        scene.chapterId,
        scene.content,
        { characters: scene.characters }
      )

      const lesson: Lesson = {
        id: "lesson_1",
        type: "scene_analysis",
        timestamp: Date.now(),
        sceneId: scene.sceneId,
        feedback: {
          necessityScore: 10, // 正向反馈
          impactScores: {
            characterGrowth: 85,
          },
        },
        adjustment: {
          necessityWeight: 0.1,
        },
      }

      identifier.learnFromLesson(lesson)

      const updated = identifier.getScenePurpose(scene.sceneId)
      expect(updated?.timestamp).toBeGreaterThan(original.timestamp)
    })

    it("应该忽略非scene_analysis类型的Lesson", () => {
      const lesson: Lesson = {
        id: "lesson_2",
        type: "pacing_feedback",
        timestamp: Date.now(),
        sceneId: 999,
        feedback: {},
        adjustment: {},
      }

      // 不应抛出错误
      expect(() => identifier.learnFromLesson(lesson)).not.toThrow()
    })
  })

  // ─── 边界情况测试 ─────────────────────────────────────────────────────

  describe("边界情况", () => {
    it("应该处理空内容", () => {
      const result = identifier.identifyScenePurpose(1, 1, "", {})
      expect(result.primaryPurpose).toBeDefined()
      expect(result.necessityScore).toBeGreaterThanOrEqual(0)
    })

    it("应该处理超长内容", () => {
      const longContent = "测试。".repeat(10000)
      const result = identifier.identifyScenePurpose(1, 1, longContent, {})
      expect(result.overallImpact).toBeLessThanOrEqual(100)
    })

    it("应该处理没有字符的场景", () => {
      const result = identifier.identifyScenePurpose(
        1, 1,
        SAMPLE_SCENES.worldBuildingScene.content,
        { characters: [] }
      )
      expect(result.primaryPurpose).toBeDefined()
    })

    it("应该处理没有上下文的场景", () => {
      const result = identifier.identifyScenePurpose(
        1, 1,
        SAMPLE_SCENES.plotAdvancementScene.content,
        {}
      )
      expect(result.primaryPurpose).toBeDefined()
    })
  })
})