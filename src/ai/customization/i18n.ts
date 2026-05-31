import type { Language } from './types'

export interface TranslationKey {
  [key: string]: string | TranslationKey
}

export const TRANSLATIONS: Record<Language, TranslationKey> = {
  'zh-CN': {
    agent: {
      plot_expert: '情节专家',
      dialogue_master: '对话大师',
      style_guard: '文风守护',
      critic_agent: '批评家'
    },
    workflow: {
      quick_write: '快速写作',
      standard: '标准协作',
      revision: '精修模式'
    },
    style: {
      realistic: '写实风格',
      romantic: '浪漫主义',
      web_novel: '网文风格'
    },
    ui: {
      customization: '定制',
      agent: 'Agent',
      style: '风格',
      workflow: '工作流',
      language: '语言'
    }
  },
  'en-US': {
    agent: {
      plot_expert: 'Plot Expert',
      dialogue_master: 'Dialogue Master',
      style_guard: 'Style Guardian',
      critic_agent: 'Critic Agent'
    },
    workflow: {
      quick_write: 'Quick Write',
      standard: 'Standard',
      revision: 'Revision'
    },
    style: {
      realistic: 'Realistic',
      romantic: 'Romantic',
      web_novel: 'Web Novel'
    },
    ui: {
      customization: 'Customization',
      agent: 'Agent',
      style: 'Style',
      workflow: 'Workflow',
      language: 'Language'
    }
  },
  'ja-JP': {
    agent: {
      plot_expert: 'プロットエキスパート',
      dialogue_master: 'ダイアログマスター',
      style_guard: 'スタイルガード',
      critic_agent: '批評家'
    },
    workflow: {
      quick_write: 'クイックライト',
      standard: 'スタンダード',
      revision: 'リビジョン'
    },
    style: {
      realistic: 'リアリスティック',
      romantic: 'ロマンチック',
      web_novel: 'ウェブ小説'
    },
    ui: {
      customization: 'カスタマイズ',
      agent: 'エージェント',
      style: 'スタイル',
      workflow: 'ワークフロー',
      language: '言語'
    }
  },
  'ko-KR': {
    agent: {
      plot_expert: '플롯 전문가',
      dialogue_master: '대화 마스터',
      style_guard: '스타일 가드',
      critic_agent: '비평가'
    },
    workflow: {
      quick_write: '빠른 작성',
      standard: '표준',
      revision: '수정'
    },
    style: {
      realistic: '리얼리즘',
      romantic: '로맨스',
      web_novel: '웹소설'
    },
    ui: {
      customization: '사용자 정의',
      agent: '에이전트',
      style: '스타일',
      workflow: '워크플로',
      language: '언어'
    }
  }
}

export function t(key: string, lang: Language = 'zh-CN'): string {
  const keys = key.split('.')
  let value: any = TRANSLATIONS[lang]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }
  
  return typeof value === 'string' ? value : key
}
