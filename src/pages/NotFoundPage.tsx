import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="길을 잃었어요" sub="찾으시는 페이지가 없어요." />
      <Link to="/" className="text-accent underline">마이홈으로 돌아가기</Link>
    </>
  )
}
