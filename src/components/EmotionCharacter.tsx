/*
 * 감정 캐릭터 (초기 SVG 버전)
 *
 * 가족마다 모티프 몸체(Body)가 있고, 그 위에 공통 얼굴(Face)을 얹습니다.
 * 표정은 가족의 감정 방향(valence)과 강도(1~5)로 계산합니다.
 * 추후 일러스트로 바꿀 때는 이 컴포넌트의 props 는 그대로 두고 내부만 교체하면 됩니다.
 */
import type { ReactNode } from 'react'
import { FAMILY_BY_ID } from '../data/families'
import type { FamilyId, Intensity } from '../types'

export type CharacterMood = 'awake' | 'sleepy'

interface Props {
  family: FamilyId
  intensity?: Intensity
  mood?: CharacterMood
  /** 잠긴 감정: 실루엣 */
  silhouette?: boolean
  className?: string
  title?: string
}

/** 얼굴 위치(몸체마다 다름) */
const FACE_Y: Record<FamilyId, number> = {
  joy: 58,
  sadness: 64,
  anger: 64,
  fear: 56,
  surprise: 60,
  disgust: 66,
  shame: 66,
  love: 58,
  calm: 64,
}

/** 입꼬리 방향: + 웃음, − 찡그림 */
const VALENCE: Record<FamilyId, number> = {
  joy: 1,
  love: 0.9,
  calm: 0.6,
  surprise: 0,
  sadness: -1,
  anger: -0.9,
  fear: -0.6,
  disgust: -0.7,
  shame: -0.4,
}

export default function EmotionCharacter({
  family,
  intensity = 3,
  mood = 'awake',
  silhouette = false,
  className,
  title,
}: Props) {
  const color = FAMILY_BY_ID[family].color
  const main = silhouette ? 'var(--color-line)' : color.main
  const deep = silhouette ? 'var(--color-ink-faint)' : color.deep

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? '감정 캐릭터'}>
      <Body family={family} main={main} deep={deep} silhouette={silhouette} />
      {silhouette ? (
        <text x="50" y={FACE_Y[family] + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--color-paper)">
          ?
        </text>
      ) : (
        <Face family={family} intensity={intensity} mood={mood} deep={deep} />
      )}
    </svg>
  )
}

// ───────────────────────── 몸체 ─────────────────────────

