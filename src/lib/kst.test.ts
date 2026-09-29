import { describe, expect, it } from 'vitest'
import { celestialProgress, formatKst, kstTime, skyPhase } from './kst'

describe('한국 시간', () => {
  it('기기 시간대와 무관하게 UTC+9 로 계산', () => {
    // UTC 2026-09-28 15:30 = KST 2026-09-29 00:30
    expect(kstTime(new Date(Date.UTC(2026, 8, 28, 15, 30)))).toEqual({ hour: 0, minute: 30, minutes: 30 })
    // UTC 03:05 = KST 12:05
    expect(kstTime(new Date(Date.UTC(2026, 8, 29, 3, 5)))).toMatchObject({ hour: 12, minute: 5 })
  })

  it('하늘 구간', () => {
    const at = (h: number, m = 0) => skyPhase(h * 60 + m)
    expect(at(0)).toBe('night')
    expect(at(4, 59)).toBe('night')
    expect(at(5, 30)).toBe('dawn')
    expect(at(12)).toBe('day')
    expect(at(18)).toBe('dusk')
    expect(at(19, 10)).toBe('night')
    expect(at(23, 59)).toBe('night')
  })

  it('해·달 위치는 0~1 사이, 한낮과 한밤에 가운데쯤', () => {
    for (let m = 0; m < 1440; m += 17) {
      const p = celestialProgress(m)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThan(1)
    }
    expect(celestialProgress(12 * 60)).toBeGreaterThan(0.4)
    expect(celestialProgress(12 * 60)).toBeLessThan(0.6)
    expect(celestialProgress(0)).toBeGreaterThan(0.4)
    expect(celestialProgress(0)).toBeLessThan(0.6)
  })

  it('표시 형식', () => {
    expect(formatKst({ hour: 0, minute: 5, minutes: 5 })).toBe('오전 12:05')
    expect(formatKst({ hour: 15, minute: 7, minutes: 907 })).toBe('오후 3:07')
  })
})
