import PageHeader from '../components/PageHeader'
import StagePlaceholder from '../components/StagePlaceholder'

export default function ReportPage() {
  return (
    <>
      <PageHeader title="나의 감정 리포트" sub="요즘 내 마음의 집에 누가 자주 머물렀는지 살펴봐요." />
      <StagePlaceholder stage={6}>주간 리포트, 감정 가족 비율, 요일별 패턴이 들어와요.</StagePlaceholder>
    </>
  )
}
