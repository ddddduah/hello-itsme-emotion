/*
 * 한국 시간(KST, Asia/Seoul) 기준 하늘 상태 — 마이홈 창밖 풍경용
 * 사용자의 기기 시간대와 상관없이 항상 한국 시간으로 계산합니다.
 */

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night'

export interface KstTime {
  hour: number
  minute: number
  /** 0시부터 지난 분 (0 ~ 1439) */
  minutes: number
}

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function kstTime(date: Date = new Date()): KstTime {
  const parts = fmt.formatToParts(date)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { hour, minute, minutes: hour * 60 + minute }
}

/** 하늘 구간 (분 단위, 서울의 평균적인 일출·일몰 무렵) */
export const SKY_SCHEDULE = {
  dawnStart: 5 * 60, // 05:00
  dayStart: 6 * 60 + 40, // 06:40
  duskStart: 17 * 60 + 40, // 17:40
  nightStart: 19 * 60 + 10, // 19:10
} as const

export function skyPhase(minutes: number): SkyPhase {
  const s = SKY_SCHEDULE
  if (minutes >= s.dawnStart && minutes < s.dayStart) return 'dawn'
  if (minutes >= s.dayStart && minutes < s.duskStart) return 'day'
  if (minutes >= s.duskStart && minutes < s.nightStart) return 'dusk'
  return 'night'
}

/**
 * 해(낮) 또는 달(밤)이 지나가는 길 위의 위치 0~1.
 * 해: 새벽 시작 → 저녁 끝, 달: 밤 시작 → 다음 새벽
 */
export function celestialProgress(minutes: number): number {
  const s = SKY_SCHEDULE
  if (minutes >= s.dawnStart && minutes < s.nightStart) {
    return (minutes - s.dawnStart) / (s.nightStart - s.dawnStart)
  }
  const nightLen = 24 * 60 - s.nightStart + s.dawnStart
  const since = minutes >= s.nightStart ? minutes - s.nightStart : minutes + 24 * 60 - s.nightStart
  return since / nightLen
}

const PHASE_KO: Record<SkyPhase, string> = {
  dawn: '해가 뜨는 새벽',
  day: '햇살 가득한 낮',
  dusk: '노을 지는 저녁',
  night: '별이 뜬 밤',
}

export function phaseLabel(phase: SkyPhase) {
  return PHASE_KO[phase]
}

/** 예: "오후 3:07" */
export function formatKst(t: KstTime) {
  const ampm = t.hour < 12 ? '오전' : '오후'
  const h = t.hour % 12 === 0 ? 12 : t.hour % 12
  return `${ampm} ${h}:${String(t.minute).padStart(2, '0')}`
}
