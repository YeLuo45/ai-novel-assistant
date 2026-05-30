import type { GenreConfig, GenreId } from './types'

// 悬疑配置
const mysteryConfig: GenreConfig = {
  id: 'mystery',
  name: '悬疑小说',
  description: '通过线索铺设、误导和揭示制造悬念',
  icon: '🔍',
  
  agentEnhancements: {
    plotExpert: [
      '遵循"误导-揭露"节奏：每埋设1个线索，至少安排2个误导',
      '谜题设计：核心谜题应在全文60%处开始有解答迹象',
      '线索密度：每2000字至少1个有效线索',
      '红鲱鱼：故意植入误导性线索'
    ],
    dialogueMaster: [
      '对话要有信息差：说话者知道的信息 > 读者知道的信息',
      '可用沉默、回避、转移话题制造悬念',
      '避免角色说出读者还不知道的线索'
    ],
    styleGuard: [
      '检测线索矛盾：同一线索前后描述是否一致',
      '检测"太明显"线索：关键线索是否有过多铺垫',
      '检测时间线矛盾'
    ],
    criticAgent: [
      '误导是否足够合理',
      '线索回收是否自然',
      '核心谜题解答是否令读者信服'
    ]
  },
  
  detectors: {
    enabled: true,
    rules: [
      { id: 'clue_contradiction', name: '线索矛盾', description: '检测同一线索前后描述是否一致', severity: 'critical', checkFunction: 'checkClueConsistency' },
      { id: 'timeline_error', name: '时间线错误', description: '检测时间顺序是否有矛盾', severity: 'major', checkFunction: 'checkTimeline' },
      { id: 'obvious_clue', name: '过于明显的线索', description: '检测线索密度是否足够', severity: 'minor', checkFunction: 'checkClueDensity' }
    ]
  },
  
  outputFormat: {
    plotStructure: 'mystery',
    includeMetrics: ['clueCount', 'redHerringCount', 'suspenseScore', 'revelationTiming']
  }
}

// 言情配置
const romanceConfig: GenreConfig = {
  id: 'romance',
  name: '言情小说',
  description: '聚焦角色间的情感发展和关系变化',
  icon: '💕',
  
  agentEnhancements: {
    plotExpert: [
      '情感曲线设计：平静→萌动→试探→确认→危机→甜蜜',
      '心动时刻：每8000字至少1个高甜/高虐节点',
      '冲突设计：误会→和解、外界压力、内心挣扎',
      '关系升级：肢体接触→表白→确认关系→考验→升华'
    ],
    dialogueMaster: [
      '对话要有化学反应：针锋相对/欲言又止/口是心非',
      '潜台词设计：言外之意、欲言又止',
      '肢体语言：眼神、动作、微表情'
    ],
    styleGuard: [
      '甜度检测：对话中亲昵称呼、甜蜜动作的密度',
      '虐度检测：误会、委屈、虐心情节的强度',
      '情感节奏：避免连续3章以上无情感进展'
    ],
    criticAgent: [
      'CP感是否足够',
      '情感发展是否循序渐进',
      '甜虐平衡是否恰当'
    ]
  },
  
  detectors: {
    enabled: true,
    rules: [
      { id: 'stagnant_relationship', name: '关系停滞', description: '检测情感关系是否有明显进展', severity: 'major', checkFunction: 'checkRelationshipProgress' },
      { id: 'ooc_risk', name: '人设崩塌', description: '检测角色行为是否符合人设', severity: 'critical', checkFunction: 'checkCharacterConsistency' }
    ]
  },
  
  outputFormat: {
    plotStructure: 'relationship',
    includeMetrics: ['sweetnessIndex', 'angstIndex', 'relationshipProgress', 'heartbeatMoments']
  }
}

