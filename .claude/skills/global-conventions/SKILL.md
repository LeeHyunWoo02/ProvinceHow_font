---
name: global-conventions
description: ProvinceHow(지방어때) 프론트엔드 전반에 통용되는 규약을 정의한다. 파일·컴포넌트·훅·스토어·상수·타입의 명명 규칙, 서버 응답 타입과 컴포넌트 props와 API 파라미터 타입을 각각 어디에 둘지, type과 interface 선택 기준, 절대 경로 import 통일과 import 정렬 순서, prettier·eslint 설정에서 오는 코드 스타일 제약, any·as·non-null 단언 금지 기준과 unknown 사용법, console 금지와 한국어 사용자 메시지 원칙, 주석 작성 기준, 죽은 코드 처리 규칙을 담는다. 이름을 지을 때, 타입 정의 위치를 정할 때, import를 정리할 때, 주석을 달 때, 타입 우회가 필요해 보일 때 사용한다. 폴더 배치는 architecture-conventions, 컴포넌트 작성은 component-conventions, API 타입은 api-conventions, Tailwind는 styling-conventions를 따른다.
---

# global-conventions

TypeScript 5.9 `strict: true` · prettier 3.1.1 · eslint 8.57.1(`--max-warnings=0`).
경로 별칭은 `baseUrl: "./src"`이며 `vite-tsconfig-paths`가 처리한다.

---

## 1. 명명

| 대상 | 규칙 | 예 |
|---|---|---|
| 컴포넌트 파일 | `PascalCase.tsx` | `RegionCard.tsx` |
| 그 외 파일 | `camelCase.ts` | `regionCodes.ts`, `comparisonStore.ts` |
| 훅 파일 | `use<이름>.ts` | `useRegionDetail.ts` |
| 폴더 | `camelCase` (단일어 소문자 선호) | `features/recommendation/` |
| 컴포넌트 | `PascalCase` | `RegionDrilldown` |
| 훅 | `use` + camelCase | `useComparison` |
| 함수 | camelCase 동사로 시작 | `fetchRegionDetail`, `encodeBitmask` |
| 모듈 상수 | `SCREAMING_SNAKE_CASE` | `MONTHLY_PRICE_OPTIONS`, `DEFAULT_PRICE` |
| 타입·인터페이스 | `PascalCase`. `I` 접두사 금지 | `RegionDetail` |
| props 타입 | `<컴포넌트명>Props` | `RegionCardProps` |
| 불리언 | `is` / `has` / `can` 접두사 | `isLoading`, `hasScore`, `canAdd` |

### 함수 접두사

| 접두사 | 의미 | 예 |
|---|---|---|
| `fetch` | 서버 요청 | `fetchRegionDetail` |
| `map` | 서버 응답 → 도메인 타입 | `mapDetailResponse` |
| `to` | 타입 변환·정규화 | `toRecord`, `toNullableNumber`, `toInfraStats` |
| `format` | 표시용 문자열 | `formatKRWMan`, `formatNumberComma` |
| `load` / `get` | 로컬 데이터 조회 (요청 아님) | `loadSidoList`, `getSigunguBySido` |
| `handle` | 이벤트 핸들러 | `handleJobInputBlur` |
| `on` | 콜백 prop | `onCardClick`, `onSelect` |

### 도메인 용어 — 서버 용어를 그대로 쓴다

`sidoCode`, `sigunguCode`, `midJobCode`, `dwellingType`, `infraImportance`, `supportTag`.
**한글 발음 표기(`siGunGu`)나 의역(`districtCode`)으로 바꾸지 않는다.**

외부 API 원시 용어(`plcyNm`, `aplyUrlAddr`, `plcyKywdNm`)는 **매핑 함수 밖으로 나가지 않는다.**
`src/utils/index.ts:262-264`에서 `title` / `url` / `keyword`로 변환된 뒤부터는 도메인 용어만 쓴다.

---

## 2. 타입 정의 위치

| 타입 | 위치 |
|---|---|
| 서버 응답 도메인 타입 | `features/<name>/model/types.ts` (여러 feature가 쓰면 `shared/types/`) |
| API 요청 파라미터 | 해당 `features/<name>/api/` 파일 안 |
| 컴포넌트 props | **그 컴포넌트 파일 상단** |
| zustand 상태 | 스토어 파일 안 |
| 한 파일에서만 쓰는 보조 타입 | 그 파일 안 |

**props 타입을 별도 `types.ts`로 빼지 않는다.** 컴포넌트와 같은 파일에 둔다.

현재 `RegionDetail` 등은 `src/types/search.ts`에, `RecommendationParams`·`CodeItem`은 `src/utils/index.ts:18,39`에 있다.
feature로 이동할 때 위 표에 맞춘다.

### `type` vs `interface`

**`type`을 기본으로 쓴다.** `interface`는 `extends`로 확장할 때만 쓴다.

