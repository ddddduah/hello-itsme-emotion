/*
 * 해금 규칙 (순수 함수 — 저장은 store 에서)
 *  1) 매일 첫 접속 시 1개 자동 해금          → pickDailyUnlock
 *  2) 기록 텍스트에 잠긴 감정 단어 사용 시 해금 → findKeywordUnlocks
 *  3) 숨은 감정 제안 / 감정 찾기 도우미        → 5단계
 */
import { DAILY_UNLOCK_SEQUENCE, EMOTIONS } from '../data/emotions'
import type { AppData, DateKey, Emotion } from '../types'

/** 오늘 아직 일일 해금을 받지 않았다면, 다음 차례의 잠긴 감정을 돌려줌 */
export function pickDailyUnlock(data: AppData, today: DateKey): Emotion | null {
  if (data.lastDailyUnlock === today) return null
  const unlocked = new Set(data.unlocks.map((u) => u.emotionId))
  // 키워드로 먼저 열린 감정은 건너뛰고 순서상 다음 감정
  return DAILY_UNLOCK_SEQUENCE.find((e) => !unlocked.has(e.id)) ?? null
}

export interface KeywordHit {
  emotion: Emotion
  keyword: string
  /** 원문에서 찾은 어절. 예: "서운했다." → "서운했다" */
  word: string
}

// 글자·숫자면 단어 중간으로 봄 (한글 포함)
const WORD_CHAR = /[\p{L}\p{N}]/u

function isWordStart(text: string, index: number): boolean {
  return index === 0 || !WORD_CHAR.test(text[index - 1])
}

/** index 부터 공백·문장부호 전까지의 어절 */
function wordAt(text: string, index: number): string {
  const rest = text.slice(index)
  const m = rest.match(/^[^\s.,!?~…"'“”‘’()[\]{}<>·]+/)
  return m ? m[0] : rest.slice(0, 8)
}

/**
 * 텍스트에서 잠긴 감정 단어를 찾음.
 * 키워드는 어절(단어) 시작 위치에서만 인정 — "충분했다" 속 "분했"은 무시.
 */
export function findKeywordUnlocks(text: string, unlockedIds: Set<string>): KeywordHit[] {
  const normalized = text.normalize('NFC')
  const hits: KeywordHit[] = []

  for (const emotion of EMOTIONS) {
    if (unlockedIds.has(emotion.id)) continue
    // 긴 키워드부터 검사해서 더 구체적인 어절을 보여 줌
    const keywords = [...emotion.keywords].sort((a, b) => b.length - a.length)
    for (const keyword of keywords) {
      let from = 0
      let found = -1
      while ((found = normalized.indexOf(keyword, from)) !== -1) {
        if (isWordStart(normalized, found)) break
        from = found + 1
      }
      if (found !== -1) {
        hits.push({ emotion, keyword, word: wordAt(normalized, found) })
        break
      }
    }
  }

  // 텍스트에 먼저 나온 순서대로
  return hits.sort((a, b) => normalized.indexOf(a.word) - normalized.indexOf(b.word))
}
