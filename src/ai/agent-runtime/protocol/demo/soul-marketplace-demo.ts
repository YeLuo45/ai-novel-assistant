/**
 * protocol/demo/soul-marketplace-demo.ts (V2471)
 */

import { SoulTemplateRegistry, SoulMarketplace, SoulAuthor, composeSoul } from '../SoulMarketplace'
import { SoulExporter, SoulImporter, SoulShareLink } from '../SoulExportImport'
import { PLOT_ADVISOR_TEMPLATE, STYLE_COACH_TEMPLATE } from '../../builtinSouls'

export function runSoulMarketplaceDemo(): {
  marketplaceSize: number
  installed: number
  active: number
  sharedLink: string
  imported: boolean
} {
  const registry = new SoulTemplateRegistry()
  const marketplace = new SoulMarketplace(registry)
  const author: SoulAuthor = { authorId: 'demo', displayName: 'Demo Author' }
  // 发布
  marketplace.publish(PLOT_ADVISOR_TEMPLATE, author, { description: 'plot expert', tags: ['plot'] })
  marketplace.publish(STYLE_COACH_TEMPLATE, author, { description: 'style coach', tags: ['style'] })
  // 派生一个
  const derived = composeSoul(PLOT_ADVISOR_TEMPLATE, { displayName: 'Plot Advisor Pro' })
  marketplace.publish(derived, author, { description: 'enhanced', tags: ['plot', 'pro'] })
  // 安装 + 激活
  marketplace.install(PLOT_ADVISOR_TEMPLATE.templateId)
  marketplace.activate(PLOT_ADVISOR_TEMPLATE.templateId)
  // 评分
  marketplace.rate(PLOT_ADVISOR_TEMPLATE.templateId, 'r1', 5)
  // 分享链接
  const link = new SoulShareLink().encode(PLOT_ADVISOR_TEMPLATE)
  // 导入测试
  const exporter = new SoulExporter()
  const importer = new SoulImporter()
  const pkg = {
    packageId: 'demo',
    template: STYLE_COACH_TEMPLATE,
    version: '1.0.0',
    author: 'demo',
    createdAt: Date.now(),
  }
  const json = exporter.exportJson(pkg)
  const imported = importer.importJson(json)
  return {
    marketplaceSize: marketplace.list().length,
    installed: marketplace.installed().length,
    active: marketplace.active().length,
    sharedLink: link,
    imported: imported.ok,
  }
}
