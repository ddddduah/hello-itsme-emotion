/*
 * 기록 통계 (마이홈 캐릭터 상태, 도감, 리포트에서 공통 사용)
 */
import type { AppData, DateKey, Entry, Intensity } from '../types'
import { addDays, daysBetween, toDateKey } from './date'

/** 최근 며칠을 "자주" 판단 기준으로 볼지 */
export const RECENT_DAYS = 7
/** 이 기간 동안 기록되지 않으면 구석에서 졺 */
export const SLEEP_AFTER_DAYS = 7
/** 최근 기록이 이 횟수 이상이면 활발 */
export const LIVELY_MIN_COUNT = 2

export type CharacterState = 'new' | 'lively' | 'normal' | 'sleepy'

export interface EmotionStats {
  emotionId: string
  total: number
  /** 지금까지 기록된 강도의 합 (자주 + 크게 느낀 정도) */
  totalIntensity: number
  /** 최근 RECENT_DAYS 일(오늘 포함) 기록 횟수 */
  recent: number
  /** 최근 기록들의 평균 강도 (없으면 null) */
  recentIntensity: Intensity | null
  lastDate: DateKey | null
  lastEntry: Entry | null
  /** 이 감정이 기록된 날짜 (중복 제거, 최신순) */
  dates: DateKey[]
}

export function computeEmotionStats(data: AppData, today: DateKey): Map<string, EmotionStats> {
  const since = addDays(today, -(RECENT_DAYS - 1))
  const map = new Map<string, EmotionStats>()
  const intensitySum = new Map<string, number>()

  const get = (id: string) => {
    let s = map.get(id)
    if (!s) {
      s = {
        emotionId: id,
        total: 0,
        totalIntensity: 0,
        recent: 0,
        recentIntensity: null,
        lastDate: null,
        lastEntry: null,
        dates: [],
      }
      map.set(id, s)
    }
    return s
  }

  // 최신 기록부터 순회
  const entries = [...data.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const entry of entries) {
    for (const { emotionId, intensity } of entry.emotions) {
      const s = get(emotionId)
      s.total += 1
      s.totalIntensity += intensity
      if (!s.lastEntry) {
        s.lastEntry = entry
        s.lastDate = entry.date
      }
      if (s.dates[s.dates.length - 1] !== entry.date) s.dates.push(entry.date)
      if (entry.date >= since && entry.date <= today) {
        s.recent += 1
        intensitySum.set(emotionId, (intensitySum.get(emotionId) ?? 0) + intensity)
      }
    }
  }

  for (const s of map.values()) {
    if (s.recent > 0) {
      s.recentIntensity = Math.min(5, Math.max(1, Math.round(intensitySum.get(s.emotionId)! / s.recent))) as Intensity
    }
  }
  return map
}

/** 마이홈 캐릭터 상태 판정 */
export function characterState(
  emotionId: string,
  stats: EmotionStats | undefined,
  data: AppData,
  today: DateKey,
): CharacterState {
  if (!data.moveInSeen.includes(emotionId)) return 'new'
  if (stats && stats.recent >= LIVELY_MIN_COUNT) return 'lively'
  // 마지막 기록일(없으면 해금일)로부터 오래 지났으면 졺
  const unlock = data.unlocks.find((u) => u.emotionId === emotionId)
  const unlockDate = unlock ? toDateKey(new Date(unlock.unlockedAt)) : today
  const ref = stats?.lastDate ?? unlockDate
  if (daysBetween(ref, today) >= SLEEP_AFTER_DAYS) return 'sleepy'
  return 'normal'
}

/** 최근 기록 횟수에 따른 크기 배율 (1 ~ 1.42) */
export function sizeScale(stats: EmotionStats | undefined): number {
  return 1 + Math.min(stats?.recent ?? 0, 6) * 0.07
}
