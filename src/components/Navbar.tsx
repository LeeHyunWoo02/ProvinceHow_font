import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logo from 'assets/logo.png'
import { classNames } from 'utils'

const MOBILE_MENU_ID = 'navbar-mobile-menu'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 모바일 메뉴가 열린 동안에만 Escape 키를 듣는다
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const showBackground = scrolled || open
  const linkBase =
    'group px-4 py-3 text-2xl font-medium whitespace-nowrap transition-colors duration-200'
  const linkActive = 'font-semibold text-brand-700 dark:text-brand-300'
  const linkIdle =
    'text-black hover:text-brand-700 dark:text-gray-100 dark:hover:text-brand-300'

  const menuItems = [
    { to: '/map', label: '지도검색' },
    { to: '/search', label: '지역추천' },
    { to: '/region', label: '지역정보' },
    { to: '/compare', label: '비교분석' }
  ]

  return (
    <header
      className={`sticky top-0 z-50 text-black transition-all duration-300 dark:border-b dark:border-transparent dark:text-gray-100 ${
        showBackground
          ? 'bg-white shadow-[0_6px_18px_-12px_rgba(15,23,42,0.12)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none'
          : 'bg-transparent shadow-none'
      }`}
    >
      <nav
        aria-label="주요 메뉴"
        className="mx-auto grid h-24 max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8"
      >
        <div className="col-start-1 flex items-center gap-4">
          <Link
            to="/map"
            aria-label="지방어때 홈"
            className="inline-flex select-none rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600/30 dark:focus:ring-brand-400/30"
          >
            <img src={logo} alt="" className="h-16 w-auto" />
          </Link>
        </div>
        <button
          type="button"
          className="col-start-3 inline-flex items-center justify-center justify-self-end rounded-md p-3 text-black hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/30 md:hidden dark:text-gray-100 dark:hover:text-brand-300 dark:focus:ring-brand-400/30"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
          aria-controls={MOBILE_MENU_ID}
          onClick={() => setOpen(!open)}
        >
          <svg
            aria-hidden="true"
            className="size-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
        <div className="col-start-3 hidden items-center justify-end gap-4 justify-self-end md:flex">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <span className="relative inline-flex flex-col items-center">
                  <span>{item.label}</span>
                  <span
                    className={`mt-2 h-0.5 w-full origin-left scale-x-0 rounded-full bg-brand-600 opacity-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100 dark:bg-brand-400 ${
                      isActive ? 'scale-x-100 opacity-100' : ''
                    }`}
                  />
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      {/* aria-controls가 항상 유효하도록 패널은 유지하고 표시 여부만 바꾼다 */}
      <nav
        id={MOBILE_MENU_ID}
        aria-label="모바일 메뉴"
        className={classNames(open ? 'block' : 'hidden', 'md:hidden')}
      >
        <div className="space-y-1 px-4 py-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `${linkBase} block ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-black hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
