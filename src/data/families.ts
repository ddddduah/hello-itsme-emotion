import type { FamilyId } from '../types'

export interface Family {
  id: FamilyId
  /** 화면 표시 이름 */
  name: string
  /** 캐릭터 모티프 설명 (추후 일러스트 교체 시 참고) */
  motif: string
  /** 초기 단순 캐릭터용 모티프 이모지 */
  emoji: string
  /** CSS 색 토큰 (index.css @theme 과 동일한 이름) */
  color: { main: string; soft: string; deep: string }
}

const token = (id: FamilyId) => ({
  main: `var(--color-${id})`,
  soft: `var(--color-${id}-soft)`,
  deep: `var(--color-${id}-deep)`,
})

/** 도감·차트에서 보여 주는 가족 순서 */
export const FAMILIES: Family[] = [
  { id: 'joy', name: '기쁨', motif: '햇살과 꽃', emoji: '🌼', color: token('joy') },
  { id: 'love', name: '연결·사랑', motif: '실타래와 덩굴', emoji: '🧶', color: token('love') },
  { id: 'calm', name: '평온', motif: '잎사귀와 조약돌', emoji: '🍃', color: token('calm') },
  { id: 'surprise', name: '놀람', motif: '별똥별과 반짝임', emoji: '✨', color: token('surprise') },
  { id: 'sadness', name: '슬픔', motif: '빗방울과 물', emoji: '💧', color: token('sadness') },
  { id: 'fear', name: '두려움', motif: '바람과 그림자', emoji: '🌬️', color: token('fear') },
  { id: 'anger', name: '분노', motif: '불꽃과 고추', emoji: '🔥', color: token('anger') },
  { id: 'disgust', name: '불쾌', motif: '이끼와 버섯', emoji: '🍄', color: token('disgust') },
  { id: 'shame', name: '부끄러움', motif: '달팽이 껍데기', emoji: '🐚', color: token('shame') },
]

export const FAMILY_BY_ID: Record<FamilyId, Family> = Object.fromEntries(
  FAMILIES.map((f) => [f.id, f]),
) as Record<FamilyId, Family>
