import type { VersionOptions, VersionStrategy, CompareMode } from './types'

export const DEFAULT_VERSION_OPTIONS: VersionOptions = {
  count: 2,
  strategy: 'style_variation',
  compareMode: 'side_by_side'
}

export const VERSION_STRATEGIES: { id: VersionStrategy; name: string; description: string }[] = [
  { id: 'style_variation', name: '风格变化', description: '文艺/口语/简洁不同风格' },
  { id: 'plot_branch', name: '情节分支', description: '探索不同情节发展路线' },
  { id: 'pov_switch', name: '视角切换', description: '主角/配角/旁观者不同视角' },
  { id: 'tone_shift', name: '语气变化', description: '严肃/幽默/抒情不同基调' },
  { id: 'mixed', name: '混合策略', description: '综合多种策略' }
]

export const COMPARE_MODES: { id: CompareMode; name: string; description: string }[] = [
  { id: 'side_by_side', name: '并排对比', description: '多个版本并排显示' },
  { id: 'unified_diff', name: '差异高亮', description: '突出显示版本间的差异' },
  { id: 'sequential', name: '顺序浏览', description: '按顺序逐一浏览各版本' }
]
