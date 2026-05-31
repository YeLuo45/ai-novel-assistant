import { useState, useRef } from 'react'
import { importMaterials, parseMaterialFromCSV, type ImportStrategy, type ImportResult, MaterialCard } from '../db'
import { useStore } from '../store'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

type ImportMode = 'json' | 'csv'

export function ImportModal({ isOpen, onClose, onImportComplete }: Props) {
  const { currentProject, loadMaterialCards } = useStore()
  const [mode, setMode] = useState<ImportMode>('json')
  const [strategy, setStrategy] = useState<ImportStrategy>('update_by_id')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // CSV column mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    type: 'type',
    name: 'name'
  })
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (mode === 'json') {
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        if (data.materials && Array.isArray(data.materials)) {
          setPreviewData(data.materials.slice(0, 5))
        } else if (Array.isArray(data)) {
          setPreviewData(data.slice(0, 5))
        } else {
          alert('无效的JSON格式')
        }
      } catch (err) {
        alert('JSON解析失败: ' + err)
      }
    } else {
      // CSV mode
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        alert('CSV文件至少需要包含标题行和数据行')
        return
      }

      // Parse headers
      const headers = parseCSVLine(lines[0])
      setCsvHeaders(headers)

      // Auto-detect column mapping
      const autoMapping: Record<string, string> = { type: '', name: '' }
      for (const h of headers) {
        const lower = h.toLowerCase()
        if (lower.includes('类型') || lower === 'type') autoMapping['type'] = h
        if (lower.includes('名称') || lower.includes('名字') || lower === 'name') autoMapping['name'] = h
      }
      setColumnMapping(prev => ({ ...prev, ...autoMapping }))

      // Parse data rows
      const rows: Record<string, string>[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h] = values[idx] || ''
        })
        rows.push(row)
      }
      setCsvData(rows)

      // Preview first 5
      const preview: any[] = []
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const parsed = parseMaterialFromCSV(rows[i], columnMapping)
        if (parsed) preview.push(parsed)
      }
      setPreviewData(preview)
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleImport = async () => {
    if (!currentProject?.id) return

    setIsImporting(true)
    try {
      let result: ImportResult

      if (mode === 'json') {
        const file = fileInputRef.current?.files?.[0]
        if (!file) throw new Error('请选择文件')

        const text = await file.text()
        const data = JSON.parse(text)
        
        const importData = {
          version: 1 as const,
          importedAt: new Date().toISOString(),
          materials: (Array.isArray(data) ? data : data.materials || []).map((m: any) => ({
            type: m.type,
            name: m.name,
            avatar: m.avatar,
            fields: m.fields || {},
            tags: m.tags || []
          }))
        }

        result = await importMaterials(importData, currentProject.id, strategy)
      } else {
        // CSV mode
        const materials: ImportResult['imported'] extends number ? any[] : any[] = []
        for (const row of csvData) {
          const parsed = parseMaterialFromCSV(row, columnMapping)
          if (parsed) materials.push(parsed)
        }

        const importData = {
          version: 1 as const,
          importedAt: new Date().toISOString(),
          materials
        }

        result = await importMaterials(importData, currentProject.id, strategy)
      }

      setImportResult(result)
      await loadMaterialCards(currentProject.id)
      onImportComplete()
    } catch (err) {
      alert('导入失败: ' + err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setPreviewData([])
    setImportResult(null)
    setCsvHeaders([])
    setCsvData([])
    setColumnMapping({ type: 'type', name: 'name' })
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">导入素材</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Import Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setMode('json'); setPreviewData([]); setCsvData([]) }}
              className={`px-4 py-2 rounded ${mode === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              JSON 导入
            </button>
            <button
              onClick={() => { setMode('csv'); setPreviewData([]); setCsvData([]) }}
              className={`px-4 py-2 rounded ${mode === 'csv' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              CSV 导入
            </button>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">导入完成！</p>
              <p className="text-sm text-green-600">新建: {importResult.imported} | 更新: {importResult.updated} | 跳过: {importResult.skipped}</p>
              {importResult.errors.length > 0 && (
                <p className="text-sm text-red-600 mt-1">错误: {importResult.errors.join('; ')}</p>
              )}
            </div>
          )}

          {/* Strategy Selection */}
          {!importResult && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">导入策略</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="update_by_id"
                      checked={strategy === 'update_by_id'}
                      onChange={() => setStrategy('update_by_id')}
                    />
                    <span className="text-sm">按名称更新（存在则更新，不存在则新建）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="full_replace"
                      checked={strategy === 'full_replace'}
                      onChange={() => setStrategy('full_replace')}
                    />
                    <span className="text-sm">全量覆盖（先删除后导入）</span>
                  </label>
                </div>
              </div>

              {/* File Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择{mode === 'json' ? 'JSON' : 'CSV'}文件
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mode === 'json' ? '.json' : '.csv'}
                  onChange={handleFileSelect}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* CSV Column Mapping */}
              {mode === 'csv' && csvHeaders.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="text-sm font-medium mb-2">CSV列映射</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['type', 'name', 'tags'].map(field => (
                      <div key={field} className="flex items-center gap-2">
                        <span className="text-sm w-16">{field}:</span>
                        <select
                          value={columnMapping[field] || ''}
                          onChange={e => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                        >
                          <option value="">-- 不映射 --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {/* 额外字段映射 */}
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">其他列将作为素材字段导入</p>
                  </div>
                </div>
              )}

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">预览（前5条）</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {previewData.map((item, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            item.type === 'character' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'location' ? 'bg-green-100 text-green-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {item.type === 'character' ? '角色' : item.type === 'location' ? '地点' : '物品'}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.fields && Object.keys(item.fields).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.fields).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <p className="text-xs text-purple-500 mt-1">标签: {item.tags.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {importResult ? '关闭' : '取消'}
          </button>
          {!importResult && previewData.length > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isImporting ? '导入中...' : '开始导入'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
