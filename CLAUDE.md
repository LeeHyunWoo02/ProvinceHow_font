# CLAUDE.md — ProvinceHow(지방어때) 프론트엔드

## 프로젝트 개요

수도권 집중과 지방 청년 유출 문제를 완화하기 위한 **청년 지방 이주 정보 통합 플랫폼**의 웹 프론트엔드다.
사용자는 지도·조건 검색으로 시군구를 고르고, 해당 지역의 일자리·주거비·지원사업·생활 인프라를 한 화면에서 확인하고 여러 지역을 비교한다.
데이터는 전부 별도 저장소의 Spring Boot 백엔드(`VITE_API_BASE_URL`)에서 가져오며, **이 저장소에는 서버 코드가 없다.**
지도는 외부 지도 SDK 없이 `src/assets/*.json`의 SVG path 데이터를 직접 렌더링한다.
배포는 Vercel이며 SPA rewrite로 모든 경로를 `/`로 보낸다(`vercel.json`).

## 기술 스택

| 항목 | 값 | 근거 파일 |
|---|---|---|
| React | 18.3.1 | `package.json` |
| TypeScript | 5.9.2, `strict: true` | `tsconfig.json:11` |
| 빌드 | Vite 5.4.20 + `@vitejs/plugin-react-swc` 3.11.0 | `vite.config.ts` |
| 경로 별칭 | `vite-tsconfig-paths` + `baseUrl: "./src"` | `tsconfig.json:3` |
| 라우팅 | react-router-dom 7.9.5 (`BrowserRouter`) | `src/index.tsx` |
| 클라이언트 상태 | zustand 4.5.2 | `src/state/*.ts` |
| 서버 상태 | **@tanstack/react-query v5 — 도입 대상, 아직 미설치** | 아래 "전환 중인 항목" |
| 스타일링 | TailwindCSS 3.4.17 (+ postcss, autoprefixer) | `tailwind.config.mjs` |
| 테스트 | vitest 1.6.1 + happy-dom + @testing-library/react (**테스트 0개**) | `vite.config.ts:9-14` |
| 린트/포맷 | eslint 8.57.1 / prettier 3.1.1 (`semi: false`, `singleQuote`, `trailingComma: none`) | `.eslintrc`, `.prettierrc` |
| 패키지 매니저 | **pnpm** (`package-lock.json`은 제거 대상) | `SETUP.md` |
| 배포 | Vercel | `vercel.json` |

## 검증 명령어

`package.json`의 script 이름 그대로다. 다른 이름을 지어내지 않는다.

```bash
pnpm run typecheck   # tsc --project tsconfig.json --noEmit
pnpm run lint        # eslint src --max-warnings=0   (경고 1개도 실패)
pnpm run build       # tsc && vite build
pnpm run test        # vitest  (watch 모드. CI에서는 vitest run)
pnpm run dev         # vite    (http://localhost:5173)
```

**코드를 변경했으면 최소한 `typecheck`와 `lint`를 돌리고, 결과를 보고에 그대로 적는다.**
`gen:regions` script는 대상 파일 `scripts/build-regions.mjs`가 없어 현재 실패한다. 쓰지 않는다.

## 디렉터리 구조 (목표)

**feature 기반**이다. 파일의 위치는 "무엇인가(component/util)"가 아니라 **"어떤 기능에 속하는가"**로 정한다.

```
src/
├─ app/                    앱 셸. 엔트리·라우터·프로바이더만.
│  ├─ App.tsx              레이아웃 + <Routes>
│  ├─ routes.ts            ROUTES 경로 상수 (문자열 리터럴의 유일한 정본)
│  └─ providers.tsx        BrowserRouter, QueryClientProvider
├─ features/               기능 단위. 서로를 공개 진입점으로만 참조한다.
│  ├─ region/              지역 선택·지역 상세
│  ├─ recommendation/      조건 검색·추천 결과
│  ├─ comparison/          지역 비교
│  └─ map/                 지도 검색
│     ├─ api/              엔드포인트 함수 + useQuery 훅 + 응답 매핑
│     ├─ components/       이 기능에서만 쓰는 컴포넌트
│     ├─ model/            타입, zustand 스토어, 순수 도메인 함수
│     ├─ pages/            라우트가 직접 렌더링하는 화면
│     └─ index.ts          공개 진입점(barrel). 다른 feature는 이것만 import한다.
├─ shared/                 2개 이상 feature가 쓰는 것만. 기능을 모른다.
│  ├─ api/                 client.ts(apiGet·ApiError), endpoints.ts, queryKeys.ts
│  ├─ components/          LoadingIndicator, Navbar
│  ├─ hooks/               useSvgFitTransform 등 범용 훅
│  ├─ lib/                 formatters, bitmask, classNames, regionCodes
│  └─ types/               feature를 가로지르는 타입
└─ assets/                 이미지, 지도 path JSON
```

