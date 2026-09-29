/*
 * 감정 찾기 도우미 ("이 감정이 뭔지 모르겠어요")
 * 몸 감각 → 에너지 → 상황, 세 단계 질문 뒤 후보 2~3개를 보여 줍니다.
 * 각 단계는 "잘 모르겠어요"로 건너뛸 수 있어요.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FAMILY_BY_ID } from '../data/families'
import { BODY_SIGNALS, SITUATIONS } from '../data/signals'
import { findCandidates, hasAnyAnswer, type FinderAnswers } from '../lib/finder'
import type { BodySignalId, Energy, SituationId } from '../types'
import EmotionCharacter from './EmotionCharacter'

interface Props {
  open: boolean
  unlockedIds: Set<string>
  onClose: () => void
  /** 고른 감정 id (잠긴 감정 포함) */
  onPick: (emotionIds: string[]) => void
}

const STEPS = ['몸', '에너지', '상황', '결과'] as const
const MAX_SITUATIONS = 2
const EMPTY: FinderAnswers = { body: [], energy: null, situations: [] }

export default function EmotionFinder({ open, unlockedIds, onClose, onPick }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<FinderAnswers>(EMPTY)
  const [picked, setPicked] = useState<string[]>([])

  // 열 때마다 처음부터 시작하도록 부모가 key 를 바꿔 새로 마운트합니다
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const candidates = useMemo(() => (step === 3 ? findCandidates(answers) : []), [step, answers])

  const toggleBody = (id: BodySignalId) =>
    setAnswers((a) => ({ ...a, body: a.body.includes(id) ? a.body.filter((x) => x !== id) : [...a.body, id] }))
  const toggleSituation = (id: SituationId) =>
    setAnswers((a) => {
      if (a.situations.includes(id)) return { ...a, situations: a.situations.filter((x) => x !== id) }
      if (a.situations.length >= MAX_SITUATIONS) return a
      return { ...a, situations: [...a.situations, id] }
    })
  const setEnergy = (energy: Energy | null) => {
    setAnswers((a) => ({ ...a, energy }))
    setStep(2)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="finder-title"
            className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-[2rem] bg-paper sketch sm:rounded-blob"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 머리: 단계 표시 */}
            <div className="flex items-center justify-between px-6 pt-5">
              <button
                type="button"
                onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
                className="-ml-2 rounded-full px-2 py-1 text-sm text-ink-soft hover:bg-sand"
              >
                {step === 0 ? '닫기' : '← 이전'}
              </button>
              <ol className="flex gap-1.5" aria-label={`${STEPS.length}단계 중 ${step + 1}단계`}>
                {STEPS.map((s, i) => (
                  <li
                    key={s}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === step ? 20 : 6, background: i <= step ? 'var(--color-accent)' : 'var(--color-line)' }}
                  />
                ))}
              </ol>
              <span className="w-10" aria-hidden />
            </div>

            <div className="overflow-y-auto px-6 pt-4 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 0 && (
                    <Step
                      title="지금 몸에서는 어떤 느낌이 드나요?"
                      sub="감정은 몸에 먼저 나타나기도 해요. 해당하는 걸 모두 골라 주세요."
                    >
                      <ChipGrid>
                        {BODY_SIGNALS.map((b) => (
                          <Chip key={b.id} on={answers.body.includes(b.id)} onClick={() => toggleBody(b.id)}>
                            {b.label}
                          </Chip>
                        ))}
                      </ChipGrid>
                      <NextRow
                        onSkip={() => {
                          setAnswers((a) => ({ ...a, body: [] }))
                          setStep(1)
                        }}
                        onNext={() => setStep(1)}
                        canNext={answers.body.length > 0}
                      />
                    </Step>
                  )}

                  {step === 1 && (
                    <Step title="마음의 에너지는 어느 쪽에 가까운가요?" sub="좋고 나쁨이 아니라, 올라가는지 가라앉는지만 떠올려 보세요.">
                      <div className="grid grid-cols-2 gap-2.5">
                        <EnergyCard
                          on={answers.energy === 'high'}
                          onClick={() => setEnergy('high')}
                          title="올라가요"
                          desc="들뜨거나, 뜨겁거나, 들썩여요"
                          arrow="↑"
                        />
                        <EnergyCard
                          on={answers.energy === 'low'}
                          onClick={() => setEnergy('low')}
                          title="가라앉아요"
                          desc="무겁거나, 조용하거나, 처져요"
                          arrow="↓"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnergy(null)}
                        className="mt-4 w-full py-2 text-sm text-ink-faint underline-offset-2 hover:underline"
                      >
                        잘 모르겠어요
                      </button>
                    </Step>
                  )}

                  {step === 2 && (
                    <Step title="어떤 일이 있었나요?" sub={`가장 가까운 것을 ${MAX_SITUATIONS}개까지 골라 주세요.`}>
                      <ChipGrid>
                        {SITUATIONS.map((s) => (
                          <Chip
                            key={s.id}
                            on={answers.situations.includes(s.id)}
                            disabled={!answers.situations.includes(s.id) && answers.situations.length >= MAX_SITUATIONS}
                            onClick={() => toggleSituation(s.id)}
                          >
                            {s.label}
                          </Chip>
                        ))}
                      </ChipGrid>
                      <NextRow
                        onSkip={() => {
                          setAnswers((a) => ({ ...a, situations: [] }))
                          setStep(3)
                        }}
                        onNext={() => setStep(3)}
                        canNext={answers.situations.length > 0}
                        nextLabel="감정 찾기"
                      />
                    </Step>
                  )}

                  {step === 3 && (
                    <Step
                      title={candidates.length ? '혹시 이런 감정이었을까요?' : '딱 맞는 감정을 찾기 어려웠어요'}
                      sub={
                        candidates.length
                          ? '마음에 가까운 것을 골라 주세요. 여러 개여도 괜찮아요.'
                          : hasAnyAnswer(answers)
                            ? '다른 답을 골라 보거나, 떠오르는 대로 글로 먼저 적어 보는 것도 좋아요.'
                            : '하나라도 답해 주시면 후보를 찾아 드릴게요.'
                      }
                    >
                      <ul className="space-y-2.5">
                        {candidates.map(({ emotion }, i) => {
                          const fam = FAMILY_BY_ID[emotion.family]
                          const on = picked.includes(emotion.id)
                          const isNew = !unlockedIds.has(emotion.id)
                          return (
                            <motion.li
                              key={emotion.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                            >
                              <button
                                type="button"
                                aria-pressed={on}
                                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== emotion.id) : [...p, emotion.id]))}
                                className="flex w-full gap-3 rounded-3xl border-2 px-4 py-3.5 text-left transition-colors"
                                style={{
                                  background: on ? fam.color.soft : 'var(--color-cream)',
                                  borderColor: on ? fam.color.deep : 'transparent',
                                }}
                              >
                                <EmotionCharacter family={emotion.family} intensity={3} className="h-12 w-12 shrink-0" title="" />
                                <span className="min-w-0">
                                  <span className="flex items-center gap-1.5">
                                    <span className="font-semibold" style={{ color: fam.color.deep }}>
                                      {emotion.name}
                                    </span>
                                    {isNew && (
                                      <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold text-white">새 감정</span>
                                    )}
                                  </span>
                                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{emotion.definition}</span>
                                  <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">예) {emotion.examples[0]}</span>
                                </span>
                              </button>
                            </motion.li>
                          )
                        })}
                      </ul>

                      {candidates.length > 0 ? (
                        <>
                          <button
                            type="button"
                            disabled={picked.length === 0}
                            onClick={() => onPick(picked)}
                            className="mt-5 w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition-transform active:scale-[0.98] disabled:bg-line disabled:text-ink-faint"
                          >
                            {picked.length ? `이 감정으로 기록할게요 (${picked.length})` : '감정을 골라 주세요'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStep(0)
                              setPicked([])
                            }}
                            className="mt-2 w-full py-2 text-sm text-ink-faint"
                          >
                            여기엔 없어요 · 처음부터 다시
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className="mt-5 w-full rounded-full border border-line px-6 py-3.5 text-sm font-medium text-ink-soft"
                        >
                          처음부터 다시 해 볼게요
                        </button>
                      )}
                    </Step>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Step({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <h2 id="finder-title" className="text-lg leading-snug font-bold">
        {title}
      </h2>
      <p className="mt-1 mb-4 text-sm leading-relaxed text-ink-soft">{sub}</p>
      {children}
    </div>
  )
}

function ChipGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

function Chip({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95 disabled:opacity-40 ${
        on ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line bg-paper text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function EnergyCard({ on, onClick, title, desc, arrow }: { on: boolean; onClick: () => void; title: string; desc: string; arrow: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex flex-col items-center rounded-3xl border-2 px-3 py-5 text-center transition-colors ${
        on ? 'border-accent bg-accent-soft' : 'border-transparent bg-cream'
      }`}
    >
      <span className="text-2xl text-accent" aria-hidden>
        {arrow}
      </span>
      <span className="mt-1 font-semibold">{title}</span>
      <span className="mt-1 text-xs leading-relaxed text-ink-soft">{desc}</span>
    </button>
  )
}

function NextRow({
  onSkip,
  onNext,
  canNext,
  nextLabel = '다음',
}: {
  onSkip: () => void
  onNext: () => void
  canNext: boolean
  nextLabel?: string
}) {
  return (
    <div className="mt-5 flex gap-2">
      <button type="button" onClick={onSkip} className="flex-1 rounded-full border border-line px-4 py-3 text-sm text-ink-soft">
        잘 모르겠어요
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:bg-line disabled:text-ink-faint"
      >
        {nextLabel}
      </button>
    </div>
  )
}
