/*
 * 창밖 풍경 — 한국 시간에 맞춰 새벽 / 낮 / 노을 / 밤
 * 창틀 안쪽 사각형(x, y, w, h)에 맞춰 그리고, 창 밖으로 넘치지 않게 잘라 냅니다.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'
import type { SkyPhase } from '../../lib/kst'

const SKY: Record<SkyPhase, [string, string, string]> = {
  dawn: ['#b3a5d4', '#f3c3ad', '#fbe2b6'],
  day: ['#a6cfe6', '#c9e4f1', '#eaf5f7'],
  dusk: ['#8a80b8', '#ee9f82', '#f9d19c'],
  night: ['#1d2446', '#2c3662', '#46507f'],
}

const HILL: Record<SkyPhase, [string, string]> = {
  dawn: ['#9fb08c', '#7f9270'],
  day: ['#a9c98f', '#86ab72'],
  dusk: ['#a58f7d', '#86716a'],
  night: ['#2f3a4f', '#232c3f'],
}

// 밤하늘 별 (창 안쪽 비율 좌표)
const STARS = [
  [0.12, 0.18],
  [0.3, 0.1],
  [0.52, 0.24],
  [0.7, 0.12],
  [0.86, 0.3],
  [0.22, 0.4],
  [0.62, 0.42],
  [0.42, 0.06],
  [0.93, 0.08],
]

interface Props {
  x: number
  y: number
  w: number
  h: number
  phase: SkyPhase
  /** 해·달 위치 0~1 */
  progress: number
  /** 작은 창(다락)은 구름·별을 줄임 */
  small?: boolean
  round?: boolean
}

export default function WindowSky({ x, y, w, h, phase, progress, small, round }: Props) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const [top, mid, bottom] = SKY[phase]
  const isNight = phase === 'night'

  // 해·달은 창 왼쪽 아래 → 위 → 오른쪽 아래로 둥글게
  const bx = x + w * (0.08 + progress * 0.84)
  const by = y + h * (0.72 - Math.sin(progress * Math.PI) * 0.55)
  const r = small ? w * 0.13 : w * 0.085

  return (
    <g>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          {round ? <circle cx={x + w / 2} cy={y + h / 2} r={w / 2} /> : <rect x={x} y={y} width={w} height={h} />}
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill={`url(#sky-${uid})`} filter="url(#crayon)" />

        {/* 별 */}
        {isNight &&
          STARS.slice(0, small ? 3 : STARS.length).map(([sx, sy], i) => (
            <motion.path
              key={i}
              d={`M${x + sx * w} ${y + sy * h - 2.2}l0.7 1.5 1.5 0.7-1.5 0.7-0.7 1.5-0.7-1.5-1.5-0.7 1.5-0.7Z`}
              fill="#fdf3c8"
              animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.4 + (i % 3) * 0.7, repeat: Infinity, delay: i * 0.35 }}
            />
          ))}

        {/* 해 또는 달 */}
        {isNight ? (
          <g filter="url(#pencil)">
            <circle cx={bx} cy={by} r={r} fill="#f7efc9" stroke="var(--color-ink)" strokeWidth="0.9" opacity="0.95" />
            <circle cx={bx + r * 0.45} cy={by - r * 0.25} r={r * 0.85} fill={mid} />
          </g>
        ) : (
          <g filter="url(#pencil)">
            {!small &&
              Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2
                return (
                  <line
                    key={i}
                    x1={bx + Math.cos(a) * r * 1.35}
                    y1={by + Math.sin(a) * r * 1.35}
                    x2={bx + Math.cos(a) * r * 1.75}
                    y2={by + Math.sin(a) * r * 1.75}
                    stroke="#e0a13c"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                )
              })}
            <circle
              cx={bx}
              cy={by}
              r={r}
              fill={phase === 'day' ? '#f8d56b' : '#f4a66f'}
              stroke="var(--color-ink)"
              strokeWidth="0.9"
            />
          </g>
        )}

        {/* 구름 (밤 제외) */}
        {!isNight &&
          !small &&
          [
            { cy: y + h * 0.28, s: 1, d: 38 },
            { cy: y + h * 0.48, s: 0.75, d: 52 },
          ].map((c, i) => (
            <motion.g
              key={i}
              filter="url(#pencil)"
              initial={{ x: w * (0.15 + i * 0.4) }}
              animate={reduce ? undefined : { x: [w * (0.15 + i * 0.4), w * 1.1, -(w * 0.4), w * (0.15 + i * 0.4)] }}
              transition={{ duration: c.d, repeat: Infinity, ease: 'linear', times: [0, 0.55 - i * 0.2, 0.55 - i * 0.2, 1] }}
            >
              <path
                d={`M${x} ${c.cy}q${6 * c.s} ${-10 * c.s} ${14 * c.s} ${-4 * c.s}q${6 * c.s} ${-8 * c.s} ${14 * c.s} 0q${8 * c.s} 0 ${6 * c.s} ${6 * c.s}z`}
                fill="#fffdf6"
                stroke="var(--color-ink)"
                strokeWidth="0.8"
                opacity="0.9"
              />
            </motion.g>
          ))}

        {/* 언덕과 나무 */}
        <g filter="url(#pencil)">
          <path
            d={`M${x - 2} ${y + h * 0.82}q${w * 0.25} ${-h * 0.16} ${w * 0.5} ${-h * 0.04}t${w * 0.52} ${-h * 0.02}V${y + h + 2}H${x - 2}Z`}
            fill={HILL[phase][0]}
            stroke="var(--color-ink)"
            strokeWidth="0.8"
          />
          <path
            d={`M${x - 2} ${y + h * 0.92}q${w * 0.3} ${-h * 0.1} ${w * 0.62} ${-h * 0.02}t${w * 0.42} ${h * 0.02}V${y + h + 2}H${x - 2}Z`}
            fill={HILL[phase][1]}
            stroke="var(--color-ink)"
            strokeWidth="0.8"
          />
          {!small && (
            <g>
              <line
                x1={x + w * 0.78}
                y1={y + h * 0.84}
                x2={x + w * 0.78}
                y2={y + h * 0.7}
                stroke="var(--color-ink)"
                strokeWidth="1.2"
              />
              <circle cx={x + w * 0.78} cy={y + h * 0.64} r={w * 0.07} fill={HILL[phase][1]} stroke="var(--color-ink)" strokeWidth="0.8" />
            </g>
          )}
        </g>

        {/* 밤에는 창 안쪽이 살짝 어둡게 */}
        {isNight && <rect x={x} y={y} width={w} height={h} fill="#10142a" opacity="0.12" />}
      </g>
    </g>
  )
}
