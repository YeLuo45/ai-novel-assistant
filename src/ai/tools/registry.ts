export type ToolCategory = 'text' | 'search' | 'calc' | 'media' | 'mcp'

export interface WritingTool {
  id: string
  name: string
  description: string
  icon: string
  category: ToolCategory
  execute: (input: string, context: { projectId: number, chapterId: number }) => Promise<{
    success: boolean
    output: string
    metadata?: Record<string, any>
  }>
}

export class ToolRegistry {
  private tools = new Map<string, WritingTool>()

  register(tool: WritingTool): void {
    this.tools.set(tool.id, tool)
  }

  get(id: string): WritingTool | undefined {
    return this.tools.get(id)
  }

  list(): WritingTool[] {
    return Array.from(this.tools.values())
  }

  listByCategory(category: string): WritingTool[] {
    return Array.from(this.tools.values()).filter(t => t.category === category)
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry()

export function registerBuiltInTools(registry: ToolRegistry): void {
  // Word Count Tool
  registry.register({
    id: 'wordCount',
    name: '字数统计',
    description: '统计字符数、词数、段落数、句子数',
    icon: '📊',
    category: 'calc',
    execute: async (input: string) => {
      const charCount = input.length
      const wordCount = input.replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length
      const paraCount = input.split(/\n\n+/).filter(p => p.trim().length > 0).length
      const sentenceCount = input.split(/[.。!！?？]+/).filter(s => s.trim().length > 0).length

      return {
        success: true,
        output: `字数: ${charCount}\n词数: ${wordCount}\n段落: ${paraCount}\n句子: ${sentenceCount}`,
        metadata: { charCount, wordCount, paraCount, sentenceCount }
      }
    }
  })

  // Rhyme Search Tool
  registry.register({
    id: 'rhymeSearch',
    name: '押韵搜索',
    description: '查找与关键词押韵的词语',
    icon: '🎵',
    category: 'search',
    execute: async (input: string) => {
      try {
        const response = await fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(input)}`)
        if (!response.ok) {
          throw new Error('API request failed')
        }
        const data = await response.json()
        const rhymes = data.slice(0, 20).map((w: { word: string }) => w.word)

        if (rhymes.length === 0) {
          return {
            success: true,
            output: '未找到押韵词',
            metadata: { rhymes: [] }
          }
        }

        return {
          success: true,
          output: `押韵词 (前${rhymes.length}个):\n${rhymes.join(', ')}`,
          metadata: { rhymes }
        }
      } catch (error) {
        return {
          success: false,
          output: '无法连接押韵服务',
          metadata: { error: String(error) }
        }
      }
    }
  })

  // Synonym Search Tool
  registry.register({
    id: 'synonymSearch',
    name: '近义词搜索',
    description: '查找与关键词意思相近的词语',
    icon: '🔍',
    category: 'search',
    execute: async (input: string) => {
      try {
        const response = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(input)}`)
        if (!response.ok) {
          throw new Error('API request failed')
        }
        const data = await response.json()
        const synonyms = data.slice(0, 20).map((w: { word: string }) => w.word)

        if (synonyms.length === 0) {
          return {
            success: true,
            output: '未找到近义词',
            metadata: { synonyms: [] }
          }
        }

        return {
          success: true,
          output: `近义词 (前${synonyms.length}个):\n${synonyms.join(', ')}`,
          metadata: { synonyms }
        }
      } catch (error) {
        return {
          success: false,
          output: '无法连接近义词服务',
          metadata: { error: String(error) }
        }
      }
    }
  })

