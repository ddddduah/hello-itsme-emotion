/*
 * 감정 찾기 도우미 — 규칙 기반 점수표 (AI 호출 없음)
 *
 *  몸 감각 일치   +2 (선택한 것마다)
 *  에너지 일치    +2
 *  상황 일치      +3 (선택한 것마다)
 *
 * 점수가 높은 순으로 2~3개 후보. 잠긴 감정도 후보가 될 수 있습니다.
 */
import { EMOTIONS } from '../data/emotions'
import type { BodySignalId, Emotion, Energy, SituationId } from '../types'

export const FINDER_WEIGHTS = { body: 2, energy: 2, situation: 3 } as const

export interface FinderAnswers {
  body: BodySignalId[]
  energy: Energy | null
  situations: SituationId[]
}

export interface FinderCandidate {
  emotion: Emotion
  score: number
}

export function scoreEmotion(emotion: Emotion, a: FinderAnswers): number {
  let score = 0
  for (const b of a.body) if (emotion.bodySignals.includes(b)) score += FINDER_WEIGHTS.body
  if (a.energy && emotion.energy === a.energy) score += FINDER_WEIGHTS.energy
  for (const s of a.situations) if (emotion.situations.includes(s)) score += FINDER_WEIGHTS.situation
  return score
}

export function hasAnyAnswer(a: FinderAnswers) {
  return a.body.length > 0 || a.energy !== null || a.situations.length > 0
}

/**
 * 후보 2~3개.
 *  - 상황을 골랐다면 상황이 하나도 맞지 않는 감정은 제외 (상황이 가장 강한 단서)
 *  - 3번째 후보는 1등 점수의 60% 이상일 때만
 *  - 동점이면 먼저 만나는 감정(unlockOrder 작은 것) 우선
 */
export function findCandidates(a: FinderAnswers, max = 3): FinderCandidate[] {
  if (!hasAnyAnswer(a)) return []
  const ranked = EMOTIONS.filter((e) => a.situations.length === 0 || a.situations.some((s) => e.situations.includes(s)))
    .map((emotion) => ({ emotion, score: scoreEmotion(emotion, a) }))
    .filter((c) => c.score > 0)
    .sort((x, y) => y.score - x.score || x.emotion.unlockOrder - y.emotion.unlockOrder)

  if (ranked.length === 0) return []
  const top = ranked[0].score
  return ranked.slice(0, max).filter((c, i) => i < 2 || c.score >= top * 0.6)
}
