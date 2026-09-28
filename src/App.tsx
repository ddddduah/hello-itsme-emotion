import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import DexPage from './pages/DexPage'
import EmotionDetailPage from './pages/EmotionDetailPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RecordPage from './pages/RecordPage'
import ReportPage from './pages/ReportPage'
import { AppDataProvider } from './store/AppDataContext'

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="record" element={<RecordPage />} />
            <Route path="dex" element={<DexPage />} />
            <Route path="dex/:id" element={<EmotionDetailPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  )
}
