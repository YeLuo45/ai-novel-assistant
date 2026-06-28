/**
 * ui/components/Forms.test.ts (O16-O25) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  FormField, ValidationEngine, InputMask, DatePicker, ColorPicker,
  SkeletonLoader, EmptyStateConfig, ErrorBoundary, SuspenseWrapper, PerformanceMonitor,
} from './Forms'

describe('O16: FormField', () => {
  it('required validation', () => {
    const f = new FormField({ name: 'name', label: 'Name', type: 'text', required: true })
    expect(f.validate('').valid).toBe(false)
    expect(f.validate('John').valid).toBe(true)
  })

  it('email validation', () => {
    const f = new FormField({ name: 'email', label: 'Email', type: 'email', required: true })
    expect(f.validate('not-an-email').valid).toBe(false)
    expect(f.validate('a@b.com').valid).toBe(true)
  })

  it('number range', () => {
    const f = new FormField({ name: 'age', label: 'Age', type: 'number', required: false, min: 0, max: 120 })
    expect(f.validate('150').valid).toBe(false)
    expect(f.validate('25').valid).toBe(true)
  })
})

describe('O17: ValidationEngine', () => {
  it('validate all', () => {
    const v = new ValidationEngine()
    v.addField(new FormField({ name: 'name', label: 'Name', type: 'text', required: true }))
    v.addField(new FormField({ name: 'age', label: 'Age', type: 'number', required: false }))
    const r = v.validateAll({ name: '', age: 25 })
    expect(r.valid).toBe(false)
    expect(r.errors.name).toBeDefined()
  })
})

describe('O18: InputMask', () => {
  it('phone mask', () => {
    expect(InputMask.apply('1234567890', 'phone')).toBe('(123) 456-7890')
  })

  it('date mask', () => {
    expect(InputMask.apply('20260127', 'date')).toBe('2026-01-27')
  })

  it('credit-card mask', () => {
    expect(InputMask.apply('1234567890123456', 'credit-card')).toBe('1234 5678 9012 3456')
  })

  it('currency mask', () => {
    expect(InputMask.apply('100.5', 'currency')).toBe('$100.50')
  })

  it('custom mask', () => {
    expect(InputMask.apply('12345', 'custom', '###-###')).toBe('123-45')
  })
})

describe('O19: DatePicker', () => {
  it('format iso', () => {
    const d = new Date('2026-01-27T00:00:00Z')
    const dp = new DatePicker()
    expect(dp.format(d, 'iso')).toBe('2026-01-27')
  })

  it('format us', () => {
    const d = new Date('2026-01-27T00:00:00Z')
    const dp = new DatePicker()
    expect(dp.format(d, 'us')).toBe('1/27/2026')
  })

  it('addDays', () => {
    const d = new Date('2026-01-27')
    const next = DatePicker.addDays(d, 5)
    expect(next.getDate()).toBe(1)
    expect(next.getMonth()).toBe(1)  // Feb (0-indexed)
  })

  it('isInRange', () => {
    const dp = new DatePicker()
    dp.setMin(new Date('2026-01-01'))
    dp.setMax(new Date('2026-12-31'))
    expect(dp.isInRange(new Date('2026-06-15'))).toBe(true)
    expect(dp.isInRange(new Date('2027-01-01'))).toBe(false)
  })
})

describe('O20: ColorPicker', () => {
  it('isValidHex', () => {
    expect(ColorPicker.isValidHex('#fff')).toBe(true)
    expect(ColorPicker.isValidHex('#ffffff')).toBe(true)
    expect(ColorPicker.isValidHex('xyz')).toBe(false)
  })

  it('normalize', () => {
    expect(ColorPicker.normalize('#fff')).toBe('#ffffff')
  })

  it('rgbToHex + hexToRgb', () => {
    expect(ColorPicker.rgbToHex(255, 0, 0)).toBe('#ff0000')
    expect(ColorPicker.hexToRgb('#ff0000')?.r).toBe(255)
  })

  it('lighten', () => {
    const lighter = ColorPicker.lighten('#000000', 100)
    expect(lighter).toBe('#646464')
  })
})

describe('O21: SkeletonLoader', () => {
  it('generates config', () => {
    const s = new SkeletonLoader()
    const cfg = s.generate({ type: 'text', width: '50%', count: 3 })
    expect(cfg.type).toBe('text')
    expect(cfg.count).toBe(3)
    expect(cfg.style.width).toBe('50%')
  })
})

describe('O22: EmptyState', () => {
  it('default config', () => {
    const e = new EmptyStateConfig()
    expect(e.title).toBe('No data')
  })

  it('custom config', () => {
    const e = new EmptyStateConfig({ title: 'No chapters yet', description: 'Create your first chapter' })
    expect(e.title).toBe('No chapters yet')
  })
})

describe('O23: ErrorBoundary', () => {
  it('capture + recover', () => {
    const e = new ErrorBoundary()
    const r = e.capture(new Error('oops'))
    expect(e.recover(r.errorId)).toBe(true)
    expect(e.unresolved().length).toBe(0)
  })

  it('subscribe + getErrors', () => {
    const e = new ErrorBoundary()
    let called = 0
    e.subscribe(() => { called += 1 })
    e.capture(new Error('x'))
    expect(called).toBe(1)
    expect(e.getErrors().length).toBe(1)
  })
})

describe('O24: SuspenseWrapper', () => {
  it('pending → resolved', () => {
    const s = new SuspenseWrapper<number>()
    expect(s.getStatus()).toBe('pending')
    s.resolve(42)
    expect(s.getStatus()).toBe('resolved')
    expect(s.getData()).toBe(42)
  })

  it('reject', () => {
    const s = new SuspenseWrapper<number>()
    s.reject(new Error('failed'))
    expect(s.getStatus()).toBe('error')
    expect(s.getError()?.message).toBe('failed')
  })

  it('reset', () => {
    const s = new SuspenseWrapper<number>()
    s.resolve(42)
    s.reset()
    expect(s.getStatus()).toBe('pending')
  })
})

describe('O25: PerformanceMonitor', () => {
  it('record + average', () => {
    const m = new PerformanceMonitor()
    m.record('render', 10)
    m.record('render', 20)
    expect(m.average('render')).toBe(15)
  })

  it('p95', () => {
    const m = new PerformanceMonitor()
    for (let i = 1; i <= 100; i++) m.record('render', i)
    expect(m.p95('render')).toBeGreaterThan(80)
  })

  it('slowOperations', () => {
    const m = new PerformanceMonitor()
    m.record('fast', 10)
    m.record('slow', 200)
    expect(m.slowOperations(100)).toContain('slow')
  })

  it('count', () => {
    const m = new PerformanceMonitor()
    m.record('a', 1)
    m.record('a', 2)
    m.record('b', 3)
    expect(m.count()).toBe(3)
  })
})