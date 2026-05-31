import { useState, useEffect, useRef } from 'react'
import { backupService, ImportStrategy, ImportPreview, BackupStats } from '../services/BackupService'
import { localBackupProvider, BackupMeta } from '../services/CloudBackupProvider'

type Tab = 'export' | 'import' | 'cloud'

interface Props {
  isOpen: boolean
  onClose: () => void
  onBackupSuccess?: () => void
}

export default function BackupPanel({ isOpen, onClose, onBackupSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('export')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [exportStats, setExportStats] = useState<BackupStats | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('merge')
  const [cloudBackups, setCloudBackups] = useState<BackupMeta[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load export stats when opening export tab
  useEffect(() => {
    if (isOpen && activeTab === 'export') {
      loadExportStats()
    }
  }, [isOpen, activeTab])

  // Load cloud backups when opening cloud tab
  useEffect(() => {
    if (isOpen && activeTab === 'cloud') {
      loadCloudBackups()
    }
  }, [isOpen, activeTab])

  const loadExportStats = async () => {
    try {
      const data = await backupService.gatherData()
      const stats = backupService.calculateStats(data)
      setExportStats(stats)
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  const loadCloudBackups = async () => {
    try {
      const backups = await localBackupProvider.list()
      setCloudBackups(backups)
    } catch (e) {
      console.error('Failed to load cloud backups:', e)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    setStatus('正在导出数据...')
    try {
      const result = await backupService.exportData()
      setStatus(result)
      onBackupSuccess?.()
      setTimeout(() => setStatus(''), 3000)
    } catch (e) {
      setStatus('导出失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsLoading(true)
    setStatus('正在解析文件...')

    try {
      const { content } = await backupService.parseFile(file)
      const data = backupService.validateAndParse(content)
      const preview = await backupService.previewImport(data)
      setImportPreview(preview)
      setStatus('')
    } catch (err) {
      setStatus('解析失败：' + (err instanceof Error ? err.message : String(err)))
      setSelectedFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importPreview) return

    setIsLoading(true)
    try {
      const result = await backupService.executeImport(
        importPreview.data,
        importStrategy,
        (msg) => setStatus(msg)
      )
      setStatus(`导入完成：成功 ${result.success}，失败 ${result.failed}，跳过 ${result.skipped}`)
      setSelectedFile(null)
      setImportPreview(null)
      onBackupSuccess?.()
      setTimeout(() => setStatus(''), 3000)
    } catch (err) {
      setStatus('导入失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCloudSnapshot = async () => {
    setIsLoading(true)
    setStatus('正在创建本地快照...')
    try {
      const data = await backupService.gatherData()
      const json = JSON.stringify(data)
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode(json).buffer
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
      await localBackupProvider.upload(arrayBuffer, `快照_${timestamp}`)
      
      setStatus('本地快照创建成功')
      loadCloudBackups()
      onBackupSuccess?.()
      setTimeout(() => setStatus(''), 3000)
    } catch (e) {
      setStatus('创建失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreCloudSnapshot = async (backupId: string) => {
    setIsLoading(true)
    setStatus('正在恢复快照...')
    try {
      const arrayBuffer = await localBackupProvider.download(backupId)
      const decoder = new TextDecoder()
      const json = decoder.decode(arrayBuffer)
      const data = backupService.validateAndParse(json)
      
      // Import with overwrite strategy for restore
      const result = await backupService.executeImport(data, 'overwrite', (msg) => setStatus(msg))
      setStatus(`恢复完成：成功 ${result.success}，失败 ${result.failed}，跳过 ${result.skipped}`)
      onBackupSuccess?.()
      setTimeout(() => setStatus(''), 3000)
    } catch (e) {
      setStatus('恢复失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCloudSnapshot = async (backupId: string) => {
    try {
      await localBackupProvider.delete(backupId)
      loadCloudBackups()
      setStatus('已删除快照')
      setTimeout(() => setStatus(''), 2000)
    } catch (e) {
      setStatus('删除失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  if (!isOpen) return null

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'export', label: '导出', icon: '📤' },
    { key: 'import', label: '导入', icon: '📥' },
    { key: 'cloud', label: '云端设置', icon: '☁️' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-bg rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <h2 className="text-xl font-bold text-dark-text">备份与同步</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-dark-text-secondary rounded-lg hover:bg-dark-bg-tertiary"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-dark-text-secondary hover:text-gray-700 hover:bg-dark-bg-tertiary'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-dark-bg-tertiary rounded-xl p-6">
                <h3 className="font-medium text-dark-text mb-4">📊 数据统计预览</h3>
                {exportStats ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-dark-bg rounded-lg p-3">
                      <div className="text-dark-text-secondary">项目</div>
                      <div className="text-2xl font-bold text-dark-text">{exportStats.projectCount}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3">
                      <div className="text-dark-text-secondary">章节</div>
                      <div className="text-2xl font-bold text-dark-text">{exportStats.chapterCount}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3">
                      <div className="text-dark-text-secondary">角色</div>
                      <div className="text-2xl font-bold text-dark-text">{exportStats.characterCount}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3">
                      <div className="text-dark-text-secondary">总字数</div>
                      <div className="text-2xl font-bold text-dark-text">{exportStats.totalWordCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3 col-span-2">
                      <div className="text-dark-text-secondary">预估大小</div>
                      <div className="text-2xl font-bold text-dark-text">{exportStats.estimatedSize}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-dark-text-secondary py-4">加载中...</div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">💡 导出的内容</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600">
                  <li>所有项目、章节、角色、世界观</li>
                  <li>聊天记录、写作统计</li>
                  <li>AI 配置和设置</li>
                </ul>
              </div>

              {status && (
                <div className={`p-3 rounded-lg text-sm ${
                  status.includes('失败') ? 'bg-red-50 text-red-700' :
                  status.includes('成功') ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {status}
                </div>
              )}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-dashed border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-dark-text-secondary mb-1">点击选择备份文件</p>
                  <p className="text-sm text-gray-400">支持 .json 或 .zip 格式</p>
                </div>
              ) : importPreview ? (
                <div className="space-y-4">
                  {/* Preview Stats */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-dark-text mb-3">📋 导入预览</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-dark-bg rounded-lg p-3 text-center">
                        <div className="text-dark-text-secondary">项目</div>
                        <div className="text-xl font-bold">{importPreview.stats.projectCount}</div>
                      </div>
                      <div className="bg-dark-bg rounded-lg p-3 text-center">
                        <div className="text-dark-text-secondary">章节</div>
                        <div className="text-xl font-bold">{importPreview.stats.chapterCount}</div>
                      </div>
                      <div className="bg-dark-bg rounded-lg p-3 text-center">
                        <div className="text-dark-text-secondary">角色</div>
                        <div className="text-xl font-bold">{importPreview.stats.characterCount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Conflicts */}
                  {importPreview.conflicts.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <h3 className="font-medium text-amber-800 mb-2">⚠️ 检测到 {importPreview.conflicts.length} 个冲突</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {importPreview.conflicts.map((c, i) => (
                          <div key={i} className="text-sm text-amber-700">
                            "{c.importName}" 与本地项目 "{c.localName}" 重名
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategy */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-dark-text mb-3">🔧 冲突处理策略</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'merge', label: '合并', desc: '同名项目保留双方，导入项目重命名' },
                        { value: 'overwrite', label: '覆盖', desc: '以导入数据为准，覆盖本地同名项目' },
                        { value: 'skip', label: '跳过', desc: '保留本地版本，忽略导入的同名项目' }
                      ].map(opt => (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            importStrategy === opt.value
                              ? 'bg-indigo-50 border-2 border-indigo-500'
                              : 'bg-white hover:bg-dark-bg-tertiary border-2 border-transparent'
                          }`}
                        >
                          <input
                            type="radio"
                            name="strategy"
                            value={opt.value}
                            checked={importStrategy === opt.value}
                            onChange={() => setImportStrategy(opt.value as ImportStrategy)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-dark-text">{opt.label}</div>
                            <div className="text-sm text-dark-text-secondary">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setSelectedFile(null); setImportPreview(null) }}
                      className="flex-1 py-2 px-4 border border-dark-border text-gray-700 rounded-lg hover:bg-dark-bg-tertiary"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isLoading}
                      className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? '导入中...' : '确认导入'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">📂</div>
                  <p className="text-dark-text-secondary">{selectedFile.name}</p>
                  <button
                    onClick={() => { setSelectedFile(null); setImportPreview(null) }}
                    className="mt-2 text-sm text-dark-text-secondary hover:text-gray-700"
                  >
                    重新选择
                  </button>
                </div>
              )}

              {status && (
                <div className={`p-3 rounded-lg text-sm ${
                  status.includes('失败') ? 'bg-red-50 text-red-700' :
                  status.includes('完成') ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {status}
                </div>
              )}
            </div>
          )}

          {/* Cloud Tab */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700">
                <p className="font-medium mb-2">☁️ 本地快照</p>
                <p className="mb-2">快照保存在浏览器本地存储中，可用于在不同设备间手动备份。但空间有限，建议定期清理。</p>
                <button
                  onClick={handleCreateCloudSnapshot}
                  disabled={isLoading}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? '创建中...' : '+ 创建本地快照'}
                </button>
              </div>

              <div>
                <h3 className="font-medium text-dark-text mb-3">📜 快照列表</h3>
                {cloudBackups.length === 0 ? (
                  <div className="text-center py-8 text-dark-text-secondary">
                    <div className="text-2xl mb-2">📭</div>
                    <p>暂无快照</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cloudBackups.map(backup => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-dark-text">{backup.name}</div>
                          <div className="text-xs text-dark-text-secondary">
                            {new Date(backup.createdAt).toLocaleString()} · {backup.size}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestoreCloudSnapshot(backup.id)}
                            disabled={isLoading}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            恢复
                          </button>
                          <button
                            onClick={() => handleDeleteCloudSnapshot(backup.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {status && (
                <div className={`p-3 rounded-lg text-sm ${
                  status.includes('失败') || status.includes('失败') ? 'bg-red-50 text-red-700' :
                  status.includes('成功') || status.includes('完成') || status.includes('创建') ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {status}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'export' && (
          <div className="px-6 py-4 border-t border-dark-border">
            <button
              onClick={handleExport}
              disabled={isLoading || !exportStats}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '导出中...' : '📤 导出数据'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
