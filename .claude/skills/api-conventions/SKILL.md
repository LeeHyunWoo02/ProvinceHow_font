---
name: api-conventions
description: ProvinceHow(지방어때) 프론트엔드의 서버 통신 규약을 정의한다. shared/api의 apiGet·ApiError 단일 진입점과 엔드포인트 상수, 서버 응답을 unknown으로 받아 도메인 타입으로 정규화하는 매핑 함수, TanStack Query v5 기반 쿼리 훅과 queryKey 계층 규칙, 로딩·에러·빈 상태 3분기 렌더링, 429 Retry-After 처리, 수동 캐시와 mounted 플래그 패턴에서 넘어오는 이행 절차를 담는다. API를 호출하거나 추가할 때, 쿼리 키를 정할 때, 로딩·에러 화면을 만들 때, 서버 응답 타입을 정의할 때 사용한다. 파일 배치는 architecture-conventions, 로딩·에러 UI 컴포넌트 작성은 component-conventions, 타입 정의 위치와 명명은 global-conventions를 따른다.
---

# api-conventions

백엔드는 별도 저장소의 Spring Boot 서버이며 `import.meta.env.VITE_API_BASE_URL` 하나로 지정한다(`.env.local`).
현재 서버 상태는 수동 캐시로 관리 중이고, **TanStack Query v5로 전환하는 것이 목표다**(§7).

---

## 1. 계층

```
컴포넌트  →  useXxxQuery (features/<name>/api/)  →  fetchXxx (features/<name>/api/)  →  apiGet (shared/api/client.ts)  →  fetch
                                                          ↓
                                                   mapXxxResponse (unknown → 도메인 타입)
```

| 위치 | 책임 |
|---|---|
| `shared/api/client.ts` | `apiGet<T>()`, `ApiError`. **`fetch`를 직접 부르는 유일한 곳** |
| `shared/api/endpoints.ts` | 경로 문자열 상수 |
| `shared/api/queryKeys.ts` | 쿼리 키 팩토리 |
| `features/<name>/api/*.ts` | 엔드포인트 함수, 매핑 함수, 쿼리 훅 |

**컴포넌트에서 `fetch`를 직접 호출하지 않는다.** 현재 코드도 이 규칙은 지키고 있다.

---

## 2. `apiGet` — 손대지 말 것

`src/utils/index.ts:84-139`의 구현이 정본이다. `shared/api/client.ts`로 옮기되 로직은 유지한다. 이미 처리하고 있는 것:

- base URL 미설정 시 명시적 에러 (`:77-82`)
- `undefined` / `null` / `''` 쿼리 파라미터 자동 제거 (`:94`)
- `Retry-After` 헤더 → `ApiError.retryAfterSeconds` (`:107-110`)
- 204 No Content → `undefined` 반환 (`:134-136`)
- 실패 시 `ApiError`로 통일 (status, code, payload 보존)

### 새 HTTP 메서드가 필요하면

현재 GET만 쓴다. POST가 필요하면 `apiGet`을 고치지 말고 `apiRequest(method, path, ...)`로 공통부를 뽑은 뒤
`apiGet`/`apiPost`를 그 위에 얹는다. 기존 호출부 시그니처를 깨지 않는다.

---

## 3. 엔드포인트 상수

경로 문자열 7개가 지금 인라인이다(`src/utils/index.ts:428, 463, 476, 501, 527, 547, 553`).

```ts
// shared/api/endpoints.ts
export const API = {
  recommend: '/api/recommend',
  detail: '/api/detail',
  code: {
    jobTop: '/api/code/jobTop',
    jobMid: '/api/code/jobMid',
    supportTag: '/api/code/supportTag'
  }
} as const
```

쿼리 파라미터 이름은 **서버가 정본이며 camelCase다**(`sigunguCode`, `midJobCode`, `dwellingType`, `infraImportance`).
지어내지 않는다. 확실하지 않으면 기존 호출부에서 확인한다.

---

## 4. 응답 매핑 — `unknown`으로 받아 좁힌다

**이것이 이 저장소의 핵심 관습이다.** 서버 응답을 제네릭으로 단정하지 않고 `unknown`으로 받아 매핑 함수를 거친다.

### Good — 현행 코드 (`src/utils/index.ts:271-298`)

```ts
export async function fetchRecommendations(filters: RecommendationParams) {
  const response = await apiGet<unknown>(API.recommend, { ...params })   // ✓ unknown
  const root = toRecord(response) ?? {}
  const itemsRaw = Array.isArray(root.items) ? root.items : []
  return { items: itemsRaw.map(mapRecommendationResponse) }
}

function mapRecommendationResponse(payload: unknown): RegionRecommendation {
  const source = toRecord(payload) ?? {}
  return {
    sidoCode: String(source.sidoCode ?? ''),          // ✓ 누락돼도 빈 문자열
    score: (source.score as number | null | undefined) ?? null,
    infraMajors: toInfraStats(source.infraMajors as ...)
  }
}
```

