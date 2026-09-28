import { describe, expect, it } from 'vitest'
import { DAILY_UNLOCK_SEQUENCE, INITIAL_EMOTION_IDS } from '../data/emotions'
import { createInitialData } from './storage'
import { findKeywordUnlocks, pickDailyUnlock } from './unlock'

const initial = new Set(INITIAL_EMOTION_IDS)
const ids = (text: string, unlocked = initial) =>
  findKeywordUnlocks(text, unlocked).map((h) => h.emotion.id)

describe('findKeywordUnlocks', () => {
  it('활용형을 모두 같은 감정으로 인식', () => {
    for (const t of ['너무 서운했다', '서운해서 말을 못 했다', '서운함이 남았다', '서운한 마음']) {
      expect(ids(t)).toEqual(['hurt'])
    }
  })

  it('단어 중간에 들어 있는 글자는 무시', () => {
    expect(ids('시간은 충분했다')).toEqual([]) // 분했
    expect(ids('대화가 길어졌다', new Set())).toEqual([]) // 화가
    expect(ids('좀 불편했다')).toEqual(['awkward']) // 편했 → 편안하다 X
  })

  it('문장부호·따옴표 뒤도 단어 시작으로 인정', () => {
    expect(ids('"억울해!" 라고 외쳤다')).toEqual(['wronged'])
    expect(ids('(막막함)')).toEqual(['lost'])
  })

  it('이미 해금된 감정은 제외', () => {
    expect(ids('기쁘고 슬펐다')).toEqual([])
    expect(ids('불안했다', new Set([...initial, 'anxious']))).toEqual([])
  })

  it('여러 감정을 텍스트 순서대로, 어절과 함께 반환', () => {
    const hits = findKeywordUnlocks('발표 전엔 긴장됐는데 끝나니 홀가분했다.', initial)
    expect(hits.map((h) => [h.emotion.id, h.word])).toEqual([
      ['nervous', '긴장됐는데'],
      ['unburdened', '홀가분했다'],
    ])
  })

  it('"기대가 어긋났다"는 기대되다가 아니라 실망으로', () => {
    expect(ids('기대가 어긋났다')).toEqual(['disappointed'])
  })
})

describe('pickDailyUnlock', () => {
  it('오늘 처음이면 순서상 첫 감정, 같은 날 두 번째는 없음', () => {
    const data = createInitialData()
    expect(pickDailyUnlock(data, '2026-09-28')?.id).toBe(DAILY_UNLOCK_SEQUENCE[0].id)
    expect(pickDailyUnlock({ ...data, lastDailyUnlock: '2026-09-28' }, '2026-09-28')).toBeNull()
  })

  it('키워드로 먼저 열린 감정은 건너뜀', () => {
    const data = createInitialData()
    const first = DAILY_UNLOCK_SEQUENCE[0].id
    data.unlocks.push({ emotionId: first, unlockedAt: '', source: 'keyword' })
    expect(pickDailyUnlock(data, '2026-09-28')?.id).toBe(DAILY_UNLOCK_SEQUENCE[1].id)
  })

  it('모두 해금되면 null', () => {
    const data = createInitialData()
    for (const e of DAILY_UNLOCK_SEQUENCE) data.unlocks.push({ emotionId: e.id, unlockedAt: '', source: 'daily' })
    expect(pickDailyUnlock(data, '2026-09-28')).toBeNull()
  })
})
