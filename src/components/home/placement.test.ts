import { describe, expect, it } from 'vitest'
import { DAILY_UNLOCK_SEQUENCE, INITIAL_EMOTION_IDS } from '../../data/emotions'
import { computeEmotionStats } from '../../lib/stats'
import { createInitialData } from '../../lib/storage'
import type { AppData, Entry, Intensity } from '../../types'
import { MAX_RESIDENTS, placeResidents, selectResidentIds } from './placement'

const TODAY = '2026-10-01'
let n = 0
const entry = (emotionId: string, intensity: Intensity = 3, date = TODAY): Entry => ({
  id: `e${n++}`,
  createdAt: `${date}T12:00:00`,
  date,
  text: '',
  emotions: [{ emotionId, intensity }],
})

/** 초기 4개 + 일일 해금 순서대로 extra 개 해금 */
function dataWith(extra: number, entries: Entry[]): AppData {
  const d = createInitialData()
  for (const e of DAILY_UNLOCK_SEQUENCE.slice(0, extra)) {
    d.unlocks.push({ emotionId: e.id, unlockedAt: '2026-09-01T00:00:00Z', source: 'daily' })
    d.moveInSeen.push(e.id)
  }
  return { ...d, entries }
}

const select = (d: AppData) => selectResidentIds(d, new Set(d.unlocks.map((u) => u.emotionId)), computeEmotionStats(d, TODAY))

describe('마이홈에 보일 감정', () => {
  it('최대 10개', () => {
    const d = dataWith(30, [])
    expect(select(d)).toHaveLength(MAX_RESIDENTS)
    const placed = placeResidents(d, new Set(d.unlocks.map((u) => u.emotionId)), computeEmotionStats(d, TODAY), TODAY)
    expect(placed).toHaveLength(MAX_RESIDENTS)
  })

  it('가장 자주 기록한 감정 순, 횟수가 같으면 강도 합이 큰 순', () => {
    const ids = DAILY_UNLOCK_SEQUENCE.slice(0, 20).map((e) => e.id)
    const entries: Entry[] = []
    // ids[0..11] 을 서로 다른 횟수로 기록: ids[i] 를 (12 - i) 번
    ids.slice(0, 12).forEach((id, i) => {
      for (let k = 0; k < 12 - i; k++) entries.push(entry(id))
    })
    // 횟수 동점(1번): 강도 5 인 쪽이 먼저
    entries.push(entry('joyful', 5), entry('sad', 1))
    const shown = select(dataWith(20, entries))
    expect(shown).toEqual(ids.slice(0, 10))

    const tie = select(dataWith(0, [entry('sad', 1), entry('joyful', 5)]))
    expect(tie.slice(0, 2)).toEqual(['joyful', 'sad'])
  })

  it('기록이 10가지보다 적으면 새로 온 감정 → 최근 만난 감정으로 채움', () => {
    const d = dataWith(12, [entry('angry')])
    const fresh = DAILY_UNLOCK_SEQUENCE[20].id
    d.unlocks.push({ emotionId: fresh, unlockedAt: new Date().toISOString(), source: 'daily' }) // moveInSeen 아님
    const shown = select(d)
    expect(shown).toHaveLength(MAX_RESIDENTS)
    expect(shown[0]).toBe('angry')
    expect(shown[1]).toBe(fresh)
  })

  it('해금이 10개 이하면 모두 보임', () => {
    expect(select(dataWith(3, []))).toHaveLength(INITIAL_EMOTION_IDS.length + 3)
  })
})
