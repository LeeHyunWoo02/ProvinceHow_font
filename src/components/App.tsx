import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from 'components/Navbar'
import LoadingIndicator from 'components/LoadingIndicator'
import ServiceNoticeModal from 'shared/components/ServiceNoticeModal'

// 라우트 단위 코드 스플리팅: 첫 화면에 필요 없는 페이지는 별도 청크로 분리한다.
const MapSearch = lazy(() => import('pages/MapSearch'))
const DetailSearch = lazy(() => import('pages/DetailSearch'))
const RegionInfo = lazy(() => import('pages/RegionInfo'))
const Comparison = lazy(() => import('pages/Comparison'))
const NotFound = lazy(() => import('pages/NotFound'))

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <LoadingIndicator
              className="py-16"
              messages={['화면을 불러오는 중입니다...']}
            />
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapSearch />} />
            <Route path="/search" element={<DetailSearch />} />
            <Route path="/region" element={<RegionInfo />} />
            <Route path="/compare" element={<Comparison />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <ServiceNoticeModal />
    </div>
  )
}
