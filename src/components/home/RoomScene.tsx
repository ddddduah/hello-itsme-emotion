/*
 * 마음집 방 안 풍경 (연필 스케치) — viewBox 0 0 400 440
 *
 *  지붕 ─ 굴뚝 연기 ─ 다락 둥근 창
 *  벽: 문 · 책장 · 큰 창(커튼, 화분) · 액자 · 스탠드
 *  바닥: 소파 · 러그 · 바구니 침대 · 빈백 · 방석
 *
 * 캐릭터는 이 그림 위에 HTML 로 얹습니다 (CozyHouse.tsx). 좌표는 placement.ts 의 ROOM 참고.
 */
import { motion, useReducedMotion } from 'framer-motion'
import type { SkyPhase } from '../../lib/kst'
import { VIEW } from './placement'
import WindowSky from './WindowSky'

const INK = 'var(--color-ink)'
const line = { stroke: INK, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export default function RoomScene({ phase, progress }: { phase: SkyPhase; progress: number }) {
  const reduce = useReducedMotion()
  const night = phase === 'night'
  const dim = phase === 'dusk' || phase === 'dawn'

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="lamp-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <pattern id="wallpaper" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M9 4v3M9 11v3" stroke="#c9b596" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        </pattern>
        <clipPath id="room-clip">
          <rect x="36" y="130" width="328" height="292" />
        </clipPath>
      </defs>

      {/* ── 굴뚝과 연기 ── */}
      <g filter="url(#pencil)">
        <rect x="296" y="46" width="28" height="64" fill="#d9a88a" {...line} />
        <path d="M292 46h36" {...line} strokeWidth="2.2" />
      </g>
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="310"
            cy="36"
            r="7"
            fill="none"
            stroke={INK}
            strokeWidth="1"
            opacity="0.5"
            filter="url(#pencil)"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.55, 0], y: -26, x: [0, 5, 10], scale: 1.5 }}
            transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
          />
        ))}

      {/* ── 지붕 ── */}
      <g filter="url(#crayon)">
        <path d="M14 132 200 24l186 108Z" fill="#e3a489" />
      </g>
      <path d="M14 132 200 24l186 108Z" fill="url(#hatch-anger)" opacity="0.6" />
      <g filter="url(#pencil)">
        <path d="M14 132 200 24l186 108Z" fill="none" {...line} strokeWidth="2.2" />
        {/* 기와 줄 */}
        <path d="M60 110 200 30l140 80M104 118 200 62l96 56" fill="none" {...line} strokeWidth="1" opacity="0.45" />
      </g>
      {/* 다락 둥근 창 */}
      <WindowSky x={183} y={70} w={34} h={34} phase={phase} progress={progress} small round />
      <g filter="url(#pencil)">
        <circle cx="200" cy="87" r="17" fill="none" {...line} strokeWidth="2" />
        <path d="M200 70v34M183 87h34" {...line} strokeWidth="1.4" />
      </g>

      {/* ── 방 ── */}
      <g clipPath="url(#room-clip)">
        {/* 벽 */}
        <g filter="url(#crayon)">
          <rect x="36" y="130" width="328" height="166" fill="#f2e3cc" />
        </g>
        <rect x="36" y="130" width="328" height="166" fill="url(#wallpaper)" />
        {/* 바닥 */}
        <g filter="url(#crayon)">
          <rect x="36" y="294" width="328" height="130" fill="#e2c49c" />
        </g>
        <rect x="36" y="294" width="328" height="130" fill="url(#hatch-joy)" opacity="0.5" />
        <g filter="url(#pencil)" {...line} strokeWidth="1" opacity="0.5" fill="none">
          <path d="M36 318h328M36 346h328M36 378h328M36 410h328" />
          <path d="M110 294v24M250 294v24M70 318v28M190 318v28M320 318v28M140 346v32M280 346v32M90 378v32M230 378v32M340 378v32" />
        </g>

        {/* 햇살 (낮) */}
        {phase === 'day' && (
          <path d="M156 252 256 252 300 420 110 420Z" fill="#fff2b8" opacity="0.28" />
        )}

        {/* 문 (새 이웃이 들어오는 곳) */}
        <g filter="url(#crayon)">
          <path d="M46 294V214q0-20 22-20t22 20v80Z" fill="#c9936b" />
        </g>
        <g filter="url(#pencil)" fill="none" {...line}>
          <path d="M46 294V214q0-20 22-20t22 20v80" />
          <path d="M53 288v-68q0-13 15-13t15 13v68" strokeWidth="1" opacity="0.5" />
          <circle cx="81" cy="252" r="2.2" fill={INK} />
        </g>

        {/* 책장 */}
        <g filter="url(#crayon)">
          <rect x="98" y="176" width="42" height="118" fill="#b98a66" />
        </g>
        <g filter="url(#pencil)">
          {[
            [102, 182, '#8fb3c4'],
            [109, 186, '#e0876d'],
            [116, 180, '#9cc5aa'],
            [124, 184, '#eccb68'],
            [102, 222, '#eda6b5'],
            [110, 218, '#9a9cc2'],
            [119, 224, '#f4b27f'],
            [102, 262, '#aeb277'],
            [110, 258, '#c29db3'],
          ].map(([bx, by, c], i) => (
            <rect key={i} x={bx as number} y={by as number} width="7" height={(i % 3 === 1 ? 30 : 32) - ((by as number) % 6)} fill={c as string} {...line} strokeWidth="0.9" />
          ))}
          <path d="M98 176h42v118H98ZM98 214h42M98 254h42" fill="none" {...line} />
        </g>

        {/* 큰 창 + 커튼 */}
        <WindowSky x={158} y={156} w={96} h={90} phase={phase} progress={progress} />
        <g filter="url(#pencil)" fill="none" {...line}>
          <rect x="152" y="150" width="108" height="102" strokeWidth="2.4" />
          <rect x="158" y="156" width="96" height="90" strokeWidth="1.1" />
          <path d="M206 156v90M158 201h96" strokeWidth="2" />
          <path d="M146 256h120" strokeWidth="3" />
        </g>
        {/* 커튼 */}
        <g filter="url(#crayon)">
          <path d="M142 146q10 50 2 116l16-4q-8-40 0-112Z" fill="#eda6b5" />
          <path d="M270 146q-10 50-2 116l-16-4q8-40 0-112Z" fill="#eda6b5" />
        </g>
        <g filter="url(#pencil)" fill="none" {...line} strokeWidth="1.3">
          <path d="M142 146q10 50 2 116l16-4q-8-40 0-112Z" />
          <path d="M270 146q-10 50-2 116l-16-4q8-40 0-112Z" />
          <path d="M138 144h136" strokeWidth="2.2" />
        </g>
        {/* 창가 화분 */}
        <g filter="url(#pencil)">
          <path d="M170 238h16l-2 14h-12Z" fill="#d9a88a" {...line} strokeWidth="1.2" />
          <path d="M178 238q-8-10-4-18M178 238q2-12 10-14M178 238q-2-8 2-16" fill="none" stroke="#4d7d5d" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* 액자 */}
        <g filter="url(#pencil)">
          <rect x="300" y="168" width="44" height="34" fill="#fdfaf2" {...line} strokeWidth="1.4" />
          <path d="M306 196l10-12 8 8 6-6 8 10" fill="none" {...line} strokeWidth="1" />
          <circle cx="334" cy="178" r="3" fill="#f8d56b" {...line} strokeWidth="0.8" />
        </g>

        {/* 스탠드 */}
        <g filter="url(#pencil)">
          <path d="M276 226v70M266 296h20" fill="none" {...line} />
          <path d="M262 226h28l-6-22h-16Z" fill={night ? '#ffe39a' : '#f5e6c8'} {...line} strokeWidth="1.4" />
        </g>

        {/* 소파 */}
        <g filter="url(#crayon)">
          <path d="M294 246q0-8 8-8h60v60h-68Z" fill="#9cc5aa" />
          <rect x="288" y="276" width="80" height="26" rx="6" fill="#8bb89b" />
        </g>
        <path d="M294 246q0-8 8-8h60v60h-68Z" fill="url(#hatch-calm)" />
        <g filter="url(#pencil)" fill="none" {...line}>
          <path d="M294 246q0-8 8-8h60v60h-68Z" />
          <rect x="288" y="276" width="80" height="26" rx="6" />
          <path d="M328 240v36" strokeWidth="1" opacity="0.6" />
          <path d="M292 302v8M364 302v8" strokeWidth="2" />
        </g>

        {/* 러그 */}
        <g filter="url(#crayon)">
          <ellipse cx="200" cy="372" rx="120" ry="30" fill="#f6d2b8" />
        </g>
        <ellipse cx="200" cy="372" rx="120" ry="30" fill="url(#hatch-love)" opacity="0.7" />
        <g filter="url(#pencil)" fill="none" {...line} strokeWidth="1.3">
          <ellipse cx="200" cy="372" rx="120" ry="30" />
          <ellipse cx="200" cy="372" rx="96" ry="21" strokeWidth="0.9" opacity="0.6" strokeDasharray="3 4" />
        </g>

        {/* 방석 */}
        <g filter="url(#pencil)">
          <ellipse cx="120" cy="316" rx="20" ry="6" fill="#eccb68" {...line} strokeWidth="1.2" />
        </g>

        {/* 바구니 침대 */}
        <g filter="url(#crayon)">
          <path d="M34 396q30-12 60 0l-4 22H38Z" fill="#c99a6b" />
        </g>
        <path d="M34 396q30-12 60 0l-4 22H38Z" fill="url(#hatch-joy)" />
        <g filter="url(#pencil)" fill="none" {...line} strokeWidth="1.4">
          <path d="M34 396q30-12 60 0l-4 22H38Z" />
          <path d="M40 404h48M42 411h44" strokeWidth="0.9" opacity="0.6" />
          <path d="M42 396q22-6 44 0" stroke="#eda6b5" strokeWidth="3" opacity="0.9" />
        </g>

        {/* 빈백 */}
        <g filter="url(#crayon)">
          <path d="M318 418q-4-26 30-28 34 2 30 28Z" fill="#9a9cc2" />
        </g>
        <path d="M318 418q-4-26 30-28 34 2 30 28Z" fill="url(#hatch-fear)" />
        <g filter="url(#pencil)" fill="none" {...line} strokeWidth="1.4">
          <path d="M318 418q-4-26 30-28 34 2 30 28Z" />
        </g>

        {/* 저녁·새벽엔 살짝, 밤엔 조금 더 어둡게 + 스탠드 불빛 */}
        {(night || dim) && <rect x="36" y="130" width="328" height="292" fill="#1b2140" opacity={night ? 0.2 : 0.08} />}
        {night && (
          <motion.circle
            cx="276"
            cy="232"
            r="84"
            fill="url(#lamp-glow)"
            animate={reduce ? undefined : { opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        )}
      </g>

      {/* ── 집 외곽선 ── */}
      <g filter="url(#pencil)" fill="none" {...line} strokeWidth="2.4">
        <path d="M36 130v292h328V130" />
        <path d="M36 294h328" strokeWidth="1.4" opacity="0.7" />
      </g>
      {/* 마당 풀 */}
      <g filter="url(#pencil)" stroke="#4d7d5d" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M8 428h384" stroke={INK} opacity="0.5" />
        {Array.from({ length: 24 }, (_, i) => {
          const gx = 14 + i * 16 + (i % 3) * 3
          return <path key={i} d={`M${gx} 428l-2-6M${gx + 3} 428l1-7M${gx + 6} 428l3-5`} />
        })}
      </g>
    </svg>
  )
}
