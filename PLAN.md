# Vivid Fresh — 구현 계획서

> 최종 수정: 2026-05-17

---

## 확정된 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router) | proxy.ts (구 middleware) |
| Styling | Tailwind CSS v4 + shadcn/ui | |
| **데이터 저장** | **Zustand + localStorage (persist)** | 프로토타입 단계, DB 없음 |
| AI | Anthropic Claude API | 레시피 추천, API 키 필요 |
| 알림 | Web Push API + VAPID | 직접 구현, sw.js |
| i18n | next-intl v4 | 쿠키 기반 (URL prefix 없음) |
| 인증 | **없음** | 단일 사용자 |
| 임박 기준 | D-7 (설정에서 변경 가능) | |
| 상태관리 | Zustand v5 | |

---

## 실제 구현된 폴더 구조

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx              # 헤더 + 하단 탭 + AppInitializer
│   │   ├── dashboard/page.tsx      # 대시보드
│   │   ├── ingredients/
│   │   │   ├── page.tsx            # 식재료 목록 (검색/필터/정렬)
│   │   │   ├── new/page.tsx        # 식재료 추가 (수동입력 + 바코드)
│   │   │   └── [id]/page.tsx       # 식재료 상세/수정/삭제
│   │   ├── recipes/page.tsx        # 레시피 (AI추천 + 매칭 + 내 레시피)
│   │   ├── groups/page.tsx         # 그룹 관리
│   │   ├── notifications/page.tsx  # (추후 확장)
│   │   └── settings/page.tsx       # 설정
│   ├── api/
│   │   ├── recipes/recommend/      # Claude AI 레시피 추천
│   │   ├── notifications/check/    # 만료 체크 (클라이언트 데이터 기반)
│   │   ├── push/subscribe/         # Push 구독 (JSON 파일 저장)
│   │   ├── push/send/              # Push 발송 (VAPID + web-push)
│   │   └── og/                     # OG 메타데이터 파싱
│   ├── layout.tsx                  # 루트 (next-intl provider)
│   └── page.tsx                    # → /dashboard 리다이렉트
├── components/
│   ├── layout/
│   │   ├── AppInitializer.tsx      # SW 등록 + 만료 체크 훅 실행
│   │   ├── TopBar.tsx
│   │   ├── BottomNav.tsx
│   │   └── NotificationBell.tsx
│   ├── ingredients/
│   │   └── BarcodeScanner.tsx
│   ├── recipes/
│   │   └── AddRecipeForm.tsx
│   ├── debug/
│   │   └── SeedDataButton.tsx      # 샘플 데이터 삽입
│   └── ui/                         # shadcn 컴포넌트
├── hooks/
│   ├── useExpiryCheck.ts           # 앱 시작시 만료 체크 → 알림 생성
│   └── useServiceWorker.ts         # SW 등록
├── stores/                         # Zustand (모두 localStorage persist)
│   ├── ingredientStore.ts
│   ├── recipeStore.ts
│   ├── notificationStore.ts
│   ├── settingsStore.ts
│   └── groupStore.ts
├── types/
│   └── database.ts
├── lib/
│   ├── utils.ts
│   ├── utils/expiry.ts
│   └── utils/categories.ts
└── proxy.ts                        # Next.js 16 proxy (구 middleware, 인증 없음)
```

---

## 데이터 아키텍처 (프로토타입)

```
브라우저 localStorage
├── vivifresh-ingredients    ← Zustand persist
├── vivifresh-recipes        ← Zustand persist
├── vivifresh-notifications  ← Zustand persist
├── vivifresh-settings       ← Zustand persist
├── vivifresh-groups         ← Zustand persist
└── vivifresh-last-check     ← 마지막 만료 체크 날짜

