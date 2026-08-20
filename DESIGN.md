---
name: ProvinceHow(지방어때)
description: 청년의 지방 이주 탐색을 돕는, 차분하고 신뢰감 있는 하늘색 톤의 정보 통합 플랫폼
colors:
  brand-50: "#EAF6FD"
  brand-100: "#D5EEFB"
  brand-200: "#ACDBF6"
  brand-300: "#84C9F1"
  brand-400: "#5CB6EC"
  brand-500: "#3AA5E6"
  brand-600: "#2793D3"
  brand-700: "#1E76A6"
  brand-800: "#155A7A"
  brand-900: "#0D3D4F"
  brand-950: "#082B38"
  neutral-0: "#FFFFFF"
  neutral-50: "#F9FAFB"
  neutral-200: "#E5E7EB"
  neutral-300: "#D1D5DB"
  neutral-500: "#6B7280"
  neutral-600: "#4B5563"
  neutral-700: "#374151"
  neutral-800: "#1F2937"
  neutral-900: "#111827"
  neutral-950: "#030712"
  state-error: "#DC2626"
  state-error-bg: "#FEF2F2"
  state-error-border: "#FECACA"
  state-error-strong-bg: "#7F1D1D"
  state-highlight: "#166534"
  state-highlight-bg: "#F0FDF4"
  state-highlight-border: "#BBF7D0"
typography:
  heading-lg:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  heading-md:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.neutral-0}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-800}"
    textColor: "{colors.neutral-0}"
  button-secondary:
    backgroundColor: "{colors.neutral-0}"
    textColor: "{colors.neutral-700}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  chip-idle:
    backgroundColor: "{colors.neutral-0}"
    textColor: "{colors.neutral-700}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "44px"
  chip-active:
    backgroundColor: "{colors.brand-50}"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.neutral-0}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-score:
    backgroundColor: "{colors.brand-50}"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
---

# Design System: ProvinceHow(지방어때)

## Overview

**Creative North Star: "The Open Sky Compass"**

이 시스템은 낯선 지역을 탐색하는 사람에게 방향을 제시하는 나침반처럼 움직인다. 주색인 하늘색(Open Sky Blue)은 개방감과 신뢰를 동시에 전달하고, 나머지 화면은 회색과 흰색의 평면 위에서 절제되어 있다. 사용자는 지도와 조건 검색을 통해 탐색하고, 시스템은 꼭 필요한 순간(선택된 지역, AI 추천, 조건 일치)에만 색과 입체감으로 응답한다.

전체 톤은 **친근하고 편안하면서도 명료하고 효율적**이다. 청년 대상 서비스이지만 장난스럽지 않고, 정보 밀도가 높은 화면(지역 비교, 조건 검색 필터)에서도 군더더기 없이 스캔할 수 있어야 한다. 화려한 그라데이션과 장식은 명시적으로 피한다 — AI Pick 콜아웃의 브랜드 그라데이션은 이 원칙의 유일한 기존 예외이자 시그니처 요소이며, 새로운 장식적 그라데이션을 추가하는 근거로 쓰지 않는다.

**Key Characteristics:**
- 평상시엔 평면적(플랫), 강조가 필요할 때만 입체감을 준다
- 브랜드 하늘색은 액션과 활성 상태에만 절제해서 쓴다
- 모든 색상 유틸리티는 라이트/다크 모드 짝을 항상 함께 가진다
- 숫자(개수·금액·점수)는 항상 tabular-nums로 정렬해 비교가 쉬운 표 형태를 이룬다

## Colors

절제된 하늘색 액센트 하나와 넓은 회색조 중립 팔레트로 구성되며, 상태 전달에만 빨강(오류)과 초록(조건 일치)을 더한다.

