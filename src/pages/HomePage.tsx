import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import CharacterSheet from '../components/home/CharacterSheet'
import CozyHouse from '../components/home/CozyHouse'
import { EMOTION_BY_ID } from '../data/emotions'
import { toDateKey } from '../lib/date'
import { characterState, computeEmotionStats } from '../lib/stats'
import { useAppData } from '../store/AppDataContext'
import type { Emotion } from '../types'

/** "이사 왔어요!" 연출을 보여 주는 시간 */
const MOVE_IN_MS = 6000

function greeting(hour: number) {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요'
  if (hour >= 11 && hour < 17) return '오늘 하루는 어떤가요'
  if (hour >= 17 && hour < 22) return '오늘 하루도 수고 많으셨어요'
  return '고요한 밤이에요'
}

export default function HomePage() {
  const { data, unlockedIds, celebrations, markMoveInSeen } = useAppData()
  const today = toDateKey()
  const stats = useMemo(() => computeEmotionStats(data, today), [data, today])
  const [selected, setSelected] = useState<Emotion | null>(null)

  const newcomers = useMemo(
    () => data.unlocks.map((u) => u.emotionId).filter((id) => !data.moveInSeen.includes(id) && EMOTION_BY_ID[id]),
    [data.unlocks, data.moveInSeen],
  )
  // 해금 축하 모달이 떠 있는 동안에는 입주 연출을 미룸
  const moveInReady = celebrations.length === 0

  useEffect(() => {
    if (!moveInReady || newcomers.length === 0) return
    const t = window.setTimeout(() => void markMoveInSeen(newcomers), MOVE_IN_MS)
    return () => window.clearTimeout(t)
  }, [moveInReady, newcomers, markMoveInSeen])

  const todayCount = data.entries.filter((e) => e.date === today).length
  const closeSheet = useCallback(() => setSelected(null), [])

  return (
    <>
      <div className="pt-3 pb-4">
        <p className="text-base text-ink-soft">{greeting(new Date().getHours())}</p>
        <h1 className="mt-0.5 text-3xl font-bold">나의 마음집</h1>
        <p className="mt-1 text-base leading-relaxed text-ink-soft">
          지금 이 집에는 <strong className="marker text-ink">{unlockedIds.size}개</strong>의 감정이 살고 있어요.
        </p>
      </div>

      <AnimatePresence>
        {newcomers.length > 0 && moveInReady && (
          <motion.p
            className="sketch mb-3 rounded-full bg-accent-soft px-4 py-1.5 text-center text-base text-ink"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            새 이웃이 이사 왔어요 · <strong>{newcomers.map((id) => EMOTION_BY_ID[id].name).join(', ')}</strong>
          </motion.p>
        )}
      </AnimatePresence>

      <CozyHouse
        data={data}
        unlockedIds={unlockedIds}
        stats={stats}
        today={today}
        moveInReady={moveInReady}
        onSelect={setSelected}
      />

      <p className="mt-3 text-center text-sm leading-relaxed text-ink-faint">
        자주 찾아온 감정은 크고 활발하게 뛰어다니고, 한동안 못 본 감정은 구석 자리에서 졸아요.
        <br />
        캐릭터를 누르면 이야기를 들을 수 있어요.
      </p>

      <Link
        to="/record"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 font-semibold text-white sketch transition-transform active:scale-[0.98]"
      >
        {todayCount > 0 ? `오늘 ${todayCount}번 기록했어요 · 하나 더 남기기` : '오늘의 마음 기록하기'}
      </Link>

      <CharacterSheet
        emotion={selected}
        stats={selected ? stats.get(selected.id) : undefined}
        state={selected ? characterState(selected.id, stats.get(selected.id), data, today) : null}
        onClose={closeSheet}
      />
    </>
  )
}
