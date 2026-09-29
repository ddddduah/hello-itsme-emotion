import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import EmotionCharacter from '../components/EmotionCharacter'
import PageHeader from '../components/PageHeader'
import { DAILY_UNLOCK_SEQUENCE, EMOTIONS } from '../data/emotions'
import { FAMILIES, type Family } from '../data/families'
import { toDateKey } from '../lib/date'
import { computeEmotionStats, type EmotionStats } from '../lib/stats'
import { useAppData } from '../store/AppDataContext'
import type { Emotion, FamilyId } from '../types'

type Filter = 'all' | FamilyId

export default function DexPage() {
  const { data, unlockedIds } = useAppData()
  // 필터를 URL 에 두어 상세 페이지에서 뒤로 와도 유지
  const [params, setParams] = useSearchParams()
  const famParam = params.get('family')
  const filter: Filter = FAMILIES.some((f) => f.id === famParam) ? (famParam as FamilyId) : 'all'
  const setFilter = (f: Filter) => setParams(f === 'all' ? {} : { family: f }, { replace: true })
  const stats = useMemo(() => computeEmotionStats(data, toDateKey()), [data])

  const total = EMOTIONS.length
  const found = EMOTIONS.filter((e) => unlockedIds.has(e.id)).length
  // 다음 일일 해금 차례 (내일 찾아올 감정)
  const nextId = DAILY_UNLOCK_SEQUENCE.find((e) => !unlockedIds.has(e.id))?.id

  const families = filter === 'all' ? FAMILIES : FAMILIES.filter((f) => f.id === filter)

  return (
    <>
      <PageHeader title="감정 도감" sub="만난 감정의 뜻과, 헷갈리는 감정과의 차이를 살펴봐요." />

      {/* 진행률 */}
      <div className="mb-5 rounded-3xl bg-paper px-5 py-4 sketch">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">지금까지 만난 감정</span>
          <span className="text-sm">
            <strong className="text-xl">{found}</strong>
            <span className="text-ink-faint"> / {total}</span>
          </span>
        </div>
        <div
          className="sketch mt-2.5 h-3 overflow-hidden rounded-full bg-paper"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={found}
          aria-label="도감 진행률"
        >
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(found / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 가족 필터 */}
      <div className="-mx-5 mb-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="tablist" aria-label="감정 가족">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          전체
        </FilterChip>
        {FAMILIES.map((f) => (
          <FilterChip key={f.id} active={filter === f.id} family={f} onClick={() => setFilter(f.id)}>
            {f.name}
          </FilterChip>
        ))}
      </div>

      <div className="space-y-7">
        {families.map((family) => (
          <FamilySection
            key={family.id}
            family={family}
            unlockedIds={unlockedIds}
            stats={stats}
            nextId={nextId}
          />
        ))}
      </div>
    </>
  )
}

function FilterChip({
  active,
  family,
  onClick,
  children,
}: {
  active: boolean
  family?: Family
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors"
      style={{
        background: active ? (family?.color.soft ?? 'var(--color-accent-soft)') : 'var(--color-paper)',
        borderColor: active ? (family?.color.deep ?? 'var(--color-accent)') : 'var(--color-line)',
        color: active ? (family?.color.deep ?? 'var(--color-accent)') : 'var(--color-ink-soft)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

function FamilySection({
  family,
  unlockedIds,
  stats,
  nextId,
}: {
  family: Family
  unlockedIds: Set<string>
  stats: Map<string, EmotionStats>
  nextId: string | undefined
}) {
  const members = EMOTIONS.filter((e) => e.family === family.id)
  const found = members.filter((e) => unlockedIds.has(e.id)).length

  return (
    <section aria-labelledby={`fam-${family.id}`}>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 id={`fam-${family.id}`} className="font-semibold" style={{ color: family.color.deep }}>
          {family.name} 가족
          <span className="ml-1.5 text-xs font-normal text-ink-faint">{family.motif}</span>
        </h2>
        <span className="text-xs text-ink-faint">
          {found} / {members.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {members.map((e, i) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
          >
            <DexCard
              emotion={e}
              family={family}
              unlocked={unlockedIds.has(e.id)}
              count={stats.get(e.id)?.total ?? 0}
              isNext={e.id === nextId}
            />
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

function DexCard({
  emotion,
  family,
  unlocked,
  count,
  isNext,
}: {
  emotion: Emotion
  family: Family
  unlocked: boolean
  count: number
  isNext: boolean
}) {
  return (
    <Link
      to={`/dex/${emotion.id}`}
      className="relative flex h-full flex-col items-center rounded-3xl border px-2 pt-3 pb-2.5 text-center transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
      style={{
        background: unlocked ? family.color.soft : 'var(--color-paper)',
        borderColor: unlocked ? 'transparent' : 'var(--color-line)',
      }}
      aria-label={unlocked ? emotion.name : `아직 만나지 못한 ${family.name} 가족 감정`}
    >
      {isNext && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white">
          다음 차례
        </span>
      )}
      <EmotionCharacter
        family={emotion.family}
        intensity={3}
        silhouette={!unlocked}
        className="h-14 w-14 sm:h-16 sm:w-16"
        title={unlocked ? emotion.name : '???'}
      />
      <span
        className="mt-1.5 text-sm font-semibold break-keep"
        style={{ color: unlocked ? family.color.deep : 'var(--color-ink-faint)' }}
      >
        {unlocked ? emotion.name : '???'}
      </span>
      <span className="mt-0.5 text-[11px] text-ink-faint">{unlocked ? (count ? `${count}번 기록` : '아직 기록 전') : '잠겨 있어요'}</span>
    </Link>
  )
}