function Body({ family, main, deep, silhouette }: { family: FamilyId; main: string; deep: string; silhouette: boolean }) {
  const line = silhouette ? 'none' : deep
  const lw = 1.6
  const shapes: Record<FamilyId, ReactNode> = {
    // 기쁨: 꽃잎에 둘러싸인 해님
    joy: (
      <g>
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="22"
            rx="8"
            ry="12"
            fill={main}
            opacity={silhouette ? 1 : 0.55}
            transform={`rotate(${i * 45} 50 55)`}
          />
        ))}
        <circle cx="50" cy="55" r="27" fill={main} stroke={line} strokeWidth={lw} />
      </g>
    ),
    // 슬픔: 물방울
    sadness: (
      <g>
        <path d="M50 10C50 10 20 46 20 64a30 30 0 0 0 60 0C80 46 50 10 50 10Z" fill={main} stroke={line} strokeWidth={lw} />
        {!silhouette && <ellipse cx="37" cy="52" rx="4" ry="7" fill="white" opacity="0.45" transform="rotate(20 37 52)" />}
      </g>
    ),
    // 분노: 불꽃
    anger: (
      <path
        d="M52 8c4 14 15 18 21 30 4 8 7 14 7 24a30 30 0 0 1-60 0c0-10 4-18 10-24 1 7 4 11 8 13-1-17 6-31 14-43Z"
        fill={main}
        stroke={line}
        strokeWidth={lw}
        strokeLinejoin="round"
      />
    ),
    // 두려움: 바람결 꼬리가 달린 그림자
    fear: (
      <g>
        <path
          d="M22 54a28 28 0 0 1 56 0v26c-5-5-9-5-13 0s-9 5-13 0-9-5-13 0-9 5-13 0Z"
          fill={main}
          stroke={line}
          strokeWidth={lw}
          strokeLinejoin="round"
        />
        {!silhouette && (
          <g fill="none" stroke={deep} strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
            <path d="M84 40c6 0 8 6 3 8" />
            <path d="M86 56h8" />
            <path d="M6 48h8c4 0 5-5 1-6" />
          </g>
        )}
      </g>
    ),
    // 놀람: 머리 위 별똥별
    surprise: (
      <g>
        <circle cx="50" cy="60" r="28" fill={main} stroke={line} strokeWidth={lw} />
        <path
          d="M62 8l3.2 6.6 7.2 1-5.2 5 1.2 7.2L62 24.4l-6.4 3.4 1.2-7.2-5.2-5 7.2-1Z"
          fill={silhouette ? main : 'var(--color-surprise-soft)'}
          stroke={line}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {!silhouette && <path d="M56 26q-4 4-5 8" fill="none" stroke={deep} strokeWidth="1.5" strokeLinecap="round" />}
      </g>
    ),
    // 불쾌: 버섯 (갓 아래 얼굴)
    disgust: (
      <g>
        <rect x="28" y="44" width="44" height="46" rx="16" fill={silhouette ? main : 'var(--color-disgust-soft)'} stroke={line} strokeWidth={lw} />
        <path d="M12 48C12 24 30 12 50 12s38 12 38 36c0 4-3 6-7 6H19c-4 0-7-2-7-6Z" fill={main} stroke={line} strokeWidth={lw} />
        {!silhouette && (
          <g fill="white" opacity="0.6">
            <circle cx="34" cy="30" r="5" />
            <circle cx="58" cy="24" r="4" />
            <circle cx="70" cy="38" r="3.5" />
          </g>
        )}
      </g>
    ),
    // 부끄러움: 등껍데기를 멘 달팽이 (껍데기 속으로 숨고 싶은)
    shame: (
      <g>
        <ellipse cx="46" cy="70" rx="32" ry="20" fill={main} stroke={line} strokeWidth={lw} />
        <circle cx="66" cy="42" r="22" fill={silhouette ? main : 'var(--color-shame-soft)'} stroke={line} strokeWidth={lw} />
        {!silhouette && (
          <path
            d="M66 42m0-3a3 3 0 1 1-3 3a7 7 0 0 1 7-7a11 11 0 0 1 11 11a15 15 0 0 1-15 15"
            fill="none"
            stroke={deep}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
        {!silhouette && (
          <g stroke={deep} strokeWidth="1.6" strokeLinecap="round">
            <path d="M30 52l-4-10" />
            <path d="M38 50l1-10" />
            <circle cx="26" cy="41" r="2" fill={deep} />
            <circle cx="39" cy="39" r="2" fill={deep} />
          </g>
        )}
      </g>
    ),
    // 연결·사랑: 실타래
    love: (
      <g>
        <circle cx="50" cy="56" r="29" fill={main} stroke={line} strokeWidth={lw} />
        {!silhouette && (
          <g fill="none" stroke={deep} strokeWidth="1.2" opacity="0.35">
            <path d="M26 40c14 6 34 6 48 0" />
            <path d="M22 70c18-6 38-4 54 4" />
            <path d="M36 29c-6 18-6 38 4 54" />
          </g>
        )}
        <path d="M78 64c8 4 10 12 6 18s-12 4-14 10" fill="none" stroke={line === 'none' ? main : deep} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    ),
    // 평온: 잎사귀를 얹은 조약돌
    calm: (
      <g>
        <path d="M14 66c0-18 16-30 36-30s36 12 36 30-14 24-36 24-36-6-36-24Z" fill={main} stroke={line} strokeWidth={lw} />
        <path d="M50 37c-2-12 6-22 20-24-1 14-8 22-20 24Z" fill={silhouette ? main : 'var(--color-calm-deep)'} opacity={silhouette ? 1 : 0.75} />
        {!silhouette && <path d="M50 37c4-6 9-11 16-18" fill="none" stroke="var(--color-calm-soft)" strokeWidth="1.2" strokeLinecap="round" />}
      </g>
    ),
  }
  return <>{shapes[family]}</>
}

// ───────────────────────── 얼굴 ─────────────────────────