서버 파일 시스템 (로컬 개발용)
└── .push-subscriptions.json ← Web Push 구독 정보
```

---

## DB 스키마 (프로토타입 이후 마이그레이션 예정)

```prisma
model Ingredient {
  id           String    @id @default(cuid())
  name         String
  category     Category  @default(REFRIGERATED)
  quantity     Float
  unit         String    @default("개")
  purchaseDate DateTime?
  expiryDate   DateTime
  memo         String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Notification { ... }
model PushSubscription { ... }

enum Category { REFRIGERATED FROZEN ROOM_TEMP BEVERAGE CONDIMENT SNACK OTHER }
```

---

## 주요 화면 구성

### 1. 대시보드 (`/dashboard`)
- 임박 재료 요약 카드 (D-day 색상 코딩: 🔴만료/🟡임박/🟢여유)
- 빠른 추가 / 레시피 추천 바로가기
- 샘플 데이터 추가 버튼 (재료 없을 때)

### 2. 식재료 목록 (`/ingredients`)
- 카테고리 탭 필터 (전체/냉장/냉동/상온/음료/양념/간식)
- 정렬: 유통기한 임박순 / 이름순 / 등록순
- 검색 기능
- 바코드 스캔 지원

### 3. 레시피 추천 (`/recipes`)
- **AI 추천 탭**: Claude API가 보유 재료로 레시피 3개 추천 (임박 재료 우선)
- **추천 탭**: localStorage 레시피 DB와 재료 매칭 (%)
- **내 레시피 탭**: 사용자가 URL로 직접 추가한 레시피

### 4. 설정 (`/settings`)
- 알림 기준일 D-7/D-3/D-1/D-0 토글
- Web Push 알림 허용 (브라우저 권한 요청)
- 언어 전환 (한/영)
- 로컬 저장소 안내

---

## Web Push 흐름

```
1. 설정 → "허용하기" 클릭
2. 브라우저 권한 요청 (Notification.requestPermission)
3. serviceWorker.ready → pushManager.subscribe (VAPID 공개키)
4. 구독 정보 → POST /api/push/subscribe → .push-subscriptions.json
5. 만료 체크 (클라이언트): 앱 시작 시 useExpiryCheck 훅
6. 인앱 알림: Zustand notificationStore에 추가
7. Web Push (서버): POST /api/push/send (CRON_SECRET 필요)
8. sw.js → showNotification (백그라운드 수신)
```

---

## 환경 변수 (.env.local)

```env
# 식품안전나라 공공 API (바코드 → 제품 정보 자동 조회)
# 발급: https://www.foodsafetykorea.go.kr/api/openApiInfo.do
# 없으면 테스트 바코드(8801062432366 등)로 동작
FOOD_SAFETY_API_KEY=your_food_safety_api_key_here

# Anthropic Claude API (레시피 추천)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Web Push VAPID Keys (자동 생성 완료)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOVaKB3TQZ9cPGCoCURypydQMzoZaNrtPiRAp6udUFIaPq3jg-9l8Kz4efs0XCE0bq_lJoSd8EHDv0KKqhz1fuE
VAPID_PRIVATE_KEY=x3_vVd6lDVhmE7JFji2qdCTINezoWdWInmGsqyxVnQI
VAPID_MAILTO=mailto:admin@vivifresh.local

# Vercel Cron 보안 토큰
CRON_SECRET=local-dev-secret-change-in-production
```

---

## 설치된 패키지

```json
{
  "dependencies": {
    "next": "16.2.6",
    "react": "19.2.4",
    "tailwindcss": "^4",
    "shadcn": "^4.7.0",
    "@anthropic-ai/sdk": "latest",
    "web-push": "^3.6.7",
    "next-intl": "^4.12.0",
    "zustand": "^5.0.13",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.16.0",
    "sonner": "^2.0.7"
  }
}
```

---

## 구현 단계 현황

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 환경 설정 (proxy.ts, i18n, shadcn) | ✅ 완료 |
| 2 | 식재료 CRUD (Zustand + localStorage) | ✅ 완료 |
| 3 | 식재료 UI (목록/추가/수정/삭제/바코드) | ✅ 완료 |
| 4 | 대시보드 + ExpiryBadge 로직 | ✅ 완료 |
| 5 | Claude API 레시피 추천 | ✅ 완료 |
| 6 | Web Push 알림 (SW + 구독 + 발송 API) | ✅ 완료 |
| 7 | 앱 내 알림 (useExpiryCheck 훅) | ✅ 완료 |
| 8 | i18n 적용 (한/영 메시지) | ✅ 완료 |
| 9 | 그룹 기능 (로컬 모드) | ✅ 완료 |

---

## 다음 단계 (v2 계획)

| 항목 | 설명 |
|---|---|
| DB 마이그레이션 | Prisma + Neon으로 이전 |
| 인증 추가 | NextAuth.js (Google 로그인) |
| 실시간 동기화 | 여러 기기 간 데이터 공유 |
| Vercel Cron | 매일 자정 push 알림 발송 |
| 이미지 인식 | 바코드 → 상품명 자동 매핑 |
