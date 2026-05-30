import { useState } from 'react'
import { shareManager } from '@/services/ShareManager'

interface Props {
  projectId: string
}

export function SharePanel({ projectId }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareType, setShareType] = useState<'read' | 'collaborate'>('read')
  const [loading, setLoading] = useState(false)

  const handleCreateLink = async () => {
    setLoading(true)
    try {
      const url = await shareManager.createShareLink(projectId, shareType)
      setShareUrl(url)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      alert('链接已复制到剪贴板')
    }
  }

  const handleGenerateQR = () => {
    if (shareUrl) {
      const qr = shareManager.generateQRCode(shareUrl)
      // 打开新窗口显示二维码
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(`<img src="${qr}" width="300" height="300"/>扫码访问`)
      }
    }
  }

  return (
    <div className="share-panel p-4 bg-white border rounded-lg">
      <h3 className="font-bold mb-4">🔗 分享作品</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">分享类型</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShareType('read')}
              className={`flex-1 px-4 py-2 rounded text-sm ${
                shareType === 'read' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              只读分享
            </button>
            <button
              onClick={() => setShareType('collaborate')}
              className={`flex-1 px-4 py-2 rounded text-sm ${
                shareType === 'collaborate' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              协作分享
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {shareType === 'read' ? '仅可查看内容' : '可编辑和评论'}
          </p>
        </div>

        {!shareUrl ? (
          <button
            onClick={handleCreateLink}
            disabled={loading}
            className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition"
          >
            {loading ? '生成中...' : '生成分享链接'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-gray-100 rounded break-all text-sm">
              {shareUrl}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
              >
                复制链接
              </button>
              <button
                onClick={handleGenerateQR}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                二维码
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              链接7天内有效
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