function Face({ family, intensity, mood, deep }: { family: FamilyId; intensity: Intensity; mood: CharacterMood; deep: string }) {
  const y = FACE_Y[family]
  const t = (intensity - 1) / 4 // 0 ~ 1
  const v = VALENCE[family]
  const ex = 10 // 눈 간격
  const eyeY = y - 3
  const mouthY = y + 8
  const stroke = { stroke: deep, strokeWidth: 2.2, strokeLinecap: 'round' as const, fill: 'none' }

  if (mood === 'sleepy') {
    return (
      <g>
        <path d={`M${50 - ex - 3} ${eyeY}q3 2 6 0M${50 + ex - 3} ${eyeY}q3 2 6 0`} {...stroke} />
        <ellipse cx="50" cy={mouthY} rx="2.2" ry="1.6" fill={deep} opacity="0.6" />
        <text x="72" y={y - 18} fontSize="10" fontWeight="700" fill={deep} opacity="0.55">
          z
        </text>
        <text x="79" y={y - 26} fontSize="7" fontWeight="700" fill={deep} opacity="0.4">
          z
        </text>
      </g>
    )
  }

  // 눈
  let eyes: ReactNode
  if ((family === 'joy' || family === 'love') && t >= 0.5) {
    // 웃는 눈 (^ ^)
    eyes = <path d={`M${50 - ex - 3.5} ${eyeY + 1}q3.5-4 7 0M${50 + ex - 3.5} ${eyeY + 1}q3.5-4 7 0`} {...stroke} />
  } else if (family === 'calm') {
    // 편안히 감은 눈
    eyes = <path d={`M${50 - ex - 3.5} ${eyeY}q3.5 3 7 0M${50 + ex - 3.5} ${eyeY}q3.5 3 7 0`} {...stroke} />
  } else if (family === 'shame') {
    // 시선을 피해 아래로
    eyes = (
      <g fill={deep}>
        <circle cx={50 - ex - 1.5} cy={eyeY + 2} r="2.4" />
        <circle cx={50 + ex - 1.5} cy={eyeY + 2} r="2.4" />
      </g>
    )
  } else {
    const r = family === 'surprise' || family === 'fear' ? 2.6 + t * 1.2 : 2.6
    eyes = (
      <g fill={deep}>
        <circle cx={50 - ex} cy={eyeY} r={r} />
        <circle cx={50 + ex} cy={eyeY} r={r} />
        {(family === 'surprise' || family === 'fear') && (
          <g fill="white">
            <circle cx={50 - ex + 0.8} cy={eyeY - 0.8} r={r * 0.35} />
            <circle cx={50 + ex + 0.8} cy={eyeY - 0.8} r={r * 0.35} />
          </g>
        )}
      </g>
    )
  }

  // 눈썹 (강도가 셀수록 기울기↑)
  let brows: ReactNode = null
  const by = eyeY - 7
  if (family === 'anger') {
    const d = 2 + t * 4
    brows = <path d={`M${50 - ex - 5} ${by - d / 2}L${50 - ex + 4} ${by + d / 2}M${50 + ex + 5} ${by - d / 2}L${50 + ex - 4} ${by + d / 2}`} {...stroke} />
  } else if (family === 'sadness' || family === 'fear') {
    const d = 1 + t * 3
    brows = <path d={`M${50 - ex - 4} ${by + d / 2}L${50 - ex + 4} ${by - d / 2}M${50 + ex + 4} ${by + d / 2}L${50 + ex - 4} ${by - d / 2}`} {...stroke} strokeWidth={1.8} />
  } else if (family === 'disgust') {
    brows = <path d={`M${50 - ex - 4} ${by + 1}l8 1M${50 + ex - 4} ${by - 1 - t * 3}q4-2 8 0`} {...stroke} strokeWidth={1.8} />
  }

  // 입
  let mouth: ReactNode
  if (family === 'surprise') {
    mouth = <ellipse cx="50" cy={mouthY} rx={2.5 + t * 2} ry={2.5 + t * 3.5} fill={deep} />
  } else if (family === 'fear') {
    const w = 6 + t * 3
    mouth = <path d={`M${50 - w} ${mouthY}q${w / 4} -3 ${w / 2} 0t${w / 2} 0t${w / 2} 0t${w / 2} 0`} {...stroke} strokeWidth={1.8} />
  } else if (family === 'disgust') {
    const w = 6 + t * 2
    mouth = <path d={`M${50 - w} ${mouthY + 1}q${w} ${-2 - t * 3} ${w * 2} ${-1 - t * 2}`} {...stroke} />
  } else {
    const w = 5 + t * 4
    const curve = v * (2 + t * 8)
    mouth = <path d={`M${50 - w} ${mouthY}Q50 ${mouthY + curve} ${50 + w} ${mouthY}`} {...stroke} />
  }

  // 볼터치·눈물·땀 등 강도 연출
  const blushOpacity =
    family === 'shame' ? 0.35 + t * 0.55 : family === 'joy' || family === 'love' ? 0.2 + t * 0.4 : family === 'anger' ? t * 0.6 : 0
  const blushColor = family === 'anger' ? 'var(--color-anger-deep)' : 'var(--color-love)'

  return (
    <g>
      {blushOpacity > 0 && (
        <g fill={blushColor} opacity={blushOpacity}>
          <ellipse cx={50 - ex - 6} cy={eyeY + 7} rx="4.5" ry="2.6" />
          <ellipse cx={50 + ex + 6} cy={eyeY + 7} rx="4.5" ry="2.6" />
        </g>
      )}
      {brows}
      {eyes}
      {mouth}
      {family === 'sadness' && t >= 0.5 && (
        <path d={`M${50 + ex + 1} ${eyeY + 4}q-2.5 4 0 6q2.5-2 0-6Z`} fill="var(--color-sadness-soft)" stroke={deep} strokeWidth="0.8" />
      )}
      {family === 'fear' && t >= 0.5 && (
        <path d={`M${50 + ex + 9} ${eyeY - 8}q-2.5 4 0 6q2.5-2 0-6Z`} fill="white" stroke={deep} strokeWidth="0.8" />
      )}
      {family === 'anger' && t >= 0.75 && (
        <g stroke={deep} strokeWidth="1.6" strokeLinecap="round">
          <path d={`M${50 + ex + 10} ${y - 22}l3 -3M${50 + ex + 14} ${y - 18}l4 -1`} />
        </g>
      )}
    </g>
  )
}
