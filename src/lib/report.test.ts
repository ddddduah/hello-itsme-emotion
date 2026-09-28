import { describe, expect, it } from 'vitest'
import { INITIAL_EMOTION_IDS } from '../data/emotions'
import type { AppData, Entry, Intensity } from '../types'
import { addDays } from './date'
import { iGa } from './josa'
import { quietFamilies, standoutWeekday, weekdayPatterns, weeklyReport, weekStart } from './report'
import { createInitialData } from './storage'

// 2026-09-28 은 월요일
const MON = '2026-09-28'

let n = 0
function entry(date: string, ...ems: [string, Intensity][]): Entry {
  return {
    id: `e${n++}`,
    createdAt: `${date}T12:00:00`,
    date,
    text: '',
    emotions: ems.map(([emotionId, intensity]) => ({ emotionId, intensity })),
  }
}
function data(entries: Entry[]): AppData {
  return { ...createInitialData(), entries }
}

describe('weekStart', () => {
  it('월요일 시작', () => {
    expect(weekStart(MON)).toBe(MON)
    expect(weekStart('2026-10-04')).toBe(MON) // 일요일
    expect(weekStart('2026-09-27')).toBe('2026-09-21') // 전 주 일요일
  })
})

describe('weeklyReport', () => {
  const d = data([
    entry(MON, ['anxious', 3], ['sad', 2]),
    entry(addDays(MON, 1), ['anxious', 4]),
    entry(addDays(MON, 1), ['joyful', 5]),
    entry(addDays(MON, 7), ['angry', 5]), // 다음 주
  ])
  const r = weeklyReport(d, MON)

  it('가장 많이 머문 감정과 기록 수', () => {
    expect(r.emotions[0].emotionId).toBe('anxious')
    expect(r.entryCount).toBe(3)
    expect(r.daysRecorded).toBe(2)
  })

  it('가족 비율 합이 1, 많은 순', () => {
    expect(r.families[0].family).toBe('fear')
    expect(r.families.reduce((a, f) => a + f.share, 0)).toBeCloseTo(1)
    expect(r.families.map((f) => f.family)).not.toContain('anger')
  })

  it('동점이면 강도 합이 큰 감정', () => {
    const t = weeklyReport(data([entry(MON, ['sad', 1], ['joyful', 5])]), MON)
    expect(t.emotions[0].emotionId).toBe('joyful')
  })
})

describe('quietFamilies', () => {
  const unlocked = new Set([...INITIAL_EMOTION_IDS, 'hurt', 'surprised'])

  it('해금된 감정이 있는 가족 중 30일간 기록 없는 가족', () => {
    const q = quietFamilies(data([entry(MON, ['sad', 3])]), MON, unlocked)
    expect(q.hasEntries).toBe(true)
    expect(q.quiet).toEqual(expect.arrayContaining(['joy', 'anger', 'surprise']))
    expect(q.quiet).not.toContain('sadness')
    expect(q.quiet).not.toContain('shame') // 해금된 감정이 없어 기록할 수 없던 가족은 제외
  })

  it('30일 이전 기록은 세지 않음', () => {
    const q = quietFamilies(data([entry(addDays(MON, -30), ['angry', 3])]), MON, unlocked)
    expect(q.hasEntries).toBe(false)
    expect(q.quiet).toContain('anger')
  })
})

describe('요일별 패턴', () => {
  it('월요일마다 불안 → 눈에 띄는 패턴', () => {
    const d = data([
      entry(MON, ['anxious', 3]),
      entry(addDays(MON, -7), ['anxious', 4]),
      entry(addDays(MON, -14), ['anxious', 2]),
      entry(addDays(MON, 3), ['joyful', 3]),
    ])
    const p = weekdayPatterns(d, addDays(MON, 3))
    expect(p.map((x) => x.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(p[0].top[0]).toMatchObject({ emotionId: 'anxious', count: 3 })
    expect(standoutWeekday(p)).toEqual({ weekday: 1, emotionId: 'anxious', count: 3 })
  })

  it('한 번씩만 나타나면 패턴으로 보지 않음', () => {
    const d = data([entry(MON, ['anxious', 3]), entry(addDays(MON, 1), ['sad', 3])])
    expect(standoutWeekday(weekdayPatterns(d, addDays(MON, 1)))).toBeNull()
  })
})

describe('조사', () => {
  it('받침에 따라 이/가', () => {
    expect(iGa('불안')).toBe('이')
    expect(iGa('기쁨')).toBe('이')
    expect(iGa('화')).toBe('가')
    expect(iGa('짜증')).toBe('이')
    expect(iGa('평온')).toBe('이')
  })
})
