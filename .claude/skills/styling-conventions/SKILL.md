---
name: styling-conventions
description: ProvinceHow(지방어때) 프론트엔드의 TailwindCSS 3 사용 규약을 정의한다. brand 색상 팔레트와 회색·상태색 사용 범위, 카드·버튼·태그칩 등 반복되는 UI 패턴의 기준 클래스, 조건부 클래스를 템플릿 리터럴 대신 classNames 헬퍼로 쓰는 규칙, className을 prop으로 주입하지 않고 variant 유니언으로 표현하는 방법, 모바일 우선 반응형 브레이크포인트 기준, index.css와 tailwind.config.mjs를 건드려야 하는 경우, eslint-plugin-tailwindcss 경고 대응을 담는다. Tailwind 클래스를 작성할 때, 색·간격·반응형을 정할 때, 조건부 스타일을 붙일 때, 새 UI 패턴을 만들 때 사용한다. 컴포넌트 분리와 props 설계는 component-conventions, 파일 배치는 architecture-conventions를 따른다.
---

# styling-conventions

TailwindCSS 3.4.17 유틸리티만 쓴다. CSS Module · styled-components · CSS-in-JS는 이 저장소에 없다.
전역 CSS는 `src/index.css` 하나뿐이고 컴포넌트별 `.css` 파일은 만들지 않는다.
`eslint-plugin-tailwindcss`가 켜져 있고 `lint`는 `--max-warnings=0`이므로 **클래스 순서 경고 하나로도 빌드 검증이 실패한다.**

---

## 1. 색

### brand 팔레트 (`tailwind.config.mjs:16-33`)

50~950 + `DEFAULT: #2793D3`. **주조색은 반드시 `brand-*`를 쓴다.** `blue-*`, `sky-*` 등으로 대체하지 않는다.

| 용도 | 클래스 | 사용처 |
|---|---|---|
| 주요 버튼 | `bg-brand-600 hover:bg-brand-700 text-white` | `DetailSearch.tsx:598`, `RegionDrilldown.tsx:297` |
| 보조 버튼(외곽선) | `border border-brand-600 text-brand-700 hover:bg-brand-50` | `RegionCard.tsx:110`, `RegionInfo.tsx:529` |
| 선택된 칩 | `border-brand-600 bg-brand-50 text-brand-700` | `DetailSearch.tsx:400, 522` |
| 섹션 헤더 배경 | `border-b border-brand-100 bg-brand-50/60` | `DetailSearch.tsx:379`, `MapSearch.tsx:91` |
| 입력 포커스 | `focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20` | `DetailSearch.tsx:456`, `RegionDrilldown.tsx:195` |

### 그 외 색

| 색 | 허용 범위 |
|---|---|
| `gray-*` | 텍스트·테두리·배경 중립색. 제한 없음 |
| `red-500` / `red-600` | **에러 메시지 전용** (`DetailSearch.tsx:494`, `RegionInfo.tsx:229`) |
| `green-200` / `green-50` | **지표 강조(최적값) 전용** (`RegionCard.tsx:134`) |
| `indigo-500`, `sky-500` | **AI Pick 그라데이션 전용** (`RegionCard.tsx:89, 122`) |

**위 목록에 없는 색을 새로 쓰지 않는다.** 새 의미색이 필요하면 `tailwind.config.mjs`에 토큰으로 추가하고 이 표를 갱신한다.
임의 값(`bg-[#3AA5E6]`)은 쓰지 않는다. 단 `shadow-[0_6px_18px_-12px_rgba(15,23,42,0.12)]`(`Navbar.tsx:38`)처럼
Tailwind 스케일에 없는 그림자는 예외로 허용한다.

---

## 2. 반복 패턴의 기준 클래스

같은 것을 만들 때 아래를 그대로 쓴다. 값을 조금씩 바꾸지 않는다.

