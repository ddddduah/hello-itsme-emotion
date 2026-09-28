import { describe, expect, it } from 'vitest'
import { EMOTIONS, INITIAL_EMOTION_IDS } from '../data/emotions'
import { findCandidates, scoreEmotion } from './finder'
import { situationsFromText, suggestHiddenEmotions } from './hidden'

const ids = (xs: { emotion: { id: string } }[]) => xs.map((x) => x.emotion.id)

describe('감정 찾기 도우미', () => {
  it('답이 없으면 후보 없음', () => {
    expect(findCandidates({ body: [], energy: null, situations: [] })).toEqual([])
  })

  it('가슴 답답 + 낮은 에너지 + 기대가 어긋남 → 서운함·실망 계열', () => {
    const c = ids(findCandidates({ body: ['chest-tight'], energy: 'low', situations: ['unmet'] }))
    expect(c.length).toBeGreaterThanOrEqual(2)
    expect(c.length).toBeLessThanOrEqual(3)
    expect(c).toContain('hurt')
    expect(c.some((id) => ['disappointed', 'let-down'].includes(id))).toBe(true)
  })

  it('얼굴 뜨거움 + 높은 에너지 + 부당한 일 → 분노 가족', () => {
    const c = findCandidates({ body: ['face-hot'], energy: 'high', situations: ['unfair'] })
    expect(c[0].emotion.family).toBe('anger')
  })

  it('심장 뜀 + 높은 에너지 + 앞일을 모름 → 불안 계열 (잠긴 감정도 후보)', () => {
    const c = ids(findCandidates({ body: ['heart-racing'], energy: 'high', situations: ['uncertain'] }))
    expect(c).toContain('anxious')
  })

  it('상황을 골랐다면 상황이 맞지 않는 감정은 제외', () => {
    const c = findCandidates({ body: ['light'], energy: 'high', situations: ['loss'] })
    for (const x of c) expect(x.emotion.situations).toContain('loss')
  })

  it('모든 감정이 자기 몸 감각·에너지·상황 하나로 후보에 오를 수 있음 (찾을 수 없는 감정이 없도록)', () => {
    const unreachable = EMOTIONS.filter(
      (e) =>
        !e.situations.some((s) =>
          ids(findCandidates({ body: e.bodySignals, energy: e.energy, situations: [s] })).includes(e.id),
        ),
    ).map((e) => e.name)
    expect(unreachable).toEqual([])
  })

  it('점수 계산', () => {
    const hurt = EMOTIONS.find((e) => e.id === 'hurt')!
    expect(scoreEmotion(hurt, { body: ['chest-tight', 'light'], energy: 'low', situations: ['unmet'] })).toBe(2 + 2 + 3)
  })
})

describe('숨은 감정 제안', () => {
  const initial = new Set(INITIAL_EMOTION_IDS)

  it('텍스트에서 상황 추정', () => {
    expect(situationsFromText('친구가 약속을 잊어버렸다')).toContain('unmet')
    expect(situationsFromText('회의에서 내 의견을 무시당했다')).toContain('unfair')
  })

  it('슬픔 선택 + 약속을 잊은 이야기 → 서운함 제안', () => {
    const s = suggestHiddenEmotions('친구가 내 생일 약속을 잊어버렸다', ['sad'], initial).map((e) => e.id)
    expect(s.length).toBeGreaterThan(0)
    expect(s.length).toBeLessThanOrEqual(2)
    expect(s).toContain('hurt')
  })

  it('화 선택 + 무시당한 이야기 → 억울함 등 분노 가족 제안', () => {
    const s = suggestHiddenEmotions('회의에서 내 아이디어를 가로채서 말했다', ['angry'], initial)
    expect(s.some((e) => e.id === 'wronged')).toBe(true)
  })

  it('이미 해금된 감정은 제안하지 않음', () => {
    const s = suggestHiddenEmotions('친구가 약속을 잊어버렸다', ['sad'], new Set([...initial, 'hurt']))
    expect(s.map((e) => e.id)).not.toContain('hurt')
  })

  it('근거가 없으면 제안하지 않음', () => {
    expect(suggestHiddenEmotions('', [], initial)).toEqual([])
  })
})
