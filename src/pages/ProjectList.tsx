import { useEffect, useState, useMemo } from 'react'
import { useStore } from '../store'
import { Link } from 'react-router-dom'
import CreateProjectModal from '../components/CreateProjectModal'
import { db } from '../db'

function formatRelativeDate(date: Date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ProjectList() {
  const { projects, loadProjects, deleteProject } = useStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const latestUpdated = useMemo(() => {
    if (projects.length === 0) return null
    const sorted = [...projects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return sorted[0]
  }, [projects])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('确定要删除这个项目吗？')) {
      await deleteProject(id)
    }
  }

  const handleCopy = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const original = await db.projects.get(id)
    if (!original) return

    const copy = {
      title: original.title + ' (副本)',
      genre: original.genre || '',
      protagonistName: original.protagonistName || '',
      background: original.background || '',
      coreSellingPoint: original.coreSellingPoint || '',
      otherRequirements: original.otherRequirements || '',
      worldbuilding: original.worldbuilding || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const newId = await db.projects.add(copy)
    loadProjects()
    window.location.href = `/ai-novel-assistant/projects/${newId}`
  }

  return (
    <div className="projects-home">
      <div className="projects-home-bg pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]" aria-hidden />

      <div className="projects-home__inner">
        <header className="projects-home__hero font-serif-novel">
          <p className="projects-home__hero-eyebrow">AI 小说开发助手</p>
          <h1 className="projects-home__hero-title">创作书架</h1>
          <p className="projects-home__hero-desc">
            管理你的长篇与短篇项目，在大纲、写作与多 Agent 协作之间自由切换。
          </p>
          <div className="projects-home__hero-actions">
            <button type="button" className="projects-home__btn-primary" onClick={() => setShowModal(true)}>
              新建项目
            </button>
            <Link to="/settings" className="projects-home__btn-secondary">
              API 设置
            </Link>
          </div>
        </header>

        <div className="projects-home__stats">
          <div className="projects-home__stat">
            <p className="projects-home__stat-value">{projects.length}</p>
            <p className="projects-home__stat-label">项目总数</p>
          </div>
          <div className="projects-home__stat">
            <p className="projects-home__stat-value">
              {latestUpdated ? formatRelativeDate(latestUpdated.updatedAt) : '—'}
            </p>
            <p className="projects-home__stat-label">最近更新</p>
          </div>
          <div className="projects-home__stat">
            <p className="projects-home__stat-value">多 Agent</p>
            <p className="projects-home__stat-label">协作能力</p>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="projects-home__section-title font-serif-novel">
            <h2>全部作品</h2>
            <p>点击卡片进入编辑，或使用下方按钮管理项目</p>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="projects-home__empty font-serif-novel">
            <div style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden>
              📚
            </div>
            <h3 style={{ marginTop: '1.5rem', fontSize: '1.125rem', fontWeight: 500 }}>书架还是空的</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              创建第一个项目后，你可以在这里看到所有作品，并随时继续写作。
            </p>
            <button
              type="button"
              className="projects-home__btn-primary"
              style={{ marginTop: '2rem', width: '100%' }}
              onClick={() => setShowModal(true)}
            >
              创建第一部作品
            </button>
          </div>
        ) : (
          <div className="projects-home__grid">
            {projects.map((project) => (
              <article key={project.id} className="projects-home__card">
                <Link to={`/projects/${project.id}`} className="projects-home__card-link font-serif-novel">
                  <div className="projects-home__card-icon" aria-hidden>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="projects-home__card-title">{project.title}</h3>
                  <span className="projects-home__card-badge">{project.genre || '未分类'}</span>
                  {project.protagonistName && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      主角：{project.protagonistName}
                    </p>
                  )}
                  <p className="projects-home__card-meta">更新于 {formatRelativeDate(project.updatedAt)}</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    进入创作 →
                  </p>
                </Link>
                {project.id != null && (
                  <div className="projects-home__card-actions">
                    <div className="projects-home__card-actions-row">
                      <button type="button" onClick={(e) => handleCopy(project.id!, e)}>
                        复制
                      </button>
                      <button type="button" onClick={(e) => handleDelete(project.id!, e)}>
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}

            <button type="button" className="projects-home__new-tile" onClick={() => setShowModal(true)}>
              <span
                style={{
                  display: 'flex',
                  width: '3rem',
                  height: '3rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                }}
                aria-hidden
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span style={{ marginTop: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>新建项目</span>
              <span style={{ marginTop: '0.25rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                开启新的创作
              </span>
            </button>
          </div>
        )}
      </div>

      <CreateProjectModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
