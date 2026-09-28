# 마음집

매일 감정을 기록하며 감정 단어를 하나씩 "잠금 해제"하고, 마이홈에 사는 감정 캐릭터들을 모아 가는 웹사이트.

## 실행

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입 검사 + 프로덕션 빌드
npm run lint
```

## 구조

```
src/
  types.ts              감정·기록·해금 타입
  data/emotions.ts      감정 단어 61개 (정의, 예시, 헷갈리는 감정, 활용형 키워드, 해금 순서)
  data/families.ts      감정 가족 9개 (이름, 모티프, 색 토큰)
  data/signals.ts       감정 찾기 도우미 선택지 (몸 감각, 상황)
  lib/storage.ts        DataStore 인터페이스 + localStorage 구현 (백엔드 교체 지점)
  lib/date.ts           로컬 날짜 유틸
  store/AppDataContext  앱 전역 데이터
  pages/                마이홈 · 기록하기 · 도감 · 도감 상세 · 리포트
  index.css             Tailwind 테마 / 감정 가족 색 토큰
```

이 서비스는 감정 알아차리기를 돕는 도구이며 전문 상담을 대체하지 않습니다.