### Bad — 응답을 그대로 믿는다

```ts
const data = await apiGet<RegionDetail>('/api/detail', { sigunguCode })   // ✗
return data   // 필드가 없으면 런타임에서 터진다
```

### 매핑 함수 규칙

- 이름은 `mapXxxResponse`, 위치는 `features/<name>/api/mappers.ts`
- 입력 타입은 `unknown`, 반환은 도메인 타입 (`null` 허용 시 `Xxx | null`)
- 공통 헬퍼 `toRecord` / `toNullableNumber`(`src/utils/index.ts:198-207`)는 `shared/api/`로 옮겨 재사용한다
- **배열 필드는 반드시 `Array.isArray()`로 확인한 뒤 매핑한다**
- 유효하지 않은 항목은 `null`로 만들고 타입 가드로 걸러낸다 (`:381` 패턴)

### 별칭 필드를 늘리지 않는다

`mapDetailResponse`(`src/utils/index.ts:390-418`)는 `totalJobs`와 `totalJobInfo.count`,
`monthlyRentAvg`와 `dwellingInfo.monthAvg`, `infra`와 `infraDetails`를 **양쪽 다 채운다**.
호환을 위한 기존 부채이며 **새 별칭을 추가하지 않는다.** 새 필드는 한 곳에만 둔다.

---

## 5. 쿼리 훅 (TanStack Query v5)

### 쿼리 키

```ts
// shared/api/queryKeys.ts
export const queryKeys = {
  region: {
    detail: (sigunguCode: string, jobCode?: string) =>
      ['region', 'detail', sigunguCode, jobCode ?? null] as const
  },
  recommendation: {
    list: (params: RecommendationParams) => ['recommendation', 'list', params] as const
  },
  code: {
    supportTag: () => ['code', 'supportTag'] as const,
    jobTop: () => ['code', 'jobTop'] as const,
    jobMid: (topCode: string) => ['code', 'jobMid', topCode] as const
  }
} as const
```

규칙:
- **키는 `[도메인, 리소스, ...식별자]` 순서**로 넓은 것부터 좁은 것으로 간다
- 키 배열을 컴포넌트에서 손으로 쓰지 않는다. 반드시 팩토리를 거친다
- `undefined`를 키에 넣지 않는다. `?? null`로 바꾼다 (직렬화가 달라진다)

### 훅

```ts
// features/region/api/useRegionDetail.ts
export function useRegionDetail(sigunguCode: string, jobCode?: string) {
  return useQuery({
    queryKey: queryKeys.region.detail(sigunguCode, jobCode),
    queryFn: () => fetchRegionDetail({ sigunguCode, jobCode, aiUse: true }),
    enabled: Boolean(sigunguCode)     // ✓ 코드가 없으면 아예 호출하지 않는다
  })
}
```

- 훅 이름은 `use<대상>` (`useRegionDetail`, `useSupportTags`)
- **파라미터가 비었을 때는 `enabled`로 막는다.** `queryFn` 안에서 조기 반환하지 않는다
- 컴포넌트는 `useQuery`를 직접 부르지 않는다. 항상 feature의 훅을 거친다

### 코드 목록처럼 거의 안 변하는 데이터

`supportTag` / `jobTop` / `jobMid`는 현재 무기한 수동 캐시다(`src/utils/index.ts:159-166`).
Query로 옮길 때 `staleTime`으로 같은 의도를 표현한다.

```ts
export function useSupportTags() {
  return useQuery({
    queryKey: queryKeys.code.supportTag(),
    queryFn: fetchSupportTags,
    staleTime: Infinity     // 세션 동안 재요청하지 않음 (현행 동작과 동일)
  })
}
```

---

## 6. 로딩 · 에러 · 빈 상태

**세 가지를 모두 처리한다.** 하나라도 빠지면 화면이 조용히 멈춘다.

### Good — 현행 `RegionInfo.tsx:217-230`의 3분기 패턴을 유지한다

```tsx
const { data, isPending, error } = useRegionDetail(sigunguCode)

if (isPending) return <LoadingIndicator className="py-16" messages={[...]} />
if (error) return <div className="text-red-600">{toErrorMessage(error)}</div>
if (!data) return null
```

### Bad — 현행 `src/pages/MapSearch.tsx:27-86`

