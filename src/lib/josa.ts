/** 마지막 글자에 받침이 있는지 (한글이 아니면 false) */
export function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return false
  return code % 28 !== 0
}

/** 이/가 */
export const iGa = (word: string) => (hasBatchim(word) ? '이' : '가')
