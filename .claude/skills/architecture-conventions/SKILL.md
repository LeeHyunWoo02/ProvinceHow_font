---
name: architecture-conventions
description: ProvinceHow(지방어때) 프론트엔드의 feature 기반 디렉터리 구조를 정의한다. app/features/shared 3계층과 단방향 의존 규칙, feature 경계를 나누는 기준, 다른 feature를 참조하는 유일한 통로인 index.ts 공개 진입점, 순환 참조를 콜백 prop으로 끊는 방법, shared로 승격하는 기준, 타입별 구조(components/pages/utils)에서 넘어오는 이행 절차를 담는다. 새 파일을 어느 폴더에 둘지 정하거나, 기능을 나누거나, 다른 feature의 코드를 쓰고 싶거나, 기존 파일을 옮길 때 사용한다. 컴포넌트 분리와 상태 위치는 component-conventions, API 계층 배치는 api-conventions, 파일·심볼 명명과 import 순서는 global-conventions, Tailwind 사용은 styling-conventions를 따른다.
---

# architecture-conventions

React 18 · TypeScript 5.9(strict) · Vite 5 · react-router-dom 7 · zustand 4 · TanStack Query v5(도입 대상) · TailwindCSS 3.
경로 별칭은 `baseUrl: "./src"`이므로 **`src/` 기준 절대 경로로 import한다**(`tsconfig.json:3`, `vite.config.ts:7`).

---

## 1. 3계층

```
app  →  features  →  shared  →  (외부 라이브러리)
```

의존은 **왼쪽에서 오른쪽으로만** 흐른다. 역방향과 순환은 금지다.

| 계층 | 무엇을 두는가 | 무엇을 import할 수 있는가 |
|---|---|---|
| `app/` | 라우터, 전역 프로바이더, 레이아웃. 화면 로직은 두지 않는다 | `features/*`의 barrel, `shared/*` |
| `features/<name>/` | 한 기능의 화면·상태·API·도메인 규칙 | 같은 feature 내부 전부, 다른 feature의 **`index.ts`만**, `shared/*` |
| `shared/` | 어느 기능에도 속하지 않는 범용 코드 | `shared/*`, 외부 라이브러리 |

**`shared/`는 기능을 몰라야 한다.** `shared/` 안에서 `features/`나 `app/`을 import하는 순간 구조가 무너진다.

---

## 2. feature 목록

이 저장소의 feature는 4개다. **임의로 늘리지 않는다.**

| feature | 책임 | 담당 라우트 |
|---|---|---|
| `region` | 지역 선택(드릴다운), 지역 상세 정보, 지역 요약 카드, 지역 미리보기 지도 | `/region` |
| `recommendation` | 조건 필터 입력, 추천 결과 목록 | `/search` |
| `comparison` | 여러 지역 담기·비교 | `/compare` |
| `map` | 대화형 지도로 시도→시군구 탐색 | `/map` |

새 feature는 **자기 라우트를 가질 때만** 만든다. 라우트 없이 화면 일부만 담당하는 것은 기존 feature의 `components/`다.

---

## 3. feature 내부 구조

```
features/<name>/
├─ api/          엔드포인트 함수 + useQuery 훅 + 응답 매핑 함수
├─ components/   이 feature에서만 쓰는 컴포넌트
├─ model/        타입, zustand 스토어, 순수 함수(도메인 규칙)
├─ pages/        라우트가 직접 렌더링하는 화면
└─ index.ts      공개 진입점
```

- 하위 폴더는 **필요할 때만** 만든다. `comparison`처럼 API가 없으면 `api/`를 만들지 않는다.
- `pages/` 아래 파일은 **다른 곳에서 import하지 않는다.** 오직 `app/`의 라우터만 쓴다.
- `model/`에는 React를 import하지 않는 코드를 둔다. 훅이 필요하면 `api/`나 `components/`로 간다.
  (예외: zustand 스토어는 `model/`에 둔다. 훅 형태지만 React 렌더링 로직이 아니다.)

---

## 4. 공개 진입점 (`index.ts`)

**다른 feature가 쓸 수 있는 것만 barrel에 내보낸다.** 내부 경로 직접 import는 금지다.

```ts
// features/region/index.ts
export { default as RegionCard } from './components/RegionCard'
export { default as RegionDrilldown } from './components/RegionDrilldown'
export { useRegionDetail } from './api/useRegionDetail'
export type { RegionDetail, RegionRecommendation } from './model/types'
```

