/**
 * V22 一致性检查器
 * Phase 2: 一致性检查
 * 
 * 功能：
 * - 检查角色特征一致性
 * - 检查关系动态一致性
 * - 检查情节时间线一致性
 */

import { longTermMemoryManager } from './LongTermMemoryManager'
import type { 
  ConsistencyIssue,
  V22CharacterMemory as CharacterMemory,
  V22PlotMemory as PlotMemory,
  V22TimelineEvent as TimelineEvent,
  RelationshipSnapshot,
  Foreshadowing,
  BeliefChange,
} from './types'

export interface ConsistencyCheckOptions {
  projectId: number
  chapter?: number
  content?: string
}

export interface ConsistencyCheckResult {
  characterIssues: ConsistencyIssue[]
  relationshipIssues: ConsistencyIssue[]
  plotIssues: ConsistencyIssue[]
  timelineIssues: ConsistencyIssue[]
  overallScore: number
}

class ConsistencyChecker {
  /**
   * 检查角色特征一致性
   * 验证角色在不同章节中的特征是否保持一致
   */
  async checkCharacterConsistency(
    characterId: string,
    newContent?: string
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    
    const character = await longTermMemoryManager.getCharacterMemoryByCharacterId(characterId)
    if (!character) return issues

    // 1. 检查性格特征一致性
    issues.push(...this.checkTraitConsistency(character))

    // 2. 检查信念变化时间线
    issues.push(...this.checkBeliefChangeConsistency(character))

    // 3. 检查情感弧与成长事件的一致性
    issues.push(...this.checkGrowthEmotionConsistency(character))

    // 4. 如果提供了新内容，检查新内容是否与现有角色状态矛盾
    if (newContent) {
      issues.push(...await this.checkContentCharacterConsistency(character, newContent))
    }

    return issues
  }

  /**
   * 检查性格特征一致性
   */
  private checkTraitConsistency(character: CharacterMemory): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []
    
    // 检查成长日志中的性格特征变化
    const traitChanges = character.growthLog.map(g => ({
      chapter: g.chapter,
      traits: g.affectedTraits,
    }))

    // 性格特征突变检测（没有过渡说明的重大变化）
    for (let i = 1; i < traitChanges.length; i++) {
      const prev = traitChanges[i - 1]
      const curr = traitChanges[i]
      
      // 检查是否删除了之前的核心特征
      const removedCoreTraits = prev.traits.filter(
        t => !curr.traits.includes(t) && prev.chapter !== curr.chapter
      )
      
      if (removedCoreTraits.length > 0) {
        // 检查两次事件之间是否有足够的章节过渡
        const chapterGap = curr.chapter - prev.chapter
        if (chapterGap < 3) {
          issues.push({
            type: 'character_state',
            severity: 'minor',
            description: `角色 ${character.name} 的核心性格特征 "${removedCoreTraits[0]}" 被移除，但章节跨度不足`,
            existingInfo: `第${prev.chapter}章: 拥有特征 ${prev.traits.join(', ')}`,
            newInfo: `第${curr.chapter}章: 特征变为 ${curr.traits.join(', ')}`,
            suggestion: '建议添加性格过渡的描写，或增加章节间隔让变化更自然',
          })
        }
      }
    }