```
카드(섹션)     rounded-xl border border-gray-200 bg-white p-5 shadow-sm
카드(큰 섹션)  overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm
섹션 헤더      border-b border-brand-100 bg-brand-50/60 px-5 py-4
지표 박스      rounded-lg border border-gray-100 bg-gray-50 p-3
지표 박스(강조) rounded-lg border border-green-200 bg-green-50 p-3 ring-1 ring-green-200
칩/태그        rounded-full border px-4 py-2 text-sm transition
주요 버튼      rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700
보조 버튼      rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-700 transition hover:border-gray-400
텍스트 입력    w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20
드롭다운       absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg
비활성         disabled:cursor-not-allowed disabled:opacity-50
```

### 현재 어긋난 지점

`rounded-xl`(`RegionInfo.tsx:235`)과 `rounded-2xl`(`DetailSearch.tsx:378`)이 같은 "섹션 카드"에 섞여 있고,
드롭다운 최대 높이가 `max-h-64`(`DetailSearch.tsx:474`)와 `max-h-60`(`RegionDrilldown.tsx:198`)로 다르다.
새로 만들 때는 위 표를 따르고, 기존 파일을 수정하는 김에 맞춘다.

### 숫자는 `tabular-nums`

지표·금액·개수를 표시하는 모든 곳에 붙인다. 값이 바뀔 때 자릿수가 흔들리지 않는다.

```tsx
<p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
  {formatNumberComma(displayJobValue)}
</p>
```

---

## 3. 조건부 클래스

### Good — `classNames` 헬퍼 (`src/utils/index.ts:12`, → `shared/lib/classNames.ts`)

```tsx
import { classNames } from 'shared/lib/classNames'

<div className={classNames(
  'rounded-lg border p-3',
  isHighlighted ? 'border-green-200 bg-green-50 ring-1 ring-green-200' : 'border-gray-100 bg-gray-50'
)} />
```

### Bad — 템플릿 리터럴

```tsx
// 현행 RegionCard.tsx:132-136, DetailSearch.tsx:398-402 등 다수
className={`rounded-lg border p-3 ${
  metricsHighlight?.jobs ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
}`}
```

템플릿 리터럴 안의 클래스는 `eslint-plugin-tailwindcss`가 순서를 검사하지 못하고, 조건이 늘면 읽을 수 없게 된다.
**`classNames`가 이미 저장소에 있으니 새 코드는 이것을 쓴다**(`LoadingIndicator.tsx`가 이미 이 방식이다).

`clsx`·`tailwind-merge`·`cva`는 도입하지 않는다. 의존성을 늘리지 않는다.

---

## 4. className을 prop으로 넘기지 않는다

```tsx
// Bad — 현행 RegionCard.tsx:30
metricsColsClass?: string        // 'sm:grid-cols-4' | 'sm:grid-cols-2' 문자열이 밖에서 들어온다
<div className={`mt-4 grid grid-cols-2 gap-4 ${metricsColsClass}`} />
```

무슨 값이 오는지 타입이 못 잡고, Tailwind가 클래스를 스캔하지 못할 위험도 있다.

```tsx
// Good — 의미로 표현한다
type RegionCardProps = {
  layout?: 'wide' | 'compact'
}
const metricsCols = layout === 'compact' ? 'sm:grid-cols-2' : 'sm:grid-cols-4'
```

**예외**: `LoadingIndicator`의 `className`(`LoadingIndicator.tsx:21`)처럼 **바깥 여백만** 받는 경우는 허용한다. 내부 구조를 바꾸는 클래스는 안 된다.

---

## 5. 반응형

**모바일 우선.** 접두사 없는 클래스가 모바일이고, 위로 올려 붙인다.

| 접두사 | 폭 | 이 저장소에서의 쓰임 |
|---|---|---|
| (없음) | ~639px | 기본. 1열 |
| `sm:` | 640px~ | 그리드 2열, 좌우 패딩 확대 |
| `md:` | 768px~ | 모바일 메뉴 ↔ 데스크톱 메뉴 전환 (`Navbar.tsx:49, 67`) |
| `lg:` | 1024px~ | 지도/정보 2단 레이아웃 (`MapSearch.tsx:89`), 3열 그리드 |
| `xl:` | 1280px~ | 미세 조정만 (`Comparison` 4열) |

