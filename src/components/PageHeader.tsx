import type { ReactNode } from 'react'

export default function PageHeader({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="pt-3 pb-5">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {sub && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  )
}
