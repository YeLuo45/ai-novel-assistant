/**
 * ai/project/demo/project-integration-demo.test.ts (J26)
 */

import { describe, it, expect } from 'vitest'
import { runProjectIntegrationDemo } from './project-integration-demo'

describe('project-integration-demo', () => {
  it('creates 5 chapters', () => {
    const r = runProjectIntegrationDemo()
    expect(r.chapterCount).toBe(5)
  })

  it('outline has 5 nodes', () => {
    expect(runProjectIntegrationDemo().outlineNodes).toBe(5)
  })

  it('2 plot threads', () => {
    expect(runProjectIntegrationDemo().plotThreads).toBe(2)
  })

  it('1 character arc', () => {
    expect(runProjectIntegrationDemo().characterArcs).toBe(1)
  })

  it('1 plot hole', () => {
    expect(runProjectIntegrationDemo().plotHoles).toBe(1)
  })

  it('1 foreshadow', () => {
    expect(runProjectIntegrationDemo().foreshadows).toBe(1)
  })

  it('1 subplot', () => {
    expect(runProjectIntegrationDemo().subplots).toBe(1)
  })

  it('15 Save the Cat beats', () => {
    expect(runProjectIntegrationDemo().beatCount).toBe(15)
  })

  it('story bible subsystems populated', () => {
    const r = runProjectIntegrationDemo()
    expect(r.worldLocations).toBeGreaterThan(0)
    expect(r.worldFactions).toBeGreaterThan(0)
    expect(r.relationships).toBeGreaterThan(0)
    expect(r.themes).toBeGreaterThan(0)
    expect(r.symbols).toBeGreaterThan(0)
    expect(r.plotNodes).toBeGreaterThan(0)
    expect(r.continuityFacts).toBeGreaterThan(0)
    expect(r.arcPoints).toBeGreaterThan(0)
    expect(r.pacingWindows).toBeGreaterThan(0)
  })

  it('end-to-end coverage', () => {
    const r = runProjectIntegrationDemo()
    expect(r.chapterCount + r.plotThreads + r.outlineNodes).toBeGreaterThan(8)
  })
})