### Bad — 다른 feature의 내부를 뚫고 들어간다

```tsx
// features/comparison/pages/Comparison.tsx
import RegionCard from 'features/region/components/RegionCard'   // ✗ 내부 경로
```

### Good

```tsx
// features/comparison/pages/Comparison.tsx
import { RegionCard } from 'features/region'                     // ✓ 공개 진입점
```

**barrel은 feature 경계에만 만든다.** `components/index.ts` 같은 내부 barrel은 만들지 않는다.
같은 feature 안에서는 파일을 직접 import한다.

---

## 5. 순환 참조를 끊는 법

두 feature가 서로를 필요로 하면 **콜백 prop으로 의존을 역전시킨다.** 아래가 이 저장소의 실제 사례다.

### Bad — 현재 코드. `region → comparison` 의존이 박혀 있다

```tsx
// src/components/RegionCard.tsx:43  (현행)
import { useComparison } from 'state/comparisonStore'

export default function RegionCard({ item, canAdd = false, jobCodeForDetail }) {
  const { addBySigunguCode } = useComparison()   // ✗ 카드가 비교 기능을 직접 안다
  ...
  <button onClick={(event) => {
    addBySigunguCode(String(item.sigunguCode), ...)
  }}>비교에 추가</button>
}
```

`comparison`은 `RegionCard`를 쓰고(`src/pages/Comparison.tsx:378`), `RegionCard`는 `comparison` 스토어를 쓴다 → **순환**.

### Good — 카드는 "눌렸다"만 알린다

```tsx
// features/region/components/RegionCard.tsx
type RegionCardProps = {
  item: RegionRecommendation
  onAdd?: (sigunguCode: string) => void   // ✓ 누가 무엇을 하는지 모른다
  onCardClick?: (sigunguCode: string) => void
}

// 호출부: features/comparison/pages/Comparison.tsx
const { addBySigunguCode } = useComparison()
<RegionCard item={rec} onAdd={addBySigunguCode} />
```

`onAdd`가 없으면 버튼을 렌더링하지 않는다. 현행의 `canAdd` prop이 자연스럽게 사라진다.

---

## 6. `shared/`로 올리는 기준

| 조건 | 판단 |
|---|---|
| **2개 이상 feature가 실제로 쓴다** + 기능 개념을 모른다 | `shared/`로 올린다 |
| 2개 이상이 쓰지만 특정 도메인 개념이다 (예: 지역 카드) | 그 도메인의 feature에 두고 barrel로 공개한다 |
| 1개 feature만 쓴다 | 해당 feature에 둔다. "언젠가 쓸 것 같아서" 올리지 않는다 |

### 배치 판정 예시 (현행 파일 기준)

| 현재 파일 | 목표 위치 | 이유 |
|---|---|---|
| `src/utils/index.ts`의 `apiGet`·`ApiError` | `shared/api/client.ts` | 모든 feature가 쓰고 도메인을 모른다 |
| `src/utils/index.ts`의 `formatKRWMan`·`formatNumberComma` | `shared/lib/formatters.ts` | 순수 표시 포맷. 도메인 무관 |
| `src/utils/index.ts`의 `mapDetailResponse` | `features/region/api/mappers.ts` | 지역 상세 응답 전용 |
| `src/utils/index.ts`의 `fetchRecommendations` | `features/recommendation/api/` | 추천 전용 |
| `src/utils/bitmask.ts` | `shared/lib/bitmask.ts` | 범용 비트 연산 |
| `src/utils/regionCodes.ts` | `shared/lib/regionCodes.ts` | `region`·`map` 둘 다 쓴다(`InteractiveMap.tsx:2`, `RegionDrilldown.tsx:4`) |
| `src/components/LoadingIndicator.tsx` | `shared/components/` | 4개 화면이 쓴다 |
| `src/components/Navbar.tsx` | `shared/components/` | 앱 셸이 쓴다 |
| `src/components/RegionCard.tsx` | `features/region/components/` | `recommendation`·`comparison`·`map`이 쓰지만 지역 도메인 개념 |
| `src/components/InteractiveMap.tsx` | `features/map/components/` | `MapSearch`만 쓴다 |
| `src/components/RegionPreviewMap.tsx` | `features/region/components/` | `RegionInfo`만 쓴다 |
| `src/state/comparisonStore.ts` | `features/comparison/model/` | 비교 전용 |
| `src/state/recommendationFilters.ts` | `features/recommendation/model/` | 필터 전용 (단, `RegionInfo.tsx:46`이 태그 필터를 공유 중 → §8) |

