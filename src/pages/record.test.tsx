// @vitest-environment jsdom
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { baseData, installDomShims, readStorage, renderApp, seedStorage, wait, type Rendered } from '../test/renderApp'

installDomShims()

let app: Rendered
afterEach(() => {
  app?.unmount()
  localStorage.clear()
})

async function typeText(value: string) {
  const ta = document.querySelector<HTMLTextAreaElement>('#entry-text')!
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(ta, value)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('감정 찾기 도우미', () => {
  it('몸 → 에너지 → 상황 → 후보 선택 시 기록에 추가되고 잠긴 감정은 해금', async () => {
    seedStorage(baseData())
    app = await renderApp('/record')

    await app.click(/이 감정이 뭔지 모르겠어요/)
    expect(app.text()).toContain('지금 몸에서는 어떤 느낌이 드나요?')

    await app.click('가슴이 답답해요')
    await app.click('다음')
    await app.click(/가라앉아요/)
    expect(app.text()).toContain('어떤 일이 있었나요?')
    await app.click('기대가 어긋났어요')
    await app.click('감정 찾기')

    expect(app.text()).toContain('혹시 이런 감정이었을까요?')
    expect(app.text()).toContain('서운하다')
    expect(app.text()).toContain('새 감정') // 서운하다는 아직 잠김

    await app.click(/서운하다/)
    await app.click(/이 감정으로 기록할게요/)
    await wait(50)

    // 해금 + 축하
    expect(readStorage().unlocks.some((u) => u.emotionId === 'hurt' && u.source === 'finder')).toBe(true)
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('마음속 감정을 찾아냈어요')
    // 기록 폼에 선택됨 (강도 슬라이더가 생김)
    expect(document.querySelector('#intensity-hurt')).not.toBeNull()
  })

  it('상황을 2개까지만 고를 수 있음', async () => {
    seedStorage(baseData())
    app = await renderApp('/record')
    await app.click(/이 감정이 뭔지 모르겠어요/)
    await app.click('잘 모르겠어요') // 몸
    await app.click('잘 모르겠어요') // 에너지
    await app.click('무언가를 잃었어요')
    await app.click('기대가 어긋났어요')
    expect(app.button('혼자라고 느꼈어요').disabled).toBe(true)
  })
})

describe('숨은 감정 제안', () => {
  it('저장 후 "혹시 이런 감정도…" → 맞아요 → 해금 + 기록에 추가', async () => {
    seedStorage(baseData())
    app = await renderApp('/record')

    await typeText('친구가 내 생일 약속을 잊어버렸다')
    await app.click(/슬프다/)
    await app.click('기록 남기기')
    await wait(50)

    expect(app.text()).toContain('혹시 이런 감정도 섞여 있었을까요?')
    const suggested = ['서운하다', '실망스럽다', '섭섭하다'].find((n) => app.text().includes(n))
    expect(suggested).toBeDefined()

    await app.click('맞아요')
    await wait(50)

    const data = readStorage()
    const entry = data.entries[0]
    expect(entry.emotions.length).toBe(2)
    expect(entry.emotions[1].intensity).toBe(2)
    expect(data.unlocks.some((u) => u.source === 'hidden')).toBe(true)
  })

  it('아니에요를 누르면 해금하지 않음', async () => {
    seedStorage(baseData())
    app = await renderApp('/record')
    await typeText('친구가 내 생일 약속을 잊어버렸다')
    await app.click(/슬프다/)
    await app.click('기록 남기기')
    await wait(50)

    const before = readStorage().unlocks.length
    while (app.text().includes('혹시 이런 감정도')) await app.click('아니에요')
    expect(readStorage().unlocks.length).toBe(before)
    expect(app.text()).toContain('내 마음은 내가 가장 잘 알아요')
  })
})
