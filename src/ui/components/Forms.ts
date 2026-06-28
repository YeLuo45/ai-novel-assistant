/**
 * ui/components/Forms.ts (O16-O25) - 10 engines
 *
 * - O16 FormField
 * - O17 ValidationEngine
 * - O18 InputMask
 * - O19 DatePicker
 * - O20 ColorPicker
 * - O21 SkeletonLoader
 * - O22 EmptyState
 * - O23 ErrorBoundary
 * - O24 SuspenseWrapper
 * - O25 PerformanceMonitor
 */

// =============================================================================
// O16: FormField
// =============================================================================

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'checkbox' | 'select' | 'textarea'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required: boolean
  defaultValue?: string | number | boolean
  placeholder?: string
  options?: string[]  // for select
  min?: number
  max?: number
}

export class FormField {
  constructor(public def: FieldDef) {}

  validate(value: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (this.def.required && (value === undefined || value === null || value === '')) {
      errors.push(`${this.def.label} is required`)
    }
    if (this.def.type === 'email' && value && typeof value === 'string') {
      if (!/^.+@.+\..+$/.test(value)) errors.push('Invalid email')
    }
    if (this.def.type === 'number' && value !== undefined && value !== '') {
      const n = Number(value)
      if (isNaN(n)) errors.push('Must be a number')
      if (this.def.min !== undefined && n < this.def.min) errors.push(`Min ${this.def.min}`)
      if (this.def.max !== undefined && n > this.def.max) errors.push(`Max ${this.def.max}`)
    }
    return { valid: errors.length === 0, errors }
  }
}

// =============================================================================
// O17: ValidationEngine
// =============================================================================

export class ValidationEngine {
  private _fields: Map<string, FormField> = new Map()

  addField(field: FormField): void { this._fields.set(field.def.name, field) }

  validateAll(values: Record<string, unknown>): { valid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {}
    let valid = true
    for (const [name, field] of this._fields) {
      const r = field.validate(values[name])
      if (!r.valid) {
        errors[name] = r.errors
        valid = false
      }
    }
    return { valid, errors }
  }

  fields(): FormField[] { return Array.from(this._fields.values()) }
}

// =============================================================================
// O18: InputMask
// =============================================================================

export type MaskType = 'phone' | 'date' | 'credit-card' | 'currency' | 'custom'

export class InputMask {
  static apply(value: string, type: MaskType, customPattern?: string): string {
    if (type === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    if (type === 'date') {
      const digits = value.replace(/\D/g, '').slice(0, 8)
      if (digits.length <= 4) return digits
      if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
    }
    if (type === 'credit-card') {
      const digits = value.replace(/\D/g, '').slice(0, 16)
      return digits.match(/.{1,4}/g)?.join(' ') ?? digits
    }
    if (type === 'currency') {
      const n = parseFloat(value.replace(/[^0-9.]/g, ''))
      return isNaN(n) ? '' : `$${n.toFixed(2)}`
    }
    if (type === 'custom' && customPattern) {
      let out = ''
      let vi = 0
      for (const c of customPattern) {
        if (c === '#') {
          if (vi < value.length) out += value[vi++]
        } else out += c
      }
      return out
    }
    return value
  }
}

// =============================================================================
// O19: DatePicker
// =============================================================================

export class DatePicker {
  private _selected: Date | null = null
  private _min: Date | null = null
  private _max: Date | null = null

  setSelected(d: Date | null): void { this._selected = d }
  getSelected(): Date | null { return this._selected }
  setMin(d: Date | null): void { this._min = d }
  setMax(d: Date | null): void { this._max = d }

  isInRange(d: Date): boolean {
    if (this._min && d < this._min) return false
    if (this._max && d > this._max) return false
    return true
  }

  format(d: Date, format: 'iso' | 'us' | 'eu' | 'long' = 'iso'): string {
    if (format === 'iso') return d.toISOString().slice(0, 10)
    if (format === 'us') return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
    if (format === 'eu') return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  static today(): Date { return new Date() }
  static addDays(d: Date, n: number): Date {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r
  }
}

// =============================================================================
// O20: ColorPicker
// =============================================================================

export class ColorPicker {
  static isValidHex(hex: string): boolean {
    return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
  }

  static normalize(hex: string): string {
    if (!hex.startsWith('#')) hex = '#' + hex
    if (hex.length === 4) {
      // #abc → #aabbcc
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    }
    return hex.toLowerCase()
  }

  static rgbToHex(r: number, g: number, b: number): string {
    const c = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
    return `#${c(r)}${c(g)}${c(b)}`
  }

  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const norm = ColorPicker.normalize(hex)
    const m = norm.match(/^#([0-9a-fA-F]{6})$/)
    if (!m) return null
    const n = parseInt(m[1], 16)
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
  }

