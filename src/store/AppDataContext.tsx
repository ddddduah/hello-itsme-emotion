import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EMOTION_BY_ID } from '../data/emotions'
import { toDateKey } from '../lib/date'
import { dataStore, newId } from '../lib/storage'
import { findKeywordUnlocks, pickDailyUnlock } from '../lib/unlock'
import type { AppData, Emotion, Entry, EntryEmotion, UnlockSource } from '../types'

/** 해금 축하 연출 하나 */
export interface UnlockEvent {
  emotion: Emotion
  source: UnlockSource
  /** 키워드 해금일 때 기록에서 찾은 어절 */
  word?: string
}

export interface SaveResult {
  entry: Entry
  unlocked: UnlockEvent[]
}

interface AppDataContextValue {
  data: AppData
  unlockedIds: Set<string>
  /** 기록 저장 + 키워드 해금 */
  saveEntry: (input: { text: string; emotions: EntryEmotion[] }) => Promise<SaveResult>
  /** 도우미·숨은 감정 제안 등에서 직접 해금 */
  unlock: (emotionIds: string[], source: UnlockSource) => Promise<UnlockEvent[]>
  /** 아직 보여 주지 않은 해금 축하 (앞에서부터 하나씩 표시) */
  /** 마이홈 "이사 왔어요!" 연출을 본 것으로 표시 */
  markMoveInSeen: (emotionIds: string[]) => Promise<void>
  celebrations: UnlockEvent[]
  dismissCelebration: () => void
  resetAll: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

/**
 * 오늘 일일 해금을 아직 받지 않았다면 지급.
 * StrictMode 이중 실행·탭 포커스가 겹쳐도 한 번만 돌도록 진행 중인 작업을 공유.
 */
let dailyClaim: Promise<UnlockEvent | null> | null = null
function claimDailyUnlock(): Promise<UnlockEvent | null> {
  dailyClaim ??= (async () => {
    const data = await dataStore.load()
    const today = toDateKey()
    if (data.lastDailyUnlock === today) return null
    const emotion = pickDailyUnlock(data, today)
    if (emotion) {
      await dataStore.addUnlocks([{ emotionId: emotion.id, unlockedAt: new Date().toISOString(), source: 'daily' }])
    }
    await dataStore.setLastDailyUnlock(today)
    return emotion ? { emotion, source: 'daily' as const } : null
  })().finally(() => {
    dailyClaim = null
  })
  return dailyClaim
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [celebrations, setCelebrations] = useState<UnlockEvent[]>([])

  const celebrate = useCallback((events: UnlockEvent[]) => {
    if (!events.length) return
    setCelebrations((q) => {
      const queued = new Set(q.map((e) => e.emotion.id))
      return [...q, ...events.filter((e) => !queued.has(e.emotion.id))]
    })
  }, [])

  // 첫 로드 + 일일 해금. 자정을 넘겨 앱을 다시 볼 때도 확인
  useEffect(() => {
    let alive = true
    const sync = async () => {
      const daily = await claimDailyUnlock()
      const loaded = await dataStore.load()
      if (!alive) return
      setData(loaded)
      if (daily) celebrate([daily])
    }
    void sync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [celebrate])

  const unlock = useCallback<AppDataContextValue['unlock']>(
    async (emotionIds, source) => {
      const current = await dataStore.load()
      const have = new Set(current.unlocks.map((u) => u.emotionId))
      const fresh = [...new Set(emotionIds)].filter((id) => !have.has(id) && EMOTION_BY_ID[id])
      if (!fresh.length) return []
      const now = new Date().toISOString()
      await dataStore.addUnlocks(fresh.map((emotionId) => ({ emotionId, unlockedAt: now, source })))
      setData(await dataStore.load())
      const events = fresh.map((id) => ({ emotion: EMOTION_BY_ID[id], source }))
      celebrate(events)
      return events
    },
    [celebrate],
  )

  const saveEntry = useCallback<AppDataContextValue['saveEntry']>(
    async ({ text, emotions }) => {
      const now = new Date()
      const entry: Entry = {
        id: newId(),
        createdAt: now.toISOString(),
        date: toDateKey(now),
        text: text.trim(),
        emotions,
      }
      await dataStore.addEntry(entry)

      const current = await dataStore.load()
      const hits = findKeywordUnlocks(entry.text, new Set(current.unlocks.map((u) => u.emotionId)))
      if (hits.length) {
        await dataStore.addUnlocks(
          hits.map((h) => ({ emotionId: h.emotion.id, unlockedAt: now.toISOString(), source: 'keyword' as const })),
        )
      }
      setData(await dataStore.load())

      const unlocked = hits.map((h) => ({ emotion: h.emotion, source: 'keyword' as const, word: h.word }))
      celebrate(unlocked)
      return { entry, unlocked }
    },
    [celebrate],
  )

  const markMoveInSeen = useCallback(async (emotionIds: string[]) => {
    if (!emotionIds.length) return
    await dataStore.markMoveInSeen(emotionIds)
    setData(await dataStore.load())
  }, [])

  const dismissCelebration = useCallback(() => setCelebrations((q) => q.slice(1)), [])

  const resetAll = useCallback(async () => {
    setData(await dataStore.reset())
    setCelebrations([])
  }, [])

  const value = useMemo<AppDataContextValue | null>(() => {
    if (!data) return null
    return {
      data,
      unlockedIds: new Set(data.unlocks.map((u) => u.emotionId)),
      saveEntry,
      unlock,
      markMoveInSeen,
      celebrations,
      dismissCelebration,
      resetAll,
    }
  }, [data, saveEntry, unlock, markMoveInSeen, celebrations, dismissCelebration, resetAll])

  if (!value) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-ink-faint">
        마음집 문을 여는 중이에요…
      </div>
    )
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData 는 AppDataProvider 안에서만 사용할 수 있어요')
  return ctx
}
