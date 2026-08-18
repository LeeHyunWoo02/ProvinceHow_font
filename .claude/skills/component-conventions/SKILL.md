---
name: component-conventions
description: ProvinceHow(지방어때) 프론트엔드의 React 컴포넌트 작성 규약을 정의한다. 컴포넌트를 쪼개는 기준과 로컬 하위 컴포넌트 허용 범위, props 타입 선언 방식 통일과 콜백 prop 설계, 상태를 로컬 useState·zustand 스토어·URL 쿼리·서버 상태 중 어디에 둘지 판정하는 표, zustand 스토어 작성 규칙, 커스텀 훅 추출 기준과 useEffect·useMemo 사용 기준, 리스트 key 규칙을 담는다. 컴포넌트를 만들거나 분해할 때, props를 설계할 때, 상태 위치를 정할 때, 커스텀 훅을 쓸 때 사용한다. 폴더 배치와 feature 경계는 architecture-conventions, 데이터 페칭과 로딩·에러 처리는 api-conventions, className 작성은 styling-conventions, 이름과 타입 위치는 global-conventions를 따른다.
---

# component-conventions

React 18 함수 컴포넌트만 쓴다. 클래스 컴포넌트·`forwardRef`·`React.FC`는 이 저장소에 없다.
`react/react-in-jsx-scope`가 꺼져 있으므로(`.eslintrc:29`) `import React`는 쓰지 않는다.

---

## 1. 파일과 export

| 항목 | 규칙 |
|---|---|
| 파일명 | `PascalCase.tsx` — 컴포넌트 이름과 정확히 일치 |
| 주 컴포넌트 | `export default function Xxx()` — 파일당 하나 |
| 그 외 (훅·타입·상수·순수 함수) | named export |
| 화살표 함수 컴포넌트 | 쓰지 않는다. `function` 선언으로 통일 |

```tsx
// features/region/components/RegionCard.tsx
export default function RegionCard({ item, onCardClick }: RegionCardProps) { ... }
```

---

## 2. 컴포넌트를 쪼개는 기준

**줄 수로 쪼개지 않는다.** 아래에 해당할 때만 분리한다.

1. **두 곳 이상에서 쓰인다** → 별도 파일
2. **독립된 상태나 이펙트를 가진다** → 별도 파일
3. **같은 파일 안에서 같은 JSX 덩어리를 반복한다** → 로컬 하위 컴포넌트

### 로컬 하위 컴포넌트

한 파일 안에서만 쓰이면 **같은 파일 하단에** 둔다. 이 저장소의 기존 패턴이다.

```tsx
// src/pages/RegionInfo.tsx:518  (현행 — 유지할 패턴)
export default function RegionInfo() { ... }

function AddToCompareButton({ sigunguCode }: { sigunguCode: string }) { ... }
function AiSummaryExplainer() { ... }
```

- 로컬 컴포넌트는 **export하지 않는다**
- 파일 하단에 모아 둔다 (주 컴포넌트 위에 흩어 놓지 않는다)
- 3개를 넘어가면 파일을 나눌 신호다

### 지금 쪼개야 하는 것

`src/pages/DetailSearch.tsx`(687줄)와 `src/pages/RegionInfo.tsx`(575줄)가 대상이다. 자를 선:

| 잘라낼 덩어리 | 현재 위치 | 목표 |
|---|---|---|
| 조건 설정 폼 전체 | `DetailSearch.tsx:378-604` | `features/recommendation/components/FilterPanel.tsx` |
| 직종 자동완성 | `DetailSearch.tsx:441-502` | `features/recommendation/components/JobAutocomplete.tsx` |
| 지원정책 목록 | `RegionInfo.tsx:412-513` | `features/region/components/SupportPolicyList.tsx` |
| 주거비 지표 카드 | `RegionInfo.tsx:293-328` | `features/region/components/DwellingSummary.tsx` |

**요청 없이 먼저 쪼개지 않는다.** 해당 파일을 수정하는 작업이 생겼을 때 함께 한다.

---

## 3. props

### 타입 선언 — `type Xxx Props`로 통일

현재 3가지가 섞여 있다. 앞으로는 **파일 상단에 `type <컴포넌트명>Props`** 하나로 쓴다.

```tsx
// Good
type RegionCardProps = {
  item: RegionRecommendation
  metricsHighlight?: MetricsHighlight
  onCardClick?: (sigunguCode: string) => void
}

export default function RegionCard({ item, metricsHighlight, onCardClick }: RegionCardProps) {
```

```tsx
// Bad — 시그니처에 인라인 (src/components/RegionCard.tsx:35-42, InteractiveMap.tsx:16-22 현행)
export default function RegionCard({ item, ... }: {
  item: RegionRecommendation
  metricsColsClass?: string
  ...
}) {
```

