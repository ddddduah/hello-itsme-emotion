/*
 * 나의 감정 리포트
 *
 * 문구 원칙: 판단·진단하지 않고 관찰한 것만 말합니다.
 *   ✗ "당신은 우울합니다"  ✓ "슬픔 가족 감정이 자주 찾아왔네요"
 *
 * 차트 원칙: 감정 가족 9색은 서로 구분하기 어려운 파스텔이라(팔레트 검증 결과),
 *   색만으로 가족을 구분하게 하지 않습니다. 막대마다 한 줄씩, 가족 이름과 캐릭터를
 *   바로 옆에 적고 값도 글자로 함께 보여 줍니다. (쌓은 막대·파이 차트는 쓰지 않음)
 */
import { motion } from 'framer-motion'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import EmotionCharacter from '../components/EmotionCharacter'
import PageHeader from '../components/PageHeader'
import { EMOTION_BY_ID } from '../data/emotions'
import { FAMILY_BY_ID } from '../data/families'
import { INTENSITY_LABELS } from '../data/intensity'
import { addDays, fromDateKey, toDateKey } from '../lib/date'
import { iGa } from '../lib/josa'
import {
  PATTERN_WEEKS,
  QUIET_WINDOW_DAYS,
  WEEKDAY_KO,
  quietFamilies,
  standoutWeekday,
  weekdayPatterns,
  weeklyReport,
  weekStart,
  type EmotionTally,
  type FamilyShare,
} from '../lib/report'
import { useAppData } from '../store/AppDataContext'
import type { Intensity } from '../types'