### Primary
- **Open Sky Blue** (`brand-500` #3AA5E6, `brand-600`/DEFAULT #2793D3, `brand-700` #1E76A6): 주요 액션 버튼, 활성 내비게이션, 포커스 링, 지도에서 선택된 지역, 필터 칩의 활성 상태에 쓴다. `brand-50`~`brand-200`은 활성 상태의 옅은 배경(칩·배지)에, `brand-800`~`brand-950`은 다크 모드 표면과 AI Pick 그라데이션의 짙은 쪽 끝에 쓴다.

### Neutral
- **White / Gray-50** (`neutral-0` #FFFFFF, `neutral-50` #F9FAFB): 카드·패널 배경(흰색), 페이지 배경과 빈 상태 배경(gray-50).
- **Gray-200 / Gray-300** (`neutral-200` #E5E7EB, `neutral-300` #D1D5DB): 카드·패널 기본 테두리(200), 지도에서 선택되지 않은 지역의 채우기 색(300).
- **Gray-500 / Gray-600** (`neutral-500` #6B7280, `neutral-600` #4B5563): 보조 텍스트(라벨, 캡션)와 본문 텍스트.
- **Gray-700 / Gray-900** (`neutral-700` #374151, `neutral-900` #111827): 제목, 강조 텍스트, 라이트 모드 링크 idle 색.
- **Gray-800 / Gray-950** (`neutral-800` #1F2937, `neutral-950` #030712): 다크 모드 카드 배경(800)과 페이지 배경(950).

### Named Rules
**The Sparse Accent Rule.** 브랜드 하늘색은 화면의 넓은 영역을 채우지 않는다. 버튼·활성 칩·선택된 지도 영역·포커스 링처럼 "지금 상호작용 가능하거나 선택됨"을 뜻하는 자리에만 나타난다. 나머지는 회색과 흰색이다.

**The No-Color-Only-Meaning Rule.** 상태(조건 일치, 오류)는 색만으로 전달하지 않는다. 초록 배경에는 체크 아이콘과 문구를 함께 쓰고(`MetricBox`의 강조 배지), 오류에는 `role="alert"`와 텍스트 메시지를 함께 쓴다.

## Typography

**Body/UI Font:** Pretendard Variable (fallback: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Segoe UI, sans-serif). 별도의 디스플레이 서체는 쓰지 않는다 — 이 제품은 탐색·비교 도구이며 마케팅 히어로 타이포가 필요 없다.

**Character:** 부드럽고 다정한 인상의 산세리프 하나로 전체를 통일하며, 위계는 굵기(weight)와 크기로만 만든다.

### Hierarchy
- **Heading (Large)** (600, 1.5rem, line-height 1.3): 페이지 최상단 제목(`RegionInfo`/`Comparison`의 `<h1>`). 404처럼 예외적으로 더 큰 스케일(2.25rem, 700)을 쓰는 화면도 있다.
- **Heading (Medium)** (600, 1.125rem, line-height 1.4): 카드·섹션 제목(`<h2>`), 지역 카드의 지역명.
- **Body** (400, 0.875rem, line-height 1.6): 본문, 버튼 라벨, 필터 칩 텍스트.
- **Label** (500, 0.75rem, letter-spacing normal): 보조 캡션, 배지 라벨, 인프라 스탯 라벨.

### Named Rules
**The Tabular Numbers Rule.** 개수·금액·점수 등 비교 대상이 되는 모든 숫자는 `tabular-nums`를 써서 자릿수가 세로로 정렬되게 한다(지역 카드 지표, AI Pick Score, 지원사업 수).

## Layout

모바일 우선 반응형이며 `sm`(640px) / `md`(768px) / `lg`(1024px) 브레이크포인트로 점진적으로 확장한다. 최상단 내비게이션은 `max-w-7xl` 컨테이너에 `px-4 sm:px-6 lg:px-8` 여백을 두고, `sticky top-0 z-50`으로 고정되며 스크롤 시에만 배경이 나타난다. 데스크톱 메뉴는 `md` 이상에서 노출되고, 그 미만에서는 햄버거 메뉴로 접힌다.

콘텐츠 영역은 카드형 섹션(`rounded-xl`/`rounded-2xl` 패널)을 세로로 쌓거나(지역 상세, 비교), 지도 검색처럼 `lg` 이상에서 좌우 2단 레이아웃으로 전환한다. 지표 그리드는 `grid-cols-2`(모바일)에서 `sm:grid-cols-4`(데스크톱)로 확장된다. 필터·칩 목록은 `flex flex-wrap`으로 줄바꿈되며, 모든 탭 가능한 칩·버튼은 `min-h-11`(44px)로 터치 타겟을 보장한다.

## Elevation & Depth

이 시스템은 **평상시 평면(플랫), 강조 시에만 입체감**을 쓰는 하이브리드다. 기본 카드·패널은 `shadow-sm`과 1px 회색 테두리만으로 표면을 구분한다. 진짜로 강조해야 하는 콘텐츠 — AI Pick 콜아웃, 추천 이유 패널 — 만 더 짙은 `shadow-md`/`shadow-lg`와 브랜드 톤 배경·링을 함께 얻는다.

### Shadow Vocabulary
- **Resting** (`shadow-sm`): 기본 카드, 패널, 배지. 대부분의 화면 요소가 이 단계에 머문다.
- **Emphasis** (`shadow-md` ~ `shadow-lg` + `ring-1 ring-brand-*`): AI Pick 카드, 추천 이유 콜아웃, 지도 위 플로팅 상태 배지처럼 사용자의 시선을 의도적으로 끌어야 하는 요소.

### Named Rules
**The Flat-at-Rest Rule.** 평상시엔 평면적이고, 강조가 필요할 때만 뜬다. 새 컴포넌트에 그림자를 추가하기 전에 "이것이 AI Pick급으로 강조되어야 하는가"를 먼저 확인한다. 아니라면 `shadow-sm`에 머문다.

## Shapes

라운드는 컴포넌트의 무게에 비례해서 커진다: 버튼·작은 컨트롤은 `rounded-md`(8px), 드롭다운·툴팁 같은 중간 패널은 `rounded-lg`(12px), 카드는 `rounded-xl`(16px)에 가깝고, 지도 패널이나 검색 패널처럼 큰 컨테이너는 `rounded-2xl`(16px 이상)까지 쓴다. 필터 칩·배지·아이콘 배지·인프라 스탯 배지는 전부 `rounded-full`(알약형)이다. 테두리는 항상 1px 실선이 기본이며, 빈 상태(empty state)에서만 `border-dashed`로 전환해 "아직 채워지지 않음"을 구분한다.

## Components

버튼·카드·칩은 모두 **명확하고 담백한** 인상을 목표로 한다 — 장식 없이 상태(선택/비선택/강조)를 색과 굵기만으로 분명히 전달한다.

### Buttons
- **Shape:** `rounded-md`(8px), 라이트/다크 모드 모두에서 형태 유지.
- **Primary:** 배경 `brand-700`, 흰 텍스트, hover 시 `brand-800`으로 짙어짐(다크 모드는 반대로 `brand-400` 배경에 `gray-950` 텍스트, hover `brand-300`). 패딩 `px-5 py-2.5`, `text-sm font-semibold`.
- **Secondary/Ghost:** 흰 배경 + `border-gray-300` + `text-gray-700`, hover 시 테두리만 `gray-400`으로 진해짐. 전용 색을 새로 쓰지 않는다.
- **Focus:** 모든 인터랙티브 요소는 `focus-visible:ring-2 ring-brand-600/30`(다크 `brand-400/30`)을 공유한다.

### Chips (필터·칩형 라디오)
- **Style:** `rounded-full border px-4 py-2 text-sm min-h-11`. 실제로는 `<input type="radio">`를 시각적으로 감춘 라벨/버튼 패턴이라 키보드·스크린리더 접근성이 기본 유지된다.
- **State:** 비선택 = 흰 배경 + 회색 테두리; 선택(active) = `border-brand-600 bg-brand-50 text-brand-700 shadow-sm`(다크 `border-brand-400 bg-brand-950 text-brand-300`). 포커스는 `peer-focus-visible:ring-2 ring-brand-600/40`.

### Cards / Containers
- **Corner Style:** `rounded-xl`(카드) ~ `rounded-2xl`(패널).
- **Background:** 흰색(라이트) / `gray-900`(다크).
- **Shadow Strategy:** 기본 `shadow-sm`; Elevation 섹션의 Emphasis 단계는 AI Pick류에서만.
- **Border:** `border-gray-200`(라이트) / `border-gray-800`(다크) 1px.
- **Internal Padding:** `p-5`(20px)가 표준, 큰 패널은 `p-6`(24px).
- **Interactive card:** 클릭 가능한 카드(`onCardClick` 지정 시)는 hover에서 `border-brand-200 bg-gray-50 shadow-md`로 반응한다.

### Badges
- **Score badge:** `rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-600/20`, 숫자는 `tabular-nums`.
- **AI Pick badge/callout:** `bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700`, 흰 텍스트 — 시스템에서 그라데이션을 쓰는 유일한 자리이자 의도적 시그니처. 새 컴포넌트에 그라데이션을 확장하지 않는다.
- **Infra/metric pill:** `rounded-full border-gray-300 bg-white` 알약형, 라벨+수치 조합.
- **Highlight badge(조건 일치):** `rounded-full bg-green-100 text-green-800`, 체크 아이콘과 문구를 항상 함께 노출(No-Color-Only-Meaning Rule).

### Empty / Error States
- **Empty:** `rounded-xl border-dashed border-gray-200 bg-gray-50`, 중앙 정렬 안내 텍스트.
- **Error:** `role="alert"`, `rounded-xl border-red-200 bg-red-50 text-red-600`(다크 `border-red-900 bg-red-950 text-red-400`).

### Loading
- **LoadingIndicator:** 이중 원 스피너 — 정적인 `border-brand-100` 링 위에 `animate-loading-rotate`(1.2s linear infinite)로 회전하는 `border-brand-500 border-t-transparent` 링을 겹친다. `motion-reduce:animate-none`으로 모션 축소 설정을 존중하며, 무작위로 고른 안내 문구 하나를 마운트 시 고정해 보여준다.

### Interactive Map (시그니처 컴포넌트)
외부 지도 SDK 없이 SVG path를 직접 렌더링하는 이 제품의 핵심 인터랙션이다. 기본 채우기는 `fill-gray-300`(다크 `fill-gray-700`), 호버 가능한 기기에서만 `hover:fill-brand-400`으로 반응한다(터치 기기에서 의도치 않은 호버 고정을 피하기 위해 `@media(hover:hover)`로 감쌈). 선택된 시군구는 `fill-brand-500`(다크 `fill-brand-300`)으로 고정된다. 지역 사이 경계는 0.5px 흰색(다크 `gray-900`) stroke로만 구분하며 그림자를 쓰지 않는다. 키보드 포커스는 `focus-visible:stroke-brand-700 stroke-2`. 현재 위치를 알리는 플로팅 배지는 `rounded-full bg-white/90 shadow-sm`, 툴팁은 `rounded bg-black/70 text-white`(다크 `bg-gray-100/90 text-gray-950`)로 지도 위에 최소한의 존재감만 남긴다.

## Do's and Don'ts

### Do:
- **Do** 브랜드 하늘색을 액션·활성 상태·AI Pick에만 절제해서 쓴다(The Sparse Accent Rule).
- **Do** 카드·패널은 평상시 `shadow-sm` + 1px 테두리로 평면을 유지하고, 진짜 강조가 필요할 때만 `shadow-md` 이상으로 올린다(The Flat-at-Rest Rule).
- **Do** 비교·집계되는 모든 숫자에 `tabular-nums`를 적용한다(The Tabular Numbers Rule).
- **Do** 모든 색상 유틸리티에 다크 모드 짝(`dark:`)을 함께 작성한다.
- **Do** 필터 칩·버튼 등 탭 가능한 요소에 `min-h-11`(44px) 터치 타겟을 유지한다.
- **Do** 상태 전달에는 색과 텍스트/아이콘을 함께 쓴다(The No-Color-Only-Meaning Rule).
- **Do** 빈 상태는 `border-dashed bg-gray-50`, 오류는 `role="alert"` + `bg-red-50 text-red-600`로 구분해서 표현한다.

### Don't:
- **Don't** AI Pick 콜아웃 밖에서 새로운 장식적 그라데이션을 추가하지 않는다 — 화려한 장식은 이 시스템이 명시적으로 지양하는 방향이다.
- **Don't** 평상시 카드에 `shadow-md` 이상을 기본값으로 주지 않는다. 그림자는 강조의 신호이지 장식이 아니다.
- **Don't** `brand` 스케일 밖의 새 액센트 색상을 임의로 추가하지 않는다.
- **Don't** 지도 인터랙션에 그림자나 장식적 테두리를 더하지 않는다 — 경계는 얇은 stroke만으로 표현한다.
