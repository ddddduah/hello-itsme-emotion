/*
 * jsdom 화면 테스트 공용 도우미 (파일 맨 위에 `// @vitest-environment jsdom` 필요)
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MotionGlobalConfig } from 'framer-motion'
import App from '../App'
import { toDateKey } from '../lib/date'
import { createInitialData } from '../lib/storage'
import type { AppData } from '../types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export function installDomShims() {
  // 테스트에서는 애니메이션을 건너뛰어 화면 전환이 즉시 끝나도록
  MotionGlobalConfig.skipAnimations = true
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
}

/** 일일 해금 축하가 뜨지 않는 기본 데이터 */
export function baseData(): AppData {
  const d = createInitialData()
  d.lastDailyUnlock = toDateKey()
  return d
}

export function seedStorage(data: AppData) {
  localStorage.setItem('maeumjip:v1', JSON.stringify(data))
}

export function readStorage(): AppData {
  return JSON.parse(localStorage.getItem('maeumjip:v1')!)
}

export const wait = (ms = 20) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })

export interface Rendered {
  container: HTMLDivElement
  text: () => string
  button: (label: string | RegExp) => HTMLButtonElement
  click: (label: string | RegExp) => Promise<void>
  unmount: () => void
}

export async function renderApp(path: string): Promise<Rendered> {
  window.history.pushState({}, '', path)
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root!: Root
  await act(async () => {
    root = createRoot(container)
    root.render(<App />)
  })
  await wait()

  const button = (label: string | RegExp) => {
    const all = [...document.querySelectorAll('button')] as HTMLButtonElement[]
    const found = all.find((b) =>
      typeof label === 'string' ? b.textContent?.trim() === label : label.test(b.textContent ?? ''),
    )
    if (!found) throw new Error(`버튼을 찾을 수 없어요: ${label}`)
    return found
  }

  return {
    container,
    text: () => document.body.textContent ?? '',
    button,
    click: async (label) => {
      await act(async () => button(label).click())
      await wait()
    },
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}
