/*
 * 나의 감정 리포트 계산 (순수 함수)
 *  - 주간: 가장 많이 머문 감정, 감정 가족 비율
 *  - 한 달간 기록되지 않은 감정 가족
 *  - 요일별로 자주 나타난 감정
 *
 * "머문 정도"는 기록에 그 감정이 담긴 횟수로 셉니다. 동점이면 강도 합이 큰 쪽.
 */
import { EMOTION_BY_ID, EMOTIONS } from '../data/emotions'
import { FAMILIES } from '../data/families'
import type { AppData, DateKey, Entry, FamilyId } from '../types'
import { addDays, fromDateKey } from './date'

export interface EmotionTally {
  emotionId: string
  count: number
  intensitySum: number
}

export interface FamilyShare {
  family: FamilyId
  count: number
  /** 0~1 */
  share: number
}

function tally(entries: Entry[]): EmotionTally[] {
  const map = new Map<string, EmotionTally>()
  for (const entry of entries) {
    for (const { emotionId, intensity } of entry.emotions) {
      if (!EMOTION_BY_ID[emotionId]) continue
      const t = map.get(emotionId) ?? { emotionId, count: 0, intensitySum: 0 }
      t.count += 1
      t.intensitySum += intensity
      map.set(emotionId, t)
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.count - a.count ||
      b.intensitySum - a.intensitySum ||
      EMOTION_BY_ID[a.emotionId].unlockOrder - EMOTION_BY_ID[b.emotionId].unlockOrder,
  )
}

function inRange(entries: Entry[], from: DateKey, to: DateKey) {
  return entries.filter((e) => e.date >= from && e.date <= to)
}

// ───────────────────────── 주간 ─────────────────────────

/** 그 날짜가 속한 주의 월요일 */
export function weekStart(date: DateKey): DateKey {
  const dow = fromDateKey(date).getDay() // 0=일
  return addDays(date, -((dow + 6) % 7))
}

export interface WeeklyReport {
  start: DateKey
  end: DateKey
  entryCount: number
  /** 기록한 날 수 (0~7) */
  daysRecorded: number
  emotions: EmotionTally[]
  families: FamilyShare[]
}

export function weeklyReport(data: AppData, start: DateKey): WeeklyReport {
  const end = addDays(start, 6)
  const entries = inRange(data.entries, start, end)
  const emotions = tally(entries)

  const famCount = new Map<FamilyId, number>()
  for (const t of emotions) {
    const f = EMOTION_BY_ID[t.emotionId].family
    famCount.set(f, (famCount.get(f) ?? 0) + t.count)
  }
  const total = [...famCount.values()].reduce((a, b) => a + b, 0)
  const families = FAMILIES.filter((f) => famCount.has(f.id))
    .map((f) => ({ family: f.id, count: famCount.get(f.id)!, share: famCount.get(f.id)! / total }))
    .sort((a, b) => b.count - a.count)

  return {
    start,
    end,
    entryCount: entries.length,
    daysRecorded: new Set(entries.map((e) => e.date)).size,
    emotions,
    families,
  }
}

// ───────────────────────── 한 달간 조용했던 가족 ─────────────────────────

export const QUIET_WINDOW_DAYS = 30

export interface QuietFamilies {
  from: DateKey
  to: DateKey
  /** 기간 안에 기록이 하나라도 있었는지 */
  hasEntries: boolean
  /** 해금된 감정이 있는데도 기간 동안 한 번도 기록되지 않은 가족 */
  quiet: FamilyId[]
}

export function quietFamilies(data: AppData, today: DateKey, unlockedIds: Set<string>): QuietFamilies {
  const from = addDays(today, -(QUIET_WINDOW_DAYS - 1))
  const entries = inRange(data.entries, from, today)
  const recorded = new Set(entries.flatMap((e) => e.emotions.map((x) => EMOTION_BY_ID[x.emotionId]?.family)))
  const available = new Set(EMOTIONS.filter((e) => unlockedIds.has(e.id)).map((e) => e.family))
  return {
    from,
    to: today,
    hasEntries: entries.length > 0,
    quiet: FAMILIES.map((f) => f.id).filter((f) => available.has(f) && !recorded.has(f)),
  }
}

// ───────────────────────── 요일별 패턴 ─────────────────────────

export const PATTERN_WEEKS = 8
/** 월요일부터 */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export interface WeekdayPattern {
  /** 0=일 ~ 6=토 */
  weekday: number
  entryCount: number
  /** 그 요일에 많이 나타난 감정 (최대 3) */
  top: EmotionTally[]
}

export function weekdayPatterns(data: AppData, today: DateKey, weeks = PATTERN_WEEKS): WeekdayPattern[] {
  const from = addDays(today, -(weeks * 7 - 1))
  const entries = inRange(data.entries, from, today)
  return WEEKDAY_ORDER.map((weekday) => {
    const day = entries.filter((e) => fromDateKey(e.date).getDay() === weekday)
    return { weekday, entryCount: day.length, top: tally(day).slice(0, 3) }
  })
}

/**
 * 눈에 띄는 요일 패턴 하나 (관찰 문장용).
 * 같은 감정이 그 요일에 2번 이상 나타났고, 다른 요일 평균보다 확실히 많을 때만.
 */
export function standoutWeekday(patterns: WeekdayPattern[]): { weekday: number; emotionId: string; count: number } | null {
  let best: { weekday: number; emotionId: string; count: number; lift: number } | null = null
  for (const p of patterns) {
    const t = p.top[0]
    if (!t || t.count < 2) continue
    const elsewhere = patterns
      .filter((q) => q.weekday !== p.weekday)
      .map((q) => q.top.find((x) => x.emotionId === t.emotionId)?.count ?? 0)
    const avg = elsewhere.reduce((a, b) => a + b, 0) / elsewhere.length
    const lift = t.count - avg
    if (lift >= 1 && (!best || lift > best.lift)) best = { weekday: p.weekday, emotionId: t.emotionId, count: t.count, lift }
  }
  return best && { weekday: best.weekday, emotionId: best.emotionId, count: best.count }
}