// 科幻配置
const scifiConfig: GenreConfig = {
  id: 'scifi',
  name: '科幻小说',
  description: '基于科学逻辑构建的幻想世界',
  icon: '🚀',
  
  agentEnhancements: {
    plotExpert: [
      '世界观设定：科技水平、社会结构、地理环境',
      '技术细节：使用的技术名词要有基本合理性',
      '逻辑自洽：异能/科技要有明确的能力边界',
      '人文关怀：科技与人性的冲突'
    ],
    dialogueMaster: [
      '科技词汇：不同职业角色有不同的专业用语',
      '科幻场景下的情感表达',
      '避免现代俚语'
    ],
    styleGuard: [
      '技术矛盾检测：同一技术前后描述是否一致',
      '能力边界检测：主角能力是否有明确限制',
      '科学常识检测：是否有明显的科学错误'
    ],
    criticAgent: [
      '世界观是否自洽',
      '技术细节是否合理',
      '情节是否尊重科学逻辑'
    ]
  },
  
  detectors: {
    enabled: true,
    rules: [
      { id: 'tech_contradiction', name: '技术矛盾', description: '检测同一技术前后描述是否一致', severity: 'critical', checkFunction: 'checkTechConsistency' },
      { id: 'power_creep', name: '战力崩坏', description: '检测战力是否平衡', severity: 'major', checkFunction: 'checkPowerBalance' },
      { id: 'science_error', name: '科学错误', description: '检测是否有明显科学错误', severity: 'minor', checkFunction: 'checkScienceAccuracy' }
    ]
  },
  
  outputFormat: {
    plotStructure: 'three_act',
    includeMetrics: ['techConsistencyScore', 'worldCoherence', 'scientificAccuracy']
  }
}

// 同人配置
const fanfictionConfig: GenreConfig = {
  id: 'fanfiction',
  name: '同人小说',
  description: '基于已有作品角色和世界观的二次创作',
  icon: '📚',
  
  agentEnhancements: {
    plotExpert: [
      '原作还原：角色性格、关系、行事风格要符合原作',
      'OOC检测：角色行为是否有偏离原作人设',
      '彩蛋设计：原作经典场景/台词/道具的再现',
      '创新平衡：在还原和创新之间找平衡'
    ],
    dialogueMaster: [
      '角色台词要符合原作性格',
      '避免使用现代/跨作品的网络梗',
      '原作角色的说话方式还原'
    ],
    styleGuard: [
      'OOC检测：角色行为/语言是否与原作不符',
      '原作风格还原度',
      '跨作品元素检测'
    ],
    criticAgent: [
      '角色还原度',
      '是否保留了原作精神',
      '创新是否合理'
    ]
  },
  
  detectors: {
    enabled: true,
    rules: [
      { id: 'ooc_behavior', name: 'OOC行为', description: '检测角色行为是否符合原作', severity: 'critical', checkFunction: 'checkOOCBehavior' },
      { id: 'ooc_dialogue', name: 'OOC对话', description: '检测对话是否保持原作风格', severity: 'major', checkFunction: 'checkOOCDialogue' },
      { id: 'cross_over', name: '跨作品元素', description: '检测是否有跨作品元素', severity: 'minor', checkFunction: 'checkCrossover' }
    ]
  },
  
  outputFormat: {
    plotStructure: 'five_act',
    includeMetrics: ['characterAccuracy', 'originalFlavor', 'innovationBalance']
  }
}

// 都市配置（简化）
const urbanConfig: GenreConfig = {
  id: 'urban',
  name: '都市小说',
  description: '现代都市背景的现实主义题材',
  icon: '🏙️',
  agentEnhancements: {
    plotExpert: ['社会真实感', '人物关系网络', '行业细节'],
    dialogueMaster: ['都市对白风格', '职业用语'],
    styleGuard: ['阶层描写一致性', '行业细节准确性'],
    criticAgent: ['真实感评估', '社会逻辑性']
  },
  detectors: { enabled: false, rules: [] },
  outputFormat: { plotStructure: 'three_act', includeMetrics: [] }
}

// 玄幻配置（简化）
const fantasyConfig: GenreConfig = {
  id: 'fantasy',
  name: '玄幻小说',
  description: '东方玄幻/异世界幻想题材',
  icon: '🐉',
  agentEnhancements: {
    plotExpert: ['力量体系平衡', '境界划分一致', '功法体系'],
    dialogueMaster: ['玄幻对白风格', '修为等级用语'],
    styleGuard: ['战力崩坏检测', '境界一致性'],
    criticAgent: ['世界观完整性', '战力平衡性']
  },
  detectors: { enabled: true, rules: [
    { id: 'power_creep', name: '战力崩坏', description: '检测战力是否平衡', severity: 'major', checkFunction: 'checkPowerBalance' }
  ]},
  outputFormat: { plotStructure: 'three_act', includeMetrics: ['powerBalance', 'realmConsistency'] }
}

// 导出
export const genreConfigs: Record<GenreId, GenreConfig> = {
  mystery: mysteryConfig,
  romance: romanceConfig,
  scifi: scifiConfig,
  fanfiction: fanfictionConfig,
  urban: urbanConfig,
  fantasy: fantasyConfig
}

export function getGenreConfig(genreId: GenreId): GenreConfig {
  return genreConfigs[genreId] || mysteryConfig
}
