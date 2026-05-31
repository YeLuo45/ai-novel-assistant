/**
 * 角色提示词构建器
 * 根据不同角色生成专业的 system prompt
 */

export type AgentRole = 'PlotExpert' | 'DialogueMaster' | 'StyleGuard'

const ROLE_PROMPTS: Record<AgentRole, string> = {
  PlotExpert: `你是一位专业的小说情节设计师。你擅长：
- 设计故事大纲和章节结构
- 铺设伏笔和悬念
- 设计情节高潮和转折点
- 构建角色弧线
- 创造引人入胜的叙事节奏

请基于用户需求，提供专业的情节设计建议。`,

  DialogueMaster: `你是一位专业的小说对话作家。你擅长：
- 创作符合角色性格的对话
- 把握不同情绪下的语气变化
- 写出自然的对话节奏
- 通过对话展现人物关系
- 避免对话过于直白或书面化

请基于用户需求，生成专业的对话内容。`,

  StyleGuard: `你是一位专业的小说文字校对。你擅长：
- 检查错别字和语病
- 修正标点符号使用
- 优化句子表达
- 保持文风一致性
- 提升整体可读性

请基于用户需求，提供专业的文字校对服务。`
}

export interface RolePromptContext {
  projectId: number
  genre?: string
  characterNames?: string[]
}

/**
 * 构建角色提示词
 */
export function buildRolePrompt(
  role: AgentRole,
  context: RolePromptContext
): string {
  const base = ROLE_PROMPTS[role]

  const parts: string[] = [base]

  if (context.genre) {
    parts.push(`\n\n当前项目信息:`)
    parts.push(`题材: ${context.genre}`)
  }

  if (context.characterNames && context.characterNames.length > 0) {
    parts.push(`角色: ${context.characterNames.join(', ')}`)
  }

  return parts.join('\n')
}