/**
 * ComicScriptIntegration.test.ts — Direction BG, V4086-V4095 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ComicPipeline, ComicDirector, ComicReport, ComicLibrary, ComicValidator, ComicTools, ComicQualityGate, ComicExport, ComicADirector2, ComicMasterIndex } from './ComicScriptIntegration';

describe('ComicPipeline', () => {
  const e = new ComicPipeline();
  it('isComplete for export', () => { expect(e.isComplete('export')).toBe(true); });
  it('next from outline', () => { expect(e.next('outline')).toBe('panel_layout'); });
});

describe('ComicDirector', () => {
  const e = new ComicDirector();
  it('decide wait for not ready', () => { expect(e.decide({ panelCount: 0, ready: false })).toBe('wait'); });
  it('decide finalize for 6+', () => { expect(e.decide({ panelCount: 10, ready: true })).toBe('finalize'); });
});

describe('ComicReport', () => {
  const e = new ComicReport();
  it('generate includes 页', () => { expect(e.generate({ pages: 5, panels: 20 })).toContain('页'); });
  it('hasReport true', () => { expect(e.hasReport('页')).toBe(true); });
});

describe('ComicLibrary', () => {
  const e = new ComicLibrary();
  it('save + get', () => { e.save('A', { data: 'x' }); expect(e.get('A')).toBeDefined(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('ComicValidator', () => {
  const e = new ComicValidator();
  it('validate for valid', () => { expect(e.validate({ pages: 10 }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('ComicTools', () => {
  const e = new ComicTools();
  it('isAvailable for Krita', () => { expect(e.isAvailable('Krita')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('ComicQualityGate', () => {
  const e = new ComicQualityGate();
  it('gate true for 1+ pages 4+ panels', () => { expect(e.gate({ pages: 1, panels: 4 })).toBe(true); });
  it('gate false for 0 panels', () => { expect(e.gate({ pages: 1, panels: 0 })).toBe(false); });
});

describe('ComicExport', () => {
  const e = new ComicExport();
  it('export includes [COMIC]', () => { expect(e.export('a')).toContain('[COMIC]'); });
  it('isValid true', () => { expect(e.isValid('[COMIC]')).toBe(true); });
});

describe('ComicADirector2', () => {
  const e = new ComicADirector2();
  it('decide wait for not ready', () => { expect(e.decide({ ready: false, reviewed: false })).toBe('wait'); });
  it('decide publish for done', () => { expect(e.decide({ ready: true, reviewed: true })).toBe('publish'); });
});

describe('ComicMasterIndex', () => {
  const idx = new ComicMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});