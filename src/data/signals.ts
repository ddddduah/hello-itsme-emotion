import type { BodySignalId, SituationId } from '../types'

/** 감정 찾기 도우미 1단계 선택지 */
export const BODY_SIGNALS: { id: BodySignalId; label: string }[] = [
  { id: 'chest-tight', label: '가슴이 답답해요' },
  { id: 'face-hot', label: '얼굴이 뜨거워요' },
  { id: 'drained', label: '힘이 쭉 빠져요' },
  { id: 'heart-racing', label: '심장이 빨리 뛰어요' },
  { id: 'light', label: '몸이 가벼워요' },
  { id: 'tense', label: '어깨나 몸이 굳어 있어요' },
  { id: 'tearful', label: '눈물이 날 것 같아요' },
  { id: 'queasy', label: '속이 울렁거리거나 불편해요' },
  { id: 'warm', label: '가슴이 따뜻해져요' },
  { id: 'loose', label: '몸이 느슨하게 풀려요' },
  { id: 'frozen', label: '순간 몸이 멈칫했어요' },
  { id: 'restless', label: '가만히 있기가 힘들어요' },
]

/** 감정 찾기 도우미 3단계 선택지 */
export const SITUATIONS: { id: SituationId; label: string }[] = [
  { id: 'loss', label: '무언가를 잃었어요' },
  { id: 'unmet', label: '기대가 어긋났어요' },
  { id: 'unfair', label: '부당한 일을 겪었어요' },
  { id: 'threat', label: '위협이나 위험을 느꼈어요' },
  { id: 'gain', label: '원하는 걸 얻었어요' },
  { id: 'connected', label: '누군가와 연결되었어요' },
  { id: 'alone', label: '혼자라고 느꼈어요' },
  { id: 'mistake', label: '실수했거나 잘못한 것 같아요' },
  { id: 'exposed', label: '남들 앞에서 드러났어요' },
  { id: 'unexpected', label: '예상 못 한 일이 생겼어요' },
  { id: 'blocked', label: '일이 뜻대로 풀리지 않아요' },
  { id: 'relief', label: '걱정하던 일이 지나갔어요' },
  { id: 'uncertain', label: '앞일을 알 수 없어요' },
  { id: 'aversive', label: '싫은 것을 마주했어요' },
  { id: 'anticipation', label: '좋은 일이 다가오고 있어요' },
  { id: 'free-time', label: '여유 시간이 생겼어요' },
]