    return issues
  }

  /**
   * 检查信念变化一致性
   */
  private checkBeliefChangeConsistency(character: CharacterMemory): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []
    const beliefChanges = character.beliefChanges

    for (let i = 1; i < beliefChanges.length; i++) {
      const prev = beliefChanges[i - 1]
      const curr = beliefChanges[i]

      // 检查章节顺序
      if (curr.chapter < prev.chapter) {
        issues.push({
          type: 'character_state',
          severity: 'major',
          description: `角色 ${character.name} 的信念变化时间线回退`,
          existingInfo: `第${prev.chapter}章: ${prev.before} -> ${prev.after}`,
          newInfo: `第${curr.chapter}章: ${curr.before} -> ${curr.after}`,
          suggestion: '检查信念变化的顺序是否正确',
        })
      }

      // 检查是否有循环逻辑问题（例如A->B->A在没有充分理由的情况下）
      if (prev.after === curr.before && prev.before === curr.after) {
        issues.push({
          type: 'character_state',
          severity: 'minor',
          description: `角色 ${character.name} 的信念发生循环变化`,
          existingInfo: `第${prev.chapter}章: ${prev.before} -> ${prev.after}`,
          newInfo: `第${curr.chapter}章: ${curr.before} -> ${curr.after}`,
          suggestion: '确保信念循环有合理的剧情支撑',
        })
      }
    }

    return issues
  }

  /**
   * 检查成长事件与情感弧的一致性
   */
  private checkGrowthEmotionConsistency(character: CharacterMemory): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []
    
    const emotionalArcs = character.emotionalArc
    const majorGrowthEvents = character.growthLog.filter(g => g.impact === 'major')

    for (const growth of majorGrowthEvents) {
      // 在成长事件前后1章内寻找情感记录
      const nearEmotions = emotionalArcs.filter(
        e => Math.abs(e.chapter - growth.chapter) <= 1
      )

      if (nearEmotions.length === 0) {
        issues.push({
          type: 'character_state',
          severity: 'minor',
          description: `角色 ${character.name} 在第${growth.chapter}章有重大成长但情感弧无对应记录`,
          existingInfo: `成长事件: ${growth.event}`,
          newInfo: '缺少情感变化记录',
          suggestion: '建议添加对应的情感弧记录',
        })
      }
    }

    // 检查情感弧的突变（没有成长事件支撑）
    for (let i = 1; i < emotionalArcs.length; i++) {
      const prev = emotionalArcs[i - 1]
      const curr = emotionalArcs[i]
      
      const intensityDelta = Math.abs(curr.intensity - prev.intensity)
      
      if (intensityDelta > 50) {
        // 检查是否有重大事件支撑
        const hasMajorEvent = character.growthLog.some(
          g => Math.abs(g.chapter - curr.chapter) <= 1 && g.impact === 'major'
        )
        
        if (!hasMajorEvent) {
          issues.push({
            type: 'character_state',
            severity: 'minor',
            description: `角色 ${character.name} 在第${curr.chapter}章情感强度大幅变化但无重大事件支撑`,
            existingInfo: `第${prev.chapter}章情感强度: ${prev.intensity}`,
            newInfo: `第${curr.chapter}章情感强度: ${curr.intensity}`,
            suggestion: '建议添加支撑情感突变的重大事件',
          })
        }
      }
    }

    return issues
  }

  /**
   * 检查内容与角色状态的一致性
   */
  private async checkContentCharacterConsistency(
    character: CharacterMemory,
    newContent: string
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []

    // 检查死亡角色不应有对话
    const isDeadState = character.personalityTraits.some(
      t => t.includes('死亡') || t.includes('已故')
    )

    if (isDeadState) {
      const dialoguePatterns = [
        /\"[^\"]+\"/g,
        /(['\""])[^'"\n]+['\""]\s*[说讲问道答喊叫]/g,
        /[说讲问道答喊叫][道到]?\s*[""][^""]+[""]/g,
      ]

      for (const pattern of dialoguePatterns) {
        if (pattern.test(newContent)) {
          issues.push({
            type: 'character_state',
            severity: 'critical',
            description: `角色 "${character.name}" 已标记为死亡，不应有对话`,
            existingInfo: `角色状态: ${character.personalityTraits.join(', ')}`,
            newInfo: '检测到对话内容',
            suggestion: '删除该角色的对话，或修正其状态标记',
          })
          break
        }
      }
    }

    // 检查关系动态一致性
    const relationships = Array.from(character.relationships.values())
    for (const rel of relationships) {
      if (rel.dynamic.includes('敌对') || rel.dynamic.includes('仇恨')) {
        // 检查是否有突然亲密的描写
        const intimatePatterns = [
          /拥抱/,
          /亲吻/,
          /依偎/,
          /深情/,
          /爱意/,
        ]
        
        if (intimatePatterns.some(p => p.test(newContent))) {
          issues.push({
            type: 'character_state',
            severity: 'major',
            description: `角色 "${character.name}" 与 "${rel.targetName}" 关系动态为"${rel.dynamic}"，但新内容出现亲密描写`,
            existingInfo: `关系动态: ${rel.dynamic} (第${rel.chapter}章)`,
            newInfo: '检测到亲密描写',
            suggestion: '确保关系变化有合理的剧情发展支撑',
          })
        }
      }
    }

    return issues
  }

  /**
   * 检查关系动态一致性
   * 验证角色间关系的变化是否符合逻辑
   */
  async checkRelationshipConsistency(
    characterId: string
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    
    const character = await longTermMemoryManager.getCharacterMemoryByCharacterId(characterId)
    if (!character) return issues

    const relationships = Array.from(character.relationships.values())
    
    // 按目标角色分组关系快照
    const relMap = new Map<string, RelationshipSnapshot[]>()
    for (const rel of relationships) {
      const existing = relMap.get(rel.targetId) || []
      existing.push(rel)
      relMap.set(rel.targetId, existing)
    }

    // 检查每个角色的关系变化
    for (const [targetId, snapshots] of relMap) {
      // 按章节排序
      snapshots.sort((a, b) => a.chapter - b.chapter)

      for (let i = 1; i < snapshots.length; i++) {
        const prev = snapshots[i - 1]
        const curr = snapshots[i]

        // 检查关系类型突变
        if (prev.relationship !== curr.relationship) {
          const suddenChanges = ['陌生->挚友', '敌对->挚友', '陌生->恋人']
          const changeDesc = `${prev.relationship}->${curr.relationship}`
          
          if (suddenChanges.some(c => changeDesc.includes(c))) {
            const chapterGap = curr.chapter - prev.chapter
            if (chapterGap < 5) {
              issues.push({
                type: 'character_state',
                severity: 'minor',
                description: `角色 ${character.name} 与 ${curr.targetName} 的关系发生突变但章节跨度不足`,
                existingInfo: `第${prev.chapter}章: ${prev.relationship} (${prev.dynamic})`,
                newInfo: `第${curr.chapter}章: ${curr.relationship} (${curr.dynamic})`,
                suggestion: '建议增加关系发展的过渡章节',
              })
            }
          }
        }

        // 检查动态描述矛盾
        if (prev.relationship === curr.relationship && 
            (prev.dynamic.includes('友好') && curr.dynamic.includes('敌对') ||
             prev.dynamic.includes('敌对') && curr.dynamic.includes('友好'))) {
          // 检查是否有充分的事件支撑
          const chapterGap = curr.chapter - prev.chapter
          if (chapterGap < 3) {
            issues.push({
              type: 'character_state',
              severity: 'minor',
              description: `角色 ${character.name} 与 ${curr.targetName} 的关系动态发生矛盾`,
              existingInfo: `第${prev.chapter}章: ${prev.dynamic}`,
              newInfo: `第${curr.chapter}章: ${curr.dynamic}`,
              suggestion: '确保有具体事件支撑关系动态的转变',
            })
          }
        }
      }
    }

    return issues
  }

  /**
   * 检查情节时间线一致性
   * 验证伏笔、线索、冲突的时间逻辑
   */
  async checkPlotConsistency(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    
    const plotMemories = await longTermMemoryManager.getAllPlotMemories()

    for (const plot of plotMemories) {
      // 1. 检查伏笔时间逻辑
      issues.push(...this.checkForeshadowingTimeline(plot))

      // 2. 检查线索与冲突的一致性
      issues.push(...this.checkClueConflictConsistency(plot))

      // 3. 检查主题出现的一致性
      issues.push(...this.checkThemeConsistency(plot))
    }

    // 4. 检查跨情节的时间线一致性
    issues.push(...await this.checkCrossPlotTimeline())

    return issues
  }

  /**
   * 检查伏笔时间线
   */
  private checkForeshadowingTimeline(plot: PlotMemory): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []

    for (const fs of plot.foreshadowings) {
      // 检查回收章节早于埋下章节
      if (fs.payoffChapter !== undefined && fs.payoffChapter < fs.chapter) {
        issues.push({
          type: 'plot_logic',
          severity: 'critical',
          description: `伏笔 "${fs.hint.slice(0, 20)}..." 的回收章节早于埋下章节`,
          existingInfo: `第${fs.chapter}章埋下`,
          newInfo: `第${fs.payoffChapter}章回收`,
          suggestion: '修正伏笔的章节号',
        })
      }

      // 检查伏笔埋下后是否在合理范围内回收（超过20章未回收给出提示）
      if (fs.status === 'unresolved' && fs.payoffChapter === undefined) {
        // 这是未回收伏笔的提示，不是错误
        // 可以在其他地方单独统计
      }

      // 检查过早暗示（第一章节就回收埋下的伏笔）
      if (fs.payoffChapter !== undefined && fs.payoffChapter === fs.chapter) {
        issues.push({
          type: 'plot_logic',
          severity: 'minor',
          description: `伏笔在同一章节埋下和回收: "${fs.hint.slice(0, 20)}..."`,
          existingInfo: `第${fs.chapter}章`,
          newInfo: '伏笔无铺垫直接回收',
          suggestion: '建议增加伏笔的铺垫和暗示',
        })
      }
    }

    return issues
  }

  /**
   * 检查线索与冲突一致性
   */
  private checkClueConflictConsistency(plot: PlotMemory): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []

    const unresolvedConflicts = plot.conflicts.filter(c => c.status !== 'resolved')
    const keyClues = plot.clues.filter(c => c.importance === 'key')

    for (const conflict of unresolvedConflicts) {
      // 检查关键线索是否在冲突解决后才出现
      const lateClues = keyClues.filter(
        c => c.chapter > conflict.chapter + 5 && c.importance === 'key'
      )

      for (const clue of lateClues) {
        issues.push({
          type: 'plot_logic',
          severity: 'minor',
          description: `关键线索在冲突章节${conflict.chapter}章之后${clue.chapter}章才出现`,
          existingInfo: `冲突: ${conflict.description.slice(0, 30)}...`,
          newInfo: `线索: ${clue.description.slice(0, 30)}...`,
          suggestion: '考虑将关键线索提前，或增加冲突的持续时间',
        })
      }
    }

    return issues
  }

  /**
   * 检查主题一致性
   */
  private checkThemeConsistency(plot: PlotMemory): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []

    // 检查主题出现的间隔是否合理
    const themeOccurrences = plot.themeOccurrences
    const themeMap = new Map<string, typeof themeOccurrences>()

    for (const occ of themeOccurrences) {
      const existing = themeMap.get(occ.theme) || []
      existing.push(occ)
      themeMap.set(occ.theme, existing)
    }

    for (const [theme, occurrences] of themeMap) {
      if (occurrences.length < 2) continue

      // 按章节排序
      occurrences.sort((a, b) => a.chapter - b.chapter)

      for (let i = 1; i < occurrences.length; i++) {
        const prev = occurrences[i - 1]
        const curr = occurrences[i]
        
        // 主题强度不应该突变
        const intensityDelta = Math.abs(curr.intensity - prev.intensity)
        const chapterGap = curr.chapter - prev.chapter
        
        if (intensityDelta > 60 && chapterGap > 10) {
          issues.push({
            type: 'plot_logic',
            severity: 'minor',
            description: `主题 "${theme}" 的强度在第${curr.chapter}章发生显著变化但之前无铺垫`,
            existingInfo: `第${prev.chapter}章强度: ${prev.intensity}`,
            newInfo: `第${curr.chapter}章强度: ${curr.intensity}`,
            suggestion: '建议增加主题强度的渐进变化',
          })
        }
      }
    }

    return issues
  }

  /**
   * 检查跨情节时间线一致性
   */
  private async checkCrossPlotTimeline(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []

    const timeline = await longTermMemoryManager.getTimeline()
    const characterMemories = await longTermMemoryManager.getAllCharacterMemories()

    // 收集所有角色出现章节
    const characterAppearances = new Map<string, number[]>()
    for (const char of characterMemories) {
      const chapters = char.appearances.map(a => a.chapter)
      characterAppearances.set(char.name, chapters)
    }

    // 检查时间线事件中的参与者是否在对应章节有出场记录
    for (const event of timeline) {
      for (const participant of event.participants) {
        const appearances = characterAppearances.get(participant)
        if (appearances && !appearances.includes(event.chapter)) {
          issues.push({
            type: 'timeline',
            severity: 'minor',
            description: `时间线事件参与者 "${participant}" 在第${event.chapter}章无出场记录`,
            existingInfo: `角色出场章节: ${appearances.join(', ')}`,
            newInfo: `事件章节: ${event.chapter}`,
            suggestion: '确保角色在参与事件前已有出场记录',
          })
        }
      }
    }

    return issues
  }

  /**
   * 执行全面一致性检查
   */
  async checkAll(options?: ConsistencyCheckOptions): Promise<ConsistencyCheckResult> {
    const result: ConsistencyCheckResult = {
      characterIssues: [],
      relationshipIssues: [],
      plotIssues: [],
      timelineIssues: [],
      overallScore: 100,
    }

    // 获取所有角色
    const characters = await longTermMemoryManager.getAllCharacterMemories()

    // 检查所有角色的一致性
    for (const character of characters) {
      const charIssues = await this.checkCharacterConsistency(character.characterId)
      result.characterIssues.push(...charIssues)

      const relIssues = await this.checkRelationshipConsistency(character.characterId)
      result.relationshipIssues.push(...relIssues)
    }

    // 检查情节一致性
    const plotIssues = await this.checkPlotConsistency()
    result.plotIssues.push(...plotIssues)

    // 计算总体评分
    const totalIssues = 
      result.characterIssues.length +
      result.relationshipIssues.length +
      result.plotIssues.length +
      result.timelineIssues.length

    // 根据问题严重程度扣分
    const criticalCount = result.characterIssues.filter(i => i.severity === 'critical').length +
                          result.plotIssues.filter(i => i.severity === 'critical').length
    const majorCount = result.characterIssues.filter(i => i.severity === 'major').length +
                       result.plotIssues.filter(i => i.severity === 'major').length
    const minorCount = result.characterIssues.filter(i => i.severity === 'minor').length +
                       result.plotIssues.filter(i => i.severity === 'minor').length

    result.overallScore = Math.max(0, 100 - criticalCount * 20 - majorCount * 5 - minorCount * 1)

    return result
  }

  /**
   * 获取一致性报告
   */
  async getConsistencyReport(projectId: number): Promise<string> {
    const result = await this.checkAll({ projectId })

    const lines: string[] = []
    lines.push('# 一致性检查报告\n')

    lines.push(`## 总体评分: ${result.overallScore}/100\n`)

    if (result.characterIssues.length > 0) {
      lines.push('## 角色一致性问题\n')
      for (const issue of result.characterIssues) {
        lines.push(`- [${issue.severity}] ${issue.description}`)
        lines.push(`  - 已有信息: ${issue.existingInfo}`)
        lines.push(`  - 新信息: ${issue.newInfo}`)
        if (issue.suggestion) {
          lines.push(`  - 建议: ${issue.suggestion}`)
        }
        lines.push('')
      }
    }

    if (result.plotIssues.length > 0) {
      lines.push('## 情节一致性问题\n')
      for (const issue of result.plotIssues) {
        lines.push(`- [${issue.severity}] ${issue.description}`)
        lines.push(`  - 已有信息: ${issue.existingInfo}`)
        lines.push(`  - 新信息: ${issue.newInfo}`)
        if (issue.suggestion) {
          lines.push(`  - 建议: ${issue.suggestion}`)
        }
        lines.push('')
      }
    }

    if (result.characterIssues.length === 0 && result.plotIssues.length === 0) {
      lines.push('✅ 未发现明显的一致性问题\n')
    }

    return lines.join('\n')
  }
}

// 单例导出
export const consistencyChecker = new ConsistencyChecker()
export { ConsistencyChecker }
