/*
 * 감정 캐릭터 — 연필 스케치 버전
 *
 * 가족마다 모티프 몸체(Body)가 있고, 그 위에 공통 얼굴(Face)을 얹습니다.
 * 몸체는 같은 모양을 세 겹으로 그립니다.
 *   1) color : 색연필로 칠한 면 (#crayon 필터 — 종이 결이 비침)
 *   2) hatch : 같은 색 계열의 빗금
 *   3) line  : 흑연 윤곽선 (#pencil 필터 — 손떨림)
 * 표정은 가족의 감정 방향(valence)과 강도(1~5)로 계산합니다.
 * 필터·빗금 정의는 SketchDefs.tsx 에 있고, 없으면(테스트 등) 그냥 평평하게 그려집니다.
 * 추후 일러스트로 바꿀 때는 이 컴포넌트의 props 는 그대로 두고 내부만 교체하면 됩니다.
 */
import type { ReactNode, SVGAttributes } from 'react'
import { FAMILY_BY_ID } from '../data/families'
import type { FamilyId, Intensity } from '../types'

export type CharacterMood = 'awake' | 'sleepy'

interface Props {
  family: FamilyId
  intensity?: Intensity
  mood?: CharacterMood
  /** 잠긴 감정: 연필 음영만 있는 실루엣 */
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

const INK = 'var(--color-ink)'

export default function EmotionCharacter({
  family,
  intensity = 3,
  mood = 'awake',
  silhouette = false,
  className,
  title,
}: Props) {
  const color = FAMILY_BY_ID[family].color
  // 맨 아래 불투명 바탕을 깔아 색연필 결 사이로 배경이 비치지 않게 함
  const layers: Layer[] = silhouette
    ? [paintBase('var(--color-sand)', 'var(--color-sand)'), paintSilhouetteFill(), paintHatch('url(#hatch-ink)'), paintLine('var(--color-ink-faint)')]
    : [paintBase(color.soft, color.soft), paintColor(color.main, color.soft), paintHatch(`url(#hatch-${family})`), paintLine(INK)]

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? '감정 캐릭터'} overflow="visible">
      {layers.map((layer) => (
        <g key={layer.key} filter={layer.filter}>
          <Body family={family} p={layer} />
        </g>
      ))}
      {silhouette ? (
        <text
          x="50"
          y={FACE_Y[family] + 6}
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'Gaegu, sans-serif' }}
        >
          ?
        </text>
      ) : (
        <g filter="url(#pencil)">
          <Face family={family} intensity={intensity} mood={mood} />
        </g>
      )}
    </svg>
  )
}

// ───────────────────────── 레이어별 칠하기 ─────────────────────────

type Paint = SVGAttributes<SVGElement>

interface Layer {
  key: string
  filter?: string
  /** 몸통 */
  main: Paint
  /** 버섯 대·달팽이 껍데기·별처럼 옅게 칠하는 부분 */
  sub: Paint
  /** 작은 색 조각 (잎, 점무늬, 하이라이트) */
  accent: (color: string, opacity?: number) => Paint
  /** 선으로만 그리는 장식 (소용돌이, 바람결, 실 가닥). 없으면 그리지 않음 */
  detail: Paint | null
}

/** 불투명 바탕 (필터 없음) — 위에 칠하는 색연필 결이 이 색 위로 보임 */
function paintBase(main: string, soft: string): Layer {
  return {
    key: 'base',
    main: { fill: main, stroke: 'none' },
    sub: { fill: soft, stroke: 'none' },
    accent: (c) => ({ fill: c, stroke: 'none' }),
    detail: null,
  }
}

function paintColor(main: string, soft: string): Layer {
  return {
    key: 'color',
    filter: 'url(#crayon)',
    main: { fill: main, stroke: 'none' },
    sub: { fill: soft, stroke: 'none' },
    accent: (c, o = 1) => ({ fill: c, opacity: o, stroke: 'none' }),
    detail: null,
  }
}

function paintSilhouetteFill(): Layer {
  return {
    key: 'color',
    filter: 'url(#crayon)',
    main: { fill: 'var(--color-sand)', stroke: 'none' },
    sub: { fill: 'var(--color-sand)', stroke: 'none' },
    accent: () => ({ fill: 'var(--color-sand)', stroke: 'none' }),
    detail: null,
  }
}

function paintHatch(pattern: string): Layer {
  return {
    key: 'hatch',
    main: { fill: pattern, stroke: 'none' },
    sub: { fill: 'none', stroke: 'none' },
    accent: () => ({ fill: 'none', stroke: 'none' }),
    detail: null,
  }
}

