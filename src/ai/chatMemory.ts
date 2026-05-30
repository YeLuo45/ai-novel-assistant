/**
 * 多轮对话上下文管理
 * - 同一项目内保留最近 N 轮对话
 * - 支持切换项目时清空上下文
 */

import { db, ChatMessage } from '../db'

const MAX_HISTORY_MESSAGES = 10

/**
 * 获取项目最近的对话历史
 */
export async function getChatHistory(projectId: number): Promise<ChatMessage[]> {
  const messages = await db.chatMessages
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('timestamp')
  
  // 返回最近 MAX_HISTORY_MESSAGES 条
  return messages.slice(0, MAX_HISTORY_MESSAGES).reverse()
}

/**
 * 添加用户消息到历史
 */
export async function addUserMessage(projectId: number, content: string): Promise<ChatMessage> {
  const message: ChatMessage = {
    projectId,
    role: 'user',
    content,
    timestamp: new Date()
  }
  const id = await db.chatMessages.add(message)
  return { ...message, id: id as number }
}

/**
 * 添加助手消息到历史
 */
export async function addAssistantMessage(projectId: number, content: string): Promise<ChatMessage> {
  const message: ChatMessage = {
    projectId,
    role: 'assistant',
    content,
    timestamp: new Date()
  }
  const id = await db.chatMessages.add(message)
  return { ...message, id: id as number }
}

/**
 * 清空项目对话历史
 */
export async function clearChatHistory(projectId: number): Promise<void> {
  await db.chatMessages.where('projectId').equals(projectId).delete()
}

/**
 * 清理旧消息，保留最近 MAX_HISTORY_MESSAGES 条
 */
export async function trimChatHistory(projectId: number): Promise<void> {
  const allMessages = await db.chatMessages
    .where('projectId')
    .equals(projectId)
    .sortBy('timestamp')
  
  if (allMessages.length > MAX_HISTORY_MESSAGES) {
    const toDelete = allMessages.slice(0, allMessages.length - MAX_HISTORY_MESSAGES)
    const idsToDelete = toDelete.map(m => m.id).filter((id): id is number => id !== undefined)
    await db.chatMessages.bulkDelete(idsToDelete)
  }
}

/**
 * 构建带上下文的 prompt
 * @param projectInfo 项目基本信息
 * @param history 对话历史
 * @param userInput 用户当前输入
 */
export function buildContextualPrompt(
  projectInfo: { title: string; genre: string; chapterCount: number },
  history: ChatMessage[],
  userInput: string
): { systemPrompt: string; messages: Array<{ role: string; content: string }> } {
  const systemPrompt = `你是一位专业的小说创作助手，帮助作者进行小说大纲规划、情节设计、角色塑造等工作。
当前项目信息：
- 类型：${projectInfo.genre}
- 标题：${projectInfo.title}
- 已完成章节数：${projectInfo.chapterCount}`

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]

  // 添加历史对话
  for (const msg of history) {
    messages.push({
      role: msg.role,
      content: msg.content
    })
  }

  // 添加当前用户输入
  messages.push({ role: 'user', content: userInput })

  return { systemPrompt, messages }
}

/**
 * 处理 /context 命令 - 要求 AI 总结当前项目状态
 */
export function buildContextCommand(
  projectInfo: { title: string; genre: string; chapterCount: number },
  outlineSummary: string,
  materialSummary: string
): string {
  return `请总结当前项目"${projectInfo.title}"的状态，包括：
1. 当前小说类型和背景
2. 主要角色及其特点
3. 已完成和进行中的章节
4. 世界观设定要点

大纲信息：
${outlineSummary}

素材库信息：
${materialSummary}

请用简洁的语言进行总结，帮助我回顾项目当前状态。`
}
