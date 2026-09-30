/*
 * 마음집 — 아늑한 방 안에서 감정들이 자유롭게 살아요.
 *
 *  - 깨어 있는 감정은 바닥을 천천히 돌아다니고(걸음마다 통통),
 *    자주 찾아온 감정(lively)은 더 크게, 더 넓게, 깡충깡충 뛰어다녀요.
 *  - 한동안 못 본 감정(sleepy)은 바구니 침대·빈백·소파 같은 구석 자리에서 졸아요.
 *  - 새로 해금된 감정(new)은 문으로 들어와 자리를 잡아요.
 *  - 창밖은 한국 시간에 맞춰 새벽/낮/노을/밤으로 바뀝니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { celestialProgress, formatKst, kstTime, phaseLabel, skyPhase, type KstTime } from '../../lib/kst'
import type { EmotionStats } from '../../lib/stats'
import type { AppData, DateKey, Emotion } from '../../types'
import { placeResidents, VIEW } from './placement'
import RoomCharacter from './RoomCharacter'
import RoomScene from './RoomScene'

interface Props {
  data: AppData
  unlockedIds: Set<string>
  stats: Map<string, EmotionStats>
  today: DateKey
  moveInReady: boolean
  onSelect: (emotion: Emotion) => void
}

/** 한국 시간을 30초마다 갱신 */
function useKstClock(): KstTime {
  const [t, setT] = useState(() => kstTime())
  useEffect(() => {
    const id = window.setInterval(() => setT(kstTime()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return t
}

export default function CozyHouse({ data, unlockedIds, stats, today, moveInReady, onSelect }: Props) {
  const clock = useKstClock()
  const phase = skyPhase(clock.minutes)
  const progress = celestialProgress(clock.minutes)
  const placements = useMemo(() => placeResidents(data, unlockedIds, stats, today), [data, unlockedIds, stats, today])

  return (
    <figure className="mx-auto max-w-xl">
      {/* isolate: 캐릭터들의 z-index 가 이 그림 안에서만 쓰이도록 — 상세 보기 창 위로 올라오지 않게 */}
      <div className="relative isolate w-full select-none" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <RoomScene phase={phase} progress={progress} />
        {placements
          .slice()
          .sort((a, b) => a.y - b.y) // 앞쪽(아래)에 있는 캐릭터가 위에 그려지도록
          .map((p) => (
            <RoomCharacter key={p.emotion.id} placement={p} moveInReady={moveInReady} onSelect={onSelect} />
          ))}
      </div>
      <figcaption className="mt-1 text-center text-sm text-ink-faint">
        창밖은 지금 한국 시간 {formatKst(clock)} · {phaseLabel(phase)}
      </figcaption>
    </figure>
  )
}
