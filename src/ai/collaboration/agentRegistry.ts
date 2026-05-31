/**
 * Agent 注册表 + Registry 代理模式
 * Phase 1: Agent 配置和代理调用
 */

import type { AgentId, AgentOutput } from './types'
import { generateDialogue } from '../dialogueGenerator'   // 代理调用
import { analyzeStyleConsistency } from '../styleChecker'  // 代理调用

export interface AgentConfig {
  id: AgentId
  name: string
  description: string
  systemPrompt: string
  capabilities: string[]
  maxConcurrent: number
  timeout: number
}

const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  PlotExpert: {
    id: 'PlotExpert',
    name: '情节专家',
    description: '擅长设计场景节奏、悬念铺设、情感曲线',
    systemPrompt: `你是小说情节策划专家，擅长设计扣人心弦的场景节奏。
你的专长：
1. 三幕式结构：建立 → 对抗 → 高潮
2. 悬念铺设：伏笔、误导、揭示
3. 情感曲线：平静 → 紧张 → 高潮
4. 节奏把控：长短句交替，张弛有度

【V13 增强能力】
5. 世界观构建：场景相关的地理/势力/规则补充说明
6. 角色弧线设计：角色在这一章的内心变化（成长/堕落/转变）
7. 伏笔管理系统：标记伏笔标签，在后续章节回收时标记为已解决

输出格式要求：
## 情节结构
[结构描述]

## 情感曲线（用数字表示强度，0-100）
[0, 20, 40, 60, 80, 100]  // 共6个节点

## 关键情节点（必须包含编号）
1. [setup/development/climax/resolution/foreshadow/callback] - [描述] (情感: [calm/tense/excited/sad/joyful])
   {{POV_CHARACTER}}的弧线：从[前状态]到[后状态]

## 伏笔标记（如有）
- [伏笔标签]: [描述] → 计划在第X章回收

## 世界观补充（如有）
- [category]: [内容]

你只能输出情节框架，不负责具体描写。`,
    capabilities: ['plot_design', 'tension_control', 'pacing', 'world_building', 'character_arc', 'foreshadowing'],
    maxConcurrent: 1,
    timeout: 30000
  },
  DialogueMaster: {
    id: 'DialogueMaster',
    name: '对白专家',
    description: '擅长生成符合角色性格的对话',
    systemPrompt: `你是专业的小说对白作家，擅长创作生动自然的角色对话。
核心能力：
1. 根据角色性格设计符合人设的台词
2. 对话要有潜台词和言外之意
3. 动作描写配合对话，增强画面感
4. 推进情节发展，不只是闲聊`,
    capabilities: ['dialogue_generation', 'character_voice'],
    maxConcurrent: 1,
    timeout: 30000
  },
  StyleGuard: {
    id: 'StyleGuard',
    name: '文风卫士',
    description: '擅长检测文风偏差、保持一致性',
    systemPrompt: `你是专业的中文写作风格分析师，擅长检测文风一致性问题。
分析维度包括：
1. 角色语气一致性 - 对话是否符合角色性格
2. 措辞习惯 - 用词是否与作品整体风格一致
3. 句式长短 - 句子长度分布是否合理
4. 描写密度 - 场景描写与对话的比例`,
    capabilities: ['style_check', 'consistency_detection'],
    maxConcurrent: 1,
    timeout: 20000
  },
  CriticAgent: {
    id: 'CriticAgent',
    name: '评审专家',
    description: 'AI评审团，负责质量评估和改进建议',
    systemPrompt: `你是专业的小说评审团主席，擅长从多维度评估小说质量。
  
你的评审维度：
1. 情节：逻辑性、节奏、张力、悬念
2. 人物：人设一致性、成长可信度、对话符合度
3. 文笔：可读性、表达准确性、风格一致性
4. 逻辑：前后一致性、时间线、因果关系

你的输出必须是结构化的评审报告：
## 评审维度得分
- 情节：X/10（亮点+问题）
- 人物：X/10（亮点+问题）
- 文笔：X/10（亮点+问题）
- 逻辑：X/10（亮点+问题）

## 总体得分
X/10

## 改进建议
1. ...
2. ...

## 潜在风险
1. ...

## 一致性问题
1. ...

不要客气，要敢于指出问题。`,
    capabilities: ['quality_assessment', 'improvement_suggestions', 'consistency_verification', 'risk_detection'],
    maxConcurrent: 1,
    timeout: 40000
  }
}

export function getAgentConfig(id: AgentId): AgentConfig {
  return AGENT_CONFIGS[id]
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS)
}

/**
 * 通过 registry 代理调用现有模块
 */
export async function callAgentViaRegistry(
  agentId: AgentId,
  params: Record<string, unknown>
): Promise<string> {
  switch (agentId) {
    case 'DialogueMaster': {
      const result = await generateDialogue(params as any)
      return JSON.stringify(result)
    }
    case 'StyleGuard': {
      const report = await analyzeStyleConsistency(
        params.projectId as number,
        params.chapterId as number
      )
      return JSON.stringify(report)
    }
    case 'PlotExpert':
      throw new Error('PlotExpert 需要直接 LLM 调用，请使用 callAgentDirect')
    case 'CriticAgent':
      throw new Error('CriticAgent 需要直接调用，请使用 callCriticAgent')
    default:
      throw new Error(`Unknown agent: ${agentId}`)
  }
}