```tsx
// Good — 현행 RegionInfo.tsx:476
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

- `2xl:`은 쓰지 않는다. 최대 폭은 `max-w-7xl`로 제한된다(`App.tsx:15`)
- **`sm:`을 건너뛰고 `lg:`만 지정하지 않는다.** 640~1023px 구간이 비면 태블릿에서 깨진다
- 데스크톱 우선(`max-*:`)은 쓰지 않는다

---

## 6. `index.css`와 `tailwind.config.mjs`

**둘 다 그 파일을 바꾸는 것이 작업의 목적일 때만 연다.**

`src/index.css`에 넣어도 되는 것은 이 셋뿐이다:
1. `@tailwind` 지시문
2. `@font-face` (Pretendard, 현재 8종)
3. `body` 기본 스타일

컴포넌트 스타일을 여기에 넣지 않는다. `@apply`도 쓰지 않는다.

`tailwind.config.mjs`는 **디자인 토큰을 추가할 때만** 수정한다 — 색 팔레트, 폰트 스택, `keyframes`/`animation`.
현재 `loading-rotate`, `loading-bounce` 두 애니메이션이 있고 `LoadingIndicator`가 쓴다.

**정리 대상**: `src/index.css:2`가 highlight.js CDN CSS를 import하는데 코드 하이라이팅 기능은 없다.

---

## 7. eslint-plugin-tailwindcss

`.eslintrc:31-33` 설정:

| 규칙 | 수준 | 대응 |
|---|---|---|
| `classnames-order` | warn | 순서를 고친다. **`eslint-disable`로 끄지 않는다** |
| `no-custom-classname` | warn | Tailwind가 모르는 클래스명. 오타이거나 config에 없는 토큰이다 |
| `no-contradicting-classname` | error | 충돌 클래스. 반드시 고친다 |

`src/components/App.tsx:1`에 `/* eslint-disable tailwindcss/classnames-order */`가 파일 전체에 걸려 있다.
**이 방식을 따라 하지 않는다.** 새 파일에 disable 주석을 넣지 않는다.

`size-full`, `size-4` 같은 Tailwind 3.4 축약형이 이미 쓰이고 있다(`RegionInfo.tsx:480`, `Navbar.tsx:54`). 계속 쓴다.

---

## 8. 하지 말 것

- 인라인 `style` — 단, 런타임 계산값은 예외 (`InteractiveMap.tsx:202`의 툴팁 좌표, `:139-144`의 `aspectRatio`)
- 임의 값 `bg-[#...]`, `p-[13px]`
- `!important` (`!bg-white`)
- `eslint-disable tailwindcss/*` 추가
- CSS 파일 신규 생성, `@apply`
- `clsx` / `tailwind-merge` / `cva` 도입
- 조건부 클래스에 템플릿 리터럴
- 접근성 무시: 아이콘만 있는 버튼에 `aria-label` 필수 (`Comparison.tsx:194`, `Navbar.tsx:50`이 지키고 있다)

---

## 9. 체크리스트

1. 주조색이 `brand-*`인가. §1 표에 없는 색을 새로 쓰지 않았는가
2. 카드·버튼·칩·입력이 §2의 기준 클래스와 일치하는가
3. 숫자 표시에 `tabular-nums`가 있는가
4. 조건부 클래스에 템플릿 리터럴 대신 `classNames`를 썼는가
5. Tailwind 클래스 문자열을 prop으로 주입하지 않았는가 (바깥 여백 `className`은 예외)
6. 모바일 우선이며 `sm:`을 건너뛰지 않았는가
7. `index.css` / `tailwind.config.mjs`를 목적 없이 수정하지 않았는가
8. `eslint-disable tailwindcss/*`를 추가하지 않았는가
9. 임의 값·`!important`·인라인 style(계산값 제외)이 없는가
10. 아이콘 전용 버튼에 `aria-label`이 있는가
11. `pnpm run lint`가 경고 0으로 통과하는가