### 각 폴더의 책임과 의존 방향

```
app  →  features  →  shared  →  (외부 라이브러리)
```

| 폴더 | 책임 | import 가능 대상 |
|---|---|---|
| `app/` | 라우팅 연결, 전역 프로바이더, 레이아웃 | `features/*`(barrel), `shared/*` |
| `features/<name>/` | 한 기능의 화면·상태·API·도메인 규칙 | 같은 feature 내부 전체, 다른 feature의 **`index.ts`만**, `shared/*` |
| `shared/` | 기능을 모르는 범용 코드 | `shared/*`, 외부 라이브러리만 |
| `assets/` | 정적 리소스 | — |

**절대 금지**
- `shared/`에서 `features/`나 `app/`을 import — 방향이 뒤집힌다.
- 다른 feature의 내부 경로를 직접 import (`features/region/components/RegionCard` ✗ / `features/region` ✓).
- feature 간 **순환 참조**. 필요하면 콜백 prop으로 의존을 역전시킨다.

### 전환 중인 항목 (현재 코드와 목표의 차이)

위 구조는 **아직 적용되지 않았다.** 현재는 타입별 배치(`src/{components,pages,state,types,utils}`)다.
새 파일은 목표 구조로 만들고, 기존 파일은 건드리는 김에 옮긴다. 요청 없이 대규모 이동을 시작하지 않는다.

| 항목 | 목표 | 현재 |
|---|---|---|
| 디렉터리 | feature 기반 | 타입별 (`components/`, `pages/`, `state/`, `utils/`) |
| 서버 상태 | TanStack Query | 수동 캐시 + `useState`/`useEffect` (`src/utils/index.ts:159-166, 472-544`) |
| API 계층 | `shared/api/` + feature별 `api/` | `src/utils/index.ts` 1개 파일(567줄)에 전부 |
| 라우터 타입 | 정식 `@types` 사용 | `src/types/react-router-dom.d.ts:1`이 라이브러리 전체를 `any`로 만듦 |
| 패키지 매니저 | pnpm 단일 | `package-lock.json`과 `pnpm-lock.yaml` 공존 |

## Critical Rules

1. **요청하지 않은 변경을 하지 않는다.** 지시된 범위 밖의 리팩토링·포맷팅·의존성 추가·파일 이동은 하지 않는다.
   눈에 띈 문제는 고치지 말고 보고에 적는다.
2. **항상 한국어로 응답한다.** 입력 언어나 코드 주석 언어와 무관하다. 코드 식별자는 영어를 쓴다.
3. **커밋·푸시는 사용자가 명시적으로 요청할 때만 한다.** 스스로 `git commit`, `git push`, 브랜치 병합을 하지 않는다.
   요청받았을 때 커밋 메시지는 `<type>: <한국어 요약>` 형식이며 type은
   `feat` / `fix` / `refactor` / `style` / `docs` / `test` / `chore` 중 하나다.
   작업은 `main`이 아닌 별도 브랜치에서 한다.
4. **무관한 파일을 수정하지 않는다.** 특히 `package.json`, `tsconfig.json`, `.eslintrc`, `.prettierrc`,
   `tailwind.config.mjs`, `vite.config.ts`, `vercel.json`은 그 파일을 바꾸는 것이 작업의 목적일 때만 연다.
   `src/assets/*.json`(지도 좌표·지역 코드)은 생성물이므로 손으로 수정하지 않는다.
5. **`any`와 `@ts-ignore`를 새로 추가하지 않는다.** 현재 코드베이스에 명시적 `any`는 0건이다. 이 상태를 유지한다.
   타입이 정말 불확실하면 `unknown`으로 받고 좁힌다.
