/**
 * V49 L3 SemanticMemory - 知识图谱
 * 
 * 语义记忆负责存储结构化的知识概念和它们之间的关系
 * 特性：
 * - KnowledgeNode: 概念节点（类型、属性、置信度）
 * - KnowledgeGraph: 知识图谱操作（添加、链接、查询、遍历、合并）
 */

import Dexie from 'dexie'

// 知识节点类型
export type KnowledgeNodeType = 
  | 'character' 
  | 'location' 
  | 'item' 
  | 'concept' 
  | 'event' 
  | 'rule' 
  | 'custom'

// 知识节点
export interface KnowledgeNode {
  id?: number
  type: KnowledgeNodeType
  name: string
  content: string              // 主要描述
  properties: Record<string, string>  // 键值属性
  connections: number[]         // 关联的节点ID列表
  confidence: number           // 置信度 0-1
  lastUpdated: number
  createdAt: number
  accessCount: number
  projectId?: number
  tags?: string[]
}

// 知识边（关系）
export interface KnowledgeEdge {
  id?: number
  sourceId: number
  targetId: number
  relation: string              // e.g., 'owns', 'located_at', 'enemy_of'
  strength: number             // 关系强度 0-1
  createdAt: number
  metadata?: Record<string, unknown>
}

// 知识图谱检索选项
export interface GraphQuery {
  type?: KnowledgeNodeType
  name?: string
  tags?: string[]
  projectId?: number
  limit?: number
}

// 图遍历选项
export interface TraverseOptions {
  depth?: number               // 最大深度
  relation?: string            // 只跟随特定关系
  direction?: 'outgoing' | 'incoming' | 'both'
  minStrength?: number         // 最小关系强度
}

export class SemanticMemory {
  private db: Dexie | null = null

  constructor() {}

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Dexie> {
    if (!this.db) {
      this.db = new Dexie('SemanticMemoryDB')
      this.db.version(1).stores({
        nodes: '++id, type, name, projectId, confidence, lastUpdated, createdAt',
        edges: '++id, sourceId, targetId, relation, strength',
        node_tags: '++id, nodeId, tag',
      })
    }
    return this.db
  }

  /**
   * 添加知识节点
   */
  async addNode(node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'accessCount' | 'lastUpdated'>): Promise<number> {
    const db = await this.getDb()
    const now = Date.now()
    
    const newNode: KnowledgeNode = {
      ...node,
      createdAt: now,
      lastUpdated: now,
      accessCount: 0,
    }
    
    const id = await db.table('nodes').add(newNode)
    
    // 添加标签索引
    if (node.tags && node.tags.length > 0) {
      for (const tag of node.tags) {
        await db.table('node_tags').add({ nodeId: id as number, tag }).catch(() => {})
      }
    }
    
    return id as number
  }

  /**
   * 链接两个节点
   */
  async linkNodes(
    sourceId: number,
    targetId: number,
    relation: string,
    strength = 0.5
  ): Promise<number> {
    const db = await this.getDb()
    
    // 检查边是否已存在
    const existing = await db.table('edges')
      .where('sourceId').equals(sourceId)
      .and(e => e.targetId === targetId)
      .first()
    
    if (existing?.id) {
      // 更新现有边
      await db.table('edges').update(existing.id, { relation, strength })
      return existing.id
    }
    
    const edge: KnowledgeEdge = {
      sourceId,
      targetId,
      relation,
      strength,
      createdAt: Date.now(),
    }
    
    const id = await db.table('edges').add(edge)
    
    // 更新源节点的连接列表
    const sourceNode = await db.table('nodes').get(sourceId)
    if (sourceNode) {
      const connections = Array.from(new Set([...sourceNode.connections, targetId]))
      await db.table('nodes').update(sourceId, { connections })
    }
    
    return id as number
  }

  /**
   * 按类型查询节点
   */
  async queryByType(type: KnowledgeNodeType, projectId?: number): Promise<KnowledgeNode[]> {
    const db = await this.getDb()
    let nodes = await db.table('nodes').where('type').equals(type).toArray()
    
    if (projectId !== undefined) {
      nodes = nodes.filter(n => n.projectId === projectId)
    }
    
    return nodes
  }

  /**
   * 按名称搜索节点
   */
  async searchByName(query: string, limit = 20): Promise<KnowledgeNode[]> {
    const db = await this.getDb()
    const nodes = await db.table('nodes').toArray()
    const queryLower = query.toLowerCase()
    
    return nodes
      .filter(n => n.name.toLowerCase().includes(queryLower))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
  }