인라인은 props가 늘어날수록 시그니처가 읽히지 않는다. 단, **prop이 1개뿐이면 인라인을 허용한다**
(`RegionInfo.tsx:518`의 `{ sigunguCode }: { sigunguCode: string }`).

### 설계 규칙

- **props 구조 분해는 시그니처에서 한다.** 본문에서 `props.xxx`로 접근하지 않는다
- 기본값은 구조 분해에서 준다: `metricsColsClass = 'sm:grid-cols-4'`
- **선택 콜백은 `on<사건>` 이름에 `?`를 붙이고, 없으면 해당 UI를 렌더링하지 않는다**
- **불리언 prop으로 동작 자체를 켜지 않는다.** 콜백 유무로 판단한다

```tsx
// Bad — 현행 RegionCard: canAdd 불리언 + 내부에서 스토어 직접 호출
canAdd?: boolean
const { addBySigunguCode } = useComparison()

// Good — 콜백만 받는다. 없으면 버튼이 없다
onAdd?: (sigunguCode: string) => void
{onAdd && <button onClick={() => onAdd(item.sigunguCode)}>비교에 추가</button>}
```

이유는 architecture-conventions §5(순환 참조)와 같다.

- **`className`을 통째로 받는 prop은 최소화한다.** 현행 `metricsColsClass`(`RegionCard.tsx:30`)처럼 Tailwind 클래스를
  문자열로 주입하면 어떤 값이 오는지 타입이 못 잡는다. 레이아웃 변형은 `variant` 유니언으로 표현한다 → styling-conventions

---

## 4. 상태를 어디에 둘 것인가

**위에서부터 순서대로 검토하고, 처음 해당하는 곳에 둔다.**

| 조건 | 위치 | 예 |
|---|---|---|
| 서버에서 온 데이터 | **TanStack Query** (`useXxxQuery`) | 지역 상세, 추천 결과, 코드 목록 |
| 새로고침·공유 후에도 유지돼야 함 | **URL 쿼리** (`useSearchParams`) | `?sigunguCode=`, `?jobCode=` (`RegionInfo.tsx:37-38`) |
| 여러 화면이 공유 | **zustand 스토어** | 비교 목록, 추천 필터 |
| 한 컴포넌트 트리 안 | **`useState`** | 자동완성 포커스, 모바일 메뉴 열림 |
| 렌더링에 영향 없음 | **`useRef`** | SVG 측정용 ref |

### 서버 데이터를 스토어에 넣지 않는다

```ts
// Bad — 현행 src/state/comparisonStore.ts:16-27
addBySigunguCode: async (sigunguCode) => {
  set({ isAdding: true })
  const data = await fetchRegionDetail({ sigunguCode, ... })   // ✗ 스토어가 페칭
  set((state) => ({ items: [...state.items, data] }))          // ✗ 서버 데이터 보관
}
```

```ts
// Good — 스토어는 "무엇을 담았는가"만 안다
type ComparisonState = {
  sigunguCodes: string[]
  add: (code: string) => void
  remove: (code: string) => void
  clear: () => void
}
// 상세 데이터는 화면에서 useQueries로 가져온다
```

이러면 `isAdding` 로딩 상태도 스토어에서 사라지고, 새로고침해도 캐시가 살아 있다.

### zustand 스토어 규칙

- 파일 위치는 `features/<name>/model/`, 파일명은 `<대상>Store.ts`
- 훅 이름은 `use<대상>` (`useComparison`, `useRecommendationFilters`)
- **상태와 액션을 하나의 `type`에 함께 선언한다** (현행 `recommendationFilters.ts:7-25` 방식 유지)
- 액션 이름: 설정 `setXxx`, 토글 `toggleXxx`, 전체 초기화 `reset`
- **스토어 안에서 API를 호출하지 않는다**
- 셀렉터로 필요한 것만 구독한다. 리스트 안에서 스토어 전체를 구독하면 전 항목이 리렌더된다

```ts
const items = useComparison((s) => s.sigunguCodes)   // ✓
const { items, addBySigunguCode, ... } = useComparison()   // 컴포넌트 하나면 허용
```

---

## 5. 훅

### `useEffect`

**데이터를 가져오려고 쓰지 않는다.** Query가 한다. `useEffect`가 정당한 경우는 외부 시스템 구독뿐이다.

