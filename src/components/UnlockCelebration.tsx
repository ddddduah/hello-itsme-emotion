/*
 * 새 감정 해금 축하 — 앱에서 가장 "확실히 기쁜" 순간.
 * 반짝임이 퍼지고, 캐릭터가 통통 튀어 올라 등장합니다.
 * 여러 개가 한꺼번에 해금되면 하나씩 차례로 보여 줍니다.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, type RefObject } from 'react'
import { useNavigate } from 'react-router'
import { FAMILY_BY_ID } from '../data/families'
import { useAppData, type UnlockEvent } from '../store/AppDataContext'
import EmotionCharacter from './EmotionCharacter'

const GENTLE_FAMILIES = new Set(['joy', 'love', 'calm', 'surprise'])

const HEADLINE:Record<UnlockEvent['source'], string> = {
  initial: '새로운 감정을 만났어요',
  daily: '오늘의 감정이 찾아왔어요',
  keyword: '기록 속에서 새 감정을 발견했어요',
  hidden: '숨어 있던 감정을 알아차렸어요',
  finder: '마음속 감정을 찾아냈어요',
}

export default function UnlockCelebration() {
  const { celebrations, dismissCelebration } = useAppData()
  const current = celebrations[0]
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!current) return
    buttonRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissCelebration()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, dismissCelebration])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissCelebration}
        >
          <AnimatePresence mode="wait">
            <CelebrationCard
              key={current.emotion.id}
              event={current}
              remaining={celebrations.length - 1}
              buttonRef={buttonRef}
              onClose={dismissCelebration}
              onOpenDex={() => {
                dismissCelebration()
                navigate(`/dex/${current.emotion.id}`)
              }}
            />
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CelebrationCard({
  event,
  remaining,
  buttonRef,
  onClose,
  onOpenDex,
}: {
  event: UnlockEvent
  remaining: number
  buttonRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onOpenDex: () => void
}) {
  const { emotion, source, word } = event
  const family = FAMILY_BY_ID[emotion.family]
  const reduce = useReducedMotion()

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
      className="relative w-full max-w-sm overflow-hidden rounded-blob bg-paper px-6 pt-8 pb-6 text-center shadow-soft"
      style={{ backgroundImage: `radial-gradient(circle at 50% 30%, ${family.color.soft} 0%, transparent 65%)` }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm font-medium" style={{ color: family.color.deep }}>
        {HEADLINE[source]}
      </p>
      {source === 'keyword' && word && (
        <p className="mt-1 text-xs text-ink-soft">
          쓰신 말 “<span className="font-semibold">{word}</span>”에 이 감정이 담겨 있었어요
        </p>
      )}

      <div className="relative mx-auto my-4 h-36 w-36">
        {!reduce && <Sparkles color={family.color.main} deep={family.color.deep} />}
        <motion.div
          className="relative h-full w-full"
          initial={reduce ? { opacity: 0 } : { y: 60, scale: 0.3, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: [60, -14, 0], scale: [0.3, 1.1, 1], opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
        >
          {/* 첫 만남은 반갑게: 불편한 감정도 너무 격한 표정으로 등장하지 않도록 */}
          <EmotionCharacter
            family={emotion.family}
            intensity={GENTLE_FAMILIES.has(emotion.family) ? 4 : 2}
            className="h-full w-full drop-shadow-sm"
            title={emotion.name}
          />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <p className="text-xs text-ink-faint">{family.name} 가족</p>
        <h2 id="unlock-title" className="mt-0.5 text-2xl font-bold">
          {emotion.name}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{emotion.definition}</p>
        <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-left text-xs leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">이런 순간에 느껴요 · </span>
          {emotion.examples[0]}
        </p>
      </motion.div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onOpenDex}
          className="flex-1 rounded-full border border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-sand"
        >
          도감에서 보기
        </button>
        <button
          ref={buttonRef}
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
          style={{ background: family.color.deep }}
        >
          {remaining > 0 ? `반가워요 (${remaining}개 더)` : '반가워요'}
        </button>
      </div>
    </motion.div>
  )
}

/** 캐릭터 뒤로 퍼지는 반짝임 */
function Sparkles({ color, deep }: { color: string; deep: string }) {
  const count = 12
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const dist = 62 + (i % 3) * 14
        const size = 8 + (i % 4) * 3
        return (
          <motion.svg
            key={i}
            viewBox="0 0 20 20"
            className="absolute top-1/2 left-1/2"
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: [0, 1.2, 0.8],
              opacity: [0, 1, 0],
              rotate: 90,
            }}
            transition={{ duration: 1.4, delay: 0.3 + (i % 4) * 0.08, ease: 'easeOut' }}
          >
            <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5Z" fill={i % 2 ? color : deep} />
          </motion.svg>
        )
      })}
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{ background: color }}
        initial={{ scale: 0.2, opacity: 0.5 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
      />
    </div>
  )
}
