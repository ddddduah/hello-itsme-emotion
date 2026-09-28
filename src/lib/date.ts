import type { DateKey } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/** 사용자 로컬 시간 기준 'YYYY-MM-DD' */
export function toDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 'YYYY-MM-DD' → 로컬 자정 Date */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 두 날짜 키 사이의 일수 (b - a) */
export function daysBetween(a: DateKey, b: DateKey): number {
  const ms = fromDateKey(b).getTime() - fromDateKey(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 예: "9월 28일 (일)" */
export function formatDateKo(key: DateKey): string {
  const d = fromDateKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

export function weekdayKo(key: DateKey): string {
  return WEEKDAYS[fromDateKey(key).getDay()]
}
