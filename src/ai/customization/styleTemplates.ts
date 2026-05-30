import type { StyleTemplate } from './types'

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'realistic',
    name: '写实风格',
    description: '简洁有力的写实主义文风',
    language: 'zh-CN',
    features: {
      sentenceLength: 'medium',
      paragraphLength: 'medium',
      dialogueRatio: 40,
      descriptionDensity: 30,
      emotionalIntensity: 50
    },
    vocabulary: {
      preferredWords: [],
      avoidedWords: ['突然', '竟然', '居然'],
      formalityLevel: 7
    },
    rhetoricalDevices: ['白描']
  },
  {
    id: 'romantic',
    name: '浪漫主义',
    description: '辞藻华丽，情感充沛',
    language: 'zh-CN',
    features: {
      sentenceLength: 'mixed',
      paragraphLength: 'long',
      dialogueRatio: 30,
      descriptionDensity: 50,
      emotionalIntensity: 80
    },
    vocabulary: {
      preferredWords: ['永恒', '星辰', '月光', '誓言'],
      avoidedWords: [],
      formalityLevel: 8
    },
    rhetoricalDevices: ['比喻', '拟人', '排比', '象征']
  },
  {
    id: 'web_novel',
    name: '网文风格',
    description: '节奏快，对话多，爽点密集',
    language: 'zh-CN',
    features: {
      sentenceLength: 'short',
      paragraphLength: 'short',
      dialogueRatio: 60,
      descriptionDensity: 20,
      emotionalIntensity: 70
    },
    vocabulary: {
      preferredWords: ['霸气', '逆天', '碾压'],
      avoidedWords: [],
      formalityLevel: 4
    },
    rhetoricalDevices: []
  }
]