```tsx
// Good — src/components/Navbar.tsx:9-19 (현행, 올바른 사용)
useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 0)
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

- **정리 함수를 반드시 반환한다** (리스너, 타이머, `requestAnimationFrame`)
- **`eslint-disable-next-line react-hooks/exhaustive-deps`를 새로 추가하지 않는다.**
  현재 1건 있다(`InteractiveMap.tsx:90`) — 그 자리에 실제 버그가 있다:
  `externalResetToken !== undefined`라 부모의 초기값 `0`에도 마운트 시 리셋이 돈다
- **`let mounted = true` 플래그를 새로 만들지 않는다.** Query로 옮기면 필요 없다

### `useMemo`

계산 비용이 실제로 있거나, 결과가 다른 훅의 의존성으로 들어갈 때만 쓴다.

```tsx
// Good — 큰 배열 순회 (src/pages/DetailSearch.tsx:164-174)
const jobSuggestions = useMemo(() => Object.entries(jobMidByTop).flatMap(...), [jobMidByTop, topNameMap])

// Bad — 단순 참조 (src/pages/RegionInfo.tsx:117-121)
const population = useMemo(() => {
  if (!data) return null
  const value = data.population
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}, [data])
```

`RegionInfo.tsx:108-163`에 이런 `useMemo`가 7개 연달아 있다. 대부분 그냥 변수여도 된다.
**정규화가 필요하면 `useMemo`가 아니라 매핑 함수에서 해결한다** → api-conventions §4.

### 커스텀 훅 추출

**같은 로직이 2곳 이상에서 반복되면** 훅으로 뺀다. 지금 해당하는 것:

| 중복 | 위치 | 추출 |
|---|---|---|
| SVG `getBBox` → transform 계산 | `InteractiveMap.tsx:94-131`, `RegionPreviewMap.tsx:33-67` | `shared/hooks/useSvgFitTransform.ts` |
| 자동완성 blur 확정 (`setTimeout` 120ms) | `DetailSearch.tsx:282-295`, `RegionDrilldown.tsx:188-193, 239-244` | `shared/hooks/useBlurConfirm.ts` |
| 지원태그 로드 + 유효코드 정리 | `DetailSearch.tsx:112-141`, `RegionInfo.tsx:49-78` | `useSupportTags()` → api-conventions |

- 훅 파일은 `use<이름>.ts`, 훅 하나당 파일 하나
- feature 전용이면 `features/<name>/`, 도메인 무관하면 `shared/hooks/`
- **훅에서 JSX를 반환하지 않는다**

---

## 6. 리스트 key

**의미 있는 고유 ID를 쓴다. 배열 인덱스를 섞지 않는다.**

```tsx
// Good
{supportTags.map((tag) => <button key={tag.code}>...</button>)}

// Bad — 현행 DetailSearch.tsx:656, Comparison.tsx:189
const key = `${r.sigunguCode}-${idx}`     // ✗ 인덱스가 섞이면 재정렬 시 상태가 어긋난다
```

`sigunguCode`는 이미 고유하다. 중복이 걱정되면 인덱스를 붙이는 대신 **데이터를 먼저 dedupe한다.**

---

## 7. 하지 말 것

- `React.FC`, 화살표 함수 컴포넌트, 클래스 컴포넌트
- props를 본문에서 `props.xxx`로 접근
- 렌더링 중 `Math.random()` / `Date.now()` 호출 — `LoadingIndicator.tsx:33-35`가 `useRef` initializer에서 매 렌더 호출한다
- `useEffect`로 데이터 페칭
- `exhaustive-deps` 무시 주석 추가
- 스토어에서 API 호출
- 리스트 key에 인덱스 사용
- 컴포넌트 안에서 컴포넌트 정의 (매 렌더 새 타입이 된다)

---

## 8. 체크리스트

1. 파일명이 `PascalCase.tsx`이고 주 컴포넌트가 `export default function`인가
2. props 타입이 파일 상단 `type <컴포넌트명>Props`인가 (prop 1개면 인라인 허용)
3. 선택 UI를 불리언이 아니라 콜백 prop 유무로 제어하는가
4. 컴포넌트가 다른 feature의 스토어를 직접 호출하지 않는가
5. 상태가 §4 표의 판정대로 놓였는가. 서버 데이터가 스토어에 들어가지 않았는가
6. `useEffect`가 외부 시스템 구독에만 쓰였고 정리 함수를 반환하는가
7. `exhaustive-deps` 무시 주석을 새로 추가하지 않았는가
8. `useMemo`가 실제로 비싼 계산이나 의존성 안정화에 쓰였는가
9. 같은 로직을 2곳 이상에서 반복하지 않는가 (했다면 훅으로 뺐는가)
10. 리스트 key가 인덱스 없이 고유한가
11. 렌더링 중 랜덤·시각 호출이 없는가
12. `pnpm run lint`가 통과하는가 (`--max-warnings=0`이라 훅 경고 1개도 실패다)
