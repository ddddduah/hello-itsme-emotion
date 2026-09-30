/*
 * 방 안의 캐릭터 한 명 — 계속 움직여요.
 *  - normal : 바닥을 천천히 오가며 걸음마다 통통
 *  - lively : 더 크게, 더 넓게, 깡충깡충
 *  - sleepy : 제자리에서 숨 쉬듯 오르내리고 "z" 가 피어오름
 *  - new    : 문에서 걸어 들어와 "이사 왔어요!"
 */
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'framer-motion'
import type { Emotion } from '../../types'
import EmotionCharacter from '../EmotionCharacter'
import { ROOM, VIEW, type Placement } from './placement'

interface Props {
  placement: Placement
  /** 새 캐릭터 입주 연출을 시작해도 되는지 (축하 모달이 닫힌 뒤) */
  moveInReady: boolean
  onSelect: (emotion: Emotion) => void
}

const pctX = (x: number) => `${(x / VIEW.w) * 100}%`
const pctY = (y: number) => `${(y / VIEW.h) * 100}%`

export default function RoomCharacter({ placement: p, moveInReady, onSelect }: Props) {
  const reduce = useReducedMotion()
  const { emotion, state, seed } = p
  const sleepy = state === 'sleepy'
  const lively = state === 'lively'
  const isNew = state === 'new'

  // 1) 자리 — 새 이웃은 문 앞에서 출발
  const home = { left: pctX(p.x), top: pctY(p.y) }
  const door = { left: pctX(ROOM.door.x), top: pctY(ROOM.door.y) }
  const anchor = isNew ? (moveInReady ? home : door) : home

  // 2) 돌아다니기 (자기 너비 대비 %)
  const r = p.roam * 100
  const roam: TargetAndTransition | undefined =
    reduce || sleepy || isNew
      ? undefined
      : {
          // 한쪽으로 천천히 → 한참 쉬고 → 반대쪽으로 천천히 → 한참 쉬고 (한 바퀴 30~50초)
          x: ['0%', `${r}%`, `${r}%`, `${-r * 0.7}%`, `${-r * 0.7}%`, '0%'],
          transition: {
            duration: (lively ? 30 : 40) + seed * 10,
            times: [0, 0.22, 0.45, 0.7, 0.88, 1],
            repeat: Infinity,
            ease: 'easeInOut',
            delay: seed * 4,
          },
        }

  // 3) 몸짓 — 둥둥 떠다니는 느낌
  let body: TargetAndTransition | undefined
  if (reduce) body = undefined
  else if (sleepy)
    body = { scaleY: [1, 0.94, 1], scaleX: [1, 1.03, 1], transition: { duration: 4 + seed, repeat: Infinity, ease: 'easeInOut' } }
  else if (lively)
    body = {
      y: ['0%', '-18%', '0%'],
      rotate: [0, -4, 3, 0],
      transition: { duration: 2 + seed * 0.6, repeat: Infinity, ease: 'easeInOut' },
    }
  else if (isNew && moveInReady)
    body = { y: ['0%', '-10%', '0%'], transition: { duration: 0.7, repeat: 3, ease: 'easeInOut' } }
  else body = { y: ['0%', '-8%', '0%'], transition: { duration: 2.6 + seed * 0.8, repeat: Infinity, ease: 'easeInOut' } }

  const label = sleepy
    ? `${emotion.name} (졸고 있어요)`
    : lively
      ? `${emotion.name} (요즘 활발해요)`
      : isNew
        ? `${emotion.name} (새로 이사 왔어요)`
        : emotion.name

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(emotion)}
      aria-label={label}
      className="group absolute -translate-x-1/2 -translate-y-full outline-offset-4"
      style={{ width: pctX(p.size), zIndex: Math.round(p.y) }}
      initial={isNew ? { ...door, opacity: 0 } : false}
      animate={{ ...anchor, opacity: isNew && !moveInReady ? 0 : 1 }}
      transition={{ duration: isNew ? 2.2 : 0.6, ease: 'easeInOut', delay: isNew ? 0.3 + seed * 0.5 : 0 }}
    >
      <motion.div className="relative" animate={roam}>
        {/* 발밑 연필 그림자 */}
        <span
          className="absolute -bottom-0.5 left-1/2 h-[14%] w-[70%] -translate-x-1/2 rounded-[50%] opacity-60"
          style={{ backgroundColor: 'rgb(52 49 45 / 0.12)' }}
          aria-hidden
        />
        <motion.div className="origin-bottom" animate={body}>
          <div className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
            <EmotionCharacter
              family={emotion.family}
              intensity={p.intensity}
              mood={sleepy ? 'sleepy' : 'awake'}
              className="block h-auto w-full"
              title={emotion.name}
            />
          </div>
        </motion.div>

        {/* 졸 때 피어오르는 z */}
        {sleepy && !reduce && (
          <span className="pointer-events-none absolute -top-1 right-0 text-ink-soft" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute font-bold"
                style={{ fontSize: `${10 + i * 2}px` }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 0.9, 0], x: [0, 6 + i * 3], y: [0, -16 - i * 6] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.85 + seed, ease: 'easeOut' }}
              >
                z
              </motion.span>
            ))}
          </span>
        )}

        {/* 이름표 */}
        <span className="pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 rounded-sm bg-paper/80 px-1 text-[11px] leading-tight whitespace-nowrap text-ink-soft sm:text-xs">
          {emotion.name}
        </span>
      </motion.div>

      <AnimatePresence>
        {isNew && moveInReady && (
          <motion.span
            className="sketch absolute -top-7 left-1/2 z-10 -translate-x-1/2 rounded-full bg-paper px-2 py-0.5 text-xs font-bold whitespace-nowrap text-ink"
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 2.4 } }}
            exit={{ opacity: 0, y: -4 }}
          >
            이사 왔어요!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
