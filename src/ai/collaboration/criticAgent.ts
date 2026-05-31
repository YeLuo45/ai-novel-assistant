import { callLLM } from '../llm'
import type { CriticReport, QualityDimension } from './types'
import { getAgentConfig } from './agentRegistry'

export async function callCriticAgent(
  chapterContent: string,
  context: {
    chapterTitle: string
    genre: string
    viewpoint: string
    contextBefore?: string
  }
): Promise<CriticReport> {
  const config = getAgentConfig('CriticAgent')
  
  const userPrompt = `请评审以下章节：

【章节标题】${context.chapterTitle}
【类型】${context.genre}
【叙事视角】${context.viewpoint}
【前文衔接】${context.contextBefore || '（无）'}

【章节内容】
${chapterContent}

请从情节、人物、文笔、逻辑四个维度进行评审，给出具体分数和改进建议。`

  const response = await callLLM({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    maxTokens: 3000
  }, 'critic-agent')

  return parseCriticResponse(response)
}

function parseCriticResponse(response: string): CriticReport {
  // 简单解析 - 实际应该更robust
  const report: CriticReport = {
    overallScore: 7.0,
    scores: [],
    improvements: [],
    risks: [],
    consistencyIssues: []
  }
  
  // 从 response 中提取分数
  const scoreMatches = response.match(/([情节人物文笔逻辑])[：:]\s*(\d+)\/10/g)
  if (scoreMatches) {
    const dimensionMap: Record<string, QualityDimension> = {
      '情节': 'plot', '人物': 'character', '文笔': 'writing', '逻辑': 'logic'
    }
    for (const match of scoreMatches) {
      const dimMatch = match.match(/^([情节人物文笔逻辑])/)
      const scoreMatch = match.match(/(\d+)\/10$/)
      if (dimMatch && scoreMatch) {
        const dimension = dimensionMap[dimMatch[1]] as QualityDimension
        const score = parseInt(scoreMatch[1])
        report.scores.push({
          dimension,
          score,
          findings: []
        })
      }
    }
  }
  
  // 提取总体得分
  const overallMatch = response.match(/总体得分[：:]\s*(\d+(?:\.\d+)?)/)
  if (overallMatch) {
    report.overallScore = parseFloat(overallMatch[1])
  }
  
  // 提取改进建议
  const improveSection = response.match(/改进建议[：:]([\s\S]*?)(?=潜在风险|$)/)
  if (improveSection) {
    const suggestions = improveSection[1].match(/\d+\.\s*[^\n]+/g)
    if (suggestions) {
      report.improvements = suggestions.map(s => s.replace(/^\d+\.\s*/, '').trim())
    }
  }
  
  // 提取风险
  const riskSection = response.match(/潜在风险[：:]([\s\S]*?)(?=一致性问题|$)/)
  if (riskSection) {
    const risks = riskSection[1].match(/\d+\.\s*[^\n]+/g)
    if (risks) {
      report.risks = risks.map(r => r.replace(/^\d+\.\s*/, '').trim())
    }
  }
  
  return report
}