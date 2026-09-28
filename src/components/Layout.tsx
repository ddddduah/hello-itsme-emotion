import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
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
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
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
                `rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive ? 'bg-accent-soft font-semibold text-accent' : 'text-ink-soft hover:bg-sand'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-5 pb-6">
        <Outlet />
      </main>

      <footer className="px-5 pb-28 text-center text-xs leading-relaxed text-ink-faint sm:pb-8">
        이 서비스는 감정 알아차리기를 돕는 도구이며 전문 상담을 대체하지 않아요.
      </footer>

      {/* 모바일에서는 하단 탭바 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur sm:hidden"
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
                  `flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                    isActive ? 'font-semibold text-accent' : 'text-ink-faint'
                  }`
                }
              >
                <Icon />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <UnlockCelebration />
    </div>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <path d="M5 15 16 5l11 10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="var(--color-joy)" />
      <path
        d="M16 24s-5-3.1-5-6.3A2.7 2.7 0 0 1 16 16.4a2.7 2.7 0 0 1 5 1.3c0 3.2-5 6.3-5 6.3z"
        fill="var(--color-anger)"
      />
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