```tsx
fetchRegionDetail({ sigunguCode: selectedCode })
  .then((d) => { ... })
  .finally(() => {})          // ✗ .catch 없음 → unhandled rejection
                              // ✗ 로딩 표시 없음 → 화면이 멈춘 것처럼 보인다
```

요청이 실패하면 사용자는 "지역을 선택해 주세요"만 계속 본다. **`.catch` 없는 프로미스를 만들지 않는다.**

### 에러 메시지

```ts
// shared/api/toErrorMessage.ts
export function toErrorMessage(error: unknown, fallback = '요청 처리에 실패했습니다.') {
  return error instanceof ApiError ? error.message : fallback
}
```

- `ApiError`면 **서버 메시지를 그대로 보여준다**(백엔드가 한국어로 준다)
- 그 외에는 화면 맥락에 맞는 한국어 fallback (`'지역 정보를 불러오지 못했습니다.'`)
- **내부 예외 메시지나 스택을 화면에 노출하지 않는다**
- `429`는 `error.retryAfterSeconds`가 채워져 있다. 재시도 안내에 쓴다

### 부분 실패

전부 실패와 일부 실패를 구분한다. `DetailSearch.tsx:251-257`이 이미 이렇게 한다 —
직종 중분류를 병렬로 받다가 일부만 실패하면 `'일부 직종 필터 데이터를 불러오지 못했습니다. (N개 실패)'`.
이 패턴을 유지한다.

---

## 7. 이행 — 수동 캐시에서 Query로

전환 시 **사라져야 하는 것들**:

| 현행 | 위치 | 대체 |
|---|---|---|
| 캐시 변수 + in-flight Promise 3세트 | `src/utils/index.ts:159-166, 472-544` | `useQuery` + `staleTime` |
| `let mounted = true` 정리 플래그 | `DetailSearch.tsx:113`, `RegionInfo.tsx:50,86` | Query가 처리 |
| `isLoading` / `error` `useState` 쌍 | 페이지마다 반복 | `useQuery` 반환값 |
| 지원태그 로드 `useEffect` 중복 2벌 | `DetailSearch.tsx:112-141`, `RegionInfo.tsx:49-78` | `useSupportTags()` 훅 하나 |

### 프로바이더

```tsx
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status === 429 ? false : failureCount < 1,
      refetchOnWindowFocus: false     // 이 서비스는 화면 복귀마다 재요청할 이유가 없다
    }
  }
})
```

429는 레이트 리밋이므로 **재시도하지 않는다**(`SETUP.md` 참고).

### 검색 버튼처럼 "눌러야 실행"되는 요청

`DetailSearch`의 검색은 자동 실행이 아니다. `enabled: false` + `refetch()`로 두거나, 제출된 필터를 별도 state로 두고
그 state를 쿼리 키에 넣는다. **버튼을 누르기 전에 요청이 나가면 안 된다.**

---

## 8. 하지 말 것

- 컴포넌트에서 `fetch` 직접 호출
- `apiGet<도메인타입>()`으로 응답을 단정 (반드시 `unknown` + 매핑)
- 쿼리 키 배열을 컴포넌트에 인라인으로 작성
- `queryFn` 안에서 `try/catch`로 에러를 삼키기 (Query가 `error`로 넘겨준다)
- 매핑 함수에서 API 호출·상태 변경 (순수 함수여야 한다)
- 서버 응답 필드명을 프론트에서 바꿔 부르기 (`plcyNm` → `title` 변환은 매핑 함수 안에서만, `src/utils/index.ts:262`)
- `.catch` 없는 프로미스
- 별칭 필드 추가 (§4)

---

## 9. 체크리스트

1. `fetch`가 `shared/api/client.ts` 밖에 없는가
2. 응답을 `unknown`으로 받아 `mapXxxResponse`로 정규화했는가
3. 배열 응답에 `Array.isArray()` 확인이 있는가
4. 경로 문자열이 `shared/api/endpoints.ts`에 있는가
5. 쿼리 키를 `queryKeys` 팩토리로 만들었는가. `undefined`가 키에 들어가지 않는가
6. 파라미터가 빌 수 있으면 `enabled`로 막았는가
7. 로딩 · 에러 · 빈 상태 3분기를 모두 렌더링하는가
8. 에러 메시지가 `ApiError`면 서버 메시지, 아니면 한국어 fallback인가
9. `.catch` 없는 프로미스를 만들지 않았는가
10. `RegionDetail`에 별칭 필드를 새로 추가하지 않았는가
11. 매핑 함수가 순수한가 (호출·상태 변경 없음)
12. `pnpm run typecheck`와 `pnpm run lint`가 통과하는가