function paintLine(ink: string): Layer {
  const line = { fill: 'none', stroke: ink, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return {
    key: 'line',
    filter: 'url(#pencil)',
    main: { ...line, strokeWidth: 1.9 },
    sub: { ...line, strokeWidth: 1.6 },
    accent: () => ({ ...line, strokeWidth: 1.1, opacity: 0.8 }),
    detail: { ...line, strokeWidth: 1.3, opacity: 0.75 },
  }
}

// ───────────────────────── 몸체 ─────────────────────────

function Body({ family, p }: { family: FamilyId; p: Layer }) {
  switch (family) {
    // 기쁨: 꽃잎에 둘러싸인 해님
    case 'joy':
      return (
        <g>
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="50"
              cy="22"
              rx="8"
              ry="12"
              transform={`rotate(${i * 45} 50 55)`}
              {...(p.key === 'base' ? p.sub : p.key === 'color' ? { ...p.main, opacity: 0.5 } : p.accent('none'))}
            />
          ))}
          <circle cx="50" cy="55" r="27" {...p.main} />
        </g>
      )
    // 슬픔: 물방울
    case 'sadness':
      return (
        <g>
          <path d="M50 10C50 10 20 46 20 64a30 30 0 0 0 60 0C80 46 50 10 50 10Z" {...p.main} />
          <ellipse cx="37" cy="52" rx="4" ry="7" transform="rotate(20 37 52)" {...p.accent('white', 0.7)} />
        </g>
      )
    // 분노: 불꽃
    case 'anger':
      return (
        <path
          d="M52 8c4 14 15 18 21 30 4 8 7 14 7 24a30 30 0 0 1-60 0c0-10 4-18 10-24 1 7 4 11 8 13-1-17 6-31 14-43Z"
          {...p.main}
        />
      )
    // 두려움: 바람결 꼬리가 달린 그림자
    case 'fear':
      return (
        <g>
          <path d="M22 54a28 28 0 0 1 56 0v26c-5-5-9-5-13 0s-9 5-13 0-9-5-13 0-9 5-13 0Z" {...p.main} />
          {p.detail && (
            <g {...p.detail}>
              <path d="M84 40c6 0 8 6 3 8" />
              <path d="M86 56h8" />
              <path d="M6 48h8c4 0 5-5 1-6" />
            </g>
          )}
        </g>
      )
    // 놀람: 머리 위 별똥별
    case 'surprise':
      return (
        <g>
          <circle cx="50" cy="60" r="28" {...p.main} />
          <path d="M62 8l3.2 6.6 7.2 1-5.2 5 1.2 7.2L62 24.4l-6.4 3.4 1.2-7.2-5.2-5 7.2-1Z" {...p.sub} />
          {p.detail && <path d="M56 26q-4 4-5 8" {...p.detail} />}
        </g>
      )
    // 불쾌: 버섯 (갓 아래 얼굴)
    case 'disgust':
      return (
        <g>
          <rect x="28" y="44" width="44" height="46" rx="16" {...p.sub} />
          <path d="M12 48C12 24 30 12 50 12s38 12 38 36c0 4-3 6-7 6H19c-4 0-7-2-7-6Z" {...p.main} />
          <circle cx="34" cy="30" r="5" {...p.accent('white', 0.75)} />
          <circle cx="58" cy="24" r="4" {...p.accent('white', 0.75)} />
          <circle cx="70" cy="38" r="3.5" {...p.accent('white', 0.75)} />
        </g>
      )
    // 부끄러움: 등껍데기를 멘 달팽이
    case 'shame':
      return (
        <g>
          <ellipse cx="46" cy="70" rx="32" ry="20" {...p.main} />
          <circle cx="66" cy="42" r="22" {...p.sub} />
          {p.detail && (
            <g {...p.detail}>
              <path d="M66 42m0-3a3 3 0 1 1-3 3a7 7 0 0 1 7-7a11 11 0 0 1 11 11a15 15 0 0 1-15 15" />
              <path d="M30 52l-4-10" />
              <path d="M38 50l1-10" />
              <circle cx="26" cy="41" r="2" />
              <circle cx="39" cy="39" r="2" />
            </g>
          )}
        </g>
      )
    // 연결·사랑: 실타래
    case 'love':
      return (
        <g>
          <circle cx="50" cy="56" r="29" {...p.main} />
          {p.detail && (
            <g {...p.detail}>
              <path d="M26 40c14 6 34 6 48 0" />
              <path d="M22 70c18-6 38-4 54 4" />
              <path d="M36 29c-6 18-6 38 4 54" />
              <path d="M78 64c8 4 10 12 6 18s-12 4-14 10" />
            </g>
          )}
        </g>
      )
    // 평온: 잎사귀를 얹은 조약돌
    case 'calm':
      return (
        <g>
          <path d="M14 66c0-18 16-30 36-30s36 12 36 30-14 24-36 24-36-6-36-24Z" {...p.main} />
          <path d="M50 37c-2-12 6-22 20-24-1 14-8 22-20 24Z" {...p.accent('var(--color-calm-deep)', 0.8)} />
          {p.detail && <path d="M50 37c4-6 9-11 16-18" {...p.detail} />}
        </g>
      )
  }
}

