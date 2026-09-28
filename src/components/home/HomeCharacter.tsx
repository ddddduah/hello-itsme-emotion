/*
 * 마이홈에 사는 캐릭터 한 명
 *  - lively : 최근 자주 기록됨 → 크고, 통통 튀며 활발
 *  - normal : 천천히 숨 쉬듯 살짝 움직임
 *  - sleepy : 오래 기록되지 않음 → 작게, 구석에서 졸고 있음
 *  - new    : 새로 해금 → 문으로 들어오며 "이사 왔어요!"
 */
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'framer-motion'
import type { Emotion, Intensity } from '../../types'
import type { CharacterState } from '../../lib/stats'
import EmotionCharacter from '../EmotionCharacter'

interface Props {
  emotion: Emotion
  state: CharacterState
  /** 크기 배율 (최근 기록 횟수 기반) */
  scale: number
  intensity: Intensity
  /** 새 캐릭터 입주 연출을 시작해도 되는지 (축하 모달이 닫힌 뒤) */
  moveInReady: boolean
  onSelect: (emotion: Emotion) => void
}

/** id 로부터 0~1 사이 고정값 — 캐릭터마다 움직임 박자를 다르게 */
function seed(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000
  return h / 1000
}

export default function HomeCharacter({ emotion, state, scale, intensity, moveInReady, onSelect }: Props) {
  const reduce = useReducedMotion()
  const s = seed(emotion.id)
  const sleepy = state === 'sleepy'
  const size = sleepy ? 0.8 : state === 'lively' ? scale : 1

  let animate: TargetAndTransition
  if (reduce) {
    animate = { opacity: state === 'new' && !moveInReady ? 0 : 1 }
  } else if (state === 'new') {
    animate = moveInReady
      ? {
          opacity: 1,
          x: [-60, -30, 0],
          y: [0, -14, 0],
          transition: { duration: 1.1, delay: 0.3 + s * 0.4, ease: 'easeOut' },
        }
      : { opacity: 0, x: -60 }
  } else if (state === 'lively') {
    animate = {
      opacity: 1,
      x: 0,
      y: [0, -9, 0],
      rotate: [0, -4, 4, 0],
      transition: { duration: 0.9 + s * 0.3, repeat: Infinity, repeatDelay: 0.6 + s, ease: 'easeInOut' },
    }
  } else if (sleepy) {
    animate = {
      opacity: 1,
      x: 0,
      scaleY: [1, 0.95, 1],
      transition: { duration: 3.6, repeat: Infinity, delay: s * 2, ease: 'easeInOut' },
    }
  } else {
    animate = {
      opacity: 1,
      x: 0,
      y: [0, -3, 0],
      transition: { duration: 2.6 + s, repeat: Infinity, delay: s * 2, ease: 'easeInOut' },
    }
  }

  const label =
    state === 'sleepy'
      ? `${emotion.name} (졸고 있어요)`
      : state === 'lively'
        ? `${emotion.name} (요즘 활발해요)`
        : state === 'new'
          ? `${emotion.name} (새로 이사 왔어요)`
          : emotion.name

  return (
    <button
      type="button"
      onClick={() => onSelect(emotion)}
      className={`group relative flex flex-col items-center ${sleepy ? 'opacity-75' : ''}`}
      style={{ width: `calc(var(--char) * ${size})` }}
      aria-label={label}
    >
      <AnimatePresence>
        {state === 'new' && moveInReady && (
          <motion.span
            className="absolute -top-6 z-10 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-ink shadow-soft"
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 1.2 } }}
            exit={{ opacity: 0, y: -4 }}
          >
            이사 왔어요!
          </motion.span>
        )}
      </AnimatePresence>
      <motion.div
        className="w-full origin-bottom transition-transform group-hover:scale-110 group-active:scale-95"
        initial={false}
        animate={animate}
      >
        <EmotionCharacter
          family={emotion.family}
          intensity={intensity}
          mood={sleepy ? 'sleepy' : 'awake'}
          className="h-auto w-full"
          title={emotion.name}
        />
      </motion.div>
      <span className="mt-0.5 max-w-full truncate text-[10px] leading-tight text-ink-soft sm:text-xs">{emotion.name}</span>
    </button>
  )
}
