// @vitest-environment jsdom
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { toDateKey } from '../lib/date'
import { baseData, installDomShims, renderApp, seedStorage, type Rendered } from '../test/renderApp'

installDomShims()

let app: Rendered

beforeEach(() => {
  const d = baseData()
  d.unlocks.push({ emotionId: 'hurt', unlockedAt: new Date().toISOString(), source: 'keyword' })
  d.moveInSeen.push('hurt')
  d.entries.push({
    id: 'e1',
    createdAt: new Date().toISOString(),
    date: toDateKey(),
    text: '친구가 약속을 잊어서 서운했다',
    emotions: [{ emotionId: 'hurt', intensity: 4 }],
  })
  seedStorage(d)
})
afterEach(() => {
  app.unmount()
  localStorage.clear()
})

describe('감정 도감', () => {
  it('진행률, 잠긴 카드(???), 다음 차례 표시', async () => {
    app = await renderApp('/dex')
    expect(app.text()).toContain('5 / 61')
    expect(app.text()).toContain('서운하다')
    expect(app.text()).toContain('1번 기록')
    expect(app.container.querySelectorAll('a[aria-label^="아직 만나지 못한"]').length).toBe(56)
    expect(app.text()).toContain('다음 차례')
  })

  it('가족 필터를 누르면 그 가족만, URL 에도 남음', async () => {
    app = await renderApp('/dex')
    const tab = [...app.container.querySelectorAll('[role=tab]')].find((b) => b.textContent === '슬픔')!
    await act(async () => (tab as HTMLButtonElement).click())
    expect(app.container.querySelectorAll('section h2').length).toBe(1)
    expect(window.location.search).toBe('?family=sadness')
  })

  it('해금된 감정 상세: 뜻, 예시, 헷갈리는 감정 차이, 기록한 날', async () => {
    app = await renderApp('/dex/hurt')
    expect(app.container.querySelector('h1')?.textContent).toBe('서운하다')
    for (const s of ['어떤 감정인가요', '이런 순간에 느껴요', '헷갈리는 감정과의 차이', '내가 이 감정을 기록한 날']) {
      expect(app.text()).toContain(s)
    }
    expect(app.text()).toContain('섭섭하다') // 비교 대상
    expect(app.text()).toContain('아직 만나지 않은 감정이에요') // 섭섭하다는 잠김
    expect(app.text()).toContain('친구가 약속을 잊어서 서운했다')
    expect(app.text()).toContain('1일 · 1번')
  })

  it('잠긴 감정 상세는 이름을 숨기고 힌트만', async () => {
    app = await renderApp('/dex/let-down')
    expect(app.container.querySelector('h1')?.textContent).toBe('???')
    expect(app.text()).toContain('힌트')
    expect(app.text()).not.toContain('기대했던 만큼의 대접') // 정의는 숨김
  })
})