6. **API 응답을 그대로 신뢰하지 않는다.** 서버 응답은 `unknown`으로 받아 매핑 함수에서 정규화한 뒤 도메인 타입으로 넘긴다.
   이것이 이 저장소의 기존 관습이다(`src/utils/index.ts:271-419`).
7. **`console.*`를 남기지 않는다.** 현재 0건이다. 디버깅용 출력은 커밋 전에 지운다.
8. **비밀값을 코드에 넣지 않는다.** 서버 주소는 `import.meta.env.VITE_API_BASE_URL` 하나뿐이며 `.env.local`에서 온다.

## 스킬 라우팅

작업을 시작하기 전에 해당하는 스킬을 읽는다. 표에 없는 판단은 기존 코드의 패턴을 근거로 삼는다.

| 상황 | 읽을 스킬 |
|---|---|
| 새 파일을 어느 폴더에 둘지, feature를 나눌지, 다른 feature를 참조해도 되는지 판단할 때 | `.claude/skills/architecture-conventions/SKILL.md` |
| 컴포넌트를 만들거나 쪼갤 때, props를 설계할 때, 상태를 어디에 둘지 정할 때, 커스텀 훅을 쓸 때 | `.claude/skills/component-conventions/SKILL.md` |
| API를 호출·추가할 때, 쿼리 키를 정할 때, 로딩·에러 화면을 만들 때, 서버 응답 타입을 정의할 때 | `.claude/skills/api-conventions/SKILL.md` |
| Tailwind 클래스를 쓸 때, 색·간격·반응형을 정할 때, 조건부 스타일을 붙일 때 | `.claude/skills/styling-conventions/SKILL.md` |
| 이름을 지을 때, 타입 정의 위치를 정할 때, import를 정렬할 때, 주석을 달 때 | `.claude/skills/global-conventions/SKILL.md` |

## 에이전트

| 에이전트 | 권한 | 용도 |
|---|---|---|
| `.claude/agents/frontend-developer.md` | 쓰기 (Read, Write, Edit, Glob, Grep, Bash) | 기능 구현·리팩토링 실행 |
| `.claude/agents/code-reviewer.md` | 읽기 전용 (Read, Grep, Glob, Bash) | 변경 파일을 스킬 규약 기준으로 검토. 코드 수정 금지 |

## 알아둘 함정

- **`react-router-dom.d.ts`가 타입을 지운다.** `src/types/react-router-dom.d.ts:1`의 `declare module 'react-router-dom'`
  때문에 라우터 API 전체가 `any`다. 그래서 `src/components/Navbar.tsx:72,76,98`처럼 `isActive`에 손으로 타입을 적고 있다.
  이 파일은 제거 대상이며, 그 전까지 라우터 관련 타입 오류는 컴파일러가 잡아주지 않는다.
- **`tsconfig.json:19`의 `types` 배열에 `"react-router-dom"`이 들어 있다.** 위 파일을 지울 때 함께 정리해야 한다.
- **`RegionDetail` 타입에 같은 값의 별칭 필드가 여러 벌 있다** (`totalJobs`/`totalJobInfo.count`,
  `monthlyRentAvg`/`dwellingInfo.monthAvg`, `infra`/`infraDetails`, `supportList`/`totalSupportList`).
  `src/utils/index.ts:390-418`이 의도적으로 양쪽을 채운다. **별칭을 새로 늘리지 않는다.**
  제거는 백엔드 응답 계약을 확인한 뒤에만 한다.
- **`lint`는 `--max-warnings=0`이다.** `react-hooks/exhaustive-deps`와 `tailwindcss/classnames-order`가 warn 설정이지만
  경고가 하나만 나도 스크립트는 실패한다.
- **`vitest`의 테스트 파일 패턴은 `**/test.{ts,tsx}`다**(`vite.config.ts:13`). `*.test.ts`가 아니라 파일명이 `test.ts`여야 잡힌다.
- **`src/assets/sigungu2.json`(13.8MB)은 참조가 0건이다.** 새로 쓰지 않는다. 지도 데이터는 `sido.json`, `sigungu.json`을 쓴다.
