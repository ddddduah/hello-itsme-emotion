/*
 * 연필 스케치 효과에 쓰는 SVG 정의 (앱에 한 번만 렌더링)
 *
 *  #pencil       떨리는 손그림 선 (카드 테두리, 캐릭터 윤곽)
 *  #pencil-2     겹쳐 그은 두 번째 선용 (다른 떨림)
 *  #crayon       색연필로 칠한 면: 종이 결이 비치는 거친 질감
 *  #hatch-<가족> 가족 색연필 빗금
 *  #hatch-ink    흑연 빗금 (실루엣·그림자)
 */
import { FAMILIES } from '../data/families'

export default function SketchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="pencil-2" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="11" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="G" yChannelSelector="R" />
        </filter>
        <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%">
          {/* 종이 결 구멍 */}
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.55"
            result="mask"
          />
          <feComposite in="SourceGraphic" in2="mask" operator="in" result="grainy" />
          {/* 가장자리 살짝 삐져나가게 */}
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="warp" />
          <feDisplacementMap in="grainy" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {FAMILIES.map((f) => (
          <pattern
            key={f.id}
            id={`hatch-${f.id}`}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-50)"
          >
            <line x1="0" y1="0" x2="0" y2="5" stroke={f.color.deep} strokeWidth="1.1" opacity="0.45" />
          </pattern>
        ))}
        <pattern id="hatch-ink" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--color-ink)" strokeWidth="0.9" opacity="0.35" />
        </pattern>
        <pattern id="hatch-ink-cross" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-ink)" strokeWidth="0.8" opacity="0.25" />
        </pattern>
      </defs>
    </svg>
  )
}
