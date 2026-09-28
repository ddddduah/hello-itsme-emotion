/*
 * 숨은 감정 제안 — "혹시 이런 감정도 섞여 있었을까요?"
 *
 * 기록을 저장한 뒤, 아직 잠긴 감정 중 이번 기록과 이어져 있을 법한 것 1~2개를 고릅니다.
 *  - 선택한 감정의 "헷갈리는 감정"으로 연결됨 (양방향)   +3
 *  - 텍스트에서 추정한 상황과 겹침 (상황마다)           +2
 *  - 선택한 감정들과 상황이 겹침 (상황마다, 최대 2)     +1
 *  - 선택한 감정과 같은 가족                            +1
 * 총점 3점 이상만 제안합니다. (근거가 약하면 묻지 않음)
 */
import { EMOTION_BY_ID, EMOTIONS } from '../data/emotions'
import { SITUATION_HINTS } from '../data/situationHints'
import type { Emotion, SituationId } from '../types'

export const HIDDEN_MIN_SCORE = 3

export function situationsFromText(text: string): SituationId[] {
  const t = text.normalize('NFC')
  return (Object.keys(SITUATION_HINTS) as SituationId[]).filter((s) => SITUATION_HINTS[s].some((w) => t.includes(w)))
}

export function suggestHiddenEmotions(
  text: string,
  selectedIds: string[],
  unlockedIds: Set<string>,
  max = 2,
): Emotion[] {
  const selected = selectedIds.map((id) => EMOTION_BY_ID[id]).filter(Boolean)
  const textSituations = situationsFromText(text)
  const selectedSituations = new Set(selected.flatMap((e) => e.situations))
  const selectedFamilies = new Set(selected.map((e) => e.family))

  const scored = EMOTIONS.filter((e) => !unlockedIds.has(e.id)).map((e) => {
    let score = 0
    const linked = selected.some((s) => s.similarTo.some((x) => x.id === e.id) || e.similarTo.some((x) => x.id === s.id))
    if (linked) score += 3
    score += e.situations.filter((s) => textSituations.includes(s)).length * 2
    score += Math.min(2, e.situations.filter((s) => selectedSituations.has(s)).length)
    if (selectedFamilies.has(e.family)) score += 1
    return { e, score }
  })

  return scored
    .filter((x) => x.score >= HIDDEN_MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.e.unlockOrder - b.e.unlockOrder)
    .slice(0, max)
    .map((x) => x.e)
}
