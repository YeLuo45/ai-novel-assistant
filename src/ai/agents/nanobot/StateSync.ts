/**
 * StateSync.ts - 状态同步
 * V41 多Agent协作系统核心组件
 */

import { PlotPoint } from './PlotAgent'
import { Character } from './CharacterAgent'

export interface Review {
  id: string
  timestamp: number
  score: number
  approved: boolean
}

export interface SharedState {
  plotOutline: PlotPoint[]
  characters: Character[]
  currentChapter: number
  pendingReviews: Review[]
}

export type StateChangeCallback = (state: SharedState) => void

export class StateSync {
  private state: SharedState
  private watchers: Set<StateChangeCallback> = new Set()

  constructor(initialState?: Partial<SharedState>) {
    this.state = {
      plotOutline: initialState?.plotOutline ?? [],
      characters: initialState?.characters ?? [],
      currentChapter: initialState?.currentChapter ?? 1,
      pendingReviews: initialState?.pendingReviews ?? []
    }
  }

  /**
   * 获取共享状态
   */
  getSharedState(): SharedState {
    return {
      plotOutline: [...this.state.plotOutline],
      characters: [...this.state.characters],
      currentChapter: this.state.currentChapter,
      pendingReviews: [...this.state.pendingReviews]
    }
  }

  /**
   * 更新状态
   */
  updateState(updates: Partial<SharedState>): void {
    const prevState = { ...this.state }

    if (updates.plotOutline !== undefined) {
      this.state.plotOutline = updates.plotOutline
    }
    if (updates.characters !== undefined) {
      this.state.characters = updates.characters
    }
    if (updates.currentChapter !== undefined) {
      this.state.currentChapter = updates.currentChapter
    }
    if (updates.pendingReviews !== undefined) {
      this.state.pendingReviews = updates.pendingReviews
    }

    // 通知所有 watcher
    this.notifyWatchers(prevState, this.state)
  }

  /**
   * 添加情节点
   */
  addPlotPoint(plotPoint: PlotPoint): void {
    this.state.plotOutline.push(plotPoint)
    this.notifyWatchers({ ...this.state }, { ...this.state })
  }

  /**
   * 添加角色
   */
  addCharacter(character: Character): void {
    this.state.characters.push(character)
    this.notifyWatchers({ ...this.state }, { ...this.state })
  }

  /**
   * 添加待评审
   */
  addPendingReview(review: Review): void {
    this.state.pendingReviews.push(review)
    this.notifyWatchers({ ...this.state }, { ...this.state })
  }

  /**
   * 推进章节
   */
  advanceChapter(): void {
    this.state.currentChapter++
    this.notifyWatchers({ ...this.state }, { ...this.state })
  }

  /**
   * 设置当前章节
   */
  setCurrentChapter(chapter: number): void {
    this.state.currentChapter = chapter
    this.notifyWatchers({ ...this.state }, { ...this.state })
  }

  /**
   * 清除待评审
   */
  clearPendingReviews(): void {
    this.state.pendingReviews = []
    this.notifyWatchers({ ...this.state }, { ...this.state })
  }

  /**
   * 观察状态变化
   */
  watchChanges(callback: StateChangeCallback): () => void {
    this.watchers.add(callback)
    // 返回取消订阅函数
    return () => {
      this.watchers.delete(callback)
    }
  }

  /**
   * 通知所有 watcher
   */
  private notifyWatchers(prevState: SharedState, newState: SharedState): void {
    for (const watcher of Array.from(this.watchers)) {
      try {
        watcher(newState)
      } catch (err) {
        console.error('[StateSync] Watcher error:', err)
      }
    }
  }

  /**
   * 清空所有监视器
   */
  clearWatchers(): void {
    this.watchers.clear()
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      plotOutline: [],
      characters: [],
      currentChapter: 1,
      pendingReviews: []
    }
    this.watchers.clear()
  }

  /**
   * 获取状态快照
   */
  snapshot(): { state: SharedState; timestamp: number } {
    return {
      state: this.getSharedState(),
      timestamp: Date.now()
    }
  }
}

// 导出单例
export const stateSync = new StateSync()