  static lighten(hex: string, amount: number): string {
    const rgb = ColorPicker.hexToRgb(hex)
    if (!rgb) return hex
    return ColorPicker.rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount)
  }
}

// =============================================================================
// O21: SkeletonLoader
// =============================================================================

export type SkeletonType = 'text' | 'circle' | 'rect' | 'card'

export interface SkeletonConfig {
  type: SkeletonType
  width?: string
  height?: string
  count?: number
}

export class SkeletonLoader {
  generate(config: SkeletonConfig): { type: SkeletonType; style: Record<string, string>; count: number } {
    return {
      type: config.type,
      style: {
        width: config.width ?? '100%',
        height: config.height ?? (config.type === 'text' ? '1em' : '40px'),
        background: 'linear-gradient(90deg, #eee, #f5f5f5, #eee)',
        animation: 'shimmer 1.5s infinite',
      },
      count: config.count ?? 1,
    }
  }
}

// =============================================================================
// O22: EmptyState
// =============================================================================

export class EmptyStateConfig {
  title: string
  description: string
  actionLabel?: string
  iconName?: string

  constructor(init: Partial<EmptyStateConfig> = {}) {
    this.title = init.title ?? 'No data'
    this.description = init.description ?? 'Nothing to show here yet'
    this.actionLabel = init.actionLabel
    this.iconName = init.iconName
  }
}

// =============================================================================
// O23: ErrorBoundary
// =============================================================================

export interface ErrorRecord {
  errorId: string
  error: Error
  componentStack?: string
  timestamp: number
  recovered: boolean
}

export class ErrorBoundary {
  private _errors: ErrorRecord[] = []
  private _nextId: number = 0
  private _listeners: Set<(e: ErrorRecord) => void> = new Set()

  capture(error: Error, componentStack?: string): ErrorRecord {
    const record: ErrorRecord = {
      errorId: `err_${++this._nextId}`,
      error, componentStack,
      timestamp: Date.now(), recovered: false,
    }
    this._errors.push(record)
    for (const l of this._listeners) {
      try { l(record) } catch { /* swallow */ }
    }
    return record
  }

  recover(errorId: string): boolean {
    const e = this._errors.find(x => x.errorId === errorId)
    if (!e) return false
    e.recovered = true
    return true
  }

  getErrors(): ErrorRecord[] { return [...this._errors] }
  unresolved(): ErrorRecord[] { return this._errors.filter(e => !e.recovered) }
  subscribe(fn: (e: ErrorRecord) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// O24: SuspenseWrapper
// =============================================================================

export type SuspenseStatus = 'pending' | 'resolved' | 'error'

export class SuspenseWrapper<T> {
  private _status: SuspenseStatus = 'pending'
  private _data: T | null = null
  private _error: Error | null = null
  private _listeners: Set<() => void> = new Set()

  resolve(data: T): void {
    this._data = data
    this._status = 'resolved'
    this._emit()
  }

  reject(error: Error): void {
    this._error = error
    this._status = 'error'
    this._emit()
  }

  reset(): void {
    this._status = 'pending'
    this._data = null
    this._error = null
  }

  getStatus(): SuspenseStatus { return this._status }
  getData(): T | null { return this._data }
  getError(): Error | null { return this._error }

  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
  private _emit(): void { for (const l of this._listeners) try { l() } catch { /* swallow */ } }
}

// =============================================================================
// O25: PerformanceMonitor
// =============================================================================

export class PerformanceMonitor {
  private _samples: Map<string, number[]> = new Map()
  private _maxSamples: number

  constructor(maxSamples: number = 100) {
    this._maxSamples = maxSamples
  }

  record(operation: string, durationMs: number): void {
    if (!this._samples.has(operation)) this._samples.set(operation, [])
    const arr = this._samples.get(operation)!
    arr.push(durationMs)
    if (arr.length > this._maxSamples) arr.shift()
  }

  average(operation: string): number {
    const arr = this._samples.get(operation)
    if (!arr || arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  p95(operation: string): number {
    const arr = this._samples.get(operation)
    if (!arr || arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length * 0.95)] ?? 0
  }

  slowOperations(thresholdMs: number = 100): string[] {
    const out: string[] = []
    for (const [op, arr] of this._samples) {
      if (arr.length > 0 && arr[arr.length - 1]! > thresholdMs) out.push(op)
    }
    return out
  }

  count(): number {
    let total = 0
    for (const arr of this._samples.values()) total += arr.length
    return total
  }
}