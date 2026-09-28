/*
 * 저장 모듈
 *
 * 앱은 DataStore 인터페이스만 사용합니다. 지금은 localStorage 구현을 쓰지만,
 * 나중에 서버로 옮길 때는 같은 인터페이스를 구현하는 ApiDataStore 를 만들어
 * 맨 아래 `dataStore` 만 바꾸면 됩니다. (모든 메서드가 Promise 를 반환하는 이유)
 */
import { INITIAL_EMOTION_IDS } from '../data/emotions'
import type { AppData, DateKey, Entry, UnlockRecord } from '../types'

export interface DataStore {
  /** 전체 데이터 불러오기. 처음이면 초기 상태를 만들어 저장 */
  load(): Promise<AppData>
  addEntry(entry: Entry): Promise<void>
  /** 이미 해금된 감정은 무시하고 새로 해금된 기록만 추가 */
  addUnlocks(records: UnlockRecord[]): Promise<void>
  setLastDailyUnlock(date: DateKey): Promise<void>
  markMoveInSeen(emotionIds: string[]): Promise<void>
  /** 모든 기록 삭제 후 초기 상태로 */
  reset(): Promise<AppData>
}

export function createInitialData(now: Date = new Date()): AppData {
  return {
    schemaVersion: 1,
    entries: [],
    unlocks: INITIAL_EMOTION_IDS.map((emotionId) => ({
      emotionId,
      unlockedAt: now.toISOString(),
      source: 'initial',
    })),
    lastDailyUnlock: null,
    // 초기 감정은 처음부터 살고 있으므로 입주 연출 없음
    moveInSeen: [...INITIAL_EMOTION_IDS],
  }
}

/** 저장된 값이 깨져 있거나 예전 형식이어도 앱이 멈추지 않도록 보정 */
function normalize(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Partial<AppData>
  if (d.schemaVersion !== 1) return null
  return {
    schemaVersion: 1,
    entries: Array.isArray(d.entries) ? d.entries : [],
    unlocks: Array.isArray(d.unlocks) ? d.unlocks : [],
    lastDailyUnlock: typeof d.lastDailyUnlock === 'string' ? d.lastDailyUnlock : null,
    moveInSeen: Array.isArray(d.moveInSeen) ? d.moveInSeen : [],
  }
}

const STORAGE_KEY = 'maeumjip:v1'

export class LocalDataStore implements DataStore {
  /** localStorage 를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 메모리에만 유지 */
  private memory: AppData | null = null
  private readonly key: string

  constructor(key: string = STORAGE_KEY) {
    this.key = key
  }

  private read(): AppData | null {
    try {
      const text = localStorage.getItem(this.key)
      if (text) return normalize(JSON.parse(text))
    } catch {
      // 무시하고 메모리 값 사용
    }
    return this.memory
  }

  private write(data: AppData) {
    this.memory = data
    try {
      localStorage.setItem(this.key, JSON.stringify(data))
    } catch {
      // 저장 공간 부족·접근 불가: 이번 세션 동안은 메모리에 유지
    }
  }

  private update(fn: (data: AppData) => AppData) {
    const current = this.read() ?? createInitialData()
    this.write(fn(current))
  }

  async load(): Promise<AppData> {
    const existing = this.read()
    if (existing) return existing
    const fresh = createInitialData()
    this.write(fresh)
    return fresh
  }

  async addEntry(entry: Entry): Promise<void> {
    this.update((d) => ({ ...d, entries: [...d.entries, entry] }))
  }

  async addUnlocks(records: UnlockRecord[]): Promise<void> {
    this.update((d) => {
      const have = new Set(d.unlocks.map((u) => u.emotionId))
      const fresh = records.filter((r) => {
        if (have.has(r.emotionId)) return false
        have.add(r.emotionId)
        return true
      })
      return fresh.length ? { ...d, unlocks: [...d.unlocks, ...fresh] } : d
    })
  }

  async setLastDailyUnlock(date: DateKey): Promise<void> {
    this.update((d) => ({ ...d, lastDailyUnlock: date }))
  }

  async markMoveInSeen(emotionIds: string[]): Promise<void> {
    this.update((d) => ({ ...d, moveInSeen: [...new Set([...d.moveInSeen, ...emotionIds])] }))
  }

  async reset(): Promise<AppData> {
    const fresh = createInitialData()
    this.write(fresh)
    return fresh
  }
}

/** 앱 전체가 사용하는 저장소. 백엔드로 옮길 때 이 한 줄만 교체 */
export const dataStore: DataStore = new LocalDataStore()

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
