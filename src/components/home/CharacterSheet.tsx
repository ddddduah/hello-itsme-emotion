/*
 * 캐릭터를 눌렀을 때: 감정 이름, 짧은 뜻, 기록 횟수, 최근 기록 1개 미리보기
 * 모바일에서는 아래에서 올라오는 시트, 넓은 화면에서는 가운데 카드
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type RefObject } from 'react'
import { Link } from 'react-router'
import { FAMILY_BY_ID } from '../../data/families'
import { INTENSITY_LABELS } from '../../data/intensity'
import { formatDateKo } from '../../lib/date'
import type { CharacterState, EmotionStats } from '../../lib/stats'
import type { Emotion } from '../../types'
import EmotionCharacter from '../EmotionCharacter'

interface Props {
  emotion: Emotion | null
  stats: EmotionStats | undefined
  state: CharacterState | null
  onClose: () => void
}

const STATE_NOTE: Record<CharacterState, string> = {
  new: '막 이사 온 새 이웃이에요.',
  lively: '요즘 자주 찾아오고 있어요.',
  normal: '이 집에서 잘 지내고 있어요.',
  sleepy: '한동안 조용히 쉬고 있어요.',
}

export default function CharacterSheet({ emotion, stats, state, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!emotion) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [emotion, onClose])

  return (
    <AnimatePresence>
      {emotion && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <SheetBody emotion={emotion} stats={stats} state={state} onClose={onClose} closeRef={closeRef} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SheetBody({
  emotion,
  stats,
  state,
  onClose,
  closeRef,
}: Omit<Props, 'emotion'> & { emotion: Emotion; closeRef: RefObject<HTMLButtonElement | null> }) {
  const family = FAMILY_BY_ID[emotion.family]
  const last = stats?.lastEntry
  const lastIntensity = last?.emotions.find((e) => e.emotionId === emotion.id)?.intensity

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="w-full max-w-md rounded-t-[2rem] bg-paper px-6 pt-3 pb-8 sketch sm:rounded-blob sm:pt-6"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />

      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 rounded-3xl p-1.5" style={{ background: family.color.soft }}>
          <EmotionCharacter
            family={emotion.family}
            intensity={stats?.recentIntensity ?? 3}
            mood={state === 'sleepy' ? 'sleepy' : 'awake'}
            className="h-full w-full"
            title={emotion.name}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: family.color.deep }}>
            {family.name} 가족
          </p>
          <h2 id="sheet-title" className="text-xl font-bold">
            {emotion.name}
          </h2>
          {state && <p className="mt-0.5 text-xs text-ink-soft">{STATE_NOTE[state]}</p>}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{emotion.definition}</p>

      <div className="mt-4 rounded-2xl bg-cream px-4 py-3">
        <p className="text-sm">
          {stats?.total ? (
            <>
              지금까지 <strong style={{ color: family.color.deep }}>{stats.total}번</strong> 기록했어요
              {stats.recent > 0 && <span className="text-ink-soft"> · 최근 7일 {stats.recent}번</span>}
            </>
          ) : (
            <span className="text-ink-soft">아직 이 감정을 기록한 적은 없어요.</span>
          )}
        </p>
        {last && (
          <div className="mt-2.5 border-t border-line pt-2.5">
            <p className="text-xs text-ink-faint">
              가장 최근 · {formatDateKo(last.date)}
              {lastIntensity && ` · ${INTENSITY_LABELS[lastIntensity]}`}
            </p>
            <p className="mt-1 line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
              {last.text || '(글 없이 감정만 남긴 기록이에요)'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          to={`/dex/${emotion.id}`}
          className="flex-1 rounded-full border border-line px-4 py-3 text-center text-sm font-medium text-ink-soft hover:bg-sand"
        >
          도감에서 자세히
        </Link>
        <Link
          to={`/record?emotion=${emotion.id}`}
          className="flex-1 rounded-full px-4 py-3 text-center text-sm font-semibold text-white"
          style={{ background: family.color.deep }}
        >
          이 감정 기록하기
        </Link>
      </div>
      <button ref={closeRef} type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm text-ink-faint">
        닫기
      </button>
    </motion.div>
  )
}
