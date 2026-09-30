/*
 * 마음집 방 안 좌표와 캐릭터 배치 계산 (viewBox 0 0 400 440 기준)
 */
import { EMOTIONS } from '../../data/emotions'
import { characterState, sizeScale, type CharacterState, type EmotionStats } from '../../lib/stats'
import type { AppData, DateKey, Emotion, Intensity } from '../../types'

export const VIEW = { w: 400, h: 440 }

/** 캐릭터 배치에 쓰는 좌표 (viewBox 기준, 캐릭터 발끝 위치) */
export const ROOM = {
  door: { x: 68, y: 300 },
  /** 깨어 있는 캐릭터가 돌아다니는 바닥 */
  floor: { x0: 92, x1: 318, y0: 326, y1: 414 },
  /** 졸린 캐릭터가 자는 아늑한 자리 (먼저 채워지는 순) */
  naps: [
    { x: 64, y: 404, name: '바구니 침대' },
    { x: 348, y: 410, name: '빈백' },
    { x: 312, y: 294, name: '소파' },
    { x: 346, y: 294, name: '소파' },
    { x: 120, y: 316, name: '방석' },
    { x: 92, y: 410, name: '바구니 옆' },
    { x: 372, y: 398, name: '빈백 옆' },
  ],
}

export interface Placement {
  emotion: Emotion
  state: CharacterState
  intensity: Intensity
  /** viewBox 좌표, 캐릭터 발끝 */
  x: number
  y: number
  /** viewBox 단위 너비 */
  size: number
  /** 돌아다니는 폭 (자기 너비 대비 배수) */
  roam: number
  seed: number
}

function seedOf(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000
  return h / 1000
}

/** 바닥 위 위치: 저불일치 수열로 겹치지 않게 고르게 흩어 놓음 */
function floorSpot(i: number) {
  const { x0, x1, y0, y1 } = ROOM.floor
  const u = (i * 0.618034 + 0.31) % 1
  const v = (i * 0.414214 + 0.57) % 1
  return { x: x0 + u * (x1 - x0), y: y0 + v * (y1 - y0) }
}

/** 마이홈에 함께 보이는 감정의 최대 수 */
export const MAX_RESIDENTS = 10

/**
 * 마이홈에 보일 감정 고르기 (최대 MAX_RESIDENTS)
 *  1) 기록한 감정 중 가장 자주(횟수) → 가장 크게(강도 합) → 최근에 느낀 순
 *  2) 자리가 남으면: 막 이사 온 새 감정 → 최근에 만난 감정 순으로 채움
 */
export function selectResidentIds(data: AppData, unlockedIds: Set<string>, stats: Map<string, EmotionStats>): string[] {
  const unlocked = EMOTIONS.filter((e) => unlockedIds.has(e.id))

  const recorded = unlocked
    .filter((e) => (stats.get(e.id)?.total ?? 0) > 0)
    .sort((a, b) => {
      const sa = stats.get(a.id)!
      const sb = stats.get(b.id)!
      return (
        sb.total - sa.total ||
        sb.totalIntensity - sa.totalIntensity ||
        (sb.lastDate ?? '').localeCompare(sa.lastDate ?? '') ||
        a.unlockOrder - b.unlockOrder
      )
    })
    .map((e) => e.id)

  const picked = recorded.slice(0, MAX_RESIDENTS)
  if (picked.length < MAX_RESIDENTS) {
    const unlockedAt = new Map(data.unlocks.map((u) => [u.emotionId, u.unlockedAt]))
    const rest = unlocked
      .filter((e) => !picked.includes(e.id))
      .sort((a, b) => {
        const newA = data.moveInSeen.includes(a.id) ? 1 : 0
        const newB = data.moveInSeen.includes(b.id) ? 1 : 0
        return newA - newB || (unlockedAt.get(b.id) ?? '').localeCompare(unlockedAt.get(a.id) ?? '')
      })
      .map((e) => e.id)
    picked.push(...rest.slice(0, MAX_RESIDENTS - picked.length))
  }
  return picked
}

export function placeResidents(
  data: AppData,
  unlockedIds: Set<string>,
  stats: Map<string, EmotionStats>,
  today: DateKey,
): Placement[] {
  const shown = new Set(selectResidentIds(data, unlockedIds, stats))
  const residents = EMOTIONS.filter((e) => shown.has(e.id)).map((emotion) => {
    const st = stats.get(emotion.id)
    return { emotion, st, state: characterState(emotion.id, st, data, today) }
  })

  // 최대 10명이라 넉넉한 크기
  const base = residents.length > 7 ? 46 : 50

  const awake = residents
    .filter((r) => r.state !== 'sleepy')
    // 활발한 감정부터 러그 가운데 쪽 자리를 차지
    .sort((a, b) => (b.st?.recent ?? 0) - (a.st?.recent ?? 0) || a.emotion.unlockOrder - b.emotion.unlockOrder)
  const sleepy = residents.filter((r) => r.state === 'sleepy')

  const placed: Placement[] = awake.map((r, i) => {
    const spot = floorSpot(i)
    const depth = 0.88 + ((spot.y - ROOM.floor.y0) / (ROOM.floor.y1 - ROOM.floor.y0)) * 0.22 // 앞쪽일수록 크게
    const lively = r.state === 'lively'
    return {
      emotion: r.emotion,
      state: r.state,
      intensity: r.st?.recentIntensity ?? 3,
      ...spot,
      size: base * depth * (lively ? sizeScale(r.st) : 1),
      // 너무 왔다 갔다 하지 않게 좁은 폭에서 천천히
      roam: lively ? 0.55 : 0.3,
      seed: seedOf(r.emotion.id),
    }
  })

  sleepy.forEach((r, i) => {
    const nap = ROOM.naps[i % ROOM.naps.length]
    const lap = Math.floor(i / ROOM.naps.length) // 자리가 모자라면 옆에 겹쳐 누움
    placed.push({
      emotion: r.emotion,
      state: 'sleepy',
      intensity: 2,
      x: nap.x + lap * 14 * (nap.x > 200 ? -1 : 1),
      y: nap.y - lap * 3,
      size: base * 0.8,
      roam: 0,
      seed: seedOf(r.emotion.id),
    })
  })

  return placed
}
