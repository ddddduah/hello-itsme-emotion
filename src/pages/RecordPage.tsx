import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import EmotionCharacter from '../components/EmotionCharacter'
import EmotionFinder from '../components/EmotionFinder'
import PageHeader from '../components/PageHeader'
import { EMOTION_BY_ID, EMOTIONS } from '../data/emotions'
import { FAMILIES, FAMILY_BY_ID } from '../data/families'
import { INTENSITY_LABELS } from '../data/intensity'
import { toDateKey } from '../lib/date'
import { useAppData, type SaveResult } from '../store/AppDataContext'
import type { Emotion, Entry, EntryEmotion, Intensity } from '../types'

const MAX_TEXT = 2000

export default function RecordPage() {
  const { data, unlockedIds, saveEntry, unlock } = useAppData()
  const [finderOpen, setFinderOpen] = useState(false)
  /** 도우미를 열 때마다 새로 마운트해서 처음 단계부터 */
  const [finderKey, setFinderKey] = useState(0)
  const [text, setText] = useState('')
  const [params] = useSearchParams()
  // 마이홈 캐릭터에서 "이 감정 기록하기"로 들어오면 미리 선택
  const [selected, setSelected] = useState<EntryEmotion[]>(() => {
    const pre = params.get('emotion')
    return pre && unlockedIds.has(pre) ? [{ emotionId: pre, intensity: 3 }] : []
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<SaveResult | null>(null)

  const canSave = !saving && (text.trim().length > 0 || selected.length > 0)

  const toggle = (emotionId: string) =>
    setSelected((cur) =>
      cur.some((s) => s.emotionId === emotionId)
        ? cur.filter((s) => s.emotionId !== emotionId)
        : [...cur, { emotionId, intensity: 3 }],
    )

  const setIntensity = (emotionId: string, intensity: Intensity) =>
    setSelected((cur) => cur.map((s) => (s.emotionId === emotionId ? { ...s, intensity } : s)))

  const openFinder = () => {
    setFinderKey((k) => k + 1)
    setFinderOpen(true)
  }
  const closeFinder = useCallback(() => setFinderOpen(false), [])

  /** 도우미에서 고른 감정: 잠긴 것은 해금하고, 기록 선택에 추가 */
  const handleFinderPick = async (ids: string[]) => {
    setFinderOpen(false)
    setSelected((cur) => [
      ...cur,
      ...ids.filter((id) => !cur.some((s) => s.emotionId === id)).map((emotionId) => ({ emotionId, intensity: 3 as const })),
    ])
    await unlock(ids, 'finder')
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await saveEntry({ text, emotions: selected })
      setResult(res)
      setText('')
      setSelected([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  const today = toDateKey()
  const todayEntries = useMemo(
    () => data.entries.filter((e) => e.date === today).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.entries, today],
  )

  return (
    <>
      <PageHeader title="기록하기" sub="오늘 있었던 일과 그때의 마음을 적어 보세요. 하루에 몇 번이든 괜찮아요." />

      <AnimatePresence mode="wait" initial={false}>
        {result ? (
          <SavedCard key="saved" result={result} onAgain={() => setResult(null)} />
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-7"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
          >
            {/* 1) 있었던 일 */}
            <section>
              <label htmlFor="entry-text" className="mb-2 block font-semibold">
                오늘 있었던 일이나 떠오른 생각
              </label>
              <textarea
                id="entry-text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                rows={5}
                placeholder="예) 점심에 동료가 내 의견을 가로채서 말했다. 아무렇지 않은 척했지만 오후 내내 신경이 쓰였다."
                className="w-full resize-y rounded-2xl border-2 border-dashed border-line bg-paper px-5 py-[0.35rem] text-lg leading-[2rem] placeholder:text-ink-faint focus:border-accent focus:outline-none"
                // 줄 노트처럼 가로줄
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(transparent 0 calc(2rem - 1px), rgb(52 49 45 / 0.14) calc(2rem - 1px) 2rem)',
                  backgroundPosition: '0 0.35rem',
                  backgroundAttachment: 'local',
                }}
              />
              <p className="mt-1 text-right text-xs text-ink-faint">
                {text.length} / {MAX_TEXT}
              </p>
            </section>

            {/* 2) 감정 선택 */}
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">그때 느낀 감정</h2>
                <span className="text-xs text-ink-faint">여러 개 골라도 돼요</span>
              </div>
              <EmotionPicker unlockedIds={unlockedIds} selected={selected} onToggle={toggle} />
              <button
                type="button"
                onClick={openFinder}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-accent/50 bg-accent-soft/40 px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                <span aria-hidden>🔍</span> 이 감정이 뭔지 모르겠어요
              </button>
            </section>

            {/* 3) 강도 */}
            <AnimatePresence initial={false}>
              {selected.length > 0 && (
                <motion.section
                  key="intensity"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <h2 className="mb-3 font-semibold">얼마나 크게 느꼈나요?</h2>
                  <ul className="space-y-3">
                    {selected.map((s) => (
                      <IntensityRow key={s.emotionId} item={s} onChange={(v) => setIntensity(s.emotionId, v)} />
                    ))}
                  </ul>
                </motion.section>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!canSave}
              className="w-full rounded-full bg-accent px-6 py-4 font-semibold text-white sketch transition-all active:scale-[0.98] disabled:bg-line disabled:text-ink-faint disabled:shadow-none"
            >
              {saving ? '저장하는 중…' : '기록 남기기'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {todayEntries.length > 0 && <TodayEntries entries={todayEntries} />}

      <EmotionFinder
        key={finderKey}
        open={finderOpen}
        unlockedIds={unlockedIds}
        onClose={closeFinder}
        onPick={(ids) => void handleFinderPick(ids)}
      />
    </>
  )
}

// ───────────────────────── 감정 고르기 ─────────────────────────

function EmotionPicker({
  unlockedIds,
  selected,
  onToggle,
}: {
  unlockedIds: Set<string>
  selected: EntryEmotion[]
  onToggle: (id: string) => void
}) {
  const selectedIds = new Set(selected.map((s) => s.emotionId))
  const groups = FAMILIES.map((family) => ({
    family,
    members: EMOTIONS.filter((e) => e.family === family.id && unlockedIds.has(e.id)),
  })).filter((g) => g.members.length > 0)

  return (
    <div className="space-y-3">
      {groups.map(({ family, members }) => (
        <div key={family.id}>
          <p className="mb-1.5 text-xs font-medium" style={{ color: family.color.deep }}>
            {family.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {members.map((e) => {
              const on = selectedIds.has(e.id)
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(e.id)}
                  className="flex items-center gap-1.5 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm transition-all active:scale-95"
                  style={{
                    background: on ? family.color.soft : 'var(--color-paper)',
                    borderColor: on ? family.color.deep : 'var(--color-line)',
                    color: on ? family.color.deep : 'var(--color-ink)',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <EmotionCharacter family={e.family} intensity={on ? 4 : 2} className="h-7 w-7" title="" />
                  {e.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ───────────────────────── 강도 슬라이더 ─────────────────────────

function IntensityRow({ item, onChange }: { item: EntryEmotion; onChange: (v: Intensity) => void }) {
  const emotion = EMOTION_BY_ID[item.emotionId]
  const family = FAMILY_BY_ID[emotion.family]
  const inputId = `intensity-${emotion.id}`

  return (
    <li className="flex items-center gap-3 rounded-3xl px-3 py-3" style={{ background: family.color.soft }}>
      <motion.div
        key={item.intensity}
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="shrink-0"
      >
        <EmotionCharacter
          family={emotion.family}
          intensity={item.intensity}
          className="h-14 w-14"
          title={`${emotion.name} ${INTENSITY_LABELS[item.intensity]}`}
        />
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={inputId} className="font-semibold" style={{ color: family.color.deep }}>
            {emotion.name}
          </label>
          <span className="text-sm text-ink-soft">
            {INTENSITY_LABELS[item.intensity]} <span className="text-ink-faint">· {item.intensity}</span>
          </span>
        </div>
        <input
          id={inputId}
          type="range"
          min={1}
          max={5}
          step={1}
          value={item.intensity}
          onChange={(e) => onChange(Number(e.target.value) as Intensity)}
          className="mt-1 h-8 w-full cursor-pointer"
          style={{ accentColor: family.color.deep }}
          aria-valuetext={INTENSITY_LABELS[item.intensity]}
        />
      </div>
    </li>
  )
}

// ───────────────────────── 저장 완료 ─────────────────────────

function SavedCard({ result, onAgain }: { result: SaveResult; onAgain: () => void }) {
  const { data } = useAppData()
  const { unlocked, hidden } = result
  // 숨은 감정을 "맞아요"로 더하면 바로 반영되도록 저장소의 최신 기록을 사용
  const entry = data.entries.find((e) => e.id === result.entry.id) ?? result.entry
  return (
    <motion.div
      key="saved"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-blob bg-paper px-6 py-7 text-center sketch"
    >
      <div className="mx-auto mb-3 flex w-fit -space-x-3">
        {entry.emotions.slice(0, 4).map((s) => (
          <EmotionCharacter
            key={s.emotionId}
            family={EMOTION_BY_ID[s.emotionId].family}
            intensity={s.intensity}
            className="h-14 w-14"
            title={EMOTION_BY_ID[s.emotionId].name}
          />
        ))}
      </div>
      <h2 className="text-lg font-bold">기록을 남겼어요</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        {entry.emotions.length > 0
          ? `${entry.emotions.map((s) => EMOTION_BY_ID[s.emotionId].noun).join(' · ')} — 오늘 알아차린 마음이 마음집에 담겼어요.`
          : '오늘의 이야기가 마음집에 담겼어요.'}
      </p>
      {unlocked.length > 0 && (
        <p className="mt-2 text-sm text-ink-soft">
          기록 덕분에 새 감정 {unlocked.length}개를 만났어요.
        </p>
      )}
      {hidden.length > 0 && <HiddenSuggestions entryId={entry.id} suggestions={hidden} />}
      <div className="mt-5 flex gap-2">
        <Link
          to="/"
          className="flex-1 rounded-full border border-line px-4 py-3 text-sm font-medium text-ink-soft hover:bg-sand"
        >
          마이홈으로
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white"
        >
          하나 더 기록하기
        </button>
      </div>
    </motion.div>
  )
}

// ───────────────────────── 숨은 감정 제안 ─────────────────────────

/**
 * "혹시 이런 감정도 섞여 있었을까요?" — 한 번에 하나씩 묻고,
 * "맞아요"면 해금하고 방금 기록에도 (강도 '조금'으로) 더합니다.
 */
function HiddenSuggestions({ entryId, suggestions }: { entryId: string; suggestions: Emotion[] }) {
  const { unlock, addEmotionToEntry } = useAppData()
  const [index, setIndex] = useState(0)
  const [accepted, setAccepted] = useState<string[]>([])
  const current = suggestions[index]

  const answer = async (yes: boolean) => {
    if (yes && current) {
      setAccepted((a) => [...a, current.id])
      await addEmotionToEntry(entryId, { emotionId: current.id, intensity: 2 })
      await unlock([current.id], 'hidden')
    }
    setIndex((i) => i + 1)
  }

  return (
    <div className="mt-5 text-left">
      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-3xl px-4 py-4"
            style={{ background: FAMILY_BY_ID[current.family].color.soft }}
          >
            <p className="text-sm font-semibold">혹시 이런 감정도 섞여 있었을까요?</p>
            <div className="mt-3 flex gap-3">
              <EmotionCharacter family={current.family} intensity={2} silhouette className="h-12 w-12 shrink-0" title="" />
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: FAMILY_BY_ID[current.family].color.deep }}>
                  {current.name}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{current.definition}</p>
              </div>
            </div>
            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={() => void answer(false)}
                className="flex-1 rounded-full bg-paper/80 px-4 py-2.5 text-sm text-ink-soft"
              >
                아니에요
              </button>
              <button
                type="button"
                onClick={() => void answer(true)}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: FAMILY_BY_ID[current.family].color.deep }}
              >
                맞아요
              </button>
            </div>
            {suggestions.length > 1 && (
              <p className="mt-2 text-center text-[11px] text-ink-faint">
                {index + 1} / {suggestions.length}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-cream px-4 py-3 text-center text-sm text-ink-soft"
          >
            {accepted.length > 0
              ? '숨어 있던 마음까지 알아차리셨네요. 기록에도 함께 담아 두었어요.'
              : '괜찮아요. 내 마음은 내가 가장 잘 알아요.'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ───────────────────────── 오늘의 기록 ─────────────────────────

const timeFmt = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })

function TodayEntries({ entries }: { entries: Entry[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold text-ink-soft">오늘 남긴 기록 · {entries.length}</h2>
      <ul className="space-y-2.5">
        {entries.map((entry) => (
          <li key={entry.id} className="sketch rounded-3xl bg-paper px-5 py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-ink-faint">{timeFmt.format(new Date(entry.createdAt))}</span>
              {entry.emotions.map((s) => {
                const e = EMOTION_BY_ID[s.emotionId]
                const f = FAMILY_BY_ID[e.family]
                return (
                  <span
                    key={s.emotionId}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: f.color.soft, color: f.color.deep }}
                  >
                    {e.name} {s.intensity}
                  </span>
                )
              })}
            </div>
            {entry.text && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">{entry.text}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
