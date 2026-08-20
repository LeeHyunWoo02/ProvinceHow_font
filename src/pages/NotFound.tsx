import { Link } from 'react-router-dom'

const QUICK_LINKS = [
  { to: '/search', label: '지역추천' },
  { to: '/region', label: '지역정보' },
  { to: '/compare', label: '비교분석' }
] as const

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl py-24 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        요청하신 주소가 변경되었거나 존재하지 않습니다. 아래에서 원하는 메뉴로
        이동해 주세요.
      </p>
      <nav
        aria-label="주요 페이지 바로가기"
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Link
          to="/map"
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 dark:bg-brand-400 dark:text-gray-950 dark:hover:bg-brand-300"
        >
          지도검색으로 이동
        </Link>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
