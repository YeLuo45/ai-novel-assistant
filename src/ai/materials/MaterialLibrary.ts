import type { MaterialType, BaseMaterial } from './types'

export class MaterialLibrary {
  private materials: Map<string, BaseMaterial> = new Map()
  private byType: Map<MaterialType, Set<string>> = new Map()
  private byTag: Map<string, Set<string>> = new Map()
  
  onUpdate?: (materials: BaseMaterial[]) => void
  
  add(material: BaseMaterial): void {
    this.materials.set(material.id, material)
    
    if (!this.byType.has(material.type)) {
      this.byType.set(material.type, new Set())
    }
    this.byType.get(material.type)!.add(material.id)
    
    for (const tag of material.tags) {
      if (!this.byTag.has(tag)) {
        this.byTag.set(tag, new Set())
      }
      this.byTag.get(tag)!.add(material.id)
    }
    
    this.save()
    this.onUpdate?.(this.getAll())
  }
  
  update(id: string, updates: Partial<BaseMaterial>): BaseMaterial | null {
    const existing = this.materials.get(id)
    if (!existing) return null
    
    const updated: BaseMaterial = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: Date.now()
    }
    
    this.materials.set(id, updated)
    this.save()
    this.onUpdate?.(this.getAll())
    return updated
  }
  
  delete(id: string): boolean {
    const m = this.materials.get(id)
    if (!m) return false
    
    this.materials.delete(id)
    this.byType.get(m.type)?.delete(id)
    
    for (const tag of m.tags) {
      this.byTag.get(tag)?.delete(id)
    }
    
    this.save()
    this.onUpdate?.(this.getAll())
    return true
  }
  
  getById(id: string): BaseMaterial | null {
    return this.materials.get(id) || null
  }
  
  getByType(type: MaterialType): BaseMaterial[] {
    const ids = this.byType.get(type) || new Set()
    return Array.from(ids).map(id => this.materials.get(id)!).filter(Boolean)
  }
  
  search(query: string): BaseMaterial[] {
    const q = query.toLowerCase()
    return Array.from(this.materials.values()).filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  
  getAll(): BaseMaterial[] {
    return Array.from(this.materials.values())
  }
  
  getStats(): Record<MaterialType, number> {
    const stats: Record<MaterialType, number> = {
      character: 0, scene: 0, plot: 0, item: 0, location: 0, world: 0
    }
    for (const m of this.materials.values()) {
      stats[m.type]++
    }
    return stats
  }
  
  export(): string {
    return JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      materials: Array.from(this.materials.values())
    }, null, 2)
  }
  
  import(json: string): number {
    try {
      const data = JSON.parse(json)
      const materials = data.materials as BaseMaterial[]
      let count = 0
      for (const m of materials) {
        if (m.id && m.name && m.type) {
          this.add(m)
          count++
        }
      }
      return count
    } catch {
      return 0
    }
  }
  
  private save(): void {
    try {
      localStorage.setItem('material_library', JSON.stringify(Array.from(this.materials.values())))
    } catch {}
  }
  
  load(): void {
    try {
      const data = localStorage.getItem('material_library')
      if (!data) return
      
      const materials = JSON.parse(data) as BaseMaterial[]
      this.materials.clear()
      this.byType.clear()
      this.byTag.clear()
      
      for (const m of materials) {
        this.add(m)
      }
    } catch {}
  }
}

export const materialLibrary = new MaterialLibrary()
