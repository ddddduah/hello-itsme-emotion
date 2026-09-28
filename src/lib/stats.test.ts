import { describe, expect, it } from 'vitest'
import type { AppData, Entry, Intensity } from '../types'
import { addDays } from './date'
import { characterState, computeEmotionStats, sizeScale } from './stats'
import { createInitialData } from './storage'

const TODAY = '2026-09-29'

function entry(date: string, emotionId: string, intensity: Intensity = 3): Entry {
  return { id: `${date}-${emotionId}-${Math.random()}`, createdAt: `${date}T12:00:00`, date, text: '', emotions: [{ emotionId, intensity }] }
}

function dataWith(entries: Entry[], unlockedDaysAgo = 0): AppData {
  const d = createInitialData(new Date(`${addDays(TODAY, -unlockedDaysAgo)}T09:00:00`))
  return { ...d, entries }
}

describe('computeEmotionStats', () => {
  it('최근 7일(오늘 포함) 횟수와 평균 강도, 최근 기록', () => {
    const data = dataWith([
      entry(TODAY, 'sad', 5),
      entry(addDays(TODAY, -6), 'sad', 2),
      entry(addDays(TODAY, -7), 'sad', 1), // 7일 창 밖
    ])
    const s = computeEmotionStats(data, TODAY).get('sad')!
    expect(s.total).toBe(3)
    expect(s.recent).toBe(2)
    expect(s.recentIntensity).toBe(4) // (5+2)/2 = 3.5 → 4
    expect(s.lastDate).toBe(TODAY)
    expect(s.dates).toEqual([TODAY, addDays(TODAY, -6), addDays(TODAY, -7)])
  })
})

describe('characterState', () => {
  it('최근 2번 이상 → 활발', () => {
    const data = dataWith([entry(TODAY, 'joyful'), entry(addDays(TODAY, -1), 'joyful')])
    const stats = computeEmotionStats(data, TODAY)
    expect(characterState('joyful', stats.get('joyful'), data, TODAY)).toBe('lively')
    expect(sizeScale(stats.get('joyful'))).toBeGreaterThan(1)
  })

  it('해금 후 7일 넘게 기록이 없으면 졺, 그 전엔 보통', () => {
    expect(characterState('angry', undefined, dataWith([], 7), TODAY)).toBe('sleepy')
    expect(characterState('angry', undefined, dataWith([], 3), TODAY)).toBe('normal')
  })

  it('마지막 기록이 오래됐으면 졺', () => {
    const data = dataWith([entry(addDays(TODAY, -10), 'sad')], 30)
    expect(characterState('sad', computeEmotionStats(data, TODAY).get('sad'), data, TODAY)).toBe('sleepy')
  })

  it('입주 연출을 아직 안 봤으면 new', () => {
    const data = dataWith([])
    data.unlocks.push({ emotionId: 'hurt', unlockedAt: new Date().toISOString(), source: 'daily' })
    expect(characterState('hurt', undefined, data, TODAY)).toBe('new')
  })
})