---

## 7. 라우트 경로는 `app/routes.ts`가 정본

경로 문자열이 지금 3곳에 흩어져 있다: `src/components/App.tsx:17-22`(정의), `src/components/Navbar.tsx:27-32`(메뉴),
각 페이지의 `navigate('/region?...')`(`DetailSearch.tsx:678`, `MapSearch.tsx:162`, `Comparison.tsx:207`).

### Good

```ts
// app/routes.ts
export const ROUTES = {
  map: '/map',
  search: '/search',
  region: '/region',
  compare: '/compare'
} as const

export function regionPath(sigunguCode: string, jobCode?: string) {
  const search = new URLSearchParams({ sigunguCode })
  if (jobCode) search.set('jobCode', jobCode)
  return `${ROUTES.region}?${search.toString()}`
}
```

`/region`으로 가는 URL 조립이 현재 3가지 방식으로 제각각이다(§4 조사 결과). `regionPath()` 하나로 통일한다.

---

## 8. feature 경계에 걸친 기존 위반

새로 만들 때 따라 하지 말 것. 건드리게 되면 함께 정리한다.

| 위치 | 문제 |
|---|---|
| `src/components/RegionCard.tsx:43` | `region` 컴포넌트가 `comparison` 스토어를 직접 호출 → 순환 (§5) |
| `src/pages/RegionInfo.tsx:46` | `region` 화면이 `recommendation`의 `useRecommendationFilters`에서 지원태그 선택 상태를 공유. **지원태그 필터는 두 화면이 함께 쓰는 상태**이므로 `shared/`의 스토어나 URL 쿼리로 올려야 한다 |
| `src/state/comparisonStore.ts:22` | 스토어가 `fetchRegionDetail`을 직접 호출해 `comparison → region`의 API 의존 발생. 데이터 페칭은 Query 훅으로 옮기고 스토어는 코드 목록만 들고 있게 한다 → api-conventions |
| `src/components/App.tsx` | 라우터 루트가 재사용 컴포넌트와 같은 폴더에 있다 → `app/App.tsx` |
| `src/pages/MapSearch.tsx:7-8` | 같은 파일 안에서 절대 경로와 상대 경로를 섞어 쓴다 → global-conventions |

---

## 9. 이행 규칙

목표 구조는 **아직 적용되지 않았다.** 현재는 `src/{components,pages,state,types,utils}` 타입별 배치다.

1. **새 파일은 목표 구조로 만든다.**
2. **기존 파일은 그 파일을 수정하는 작업이 생겼을 때 함께 옮긴다.** 옮기는 것 자체를 목적으로 삼지 않는다.
3. **요청 없이 대규모 이동을 시작하지 않는다.** 파일 이동은 diff가 커서 리뷰가 불가능해진다.
4. 파일을 옮기면 **import 경로를 모두 고치고 `pnpm run typecheck`로 확인한다.** 경로 별칭이라 컴파일러가 잡아준다.
5. 옮기는 김에 로직을 바꾸지 않는다. **이동 커밋(`refactor:`)과 동작 변경 커밋을 분리한다.**

---

## 10. 체크리스트

1. 새 파일이 `app/` · `features/<name>/` · `shared/` 중 맞는 자리에 있는가
2. `shared/`에서 `features/`나 `app/`을 import하지 않는가
3. 다른 feature를 참조할 때 `index.ts` 공개 진입점만 거치는가
4. feature 간 순환 참조가 없는가. 있다면 콜백 prop으로 역전시켰는가
5. `pages/` 아래 파일을 `app/`의 라우터 외에서 import하지 않는가
6. `shared/`로 올린 것이 정말 2개 이상 feature에서 쓰이며 도메인 개념이 없는가
7. 라우트 경로 문자열을 `app/routes.ts` 밖에서 새로 쓰지 않았는가
8. `model/`에 React 렌더링 코드를 넣지 않았는가 (zustand 스토어는 예외)
9. 내부 barrel(`components/index.ts` 등)을 만들지 않았는가
10. 파일을 옮겼다면 `pnpm run typecheck`가 통과하는가
