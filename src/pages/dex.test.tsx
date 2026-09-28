// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { toDateKey } from '../lib/date'
import { createInitialData } from '../lib/storage'
import type { AppData } from '../types'

// React 18+ act 환경 표시
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
window.matchMedia ??= ((q: string) => ({
  matches: false,
  media: q,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  onchange: null,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia
window.scrollTo = () => {}

const today = toDateKey()

function seed(): AppData {
  const d = createInitialData()
  d.lastDailyUnlock = today // 일일 해금 축하가 뜨지 않도록
  d.unlocks.push({ emotionId: 'hurt', unlockedAt: new Date().toISOString(), source: 'keyword' })
  d.moveInSeen.push('hurt')
  d.entries.push({
    id: 'e1',
    createdAt: new Date().toISOString(),
    date: today,
    text: '친구가 약속을 잊어서 서운했다',
    emotions: [{ emotionId: 'hurt', intensity: 4 }],
  })
  return d
}

let root: Root
let container: HTMLDivElement

async function renderAt(path: string) {
  window.history.pushState({}, '', path)
  container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => {
    root = createRoot(container)
    root.render(<App />)
  })
  // 저장소 비동기 로드 대기
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20))
  })
}

const text = () => container.textContent ?? ''

beforeEach(() => {
  localStorage.setItem('maeumjip:v1', JSON.stringify(seed()))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  localStorage.clear()
})

describe('감정 도감', () => {
  it('진행률, 잠긴 카드(???), 다음 차례 표시', async () => {
    await renderAt('/dex')
    expect(text()).toContain('5 / 61')
    expect(text()).toContain('서운하다')
    expect(text()).toContain('1번 기록')
    expect(container.querySelectorAll('a[aria-label^="아직 만나지 못한"]').length).toBe(56)
    expect(text()).toContain('다음 차례')
  })

  it('가족 필터를 누르면 그 가족만, URL 에도 남음', async () => {
    await renderAt('/dex')
    const tab = [...container.querySelectorAll('[role=tab]')].find((b) => b.textContent === '슬픔')!
    await act(async () => (tab as HTMLButtonElement).click())
    expect(container.querySelectorAll('section h2').length).toBe(1)
    expect(window.location.search).toBe('?family=sadness')
  })

  it('해금된 감정 상세: 뜻, 예시, 헷갈리는 감정 차이, 기록한 날', async () => {
    await renderAt('/dex/hurt')
    expect(container.querySelector('h1')?.textContent).toBe('서운하다')
    for (const s of ['어떤 감정인가요', '이런 순간에 느껴요', '헷갈리는 감정과의 차이', '내가 이 감정을 기록한 날']) {
      expect(text()).toContain(s)
    }
    expect(text()).toContain('섭섭하다') // 비교 대상
    expect(text()).toContain('아직 만나지 않은 감정이에요') // 섭섭하다는 잠김
    expect(text()).toContain('친구가 약속을 잊어서 서운했다')
    expect(text()).toContain('1일 · 1번')
  })

  it('잠긴 감정 상세는 이름을 숨기고 힌트만', async () => {
    await renderAt('/dex/let-down')
    expect(container.querySelector('h1')?.textContent).toBe('???')
    expect(text()).toContain('힌트')
    expect(text()).not.toContain('기대했던 만큼의 대접') // 정의는 숨김
  })
})