// ───────────────────────── 얼굴 ─────────────────────────

function Face({ family, intensity, mood }: { family: FamilyId; intensity: Intensity; mood: CharacterMood }) {
  const y = FACE_Y[family]
  const t = (intensity - 1) / 4 // 0 ~ 1
  const v = VALENCE[family]
  const ex = 10 // 눈 간격
  const eyeY = y - 3
  const mouthY = y + 8
  const stroke = { stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const, fill: 'none' }

  if (mood === 'sleepy') {
    return (
      <g>
        <path d={`M${50 - ex - 3} ${eyeY}q3 2 6 0M${50 + ex - 3} ${eyeY}q3 2 6 0`} {...stroke} />
        <ellipse cx="50" cy={mouthY} rx="2.2" ry="1.6" fill={INK} opacity="0.6" />
      </g>
    )
  }

  // 눈
  let eyes: ReactNode
  if ((family === 'joy' || family === 'love') && t >= 0.5) {
    eyes = <path d={`M${50 - ex - 3.5} ${eyeY + 1}q3.5-4 7 0M${50 + ex - 3.5} ${eyeY + 1}q3.5-4 7 0`} {...stroke} />
  } else if (family === 'calm') {
    eyes = <path d={`M${50 - ex - 3.5} ${eyeY}q3.5 3 7 0M${50 + ex - 3.5} ${eyeY}q3.5 3 7 0`} {...stroke} />
  } else if (family === 'shame') {
    eyes = (
      <g fill={INK}>
        <circle cx={50 - ex - 1.5} cy={eyeY + 2} r="2.4" />
        <circle cx={50 + ex - 1.5} cy={eyeY + 2} r="2.4" />
      </g>
    )
  } else {
    const r = family === 'surprise' || family === 'fear' ? 2.6 + t * 1.2 : 2.6
    eyes = (
      <g fill={INK}>
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
    brows = (
      <path
        d={`M${50 - ex - 5} ${by - d / 2}L${50 - ex + 4} ${by + d / 2}M${50 + ex + 5} ${by - d / 2}L${50 + ex - 4} ${by + d / 2}`}
        {...stroke}
      />
    )
  } else if (family === 'sadness' || family === 'fear') {
    const d = 1 + t * 3
    brows = (
      <path
        d={`M${50 - ex - 4} ${by + d / 2}L${50 - ex + 4} ${by - d / 2}M${50 + ex + 4} ${by + d / 2}L${50 + ex - 4} ${by - d / 2}`}
        {...stroke}
        strokeWidth={1.8}
      />
    )
  } else if (family === 'disgust') {
    brows = <path d={`M${50 - ex - 4} ${by + 1}l8 1M${50 + ex - 4} ${by - 1 - t * 3}q4-2 8 0`} {...stroke} strokeWidth={1.8} />
  }

  // 입
  let mouth: ReactNode
  if (family === 'surprise') {
    mouth = <ellipse cx="50" cy={mouthY} rx={2.5 + t * 2} ry={2.5 + t * 3.5} fill={INK} />
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

  // 볼터치(색연필로 쓱쓱)·눈물·땀 등 강도 연출
  const blushOpacity =
    family === 'shame' ? 0.35 + t * 0.55 : family === 'joy' || family === 'love' ? 0.25 + t * 0.4 : family === 'anger' ? t * 0.6 : 0
  const blushColor = family === 'anger' ? 'var(--color-anger-deep)' : 'var(--color-love-deep)'

  return (
    <g>
      {blushOpacity > 0 && (
        <g stroke={blushColor} strokeWidth="1.1" strokeLinecap="round" opacity={blushOpacity}>
          {[-1, 1].map((side) => {
            const cx = 50 + side * (ex + 6)
            const cy = eyeY + 7
            return <path key={side} d={`M${cx - 4} ${cy + 1.5}l2.5 -3M${cx - 1.5} ${cy + 2}l2.5 -3.5M${cx + 1} ${cy + 2}l2.5 -3`} />
          })}
        </g>
      )}
      {brows}
      {eyes}
      {mouth}
      {family === 'sadness' && t >= 0.5 && (
        <path d={`M${50 + ex + 1} ${eyeY + 4}q-2.5 4 0 6q2.5-2 0-6Z`} fill="var(--color-sadness-soft)" stroke={INK} strokeWidth="0.9" />
      )}
      {family === 'fear' && t >= 0.5 && (
        <path d={`M${50 + ex + 9} ${eyeY - 8}q-2.5 4 0 6q2.5-2 0-6Z`} fill="white" stroke={INK} strokeWidth="0.9" />
      )}
      {family === 'anger' && t >= 0.75 && (
        <path d={`M${50 + ex + 10} ${y - 22}l3 -3M${50 + ex + 14} ${y - 18}l4 -1`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      )}
    </g>
  )
}
