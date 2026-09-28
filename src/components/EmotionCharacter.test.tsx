import { readFileSync, writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FAMILIES } from '../data/families'
import type { Intensity } from '../types'
import EmotionCharacter from './EmotionCharacter'

describe('EmotionCharacter', () => {
  it('모든 가족 × 강도 × 상태를 렌더링', () => {
    const rows: string[] = []
    for (const f of FAMILIES) {
      const cells = ([1, 2, 3, 4, 5] as Intensity[]).map((i) =>
        renderToStaticMarkup(<EmotionCharacter family={f.id} intensity={i} className="c" />),
      )
      cells.push(renderToStaticMarkup(<EmotionCharacter family={f.id} mood="sleepy" className="c" />))
      cells.push(renderToStaticMarkup(<EmotionCharacter family={f.id} silhouette className="c" />))
      for (const c of cells) expect(c).not.toMatch(/NaN|undefined/)
      rows.push(`<div class="row"><b>${f.name}</b>${cells.join('')}</div>`)
    }

    // CHARACTER_GALLERY=경로 를 주면 눈으로 확인할 수 있는 갤러리 HTML 출력
    const out = process.env.CHARACTER_GALLERY
    if (out) {
      const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
      const tokens = [...css.matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]+);/g)].map((m) => `${m[1]}:${m[2]};`).join('')
      writeFileSync(
        out,
        `<meta charset="utf-8"><style>:root{${tokens}}body{background:#fbf6ef;font-family:sans-serif}` +
          `.row{display:flex;align-items:center;gap:8px}.row b{width:80px}.c{width:90px;height:90px}</style>${rows.join('')}`,
      )
    }
  })
})
