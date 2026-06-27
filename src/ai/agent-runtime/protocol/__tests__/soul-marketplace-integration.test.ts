/**
 * protocol/__tests__/soul-marketplace-integration.test.ts (V2472)
 */

import { describe, it, expect } from 'vitest'
import {
  SoulTemplateRegistry, SoulMarketplace, SoulExporter, SoulImporter, SoulShareLink,
  parseSoulVersion, SoulChangelog, SoulDeprecationRegistry, SoulMigrator,
  buildPreview, validateForStudio,
  type SoulPackage,
} from '../index'
import { PLOT_ADVISOR_TEMPLATE } from '../../builtinSouls'

const AUTHOR: { authorId: string; displayName: string } = { authorId: 'a1', displayName: 'Author' }

describe('Soul marketplace — end-to-end', () => {
  it('publish + install + activate flow', () => {
    const m = new SoulMarketplace(new SoulTemplateRegistry())
    m.publish(PLOT_ADVISOR_TEMPLATE, AUTHOR, { description: 'plot expert' })
    expect(m.install(PLOT_ADVISOR_TEMPLATE.templateId)).toBe(true)
    expect(m.activate(PLOT_ADVISOR_TEMPLATE.templateId)).toBe(true)
    expect(m.isActive(PLOT_ADVISOR_TEMPLATE.templateId)).toBe(true)
  })

  it('rate updates average', () => {
    const m = new SoulMarketplace(new SoulTemplateRegistry())
    m.publish(PLOT_ADVISOR_TEMPLATE, AUTHOR)
    m.rate(PLOT_ADVISOR_TEMPLATE.templateId, 'r1', 5)
    m.rate(PLOT_ADVISOR_TEMPLATE.templateId, 'r2', 3)
    expect(m.ratingFor(PLOT_ADVISOR_TEMPLATE.templateId)).toBe(4)
  })

  it('export → import roundtrip', () => {
    const pkg: SoulPackage = {
      packageId: 'p1', template: PLOT_ADVISOR_TEMPLATE, version: '1.0.0', author: 'a', createdAt: 0,
    }
    const json = new SoulExporter().exportJson(pkg)
    const r = new SoulImporter().importJson(json)
    expect(r.ok).toBe(true)
    expect(r.package?.packageId).toBe('p1')
  })

  it('share link encode/decode', () => {
    const link = new SoulShareLink().encode(PLOT_ADVISOR_TEMPLATE)
    const back = new SoulShareLink().decode(link)
    expect(back?.templateId).toBe(PLOT_ADVISOR_TEMPLATE.templateId)
  })

  it('version parse + compare', () => {
    const v1 = parseSoulVersion('1.0.0')
    const v2 = parseSoulVersion('1.1.0')
    expect(v1.major).toBe(1)
    expect(v2.minor).toBe(1)
  })

  it('changelog latest', () => {
    const cl = new SoulChangelog()
    cl.add({ version: '1.0.0', date: 100, changes: ['init'] })
    cl.add({ version: '1.1.0', date: 200, changes: ['add'] })
    expect(cl.latest()?.version).toBe('1.1.0')
  })

  it('deprecation registry', () => {
    const r = new SoulDeprecationRegistry()
    r.deprecate('t1', 'replaced by t2', { replacementId: 't2' })
    expect(r.isDeprecated('t1')).toBe(true)
    expect(r.noticeFor('t1')?.replacementId).toBe('t2')
  })

  it('migrator applies migration', () => {
    const m = new SoulMigrator()
    m.add({ fromVersion: '1.0.0', toVersion: '2.0.0', description: 'x', migrate: (t) => ({ ...t, archetype: 'instructor' as const }) })
    const r = m.migrate(PLOT_ADVISOR_TEMPLATE, '2.0.0')
    expect(r.archetype).toBe('instructor')
  })

  it('studio preview', () => {
    const p = buildPreview(PLOT_ADVISOR_TEMPLATE)
    expect(p.displayName).toBe(PLOT_ADVISOR_TEMPLATE.displayName)
  })

  it('studio validation', () => {
    const issues = validateForStudio(PLOT_ADVISOR_TEMPLATE)
    expect(issues.length).toBe(0)
  })
})
