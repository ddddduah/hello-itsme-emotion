import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import SketchDefs from './SketchDefs'
import UnlockCelebration from './UnlockCelebration'

const NAV_ITEMS = [
  { to: '/', label: '마이홈', icon: HomeIcon, end: true },
  { to: '/record', label: '기록하기', icon: PencilIcon, end: false },
  { to: '/dex', label: '도감', icon: BookIcon, end: false },
  { to: '/report', label: '리포트', icon: ChartIcon, end: false },
]

export default function Layout() {
  const { pathname } = useLocation()
  // 화면을 옮기면 맨 위부터 보이도록
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh sm:px-4 sm:py-6">
      <SketchDefs />
      {/* 스케치북 한 장 */}
      <div className="sketch-page relative mx-auto flex min-h-dvh max-w-2xl flex-col sm:min-h-[calc(100dvh-3rem)] sm:rounded-[6px] sm:shadow-[3px_4px_0_rgb(52_49_45/0.12)]">
        <SpiralBinding />

        <header className="flex items-center justify-between px-5 pt-7 pb-2">
          <NavLink to="/" className="flex items-center gap-2 text-2xl font-bold">
            <LogoMark />
            마음집
          </NavLink>
          {/* 데스크톱에서는 상단에 메뉴 */}
          <nav className="hidden gap-1 sm:flex" aria-label="주요 메뉴">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative px-3.5 py-1.5 text-lg transition-colors ${isActive ? 'font-bold text-ink' : 'text-ink-soft hover:text-ink'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && <Scribble />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-5 pb-6">
          <Outlet />
        </main>

        <footer className="px-5 pb-28 text-center text-sm leading-relaxed text-ink-faint sm:pb-8">
          이 서비스는 감정 알아차리기를 돕는 도구이며 전문 상담을 대체하지 않아요.
        </footer>
      </div>

      {/* 모바일에서는 하단 탭바 */}
      <nav
        className="sketch-page fixed inset-x-0 bottom-0 z-40 border-t-2 border-dashed border-line sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="주요 메뉴"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 py-2 text-sm transition-colors ${
                    isActive ? 'font-bold text-ink' : 'text-ink-faint'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon />
                    <span className="relative">
                      {label}
                      {isActive && <Scribble />}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <UnlockCelebration />
    </div>
  )
}

/** 스케치북 윗부분의 스프링 */
function SpiralBinding() {
  return (
    <div className="pointer-events-none absolute inset-x-4 -top-2 flex justify-between sm:-top-3" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <svg key={i} viewBox="0 0 12 22" className={`h-5 w-2.5 sm:h-6 sm:w-3 ${i > 9 ? 'hidden sm:block' : ''}`}>
          <circle cx="6" cy="16" r="2.4" fill="var(--color-desk)" stroke="var(--color-ink)" strokeWidth="0.8" opacity="0.8" />
          <path d="M6 16C1 10 2 3 6 2c3 0 4 3 3 6" fill="none" stroke="var(--color-ink-soft)" strokeWidth="1.4" strokeLinecap="round" filter="url(#pencil)" />
        </svg>
      ))}
    </div>
  )
}

/** 현재 메뉴 아래 연필로 쓱 그은 밑줄 */
function Scribble() {
  return (
    <svg
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-1 left-1/2 h-2.5 w-[110%] -translate-x-1/2 text-accent"
      aria-hidden
    >
      <path
        d="M3 7c20-4 45-5 94-3M8 10c25-3 50-3 80-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        filter="url(#pencil)"
      />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <g filter="url(#crayon)">
        <path d="M5 15 16 5l11 10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="var(--color-joy)" />
        <path
          d="M16 24s-5-3.1-5-6.3A2.7 2.7 0 0 1 16 16.4a2.7 2.7 0 0 1 5 1.3c0 3.2-5 6.3-5 6.3z"
          fill="var(--color-anger)"
        />
      </g>
      <g filter="url(#pencil)" fill="none" stroke="var(--color-ink)" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M5 15 16 5l11 10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
        <path d="M16 24s-5-3.1-5-6.3A2.7 2.7 0 0 1 16 16.4a2.7 2.7 0 0 1 5 1.3c0 3.2-5 6.3-5 6.3z" />
      </g>
    </svg>
  )
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  filter: 'url(#pencil)',
  'aria-hidden': true,
}

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}
function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15.5 5.5 18.5 8.5M5 19l1-4L16 5a2.1 2.1 0 0 1 3 3L9 18z" />
    </svg>
  )
}
function BookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 20V11M12 20V5M19 20v-6" />
    </svg>
  )
}