  // Idiom Check Tool
  registry.register({
    id: 'idiomCheck',
    name: '成语检测',
    description: '检测文本中的成语使用情况',
    icon: '📖',
    category: 'text',
    execute: async (input: string) => {
      // Common Chinese idioms (100+)
      const commonIdioms = [
        '守株待兔', '亡羊补牢', '掩耳盗铃', '刻舟求剑', '画蛇添足',
        '叶公好龙', '杯弓蛇影', '画龙点睛', '对牛弹琴', '狐假虎威',
        '黔驴技穷', '东施效颦', '邯郸学步', '滥竽充数', '买椟还珠',
        '此地无银三百两', '不到黄河心不死', '不入虎穴焉得虎子',
        '拆东墙补西墙', '成也萧何败萧何', '初生牛犊不怕虎',
        '从善如流', '打草惊蛇', '大树底下好乘凉', '当局者迷',
        '得道多助失道寡助', '滴水穿石', '翻手为云覆手雨',
        '放下屠刀立地成佛', '风马牛不相及', '福兮祸所伏祸兮福所倚',
        '高不成低不就', '隔墙有耳', '工欲善其事必先利其器',
        '狗咬吕洞宾不识好人心', '挂羊头卖狗肉', '光阴似箭日月如梭',
        '过五关斩六将', '行百里者半九十', '害人之心不可有防人之心不可无',
        '好汉不提当年勇', '好景不常在', '好事不出门坏事传千里',
        '涸泽而渔', '呼风唤雨', '画虎画皮难画骨', '祸从口出',
        '机不可失时不再来', '鸡蛋里挑骨头', '己所不欲勿施于人',
        '家有敝帚享之千金', '嫁鸡随鸡嫁狗随狗', '近水楼台先得月',
        '井底之蛙', '九牛二虎之力', '开弓没有回头箭',
        '看菜吃饭量体裁衣', '孔夫子面前卖文章', '口惠而实不至',
        '苦心积虑', '老骥伏枥志在千里', '老牛舐犊', '老鼠过街人人喊打',
        '冷眼旁观', '礼尚往来', '流水不腐户枢不蠹', '路见不平拔刀相助',
        '眉毛胡子一把抓', '明知山有虎偏向虎山行', '磨刀不误砍柴工',
        '木已成舟', '拿手好戏', '赔了夫人又折兵', '平时不烧香临时抱佛脚',
        '破镜重圆', '破涕为笑', '七上八下', '骑驴找马',
        '前事不忘后事之师', '敲竹杠', '巧妇难为无米之炊',
        '青云直上', '庆父不死鲁难未已', '穷则思变',
        '人而无信不知其可', '人多力量大', '人心不足蛇吞象',
        '日久见人心', '如鱼得水', '瑞雪兆丰年', '塞翁失马焉知非福',
        '三思而后行', '三人成虎', '三十年河东三十年河西',
        '色厉内荏', '杀鸡焉用牛刀', '善有善报恶有恶报',
        '失之毫厘谬以千里', '十年树木百年树人', '识时务者为俊杰',
        '鼠目寸光', '树欲静而风不止', '双管齐下', '水滴石穿',
        '水中捞月', '顺我者昌逆我者亡', '随机应变', '贪小便宜吃大亏',
        '谈笑风生', '螳螂捕蝉黄雀在后', '天网恢恢疏而不漏',
        '天下无难事只怕有心人', '天下兴亡匹夫有责', '同舟共济',
        '偷鸡不成蚀把米', '头痛医头脚痛医脚', '图穷匕见',
        '退一步海阔天空', '外不修，内不安', '玩物丧志',
        '温故而知新', '文武之道一张一弛', '稳如泰山', '无风不起浪',
        '无根无底', '无懈可击', '物以类聚人以群分', '细水长流',
        '下笔如有神', '下坡路', '习惯成自然', '想当然',
        '心有灵犀一点通', '新官上任三把火', '行成于思毁于随',
        '雄鸡一唱天下白', '朽木不可雕', '学而不厌诲人不倦',
        '牙牙学语', '眼不见为净', '羊毛出在羊身上',
        '一个巴掌拍不响', '一箭双雕', '一举两得', '一路顺风',
        '一毛不拔', '一诺千金', '一曝十寒', '一往无前',
        '一叶障目不见泰山', '衣来伸手饭来张口', '以卵击石',
        '以其昏昏使人昭昭', '以子之矛攻子之盾', '因地制宜',
        '寅吃卯粮', '英雄无用武之地', '有备无患', '有福同享有难同当',
        '有眼不识泰山', '有则改之无则加勉', '与人为善',
        '欲加之罪何患无辞', '欲速则不达', '鹬蚌相争渔翁得利',
        '张冠李戴', '这山望着那山高', '纸上得来终觉浅绝知此事要躬行',
        '只许州官放火不许百姓点灯', '指鹿为马', '钟不敲不响',
        '竹篮打水一场空', '自相矛盾', '走马观花', '坐山观虎斗'
      ]

      const foundIdioms: string[] = []
      const notFoundIdioms: string[] = []

      // Simple check: look for 4-character idioms in input
      const fourCharIdioms = input.match(/[\u4e00-\u9fa5]{4}/g) || []

      for (const idiom of fourCharIdioms) {
        if (commonIdioms.includes(idiom)) {
          if (!foundIdioms.includes(idiom)) {
            foundIdioms.push(idiom)
          }
        }
      }

      // Also check if input itself is an idiom (for direct lookup)
      const inputIdiom = input.trim()
      if (inputIdiom.length === 4 && commonIdioms.includes(inputIdiom)) {
        if (!foundIdioms.includes(inputIdiom)) {
          foundIdioms.push(inputIdiom)
        }
      }

      if (foundIdioms.length === 0) {
        return {
          success: true,
          output: '未检测到常用成语',
          metadata: { foundIdioms: [], totalFound: 0 }
        }
      }

      return {
        success: true,
        output: `检测到 ${foundIdioms.length} 个成语:\n${foundIdioms.join(', ')}`,
        metadata: { foundIdioms, totalFound: foundIdioms.length }
      }
    }
  })

  // Word Frequency Tool
  registry.register({
    id: 'wordFrequency',
    name: '词频统计',
    description: '统计文本中各词语出现的频率',
    icon: '📈',
    category: 'calc',
    execute: async (input: string) => {
      // Simple Chinese word segmentation (by character n-grams)
      const wordMap = new Map<string, number>()

      // Extract Chinese words (2-4 characters)
      const chineseWords = input.match(/[\u4e00-\u9fa5]{2,4}/g) || []
      for (const word of chineseWords) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1)
      }

      // Sort by frequency
      const sortedWords = Array.from(wordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)

      if (sortedWords.length === 0) {
        return {
          success: true,
          output: '未检测到词语',
          metadata: { wordFrequency: [] }
        }
      }

      const outputLines = sortedWords.map(([word, count]) => `${word}: ${count}`)
      return {
        success: true,
        output: `高频词 (前${sortedWords.length}个):\n${outputLines.join('\n')}`,
        metadata: { wordFrequency: sortedWords }
      }
    }
  })
}