  /**
   * 图遍历
   */
  async traverse(startNodeId: number, options: TraverseOptions = {}): Promise<{
    nodes: KnowledgeNode[]
    edges: KnowledgeEdge[]
  }> {
    const db = await this.getDb()
    const depth = options.depth || 2
    const visitedNodes = new Set<number>()
    const resultNodes: KnowledgeNode[] = []
    const resultEdges: KnowledgeEdge[] = []
    
    const queue: Array<{ nodeId: number; currentDepth: number }> = [
      { nodeId: startNodeId, currentDepth: 0 }
    ]
    
    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!
      
      if (visitedNodes.has(nodeId) || currentDepth > depth) continue
      visitedNodes.add(nodeId)
      
      const node = await db.table('nodes').get(nodeId)
      if (!node) continue
      
      resultNodes.push(node)
      
      if (currentDepth >= depth) continue
      
      // 获取出边
      let edges = await db.table('edges')
        .where('sourceId')
        .equals(nodeId)
        .toArray()
      
      // 如果是双向或入向，也获取入边
      if (options.direction === 'both' || options.direction === 'incoming') {
        const incomingEdges = await db.table('edges')
          .where('targetId')
          .equals(nodeId)
          .toArray()
        edges = [...edges, ...incomingEdges]
      }
      
      for (const edge of edges) {
        // 关系过滤
        if (options.relation && edge.relation !== options.relation) continue
        // 强度过滤
        if (options.minStrength && edge.strength < options.minStrength) continue
        
        resultEdges.push(edge)
        
        const nextNodeId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId
        if (!visitedNodes.has(nextNodeId)) {
          queue.push({ nodeId: nextNodeId, currentDepth: currentDepth + 1 })
        }
      }
    }
    
    return { nodes: resultNodes, edges: resultEdges }
  }

  /**
   * 合并两个节点
   */
  async mergeNodes(sourceId: number, targetId: number): Promise<number> {
    const db = await this.getDb()
    
    const sourceNode = await db.table('nodes').get(sourceId)
    const targetNode = await db.table('nodes').get(targetId)
    
    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found')
    }
    
    // 更新目标节点的属性（保留更高的置信度）
    const mergedProperties = { ...targetNode.properties }
    for (const [key, value] of Object.entries(sourceNode.properties)) {
      if (!mergedProperties[key]) {
        mergedProperties[key] = value
      }
    }
    
    const mergedConnections = Array.from(new Set([...targetNode.connections, ...sourceNode.connections]))
    const mergedConfidence = Math.max(sourceNode.confidence, targetNode.confidence)
    const mergedTags = Array.from(new Set([...(targetNode.tags || []), ...(sourceNode.tags || [])]))
    
    await db.table('nodes').update(targetId, {
      properties: mergedProperties,
      connections: mergedConnections,
      confidence: mergedConfidence,
      tags: mergedTags,
      lastUpdated: Date.now(),
    })
    
    // 更新所有指向源节点的边，使其指向目标节点
    const edges = await db.table('edges').toArray()
    for (const edge of edges) {
      if (edge.sourceId === sourceId) {
        await db.table('edges').update(edge.id!, { sourceId: targetId })
      }
      if (edge.targetId === sourceId) {
        await db.table('edges').update(edge.id!, { targetId: targetId })
      }
    }
    
    // 删除源节点
    await db.table('nodes').delete(sourceId)
    
    return targetId
  }

  /**
   * 获取节点详情
   */
  async getNode(id: number): Promise<KnowledgeNode | undefined> {
    const db = await this.getDb()
    const node = await db.table('nodes').get(id)
    
    if (node) {
      node.accessCount++
      await db.table('nodes').update(id, {
        accessCount: node.accessCount,
        lastUpdated: Date.now(),
      })
    }
    
    return node
  }

  /**
   * 获取节点的关联边
   */
  async getNodeEdges(id: number): Promise<KnowledgeEdge[]> {
    const db = await this.getDb()
    const edges = await db.table('edges').toArray()
    
    return edges.filter(e => e.sourceId === id || e.targetId === id)
  }

  /**
   * 更新节点
   */
  async updateNode(id: number, updates: Partial<KnowledgeNode>): Promise<void> {
    const db = await this.getDb()
    await db.table('nodes').update(id, {
      ...updates,
      lastUpdated: Date.now(),
    })
  }

  /**
   * 删除节点及其所有边
   */
  async deleteNode(id: number): Promise<void> {
    const db = await this.getDb()
    
    // 删除所有相关边
    const edges = await db.table('edges').toArray()
    for (const edge of edges) {
      if (edge.sourceId === id || edge.targetId === id) {
        await db.table('edges').delete(edge.id!)
      }
    }
    
    // 删除节点
    await db.table('nodes').delete(id)
    
    // 删除标签索引
    await db.table('node_tags').where('nodeId').equals(id).delete()
  }

  /**
   * 获取统计信息
   */
  async getStats(projectId?: number): Promise<{
    totalNodes: number
    byType: Record<string, number>
    totalEdges: number
    avgConnections: number
  }> {
    const db = await this.getDb()
    let nodes = await db.table('nodes').toArray()
    
    if (projectId !== undefined) {
      nodes = nodes.filter(n => n.projectId === projectId)
    }
    
    const edges = await db.table('edges').toArray()
    const byType: Record<string, number> = {}
    
    for (const node of nodes) {
      byType[node.type] = (byType[node.type] || 0) + 1
    }
    
    const totalConnections = nodes.reduce((sum, n) => sum + n.connections.length, 0)
    
    return {
      totalNodes: nodes.length,
      byType,
      totalEdges: edges.length,
      avgConnections: totalConnections / (nodes.length || 1),
    }
  }
}

// Singleton instance
export const semanticMemory = new SemanticMemory()