```ts
// Good — 확장이 실제로 있다 (src/types/search.ts:19)
export interface DwellingSimpleInfo { monthMid?: number | null }
export interface DwellingInfo extends DwellingSimpleInfo { monthAvg?: number | null }

// Good — 그 외 전부
type RegionCardProps = { item: RegionRecommendation }
export type InfraMajor = 'HEALTH' | 'FOOD' | 'CULTURE' | 'LIFE'
```

### 유니언 리터럴 + `as const`

문자열 상수 집합은 유니언 타입으로 좁힌다. 옵션 배열에는 `as const`를 붙인다.

```ts
export type InfraMajor = 'HEALTH' | 'FOOD' | 'CULTURE' | 'LIFE'

const INFRA_MAJORS = [
  { id: 'HEALTH', label: '건강' },
  { id: 'FOOD', label: '식생활' }
] as const                                     // ✓ id가 리터럴 타입으로 좁혀진다
```

### `null` vs `undefined`

- **서버가 준 "값 없음"은 `null`** — 매핑 함수가 `?? null`로 정규화한다
- **애초에 안 넘어온 선택 값은 `undefined`** — 선택 prop, 선택 파라미터
- 둘을 함께 받아야 하면 `?: T | null`로 명시한다 (`score?: number | null`)

---

## 3. import

### 절대 경로로 통일한다

`baseUrl: "./src"`이므로 `src/` 기준 절대 경로를 쓴다. **상대 경로는 같은 폴더(`./`) 안에서만 허용한다.**

```tsx
// Bad — 현행 src/pages/MapSearch.tsx:7-8 (같은 파일 안에서 혼용)
import RegionCard from 'components/RegionCard'
import InteractiveMap from '../components/InteractiveMap'    // ✗
import { REGION_JSON } from '../utils/regionCodes'           // ✗

// Good
import { RegionCard } from 'features/region'
import InteractiveMap from 'features/map/components/InteractiveMap'
import { REGION_JSON } from 'shared/lib/regionCodes'
```

`InteractiveMap.tsx:2-4`, `RegionPreviewMap.tsx:2-3`도 같은 문제가 있다.

### 정렬 순서

빈 줄로 그룹을 나눈다.

```tsx
// 1. 외부 라이브러리
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

// 2. shared
import { classNames } from 'shared/lib/classNames'
import LoadingIndicator from 'shared/components/LoadingIndicator'

// 3. 다른 feature (공개 진입점만)
import { RegionCard } from 'features/region'

// 4. 같은 feature 내부
import { useRecommendations } from '../api/useRecommendations'

// 5. 타입 전용
import type { RegionRecommendation } from 'features/region'
```

- **타입만 쓰는 import는 `import type`으로 분리한다.** `isolatedModules: true`라 중요하다
- 자동 정렬 플러그인은 설정돼 있지 않다. 손으로 지킨다

---

## 4. 코드 스타일 (prettier가 강제)

```
세미콜론 없음        semi: false
작은따옴표           singleQuote: true
후행 콤마 없음       trailingComma: "none"
들여쓰기 2칸, LF     .editorconfig
```

**손으로 포맷을 맞추려 하지 말고 prettier 설정을 따른다.** 포맷만 바꾸는 커밋을 만들지 않는다.

---

## 5. 타입 안전성

### `any` 금지

현재 저장소에 명시적 `any`는 **0건**이다. 이 상태를 유지한다. `@ts-ignore` / `@ts-expect-error`도 0건이다.

```ts
// Bad
function parse(data: any) { return data.items }

// Good
function parse(data: unknown) {
  const record = toRecord(data)
  return Array.isArray(record?.items) ? record.items : []
}
```

### `as` 단언

**타입 가드나 정규화 함수로 대체할 수 있으면 대체한다.** 불가피하면 매핑 함수 안에서만 쓴다.

```ts
// Good — 검증한 뒤 좁힌다 (src/utils/index.ts:366-377)
if (typeof major !== 'string' || !VALID_INFRA_MAJORS.includes(major as InfraStat['major'])) {
  return null
}
const entry: RegionDetailInfraItem = { major: major as InfraStat['major'], ... }

// Good — 타입 술어로 걸러낸다 (:381)
.filter((entry): entry is RegionDetailInfraItem => entry !== null)

// Bad — 컴포넌트에서 응답을 단정
const detail = response as RegionDetail
```

### non-null 단언 `!`

`.eslintrc:30`에서 규칙이 꺼져 있지만 **새로 쓰지 않는다.** 옵셔널 체이닝과 기본값으로 처리한다.

예외: `src/index.tsx:6`의 `document.getElementById('root') as HTMLDivElement` — 엔트리 1회성이라 유지한다.

### 앰비언트 모듈 선언 금지

```ts
// src/types/react-router-dom.d.ts:1  ← 제거 대상
declare module 'react-router-dom'
```

