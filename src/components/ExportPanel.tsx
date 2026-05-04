import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { generatePdf, PdfChapter, PdfExportOptions, buildPdfChapterList } from '../services/PdfExportService'
import { generateEpub, downloadEpub } from '../services/EpubExportService'

interface ExportChapter {
  id: number
  title: string
  content: string
  type: 'volume' | 'chapter' | 'section' | 'scene'
}

interface Props {
  isOpen: boolean
  onToggle: () => void
}

type ExportFormat = 'epub' | 'pdf'
type ExportScope = 'all' | 'current'

export function ExportPanel({ isOpen, onToggle }: Props) {
  const { currentProject, outlineNodes, materialCards } = useStore()
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [scope, setScope] = useState<ExportScope>('all')
  const [includeMaterials, setIncludeMaterials] = useState(false)
  const [bookTitle, setBookTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('zh-CN')
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [cropCanvas, setCropCanvas] = useState<HTMLCanvasElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize cropper canvas when image is selected
  useEffect(() => {
    if (!showCropper || !coverImage || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      // 1:1.4 aspect ratio (standard book cover)
      const targetRatio = 1 / 1.4
      let sx = 0, sy = 0, sw = img.width, sh = img.height
      const imgRatio = img.width / img.height
      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio
        sx = (img.width - sw) / 2
      } else {
        sh = img.width / targetRatio
        sy = (img.height - sh) / 2
      }
      canvas.width = 300
      canvas.height = 300 / targetRatio
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      setCropCanvas(canvas)
    }
    img.src = coverImage
  }, [showCropper, coverImage])

  const applyCrop = () => {
    if (!cropCanvas) return
    const cropped = cropCanvas.toDataURL('image/jpeg', 0.9)
    setCoverImage(cropped)
    setShowCropper(false)
  }

  if (!isOpen) return null

  const handleExport = async () => {
    if (!currentProject) return
    setIsExporting(true)
    setStatus('正在准备导出...')

    try {
      const title = bookTitle || currentProject.title

      // Build flat ordered list of chapters
      const buildChapterList = (parentId: number | null): ExportChapter[] => {
        return outlineNodes
          .filter(n => n.parentId === parentId)
          .sort((a, b) => a.order - b.order)
          .flatMap(n => [
            {
              id: n.id as number,
              title: n.title,
              content: n.content,
              type: n.type
            },
            ...buildChapterList(n.id ?? null)
          ])
      }

      const allChapters = buildChapterList(null)
      const chaptersToExport = scope === 'all'
        ? allChapters
        : allChapters.slice(0, 10) // placeholder for current

      if (format === 'pdf') {
        setStatus('正在生成 PDF...')
        const pdfChapters: PdfChapter[] = chaptersToExport.map(ch => ({
          title: ch.title,
          content: ch.content || '',
          type: ch.type as 'volume' | 'chapter' | 'section',
        }))
        const pdfOptions: PdfExportOptions = {
          includeMaterials,
          materialCards: includeMaterials ? materialCards.map(card => ({
            type: card.type,
            name: card.name,
            fields: card.fields,
          })) : undefined,
        }
        await generatePdf(
          {
            title,
            author: author || undefined,
            language,
            description,
            category,
          },
          pdfChapters,
          pdfOptions
        )
        setStatus('PDF 导出成功！')
      } else {
        // EPUB export
        setStatus('正在生成 EPUB...')
        const allChaptersForEpub = buildChapterList(null)
        if (allChaptersForEpub.length === 0) {
          setStatus('没有可导出的章节')
          setIsExporting(false)
          return
        }
        const epubChapters = allChaptersForEpub.map((ch, i) => ({
          id: String(ch.id),
          title: ch.title || `第${i + 1}章`,
          content: `<p>${(ch.content || '').replace(/\n/g, '</p><p>')}</p>`
        }))
        const metadata = {
          title: title,
          author: author || '未知作者',
          language: language || 'zh-CN',
          description: description,
          category: category
        }
        const blob = await generateEpub(metadata, epubChapters, coverImage)
        downloadEpub(blob, `${title}.epub`)
        setStatus('EPUB 导出成功！')
      }

      setTimeout(() => setStatus(''), 3000)
    } catch (err) {
      console.error('Export failed:', err)
      setStatus('导出失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">📤 导出</h3>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Book Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            书名
          </label>
          <input
            type="text"
            value={bookTitle}
            onChange={e => setBookTitle(e.target.value)}
            placeholder={currentProject?.title || '请输入书名'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作者
          </label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="（留空）"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分类
          </label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="（留空）"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            简介
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="（留空）"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            语言
          </label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            导出格式
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('pdf')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                format === 'pdf'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📄 PDF
            </button>
            <button
              onClick={() => setFormat('epub')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                format === 'epub'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📚 EPUB
            </button>
          </div>
          {format === 'epub' && (
            <p className="mt-1 text-xs text-green-600">
              ✅ EPUB 导出功能已就绪
            </p>
          )}
        </div>

        {/* Scope */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            导出范围
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setScope('all')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                scope === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全项目
            </button>
            <button
              onClick={() => setScope('current')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                scope === 'current'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              当前章节
            </button>
          </div>
        </div>

        {/* Include Materials */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeMaterials"
            checked={includeMaterials}
            onChange={e => setIncludeMaterials(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="includeMaterials" className="text-sm text-gray-700">
            包含素材卡（作为附录）
          </label>
        </div>

        {/* Cover Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            书籍封面
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => {
                const src = ev.target?.result as string
                setCoverImage(src)
                setShowCropper(true)
              }
              reader.readAsDataURL(file)
              e.target.value = ''
            }}
            className="hidden"
          />
          {coverImage && !showCropper ? (
            <div className="relative">
              <img src={coverImage} alt="Cover" className="w-full h-auto rounded border" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 w-full py-1.5 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                重新上传
              </button>
            </div>
          ) : showCropper ? (
            <div>
              <canvas ref={canvasRef} className="border rounded w-full" />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={applyCrop}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  确认裁剪
                </button>
                <button
                  onClick={() => {
                    setShowCropper(false)
                    setCoverImage(null)
                  }}
                  className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 border-2 border-dashed border-gray-300 text-gray-600 text-sm rounded hover:border-indigo-400 hover:text-indigo-600"
            >
              + 上传封面图片
            </button>
          )}
        </div>

        {/* Chapter count */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            将导出 <span className="font-medium text-gray-800">{outlineNodes.length}</span> 个节点
          </p>
          {includeMaterials && (
            <p className="text-sm text-gray-600">
              + <span className="font-medium text-gray-800">{materialCards.length}</span> 张素材卡
            </p>
          )}
        </div>

        {/* Status */}
        {status && (
          <div className={`text-sm p-3 rounded-lg ${
            status.includes('成功') ? 'bg-green-50 text-green-700' :
            status.includes('失败') ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {status}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isExporting ? '导出中...' : `导出 ${format.toUpperCase()}`}
        </button>
      </div>
    </div>
  )
}
