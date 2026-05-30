/**
 * 敏感词库
 * 包含5个分类：政治敏感、色情低俗、暴力血腥、违禁品、广告推广
 */

export interface SensitiveWordCategory {
  label: string
  color: string
  words: string[]
}

export const sensitiveWordCategories: Record<string, SensitiveWordCategory> = {
  political: {
    label: '政治敏感',
    color: 'red',
    words: [
      '独裁',
      '专制',
      '反动',
      '暴动',
      '武装政变',
      '颠覆国家',
      '分裂主义',
      '恐怖主义',
      '极端主义',
      '邪教组织',
      '台独',
      '港独',
      '藏独',
      '疆独',
      '间谋',
      '泄密',
      '叛国',
      '卖国',
      '官僚主义',
      '贪污腐败'
    ]
  },
  pornographic: {
    label: '色情低俗',
    color: 'orange',
    words: [
      '色情',
      '淫秽',
      '黄色',
      '性感',
      '裸露',
      '三级片',
      '成人电影',
      '一夜情',
      '约炮',
      '援交',
      '裸聊',
      '色情直播',
      '偷拍',
      '偷窥',
      'sm',
      '性虐',
      '恋物癖',
      '人妻',
      '少妇',
      '萝莉'
    ]
  },
  violent: {
    label: '暴力血腥',
    color: 'purple',
    words: [
      '暴力',
      '血腥',
      '杀人',
      '谋杀',
      '凶杀',
      '分尸',
      '肢解',
      '爆炸',
      '炸弹',
      '炸药',
      '枪支',
      '弹药',
      '武器',
      '匕首',
      '砍刀',
      '殴打',
      '酷刑',
      '虐待',
      '自残',
      '自杀'
    ]
  },
  contraband: {
    label: '违禁品',
    color: 'blue',
    words: [
      '毒品',
      '大麻',
      '海洛因',
      '冰毒',
      '摇头丸',
      '可卡因',
      '鸦片',
      '吗啡',
      '杜冷丁',
      '麻古',
      'K粉',
      '致幻剂',
      '兴奋剂',
      '僵尸粉',
      '假证',
      '假币',
      '走私',
      '军火',
      '黑市',
      '赌具'
    ]
  },
  advertising: {
    label: '广告推广',
    color: 'gray',
    words: [
      '加微',
      '微信',
      'QQ号',
      '手机号',
      '点击链接',
      '扫描二维码',
      '免费领取',
      '限时优惠',
      '立即注册',
      '推荐好友',
      '佣金返利',
      '日赚千元',
      '兼职赚钱',
      '代理招募',
      '招商加盟',
      '投资理财',
      '高回报',
      '稳赚不赔',
      '夸大宣传',
      '虚假承诺'
    ]
  }
}

// 获取所有敏感词（用于快速匹配）
export function getAllSensitiveWords(): Map<string, { category: string; label: string; color: string }> {
  const wordMap = new Map<string, { category: string; label: string; color: string }>()
  
  for (const [categoryKey, category] of Object.entries(sensitiveWordCategories)) {
    for (const word of category.words) {
      wordMap.set(word, {
        category: categoryKey,
        label: category.label,
        color: category.color
      })
    }
  }
  
  return wordMap
}

// 获取分类颜色对应的 Tailwind CSS 类
export function getCategoryColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    red: 'text-red-600 bg-red-50 border-red-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200'
  }
  return colorMap[color] || colorMap.gray
}
