/** 아직 구현되지 않은 단계 자리 표시 (단계별 작업이 끝나면 제거) */
export default function StagePlaceholder({ stage, children }: { stage: number; children: string }) {
  return (
    <div className="rounded-blob border border-dashed border-line bg-paper px-5 py-8 text-center text-sm leading-relaxed text-ink-soft">
      <span className="mb-2 inline-block rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink-soft">
        {stage}단계에서 만들어요
      </span>
      <p>{children}</p>
    </div>
  )
}
