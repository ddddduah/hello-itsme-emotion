// ─────────────────────────────────────────────
// 감정 데이터
// ─────────────────────────────────────────────

export type FamilyId =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'shame'
  | 'love'
  | 'calm'

export type Energy = 'high' | 'low'

/** 감정 찾기 도우미 1단계: 몸 감각 */
export type BodySignalId =
  | 'chest-tight'
  | 'face-hot'
  | 'drained'
  | 'heart-racing'
  | 'light'
  | 'tense'
  | 'tearful'
  | 'queasy'
  | 'warm'
  | 'loose'
  | 'frozen'
  | 'restless'

/** 감정 찾기 도우미 3단계: 상황 */
export type SituationId =
  | 'loss'
  | 'unmet'
  | 'unfair'
  | 'threat'
  | 'gain'
  | 'connected'
  | 'alone'
  | 'mistake'
  | 'exposed'
  | 'unexpected'
  | 'blocked'
  | 'relief'
  | 'uncertain'
  | 'aversive'
  | 'anticipation'
  | 'free-time'

export interface SimilarEmotion {
  /** 비교 대상 감정 id */
  id: string
  /** "이 감정"의 입장에서 본 차이 설명 */
  difference: string
}

export interface Emotion {
  id: string
  /** 기본형 이름. 예: "서운하다" */
  name: string
  /** 명사형 이름. 리포트 문구 등에 사용. 예: "서운함" */
  noun: string
  family: FamilyId
  /** 쉬운 말로 1~2문장 */
  definition: string
  /** 이런 순간에 느껴요 (2개) */
  examples: [string, string]
  similarTo: SimilarEmotion[]
  /** 기록 텍스트 매칭용 활용형 키워드 (단어 시작 위치에서 매칭) */
  keywords: string[]
  bodySignals: BodySignalId[]
  situations: SituationId[]
  energy: Energy
  /** 0 = 처음부터 해금. 1부터 매일 자동 해금되는 순서 */
  unlockOrder: number
}

// ─────────────────────────────────────────────
// 사용자 데이터
// ─────────────────────────────────────────────

/** 로컬 날짜 키 'YYYY-MM-DD' (사용자 로컬 시간 기준) */
export type DateKey = string

export type Intensity = 1 | 2 | 3 | 4 | 5

export interface EntryEmotion {
  emotionId: string
  intensity: Intensity
}

export interface Entry {
  id: string
  /** ISO 타임스탬프 */
  createdAt: string
  /** 기록 당시의 로컬 날짜 */
  date: DateKey
  text: string
  emotions: EntryEmotion[]
}

export type UnlockSource = 'initial' | 'daily' | 'keyword' | 'hidden' | 'finder'

export interface UnlockRecord {
  emotionId: string
  /** ISO 타임스탬프 */
  unlockedAt: string
  source: UnlockSource
}

export interface AppData {
  schemaVersion: 1
  entries: Entry[]
  unlocks: UnlockRecord[]
  /** 마지막으로 일일 해금을 지급한 로컬 날짜 */
  lastDailyUnlock: DateKey | null
  /** 마이홈에서 "이사 왔어요!" 연출을 이미 본 감정 id */
  moveInSeen: string[]
}
