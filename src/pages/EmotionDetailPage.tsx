import { motion } from 'framer-motion'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import EmotionCharacter from '../components/EmotionCharacter'
import PageHeader from '../components/PageHeader'
import { EMOTION_BY_ID, EMOTIONS } from '../data/emotions'
import { FAMILIES, FAMILY_BY_ID, type Family } from '../data/families'
import { INTENSITY_LABELS } from '../data/intensity'
import { BODY_SIGNALS } from '../data/signals'
import { formatDateKo, toDateKey } from '../lib/date'
import { useAppData } from '../store/AppDataContext'
import type { Emotion, Entry, UnlockSource } from '../types'

/** 도감 순서 (가족 순 → 가족 안에서는 데이터 순) */
const DEX_ORDER = FAMILIES.flatMap((f) => EMOTIONS.filter((e) => e.family === f.id))

const BODY_LABEL = Object.fromEntries(BODY_SIGNALS.map((b) => [b.id, b.label]))

const SOURCE_LABEL: Record<UnlockSource, string> = {
  initial: '처음부터 함께했어요',
  daily: '오늘의 감정으로 찾아왔어요',
  keyword: '기록 속 단어에서 발견했어요',
  hidden: '숨은 감정으로 알아차렸어요',
  finder: '감정 찾기 도우미로 찾았어요',
}

/** 기록 목록 처음에 보여 줄 개수 */
const ENTRY_PAGE = 5

export default function EmotionDetailPage() {
  const { id = '' } = useParams()
  const { unlockedIds } = useAppData()
  const emotion = EMOTION_BY_ID[id]

  if (!emotion) {
    return (
      <>
        <PageHeader title="찾을 수 없는 감정이에요" />
        <Link to="/dex" className="text-accent underline">
          도감으로 돌아가기
        </Link>
      </>
    )
  }

  return (
    <motion.div key={emotion.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <BackLink family={emotion.family} />
      {unlockedIds.has(emotion.id) ? <UnlockedDetail emotion={emotion} /> : <LockedDetail emotion={emotion} />}
      <PrevNext emotion={emotion} />
    </motion.div>
  )
}

function BackLink({ family }: { family: Emotion['family'] }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(`/dex?family=${family}`))}
      className="mt-2 -ml-1 flex items-center gap-1 rounded-full px-2 py-1 text-sm text-ink-soft hover:bg-sand"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M15 5l-7 7 7 7" />
      </svg>
      도감
    </button>
  )
}

// ───────────────────────── 해금된 감정 ─────────────────────────

function UnlockedDetail({ emotion }: { emotion: Emotion }) {
  const { data, unlockedIds } = useAppData()
  const family = FAMILY_BY_ID[emotion.family]
  const unlock = data.unlocks.find((u) => u.emotionId === emotion.id)

  // 이 감정이 담긴 기록 (최신순)
  const entries = useMemo(
    () =>
      data.entries
        .filter((e) => e.emotions.some((x) => x.emotionId === emotion.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.entries, emotion.id],
  )
  const dayCount = new Set(entries.map((e) => e.date)).size

  return (
    <>
      {/* 머리 */}
      <header
        className="mt-3 flex items-center gap-4 rounded-blob px-5 py-5"
        style={{ background: family.color.soft }}
      >
        <motion.div
          className="h-24 w-24 shrink-0"
          initial={{ scale: 0.8, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <EmotionCharacter family={emotion.family} intensity={3} className="h-full w-full" title={emotion.name} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: family.color.deep }}>
            {family.name} 가족 · {family.motif}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{emotion.name}</h1>
          <p className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
            <Tag family={family}>{emotion.energy === 'high' ? '에너지가 올라가는 감정' : '에너지가 가라앉는 감정'}</Tag>
          </p>
        </div>
      </header>

      {unlock && (
        <p className="mt-2 px-1 text-xs text-ink-faint">
          {formatDateKo(toDateKey(new Date(unlock.unlockedAt)))} · {SOURCE_LABEL[unlock.source]}
        </p>
      )}

      <div className="mt-6 space-y-7">
        <Section title="어떤 감정인가요">
          <p className="text-[15px] leading-relaxed">{emotion.definition}</p>
        </Section>

        <Section title="이런 순간에 느껴요">
          <ul className="space-y-2">
            {emotion.examples.map((ex) => (
              <li key={ex} className="flex gap-2.5 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: family.color.main }} aria-hidden />
                {ex}
              </li>
            ))}
          </ul>
        </Section>

        {emotion.bodySignals.length > 0 && (
          <Section title="몸에서는 이렇게 느껴지기도 해요">
            <div className="flex flex-wrap gap-1.5">
              {emotion.bodySignals.map((b) => (
                <span key={b} className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink-soft">
                  {BODY_LABEL[b]}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="헷갈리는 감정과의 차이">
          <ul className="space-y-2.5">
            {emotion.similarTo.map((s) => (
              <Comparison key={s.id} emotion={emotion} otherId={s.id} difference={s.difference} known={unlockedIds.has(s.id)} />
            ))}
          </ul>
        </Section>

        <Section
          title="내가 이 감정을 기록한 날"
          aside={entries.length > 0 ? `${dayCount}일 · ${entries.length}번` : undefined}
        >
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-soft">
              아직 이 감정을 기록한 적은 없어요.
              <br />
              비슷한 마음이 찾아오면 떠올려 보세요.
            </div>
          ) : (
            <EntryList entries={entries} emotionId={emotion.id} family={family} />
          )}
        </Section>

        <Link
          to={`/record?emotion=${emotion.id}`}
          className="flex w-full items-center justify-center rounded-full px-6 py-4 font-semibold text-white shadow-soft transition-transform active:scale-[0.98]"
          style={{ background: family.color.deep }}
        >
          이 감정으로 기록하기
        </Link>
      </div>
    </>
  )
}

function Comparison({
  emotion,
  otherId,
  difference,
  known,
}: {
  emotion: Emotion
  otherId: string
  difference: string
  known: boolean
}) {
  const other = EMOTION_BY_ID[otherId]
  const fam = FAMILY_BY_ID[emotion.family]
  const otherFam = FAMILY_BY_ID[other.family]

  const otherBadge = (
    <span
      className="flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-1 text-sm font-semibold"
      style={known ? { background: otherFam.color.soft, color: otherFam.color.deep } : { background: 'var(--color-sand)', color: 'var(--color-ink-faint)' }}
    >
      <EmotionCharacter family={other.family} silhouette={!known} className="h-6 w-6" title="" />
      {other.name}
    </span>
  )

  return (
    <li className="rounded-3xl bg-paper px-4 py-3.5">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className="flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-1 text-sm font-semibold"
          style={{ background: fam.color.soft, color: fam.color.deep }}
        >
          <EmotionCharacter family={emotion.family} className="h-6 w-6" title="" />
          {emotion.name}
        </span>
        <span className="text-xs text-ink-faint" aria-label="비교">↔</span>
        {known ? <Link to={`/dex/${other.id}`}>{otherBadge}</Link> : otherBadge}
      </div>
      <p className="text-sm leading-relaxed text-ink-soft">{difference}</p>
      {!known && <p className="mt-1.5 text-xs text-ink-faint">아직 만나지 않은 감정이에요. 만나면 도감에서 자세히 볼 수 있어요.</p>}
    </li>
  )
}

const timeFmt = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })

function EntryList({ entries, emotionId, family }: { entries: Entry[]; emotionId: string; family: Family }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? entries : entries.slice(0, ENTRY_PAGE)

  return (
    <>
      <ul className="space-y-2">
        {visible.map((entry) => {
          const intensity = entry.emotions.find((x) => x.emotionId === emotionId)!.intensity
          return (
            <li key={entry.id} className="rounded-2xl bg-paper px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {formatDateKo(entry.date)}
                  <span className="ml-1.5 text-xs font-normal text-ink-faint">{timeFmt.format(new Date(entry.createdAt))}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink-soft" aria-label={`강도 ${intensity}, ${INTENSITY_LABELS[intensity]}`}>
                  {INTENSITY_LABELS[intensity]}
                  <span className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: n <= intensity ? family.color.deep : 'var(--color-line)' }}
                      />
                    ))}
                  </span>
                </span>
              </div>
              {entry.text && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{entry.text}</p>}
            </li>
          )
        })}
      </ul>
      {entries.length > ENTRY_PAGE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 w-full rounded-full py-2.5 text-sm text-ink-soft hover:bg-sand"
        >
          {showAll ? '접기' : `${entries.length - ENTRY_PAGE}개 더 보기`}
        </button>
      )}
    </>
  )
}

