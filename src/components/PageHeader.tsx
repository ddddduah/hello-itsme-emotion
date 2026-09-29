import type { ReactNode } from 'react'

export default function PageHeader({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="pt-3 pb-5">
      <h1 className="text-3xl font-bold">
        <span className="marker">{title}</span>
      </h1>
      {sub && <p className="mt-1.5 text-base leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  )
}
