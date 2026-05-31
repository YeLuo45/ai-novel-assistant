import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectList from './pages/ProjectList'
import ProjectEditor from './pages/ProjectEditor'
import StatsPage from './pages/StatsPage'
import Settings from './pages/Settings'
import VersionGeneratorPage from './pages/VersionGeneratorPage'
import FillProjectPage from './pages/FillProjectPage'

function App() {
  return (
    <BrowserRouter basename="/ai-novel-assistant">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="projects/:id/stats" element={<StatsPage />} />
          <Route path="projects/:id/version-generator" element={<VersionGeneratorPage />} />
          <Route path="projects/:id/fill" element={<FillProjectPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
