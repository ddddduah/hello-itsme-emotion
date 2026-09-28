// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { toDateKey } from '../lib/date'
import { baseData, installDomShims, renderApp, seedStorage, type Rendered } from '../test/renderApp'

installDomShims()

let app: Rendered
afterEach(() => {
  app.unmount()
  localStorage.clear()
})

describe('감정 리포트', () => {
  it('기록이 없으면 판단 없이 빈 상태 안내', async () => {
    seedStorage(baseData())
    app = await renderApp('/report')
    expect(app.text()).toContain('이번 주에는 아직 기록이 없어요')
    expect(app.text()).toContain('최근 30일 동안 남긴 기록이 없어요')
  })

  it('가장 오래 머문 감정 문구, 가족 비율, 조용했던 가족', async () => {
    const d = baseData()
    const now = new Date().toISOString()
    d.entries.push(
      { id: 'a', createdAt: now, date: toDateKey(), text: '', emotions: [{ emotionId: 'angry', intensity: 4 }] },
      { id: 'b', createdAt: now, date: toDateKey(), text: '', emotions: [{ emotionId: 'angry', intensity: 3 }, { emotionId: 'sad', intensity: 2 }] },
    )
    seedStorage(d)
    app = await renderApp('/report')

    expect(app.text()).toContain('이번 주 당신의 집에는 ‘화’가 가장 오래 머물렀어요')
    expect(app.text()).toContain('67%') // 분노 2 / 3
    expect(app.text()).toContain('‘기쁨’ 가족의 감정은 한 번도 기록되지 않았어요')
    // 진단·판단하는 표현 금지
    expect(app.text()).not.toMatch(/당신은 .*(합니다|입니다)|문제가 있|걱정스러운 수준/)
  })
})