const md = (key: string) => {
  const d = fromDateKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function ReportPage() {
  const { data, unlockedIds } = useAppData()
  const today = toDateKey()
  const thisWeek = weekStart(today)
  const [start, setStart] = useState(thisWeek)
  const isThisWeek = start === thisWeek
  // 가장 오래된 기록이 있는 주까지만 뒤로 갈 수 있게
  const firstWeek = useMemo(() => {
    const first = data.entries.reduce<string | null>((min, e) => (!min || e.date < min ? e.date : min), null)
    return first ? weekStart(first) : thisWeek
  }, [data.entries, thisWeek])

  const week = useMemo(() => weeklyReport(data, start), [data, start])
  const quiet = useMemo(() => quietFamilies(data, today, unlockedIds), [data, today, unlockedIds])
  const patterns = useMemo(() => weekdayPatterns(data, today), [data, today])
  const standout = standoutWeekday(patterns)

  return (
    <>
      <PageHeader title="나의 감정 리포트" sub="요즘 내 마음의 집에 누가 자주 머물렀는지 살펴봐요." />

      {/* 주 이동 */}
      <div className="mb-4 flex items-center justify-between rounded-full bg-paper px-2 py-1.5 sketch">
        <WeekButton label="이전 주" disabled={start <= firstWeek} onClick={() => setStart(addDays(start, -7))}>
          ‹
        </WeekButton>
        <p className="text-sm font-semibold">
          {isThisWeek ? '이번 주' : start === addDays(thisWeek, -7) ? '지난주' : `${md(start)} 주`}
          <span className="ml-1.5 font-normal text-ink-faint">
            {md(week.start)} ~ {md(week.end)}
          </span>
        </p>
        <WeekButton label="다음 주" disabled={isThisWeek} onClick={() => setStart(addDays(start, 7))}>
          ›
        </WeekButton>
      </div>

      <div className="space-y-4">
        <WeekHero top={week.emotions[0]} isThisWeek={isThisWeek} />

        {week.entryCount > 0 && (
          <>
            {/* 요약 숫자 */}
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="남긴 기록" value={`${week.entryCount}번`} />
              <StatTile label="기록한 날" value={`${week.daysRecorded}일`} sub="/ 7일" />
              <StatTile label="만난 감정" value={`${week.emotions.length}가지`} />
            </div>

            <Card title="감정 가족 비율" sub="기록에 담긴 감정을 가족별로 모아 봤어요.">
              <FamilyBars families={week.families} />
            </Card>

            <Card title={isThisWeek ? '이번 주에 찾아온 감정' : '그 주에 찾아온 감정'}>
              <EmotionChips tallies={week.emotions} />
            </Card>
          </>
        )}

        {/* 한 달간 조용했던 가족 */}
        <Card title={`최근 ${QUIET_WINDOW_DAYS}일, 조용했던 감정 가족`}>
          {!quiet.hasEntries ? (
            <p className="text-sm leading-relaxed text-ink-soft">최근 {QUIET_WINDOW_DAYS}일 동안 남긴 기록이 없어요.</p>
          ) : quiet.quiet.length === 0 ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              최근 {QUIET_WINDOW_DAYS}일 동안 마음집에 사는 모든 가족이 한 번씩은 찾아왔어요.
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed">
                최근 {QUIET_WINDOW_DAYS}일 동안{' '}
                {quiet.quiet.map((f, i) => (
                  <span key={f}>
                    {i > 0 && ', '}
                    <strong>‘{FAMILY_BY_ID[f].name}’</strong>
                  </span>
                ))}{' '}
                가족의 감정은 한 번도 기록되지 않았어요.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quiet.quiet.map((f) => (
                  <span key={f} className="flex items-center gap-1.5 rounded-full bg-cream py-1 pr-3 pl-1 text-sm text-ink-soft">
                    <EmotionCharacter family={f} mood="sleepy" className="h-7 w-7" title="" />
                    {FAMILY_BY_ID[f].name}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                그런 순간이 없었을 수도 있고, 미처 이름 붙이지 못하고 지나갔을 수도 있어요. 어느 쪽이든 괜찮아요.
              </p>
            </>
          )}
        </Card>

        {/* 요일별 패턴 */}
        <Card title="요일별로 자주 찾아온 감정" sub={`최근 ${PATTERN_WEEKS}주 동안의 기록이에요.`}>
          {standout ? (
            <p className="mb-3 rounded-2xl bg-cream px-4 py-3 text-sm leading-relaxed">
              <strong>{WEEKDAY_KO[standout.weekday]}요일</strong>에는 ‘{EMOTION_BY_ID[standout.emotionId].noun}’{iGa(EMOTION_BY_ID[standout.emotionId].noun)} 자주
              찾아왔어요. <span className="text-ink-faint">({standout.count}번)</span>
            </p>
          ) : (
            <p className="mb-3 text-sm leading-relaxed text-ink-soft">
              기록이 조금 더 쌓이면 요일마다 자주 찾아오는 감정이 보이기 시작할 거예요.
            </p>
          )}
          <WeekdayTable patterns={patterns} highlight={standout?.weekday} />
        </Card>
      </div>
    </>
  )
}

// ───────────────────────── 주간 머리 ─────────────────────────

function WeekHero({ top, isThisWeek }: { top: EmotionTally | undefined; isThisWeek: boolean }) {
  if (!top) {
    return (
      <div className="rounded-blob bg-paper px-6 py-8 text-center sketch">
        <p className="text-sm leading-relaxed text-ink-soft">
          {isThisWeek ? '이번 주에는 아직 기록이 없어요.' : '이 주에는 남긴 기록이 없어요.'}
        </p>
        {isThisWeek && (
          <Link to="/record" className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
            오늘의 마음 기록하기
          </Link>
        )}
      </div>
    )
  }

  const emotion = EMOTION_BY_ID[top.emotionId]
  const family = FAMILY_BY_ID[emotion.family]
  const avg = Math.min(5, Math.max(1, Math.round(top.intensitySum / top.count))) as Intensity

  return (
    <motion.div
      key={top.emotionId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-blob px-5 py-5"
      style={{ background: family.color.soft }}
    >
      <motion.div
        className="h-24 w-24 shrink-0"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <EmotionCharacter family={emotion.family} intensity={avg} className="h-full w-full" title={emotion.name} />
      </motion.div>
      <div className="min-w-0">
        <p className="text-[15px] leading-relaxed">
          {isThisWeek ? '이번 주' : '이 주에'} 당신의 집에는{' '}
          <strong className="text-lg" style={{ color: family.color.deep }}>
            ‘{emotion.noun}’
          </strong>
          {iGa(emotion.noun)} 가장 오래 머물렀어요
        </p>
        <p className="mt-1.5 text-xs text-ink-soft">
          {top.count}번 찾아왔고, 평균 ‘{INTENSITY_LABELS[avg]}’ 느꼈어요
        </p>
      </div>
    </motion.div>
  )
}

// ───────────────────────── 가족 비율 막대 ─────────────────────────

function FamilyBars({ families }: { families: FamilyShare[] }) {
  const max = Math.max(...families.map((f) => f.share))
  return (
    <ul className="space-y-2.5" aria-label="감정 가족 비율">
      {families.map((f, i) => {
        const fam = FAMILY_BY_ID[f.family]
        const pct = Math.round(f.share * 100)
        return (
          <li
            key={f.family}
            className="group grid grid-cols-[5.5rem_1fr_auto] items-center gap-2.5 rounded-xl px-1 py-0.5 transition-colors hover:bg-cream"
            title={`${fam.name} 가족 · ${pct}% (${f.count}번)`}
          >
            <span className="flex min-w-0 items-center gap-1.5 text-sm">
              <EmotionCharacter family={f.family} className="h-6 w-6 shrink-0" title="" />
              <span className="truncate">{fam.name}</span>
            </span>
            <span className="h-3 overflow-hidden rounded-r-[4px]" aria-hidden>
              <motion.span
                className="hatch block h-full rounded-r-[4px]"
                style={{ background: fam.color.deep }}
                initial={{ width: 0 }}
                animate={{ width: `${(f.share / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              />
            </span>
            <span className="w-16 text-right text-sm tabular-nums">
              {pct}%<span className="ml-1 text-xs text-ink-faint">{f.count}번</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function EmotionChips({ tallies }: { tallies: EmotionTally[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tallies.map((t) => {
        const e = EMOTION_BY_ID[t.emotionId]
        return (
          <li key={t.emotionId}>
            <Link
              to={`/dex/${e.id}`}
              className="flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-sm"
              style={{ background: FAMILY_BY_ID[e.family].color.soft }}
            >
              <EmotionCharacter family={e.family} className="h-7 w-7" title="" />
              {e.name}
              <span className="text-xs text-ink-soft">×{t.count}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

// ───────────────────────── 요일별 표 ─────────────────────────

function WeekdayTable({ patterns, highlight }: { patterns: ReturnType<typeof weekdayPatterns>; highlight?: number }) {
  return (
    <table className="w-full border-separate border-spacing-y-1.5 text-sm">
      <caption className="sr-only">요일별로 자주 기록된 감정</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">요일</th>
          <th scope="col">자주 찾아온 감정</th>
          <th scope="col">기록 수</th>
        </tr>
      </thead>
      <tbody>
        {patterns.map((p) => (
          <tr key={p.weekday} className={p.weekday === highlight ? 'bg-cream' : ''}>
            <th
              scope="row"
              className={`w-9 rounded-l-xl py-1.5 pl-2 text-left font-semibold ${
                p.weekday === 0 || p.weekday === 6 ? 'text-accent' : ''
              }`}
            >
              {WEEKDAY_KO[p.weekday]}
            </th>
            <td className="py-1.5">
              {p.top.length === 0 ? (
                <span className="text-ink-faint">—</span>
              ) : (
                <span className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {p.top.map((t, i) => {
                    const e = EMOTION_BY_ID[t.emotionId]
                    return (
                      <span key={t.emotionId} className={`flex items-center gap-1 ${i > 0 ? 'text-ink-soft' : 'font-medium'}`}>
                        <EmotionCharacter family={e.family} className="h-5 w-5" title="" />
                        {e.name}
                        <span className="text-xs text-ink-faint">{t.count}</span>
                      </span>
                    )
                  })}
                </span>
              )}
            </td>
            <td className="w-14 rounded-r-xl py-1.5 pr-2 text-right text-xs text-ink-faint tabular-nums">
              {p.entryCount > 0 ? `기록 ${p.entryCount}` : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ───────────────────────── 공통 ─────────────────────────

function Card({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-paper px-5 py-5 sketch">
      <h2 className="font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-paper px-3 py-3.5 text-center sketch">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-xl font-semibold">
        {value}
        {sub && <span className="ml-0.5 text-xs font-normal text-ink-faint">{sub}</span>}
      </p>
    </div>
  )
}

function WeekButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-sand disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
