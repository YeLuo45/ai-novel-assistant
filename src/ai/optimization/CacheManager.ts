export interface CacheEntry {
  key: string
  content: string
  createdAt: number
  lastAccessedAt: number
  hitCount: number
  metadata: {
    agentId: string
    prompt: string
    strategy?: string
  }
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 100
  private ttl: number = 7 * 24 * 60 * 60 * 1000  // 7天
  
  generateKey(prompt: string, agentId: string, strategy?: string): string {
    const hash = this.hashString(prompt)
    return `${agentId}_${strategy || 'default'}_${hash}`
  }
  
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
  
  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.createdAt > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    entry.lastAccessedAt = Date.now()
    entry.hitCount++
    
    return entry.content
  }
  
  set(key: string, content: string, metadata: CacheEntry['metadata']): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      key,
      content,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      hitCount: 0,
      metadata
    })
  }
  
  cleanExpired(): number {
    const now = Date.now()
    let count = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.ttl) {
        this.cache.delete(key)
        count++
      }
    }
    
    return count
  }
  
  private evictOldest(): void {
    let oldest: string | null = null
    let oldestTime = Infinity
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt
        oldest = key
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest)
    }
  }
  
  getStats(): { size: number; hitRate: number; oldestEntry: number } {
    let totalHits = 0
    let oldest = 0
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount
      if (entry.createdAt < oldest || oldest === 0) {
        oldest = entry.createdAt
      }
    }
    
    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      oldestEntry: oldest
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
}

export const cacheManager = new CacheManager()
