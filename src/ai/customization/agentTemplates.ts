import type { AgentTemplate } from './types'

export const BUILT_IN_TEMPLATES: AgentTemplate[] = [
  {
    id: 'plot_expert',
    name: 'PlotExpert',
    description: '情节设计专家，擅长构建故事结构和冲突',
    icon: '📖',
    config: {
      role: 'Plot Expert',
      systemPrompt: '你是一个专业的小说情节设计专家，擅长构建引人入胜的故事结构、冲突和高潮。你需要深入理解用户的需求，创造性地设计情节走向。',
      temperature: 0.7,
      maxTokens: 2000,
      capabilities: ['plot_design', 'conflict_creation', 'story_structure'],
      outputFormat: 'structured'
    },
    isBuiltIn: true
  },
  {
    id: 'dialogue_master',
    name: 'DialogueMaster',
    description: '对话写作专家，擅长塑造人物语言风格',
    icon: '💬',
    config: {
      role: 'Dialogue Master',
      systemPrompt: '你是一个专业的小说对话写作专家，擅长塑造鲜活的人物语言风格，让每个角色都有独特的说话方式。',
      temperature: 0.8,
      maxTokens: 1500,
      capabilities: ['dialogue_generation', 'character_voice', 'subtext'],
      outputFormat: 'plain'
    },
    isBuiltIn: true
  },
  {
    id: 'style_guard',
    name: 'StyleGuard',
    description: '文风守护者，确保文字风格一致',
    icon: '🛡️',
    config: {
      role: 'Style Guardian',
      systemPrompt: '你是一个专业的小说文风分析师，确保文字风格的一致性，控制节奏和情感表达。',
      temperature: 0.5,
      maxTokens: 1000,
      capabilities: ['style_analysis', 'consistency_check', 'tone_matching'],
      outputFormat: 'structured'
    },
    isBuiltIn: true
  },
  {
    id: 'critic_agent',
    name: 'CriticAgent',
    description: '批评专家，提供建设性反馈',
    icon: '🎯',
    config: {
      role: 'Critic Agent',
      systemPrompt: '你是一个专业的小说批评家，提供建设性的反馈和改进建议，帮助提升作品质量。',
      temperature: 0.6,
      maxTokens: 1500,
      capabilities: ['critique', 'feedback', 'improvement_suggestions'],
      outputFormat: 'structured'
    },
    isBuiltIn: true
  }
]