라이브러리 전체를 `any`로 만든다. 그래서 `Navbar.tsx:72,76,98`에서 `isActive` 타입을 손으로 적고 있다.
**`.d.ts`에 `declare module '<라이브러리>'`를 새로 추가하지 않는다.** 타입이 없으면 `@types/*`를 설치한다.

---

## 6. 메시지와 로깅

### 사용자에게 보이는 문자열은 전부 한국어

```tsx
'추천 데이터를 불러오지 못했습니다.'
'조건에 맞는 추천 결과를 검색해 주세요.'
'표시할 지원정책이 없습니다.'
```

- 존댓말 종결(`~습니다`, `~해 주세요`)로 통일한다
- i18n 라이브러리는 없다. 문자열을 JSX에 직접 쓴다
- 에러 메시지에 내부 예외·스택·URL을 노출하지 않는다

### `console` 금지

현재 `console.*`는 **0건**이다. 디버깅 출력은 커밋 전에 지운다.
에러는 삼키지 말고 상태로 올려 화면에 표시한다 → api-conventions §6.

---

## 7. 주석

**"무엇을"이 아니라 "왜"를 쓴다.** 한국어로 쓴다(기존 코드가 한국어·영어 혼용이지만 앞으로는 한국어).

```tsx
// Good — 코드만 봐서는 모르는 이유
// 시군구 선택 시 해당 시도 자동 채움          (RegionDrilldown.tsx:260)
// 만약 시도가 비어 있어 전역 목록을 보여줄 때는 전역 중복 기준 적용   (RegionDrilldown.tsx:80)

// Bad — 코드를 그대로 옮긴 것
// zustand store used directly; no provider needed   (App.tsx:8, 이미 죽은 주석)
// notify parent when view changes                   (InteractiveMap.tsx:80)
```

- JSX 섹션 구분 주석(`{/* 주거 유형 */}`)은 긴 폼에서 유용하다. 유지한다
- **주석 처리된 코드를 남기지 않는다.** `LoadingIndicator.tsx:73-84`, `RegionDrilldown.tsx:167`이 그 상태다
- `@deprecated`를 붙였으면 제거 시점을 함께 적는다

---

## 8. 죽은 코드

**호출부가 없으면 지운다.** "나중에 쓸지 몰라서" 남기지 않는다. git이 기억한다.

현재 확인된 미사용(호출부 0건):

| 대상 | 위치 |
|---|---|
| `fetchSidoCodes`, `fetchSigunguCodes` | `src/utils/index.ts:546, 551` — `assets/regions.json`으로 대체됨 |
| `decodeBitmask` | `src/utils/bitmask.ts:22` |
| `formatKRW` | `src/utils/index.ts:561` |
| `SearchFilters`, `isLegacyFilters`, `legacyToRecommendationParams`, `legacySupportTagMap` | `src/utils/index.ts:31-37, 141-196` — `@deprecated` |
| `src/assets/sigungu2.json` (13.8MB) | 참조 0건 |
| 주석 처리된 스피너·배지 | `LoadingIndicator.tsx:73-84`, `RegionDrilldown.tsx:167` |
| highlight.js CDN import | `src/index.css:2` — 하이라이팅 기능 없음 |

새로 함수를 추가할 때 **호출부를 같은 변경에 포함시킨다.** 쓰이지 않는 export를 미리 만들지 않는다.

---

## 9. 하지 말 것

- `any`, `@ts-ignore`, `@ts-expect-error`
- `declare module '<라이브러리>'`
- 새 non-null 단언 `!`
- 상대 경로 import (같은 폴더 `./` 제외)
- `console.*`
- 영어 사용자 메시지
- 주석 처리된 코드 커밋
- 호출부 없는 export 추가
- 포맷만 바꾸는 변경
- `I` 접두사 인터페이스, `Impl` 접미사

---

## 10. 체크리스트

1. 파일명·심볼명이 §1 표를 따르는가
2. 서버 도메인 용어(`sigunguCode` 등)를 그대로 썼는가. 외부 API 원시 용어가 매핑 함수 밖으로 새지 않았는가
3. 타입이 §2 표의 위치에 있는가. props 타입이 컴포넌트 파일 안에 있는가
4. `interface`를 `extends`가 있을 때만 썼는가
5. import가 절대 경로이고 §3 순서로 그룹지어져 있는가
6. 타입 전용 import에 `import type`을 썼는가
7. `any` / `@ts-ignore` / 새 `!` 단언이 없는가
8. `as` 단언이 검증 뒤에만 쓰였는가
9. 사용자 메시지가 한국어 존댓말인가
10. `console.*`가 없는가
11. 주석이 "왜"를 설명하는가. 주석 처리된 코드를 남기지 않았는가
12. 추가한 export에 호출부가 있는가
13. `pnpm run typecheck`와 `pnpm run lint`가 통과하는가
