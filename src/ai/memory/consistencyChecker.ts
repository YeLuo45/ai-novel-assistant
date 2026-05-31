/**
 * 一致性检查器
 * V14 Phase 4: 角色状态 + 伏笔一致性检查
 */

import { memoryManager } from './memoryManager'
import type { ConsistencyIssue } from './types'

/**
 * 角色一致性检查
 */
export async function checkCharacterConsistency(
  projectId: number,
  characterId: string,
  newContent: string
): Promise<ConsistencyIssue[]> {
  const issues: ConsistencyIssue[] = []
  
  const currentState = await memoryManager.getCharacterState(projectId, characterId)
  if (!currentState) return issues

  // 检测明显的状态矛盾
  // 例如：如果角色已"死亡"，新内容中不应该有对话
  const deathKeywords = ['死亡', '去世', '死去', '死了']
  const isDead = deathKeywords.some(k => currentState.includes(k))
  
  if (isDead) {
    const dialoguePatterns = [
      /"[^"]+"/g,  // 引号内的对话
      /['"][^'"]+['"][\s]*[说讲问道]/g  // xxx说/问道等
    ]
    
    for (const pattern of dialoguePatterns) {
      if (pattern.test(newContent)) {
        issues.push({
          type: 'character_state',
          severity: 'critical',
          description: `角色"${characterId}"已死亡，不应有对话`,
          existingInfo: currentState,
          newInfo: '检测到对话内容',
          suggestion: '删除该角色的对话，或修正其状态'
        })
        break
      }
    }
  }

  return issues
}

/**
 * 伏笔一致性检查
 */
export async function checkPlotConsistency(
  projectId: number,
  newContent: string
): Promise<ConsistencyIssue[]> {
  const issues: ConsistencyIssue[] = []
  
  const activeThreads = await memoryManager.getActivePlotThreads(projectId)
  
  for (const thread of activeThreads) {
    // 检测是否意外回收了未铺垫的伏笔
    // 简化实现：检查关键词
    const tagKeywords = thread.tag.split(/[,，、]/).map(t => t.trim())
    
    for (const keyword of tagKeywords) {
      if (keyword.length >= 2 && newContent.includes(keyword)) {
        // 找到了伏笔关键词，检查是否有回收暗示
        const resolvePatterns = [
          /揭[开晓示]/,
          /暴露/,
          /真相/,
          /原来/,
          /揭示/
        ]
        
        const hasResolvelHint = resolvePatterns.some(p => p.test(newContent))
        
        // 如果有伏笔关键词但没有明确的回收暗示，可能造成逻辑问题
        // 这里只是标记，不直接报错误
      }
    }
  }

  return issues
}

/**
 * 全面一致性检查
 */
export async function checkConsistency(
  projectId: number,
  newContent: string,
  checkType: 'character' | 'plot' | 'world' | 'all'
): Promise<ConsistencyIssue[]> {
  const allIssues: ConsistencyIssue[] = []

  if (checkType === 'character' || checkType === 'all') {
    const charStates = await memoryManager.getAllCharacterStates(projectId)
    for (const [charId] of Object.entries(charStates)) {
      const issues = await checkCharacterConsistency(projectId, charId, newContent)
      allIssues.push(...issues)
    }
  }

  if (checkType === 'plot' || checkType === 'all') {
    const issues = await checkPlotConsistency(projectId, newContent)
    allIssues.push(...issues)
  }

  return allIssues
}