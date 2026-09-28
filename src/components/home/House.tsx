/*
 * 마음집 일러스트: 지붕 + 3층 × 3칸 방.
 * 방 하나에 감정 가족 하나가 살고, 방 색은 가족 색 토큰을 따릅니다.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { EMOTIONS } from '../../data/emotions'
import { FAMILIES, type Family } from '../../data/families'
import { characterState, sizeScale, type EmotionStats } from '../../lib/stats'
import type { AppData, DateKey, Emotion } from '../../types'
import HomeCharacter from './HomeCharacter'

interface Props {
  data: AppData
  unlockedIds: Set<string>
  stats: Map<string, EmotionStats>
  today: DateKey
  moveInReady: boolean
  onSelect: (emotion: Emotion) => void
}

export default function House(props: Props) {
  return (
    <div className="relative [--char:36px] min-[400px]:[--char:40px] sm:[--char:52px]">
      <Roof />
      <div className="relative mx-[4%] -mt-px rounded-b-[1.75rem] border-2 border-t-0 border-[#d9c7b0] bg-[#efe3d2] p-2 shadow-soft sm:p-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {FAMILIES.map((family) => (
            <Room key={family.id} family={family} {...props} />
          ))}
        </div>
      </div>
      {/* 마당 */}
      <div className="mx-[-8px] mt-[-6px] h-4 rounded-full bg-[#cfe3c8]" aria-hidden />
    </div>
  )
}

function Room({ family, data, unlockedIds, stats, today, moveInReady, onSelect }: Props & { family: Family }) {
  const residents = EMOTIONS.filter((e) => e.family === family.id && unlockedIds.has(e.id)).map((emotion) => {
    const st = stats.get(emotion.id)
    return {
      emotion,
      stats: st,
      state: characterState(emotion.id, st, data, today),
    }
  })
  // 깨어 있는 캐릭터는 가운데, 졸린 캐릭터는 구석(오른쪽 끝)으로
  const awake = residents
    .filter((r) => r.state !== 'sleepy')
    .sort((a, b) => (b.stats?.recent ?? 0) - (a.stats?.recent ?? 0))
  const sleepy = residents.filter((r) => r.state === 'sleepy')

  return (
    <section
      className="relative flex min-h-32 flex-col overflow-hidden rounded-2xl px-1.5 pt-1.5 pb-1 sm:min-h-40 sm:px-2"
      style={{ background: residents.length ? family.color.soft : 'var(--color-cream)' }}
      aria-label={`${family.name} 가족의 방`}
    >
      <header className="flex items-center justify-between px-0.5">
        <span className="text-[10px] font-semibold sm:text-xs" style={{ color: family.color.deep }}>
          {family.name}
        </span>
        <span className="text-xs opacity-50" aria-hidden>
          {family.emoji}
        </span>
      </header>

      {residents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-ink-faint">
          <Door />
          <span className="text-[10px]">빈 방이에요</span>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap items-end justify-center gap-x-1 gap-y-2 pt-6">
          {awake.map((r) => (
            <HomeCharacter
              key={r.emotion.id}
              emotion={r.emotion}
              state={r.state}
              scale={sizeScale(r.stats)}
              intensity={r.stats?.recentIntensity ?? 3}
              moveInReady={moveInReady}
              onSelect={onSelect}
            />
          ))}
          {sleepy.length > 0 && (
            <div className="ml-auto flex items-end gap-0.5">
              {sleepy.map((r) => (
                <HomeCharacter
                  key={r.emotion.id}
                  emotion={r.emotion}
                  state="sleepy"
                  scale={1}
                  intensity={2}
                  moveInReady={moveInReady}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* 방바닥 */}
      <div className="mx-[-8px] mt-1 h-1.5 rounded-full opacity-60" style={{ background: family.color.main }} aria-hidden />
    </section>
  )
}

function Roof() {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 400 110" className="block w-full" aria-hidden>
      {/* 굴뚝과 연기 */}
      <rect x="300" y="18" width="26" height="52" rx="4" fill="#d9a88a" />
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="313"
            cy="10"
            r="7"
            fill="#dccbb8"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.8, 0], y: -24, scale: 1.4 }}
            transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.05, ease: 'easeOut' }}
          />
        ))}
      <path d="M8 108 200 8l192 100Z" fill="#e7a98c" stroke="#d08e70" strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 100 200 22l160 78" fill="none" stroke="#f3c3a9" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      {/* 다락 창 */}
      <circle cx="200" cy="68" r="17" fill="#fdf1dc" stroke="#d08e70" strokeWidth="3" />
      <path d="M200 52v32M184 68h32" stroke="#d08e70" strokeWidth="2.5" />
    </svg>
  )
}

function Door() {
  return (
    <svg viewBox="0 0 24 32" className="h-7 w-5 opacity-60" aria-hidden>
      <rect x="2" y="2" width="20" height="28" rx="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="17" r="1.6" fill="currentColor" />
    </svg>
  )
}