// ───────────────────────── 잠긴 감정 ─────────────────────────

function LockedDetail({ emotion }: { emotion: Emotion }) {
  const family = FAMILY_BY_ID[emotion.family]
  return (
    <div className="mt-3 rounded-blob border border-line bg-paper px-6 py-8 text-center">
      <EmotionCharacter family={emotion.family} silhouette className="mx-auto h-28 w-28" title="아직 만나지 못한 감정" />
      <p className="mt-3 text-xs font-medium" style={{ color: family.color.deep }}>
        {family.name} 가족
      </p>
      <h1 className="mt-0.5 text-2xl font-bold text-ink-faint">???</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">아직 만나지 못한 감정이에요.</p>

      <div className="mt-5 rounded-2xl bg-cream px-4 py-3 text-left">
        <p className="text-xs font-semibold text-ink-soft">힌트 · 이런 순간에 찾아와요</p>
        <p className="mt-1 text-sm leading-relaxed">{emotion.examples[0]}</p>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-faint">
        매일 하나씩 새 감정이 찾아오고,
        <br />
        기록에 이 감정을 뜻하는 말을 쓰면 바로 만날 수 있어요.
      </p>
    </div>
  )
}

// ───────────────────────── 공통 ─────────────────────────

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        {aside && <span className="text-xs text-ink-faint">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Tag({ family, children }: { family: Family; children: string }) {
  return (
    <span className="rounded-full bg-paper/70 px-2 py-0.5" style={{ color: family.color.deep }}>
      {children}
    </span>
  )
}

function PrevNext({ emotion }: { emotion: Emotion }) {
  const { unlockedIds } = useAppData()
  const i = DEX_ORDER.findIndex((e) => e.id === emotion.id)
  const prev = DEX_ORDER[(i - 1 + DEX_ORDER.length) % DEX_ORDER.length]
  const next = DEX_ORDER[(i + 1) % DEX_ORDER.length]
  const name = (e: Emotion) => (unlockedIds.has(e.id) ? e.name : '???')

  return (
    <nav className="mt-8 flex justify-between gap-2 border-t border-line pt-4 text-sm" aria-label="이전·다음 감정">
      <Link to={`/dex/${prev.id}`} replace className="rounded-full px-3 py-2 text-ink-soft hover:bg-sand">
        ← {name(prev)}
      </Link>
      <Link to={`/dex/${next.id}`} replace className="rounded-full px-3 py-2 text-ink-soft hover:bg-sand">
        {name(next)} →
      </Link>
    </nav>
  )
}
