import type { Intensity } from '../types'

/** 강도 1~5 표시 문구 */
export const INTENSITY_LABELS: Record<Intensity, string> = {
  1: '살짝',
  2: '조금',
  3: '꽤',
  4: '많이',
  5: '아주 크게',
}
