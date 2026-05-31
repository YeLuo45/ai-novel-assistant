/**
 * 任务复杂度评估器
 * 根据用户输入评估任务复杂度，决定路由到哪个专业角色
 */

export interface ComplexityResult {
  score: number      // 1-10
  steps: number
  domain: string[]   // ['plot', 'dialogue', 'style', 'critique']
  routingHint: 'PlotExpert' | 'DialogueMaster' | 'StyleGuard'
}

// 步骤指示词
const STEP_INDICATORS = [
  '首先', '然后', '最后', '下一步', '接下来', '接着',
  '第一', '第二', '第三', '其次', '再者',
  'first', 'then', 'next', 'finally', 'after that'
]

// 对话类关键词
const DIALOGUE_KEYWORDS = [
  '对话', '台词', '角色说', '说道', '问道', '答道',
  '叫道', '叹道', '笑着说', '哭着说', '怒道',
  'dialogue', 'dialog', '台词', '对白', '说话'
]

// 风格类关键词
const STYLE_KEYWORDS = [
  '润色', '错别字', '标点', '文风', '语句', '语法',
  '不通顺', '表达', '修改', '校对', '检查', '修正',
  'polish', 'style', 'grammar', 'punctuation', 'typo'
]

// 情节类关键词
const PLOT_KEYWORDS = [
  '大纲', '伏笔', '章节', '情节', '故事', '叙事',
  '高潮', '转折', '铺垫', '结局', '开头', '结尾',
  'outline', 'plot', 'story', 'narrative', 'chapter'
]

/**
 * 评估任务复杂度
 */
export function evaluateComplexity(task: string): ComplexityResult {
  const lowerTask = task.toLowerCase()

  // 基础分
  let score = 1
  let steps = 0
  const domain: string[] = []

  // 1. 步骤指示词检测
  for (const indicator of STEP_INDICATORS) {
    if (lowerTask.includes(indicator.toLowerCase())) {
      steps++
    }
  }
  // 每3步 +1分
  score += Math.floor(steps / 3)

  // 2. 角色词检测 -> dialogue
  for (const keyword of DIALOGUE_KEYWORDS) {
    if (lowerTask.includes(keyword.toLowerCase())) {
      if (!domain.includes('dialogue')) {
        domain.push('dialogue')
      }
      break
    }
  }

  // 3. 风格词检测 -> style
  for (const keyword of STYLE_KEYWORDS) {
    if (lowerTask.includes(keyword.toLowerCase())) {
      if (!domain.includes('style')) {
        domain.push('style')
      }
      break
    }
  }

  // 4. 情节词检测 -> plot
  for (const keyword of PLOT_KEYWORDS) {
    if (lowerTask.includes(keyword.toLowerCase())) {
      if (!domain.includes('plot')) {
        domain.push('plot')
      }
      break
    }
  }

  // 5. 不确定性词汇检测（每出现一次+0.5分）
  const uncertaintyWords = ['大概', '可能', '也许', '似乎', '应该', '估计', 'perhaps', 'maybe', 'probably', 'might']
  for (const word of uncertaintyWords) {
    if (lowerTask.includes(word.toLowerCase())) {
      score += 0.5
    }
  }

  // 6. 输出格式复杂度（要求特定格式+1分）
  const formatIndicators = ['列出', '表格', 'JSON', '格式', '列表', '按顺序', '分点', '编号']
  for (const indicator of formatIndicators) {
    if (lowerTask.includes(indicator.toLowerCase())) {
      score += 1
      break
    }
  }

  // 限制分数范围
  score = Math.min(10, Math.max(1, Math.round(score)))

  // 7. 路由决策
  let routingHint: 'PlotExpert' | 'DialogueMaster' | 'StyleGuard' = 'PlotExpert'

  if (score >= 7) {
    routingHint = 'PlotExpert'
  } else if (domain.includes('dialogue')) {
    routingHint = 'DialogueMaster'
  } else if (domain.includes('style')) {
    routingHint = 'StyleGuard'
  } else if (domain.includes('plot')) {
    routingHint = 'PlotExpert'
  } else {
    // 默认根据步骤数判断
    routingHint = steps > 3 ? 'PlotExpert' : 'StyleGuard'
  }

  return {
    score,
    steps,
    domain,
    routingHint
  }
}