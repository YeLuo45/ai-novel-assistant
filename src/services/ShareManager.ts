export interface ShareLink {
  id: string
  projectId: string
  type: 'read' | 'collaborate'
  createdAt: number
  expiresAt?: number
  accessCount: number
}

export class ShareManager {
  private shareLinks: Map<string, ShareLink> = new Map()

  constructor() {
    this.load()
  }

  async createShareLink(projectId: string, type: 'read' | 'collaborate' = 'read'): Promise<string> {
    const shareId = this.generateId()

    const shareLink: ShareLink = {
      id: shareId,
      projectId,
      type,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
      accessCount: 0
    }

    this.shareLinks.set(shareId, shareLink)
    this.persist()

    return `${window.location.origin}/share/${shareId}`
  }

  getShareLink(shareId: string): ShareLink | null {
    return this.shareLinks.get(shareId) || null
  }

  async accessViaShare(shareId: string): Promise<string | null> {
    const link = this.shareLinks.get(shareId)

    if (!link) return null

    // 检查过期
    if (link.expiresAt && Date.now() > link.expiresAt) {
      return null
    }

    // 更新访问计数
    link.accessCount++
    this.persist()

    return link.projectId
  }

  revokeShareLink(shareId: string): boolean {
    return this.shareLinks.delete(shareId)
  }

  listShareLinks(projectId?: string): ShareLink[] {
    const links = Array.from(this.shareLinks.values())
    
    if (projectId) {
      return links.filter(l => l.projectId === projectId)
    }
    
    return links
  }

  /**
   * 生成二维码（返回data URL）
   */
  generateQRCode(url: string): string {
    // 简单的二维码生成
    // 实际使用时可以用 qrcode 库
    const size = 200
    const qr = this.simpleQR(url, size)
    return qr
  }

  /**
   * 简化QR码生成（实际项目建议用库）
   */
  private simpleQR(data: string, size: number): string {
    // 这里返回占位图，实际应该用 qrcode 库
    // 临时返回一个简单的 SVG
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">QR Code</text>
        <rect x="10" y="10" width="30" height="30" fill="black"/>
        <rect x="50" y="10" width="30" height="30" fill="black"/>
        <rect x="10" y="50" width="30" height="30" fill="black"/>
      </svg>
    `)}`
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  }

  private persist(): void {
    try {
      const data = Array.from(this.shareLinks.entries())
      localStorage.setItem('share_links', JSON.stringify(data))
    } catch {}
  }

  private load(): void {
    try {
      const data = localStorage.getItem('share_links')
      if (data) {
        this.shareLinks = new Map(JSON.parse(data))
      }
    } catch {}
  }
}

export const shareManager = new ShareManager()
