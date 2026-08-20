import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import {
  ApiError,
  classNames,
  fetchRegionDetail,
  fetchSupportTags,
  formatKRWMan,
  formatNumberComma
} from 'utils'
import { useComparison } from 'state/comparisonStore'
import { useRecommendationFilters } from 'state/recommendationFilters'
import { normalizeUrl } from 'shared/lib/url'
import RegionDrilldown from 'components/RegionDrilldown'
import RegionPreviewMap from 'components/RegionPreviewMap'
import LoadingIndicator from 'components/LoadingIndicator'

import JobVacancyList from 'features/region/components/JobVacancyList'
import RegionJobProfileSummary from 'features/region/components/RegionJobProfileSummary'

import type { RegionDetail } from 'types/search'
import type { CodeItem } from 'utils'

export default function RegionInfo() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const sigunguCode = params.get('sigunguCode') || ''
  const jobCode = params.get('jobCode') || undefined

  const [data, setData] = useState<RegionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 수동 재시도 트리거. 값이 바뀌면 상세 조회 이펙트가 다시 실행된다.
  const [retryToken, setRetryToken] = useState(0)
  const [supportTags, setSupportTags] = useState<CodeItem[]>([])
  const [supportTagsLoading, setSupportTagsLoading] = useState(false)
  const [supportTagsError, setSupportTagsError] = useState<string | null>(null)
  const { supportTagCodes, setSupportTagCodes, toggleSupportTagCode } =
    useRecommendationFilters()

  useEffect(() => {
    let mounted = true
    setSupportTagsLoading(true)
    setSupportTagsError(null)
    fetchSupportTags()
      .then((tags) => {
        if (!mounted) return
        setSupportTags(tags ?? [])
      })
      .catch(() => {
        if (!mounted) return
        setSupportTagsError('지원 태그를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (mounted) setSupportTagsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!supportTags.length || !supportTagCodes.length) return
    const availableCodes = new Set(supportTags.map((tag) => tag.code))
    const filtered = supportTagCodes.filter((code) => availableCodes.has(code))
    if (filtered.length !== supportTagCodes.length) {
      setSupportTagCodes(filtered)
    }
  }, [supportTags, supportTagCodes, setSupportTagCodes])

  useEffect(() => {
    // sigunguCode가 없으면 아래에서 지역 선택 화면을 렌더하므로 요청하지 않는다.
    if (!sigunguCode) {
      setData(null)
      setError(null)
      return
    }
    let mounted = true
    setIsLoading(true)
    setError(null)
    fetchRegionDetail({ sigunguCode, jobCode, aiUse: true })
      .then((res) => {
        if (!mounted) return
        setData(res)
      })
      .catch((err) => {
        if (!mounted) return
        setError(
          err instanceof ApiError
            ? err.message
            : '지역 정보를 불러오지 못했습니다.'
        )
      })
      .finally(() => mounted && setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [sigunguCode, jobCode, retryToken])

  const jobs = useMemo(() => {
    if (!data) return null
    const fitCount = data.fitJobInfo?.count ?? data.fitJobs
    const totalCount = data.totalJobInfo?.count ?? data.totalJobs
    if (typeof fitCount === 'number')
      return { label: '맞춤 일자리', value: fitCount }
    return { label: '전체 일자리', value: totalCount }
  }, [data])

  const population = useMemo(() => {
    if (!data) return null
    const value = data.population
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }, [data])

  const monthlyAvg = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.monthAvg ?? data.monthlyRentAvg ?? null
  }, [data])

  const monthlyMid = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.monthMid ?? data.monthlyRentMid ?? null
  }, [data])

  const jeonseAvg = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.jeonseAvg ?? data.jeonseAvg ?? null
  }, [data])

  const jeonseMid = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.jeonseMid ?? data.jeonseMid ?? null
  }, [data])

  const aiSummary = useMemo(() => {
    if (!data) return null
    const summary = data.aiSummary ?? null
    if (!summary) return null
    const trimmed = summary.trim()
    return trimmed.length > 0 ? trimmed : null
  }, [data])

  const jobLinkUrl = useMemo(() => {
    if (!data) return ''
    const candidates = [
      data.fitJobInfo?.url,
      data.totalJobInfo?.url,
      data.jobURL
    ]
    for (const candidate of candidates) {
      const normalized = normalizeUrl(candidate)
      if (normalized) return normalized
    }
    return ''
  }, [data])

  const supportTagNameToCode = useMemo(() => {
    const map = new Map<string, string>()
    supportTags.forEach((tag) => {
      map.set(tag.name.trim(), tag.code)
    })
    return map
  }, [supportTags])

  const selectedSupportTagSet = useMemo(() => {
    return new Set<string>(supportTagCodes)
  }, [supportTagCodes])

  const filteredSupportList = useMemo(() => {
    const list = data?.totalSupportList ?? []
    if (!list.length) return []

    const filtered =
      selectedSupportTagSet.size === 0
        ? list
        : list.filter((item) => {
            const keyword = item.keyword?.trim()
            if (!keyword) return false
            const normalized = supportTagNameToCode.get(keyword) ?? keyword
            return selectedSupportTagSet.has(normalized)
          })

    return [...filtered].sort((a, b) => {
      const aHasUrl = Boolean(normalizeUrl(a.url))
      const bHasUrl = Boolean(normalizeUrl(b.url))
      if (aHasUrl === bHasUrl) return 0
      return aHasUrl ? -1 : 1
    })
  }, [data, selectedSupportTagSet, supportTagNameToCode])

  const hasSelectedSupportTags = supportTagCodes.length > 0
  const hasAnySupportItems = (data?.totalSupportList?.length ?? 0) > 0

  const handleRetry = () => setRetryToken((token) => token + 1)
  const handleReselectRegion = () => navigate('/region')

  if (!sigunguCode) {
    return (
      <div className="space-y-4">
        <RegionDrilldown
          onSelect={(code) => {
            const search = new URLSearchParams()
            search.set('sigunguCode', code)
            if (jobCode) search.set('jobCode', jobCode)
            navigate(`/region?${search.toString()}`)
          }}
        />
      </div>
    )
  }

  if (isLoading)
    return (
      <LoadingIndicator
        className="py-16"
        messages={[
          '지역 정보를 수집하고 있어요...',
          '통계를 정리하는 중입니다. 잠시만 기다려 주세요.',
          '지역 데이터와 지원정책을 모으는 중입니다.'
        ]}
        description="최신 데이터를 불러오는 데 다소 시간이 걸릴 수 있습니다."
      />
    )
  if (error)
    return (
      <RegionStatusNotice
        variant="error"
        title="지역 정보를 불러오지 못했습니다"
        description={error}
        onRetry={handleRetry}
        onReselectRegion={handleReselectRegion}
      />
    )
  if (!data)
    return (
      <RegionStatusNotice
        variant="empty"
        title="표시할 지역 정보가 없습니다"
        description="선택하신 지역의 정보를 찾지 못했습니다. 잠시 후 다시 시도하시거나 다른 지역을 선택해 주세요."
        onRetry={handleRetry}
        onReselectRegion={handleReselectRegion}
      />
    )

  return (
    <div className="space-y-6">
      {/* 헤더 메타 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          {/* 좌측: 타이틀 + 지표(줄바꿈 단락) */}
          <div className="flex-1">
            <div className="flex items-end gap-2">
              <div className="mr-auto">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {data.sidoName}
                  {data.sigunguName ? (
                    <span
                      aria-hidden="true"
                      className="text-gray-500 dark:text-gray-400"
                    >
                      {' · '}
                    </span>
                  ) : null}
                  <span className="text-gray-900 dark:text-gray-100">
                    {data.sigunguName}
                  </span>
                </h1>
              </div>

              {jobLinkUrl && (
                <a
                  href={jobLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-1 self-center rounded-md bg-brand-700 px-3 text-sm text-white shadow-sm hover:bg-brand-800 dark:bg-brand-400 dark:text-gray-950 dark:hover:bg-brand-300"
                >
                  채용 정보 바로가기
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only">(새 탭에서 열립니다)</span>
                </a>
              )}
              <AddToCompareButton
                sigunguCode={String(data.sigunguCode || '')}
              />
            </div>

            {/* 인구 + 일자리 카드 */}
            <div className="mt-5 flex flex-wrap gap-2">
              {typeof population === 'number' && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    인구수
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {formatNumberComma(population)}
                  </p>
                </div>
              )}
              {jobs && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {jobs.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {typeof jobs.value === 'number'
                      ? formatNumberComma(jobs.value)
                      : '-'}
                  </p>
                </div>
              )}
            </div>

            {/* 월세/전세: 각 단락 내 줄바꿈 */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">월세</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    평균
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {typeof monthlyAvg === 'number'
                      ? formatKRWMan(monthlyAvg)
                      : '-'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    중간
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {typeof monthlyMid === 'number'
                      ? formatKRWMan(monthlyMid)
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">전세</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    평균
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {typeof jeonseAvg === 'number'
                      ? formatKRWMan(jeonseAvg)
                      : '-'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    중간
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {typeof jeonseMid === 'number'
                      ? formatKRWMan(jeonseMid)
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 인프라 요약 */}
            {data.infra && data.infra.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  인프라
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.infra.map((it, idx) => {
                    const displayValue =
                      typeof it.score === 'number' && Number.isFinite(it.score)
                        ? it.score
                        : it.num
                    return (
                      <span
                        key={`${it.major}-${it.name}-${idx}`}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      >
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {it.major}
                        </span>
                        <span>{it.name}</span>
                        <span className="tabular-nums text-gray-500 dark:text-gray-400">
                          {typeof displayValue === 'number'
                            ? displayValue
                            : '-'}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 선택한 지역의 위치 미리보기 지도 */}
          <div className="w-full lg:w-80 lg:self-stretch xl:w-96">
            <RegionPreviewMap
              sigunguCode={
                data.sigunguCode ? String(data.sigunguCode) : undefined
              }
            />
          </div>
        </div>
      </section>

      {aiSummary && (
        <section className="relative rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-md shadow-brand-100/40 dark:border-brand-900 dark:from-brand-950 dark:via-gray-900 dark:to-gray-900 dark:shadow-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 top-1/2 size-56 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-200/60 via-brand-400/20 to-brand-600/30 blur-3xl dark:from-brand-400/15 dark:via-brand-500/10 dark:to-brand-700/20"
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="relative flex size-12 items-center justify-center rounded-full bg-white/80 text-3xl text-brand-600 shadow-lg ring-1 ring-brand-200 dark:bg-gray-900/80 dark:text-brand-300 dark:shadow-none dark:ring-brand-800"
              >
                <span className="drop-shadow-sm">💡</span>
              </span>
              <div>
                <h2 className="flex items-center gap-1 text-lg font-semibold tracking-wide text-brand-600 dark:text-brand-300">
                  AI Insight
                  <AiSummaryExplainer />
                </h2>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  이 지역의 특징을 한눈에 살펴보세요
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 md:max-w-3xl dark:text-gray-200">
              {aiSummary}
            </p>
          </div>
        </section>
      )}

      <RegionJobProfileSummary profile={data.regionJobProfile} />

      {/* 지역이나 직종이 바뀌면 더보기로 늘린 노출 개수를 초기화하기 위해 key로 remount한다 */}
      <JobVacancyList
        key={`${data.sigunguCode}-${jobCode ?? ''}`}
        vacancies={data.jobVacancies}
      />

      {/* 지원정책 리스트 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold dark:text-gray-100">지원정책</h2>
        {data.totalSupportNum != null && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            총 지원사업
            <span className="mx-1 font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {formatNumberComma(data.totalSupportNum)}건
            </span>
            을 제공합니다.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!hasSelectedSupportTags}
            onClick={() => setSupportTagCodes([])}
            className={classNames(
              'inline-flex min-h-11 items-center rounded-full border px-4 text-xs transition',
              hasSelectedSupportTags
                ? 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                : 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
            )}
          >
            전체
          </button>
          {supportTags.map((tag) => {
            const active = selectedSupportTagSet.has(tag.code)
            return (
              <button
                key={tag.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSupportTagCode(tag.code)}
                className={classNames(
                  'inline-flex min-h-11 items-center rounded-full border px-4 text-xs transition',
                  active
                    ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                )}
              >
                #{tag.name}
              </button>
            )
          })}
          {supportTagsLoading && (
            <LoadingIndicator
              compact
              className="text-xs text-gray-500 dark:text-gray-400"
              messages={[
                '지원 정책 태그를 불러오는 중입니다...',
                '지역별 지원사업 분류를 준비하고 있어요.'
              ]}
              description="조금만 기다려 주시면 필터를 사용할 수 있어요."
            />
          )}
          {!supportTagsLoading && supportTagsError && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {supportTagsError}
            </span>
          )}
          {!supportTagsLoading &&
            !supportTagsError &&
            supportTags.length === 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                표시할 필터 태그가 없습니다.
              </span>
            )}
        </div>
        {/* 필터를 바꿨을 때 결과 변화를 스크린리더에도 알리기 위해 목록 영역을 live region으로 둔다 */}
        <div aria-live="polite" className="space-y-3">
          {hasAnySupportItems && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              지원정책
              <span className="mx-1 font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                {formatNumberComma(filteredSupportList.length)}건
              </span>
              을 표시하고 있습니다.
            </p>
          )}
          {hasAnySupportItems ? (
            filteredSupportList.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredSupportList.map((s, i) => (
                  <article
                    key={`${s.title}-${i}`}
                    className="size-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex size-full flex-col">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {s.title}
                      </h3>
                      {s.keyword && (
                        <span className="mt-2 inline-flex w-fit items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          #{s.keyword}
                        </span>
                      )}
                      {normalizeUrl(s.url) ? (
                        <a
                          href={normalizeUrl(s.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex min-h-11 w-fit items-center gap-1 rounded-md border border-brand-600 px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950"
                        >
                          자세히 보기
                          <span aria-hidden="true">↗</span>
                          <span className="sr-only">(새 탭에서 열립니다)</span>
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                선택한 필터에 해당하는 지원정책이 없습니다.
              </p>
            )
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              표시할 지원정책이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

type RegionStatusNoticeProps = {
  variant: 'error' | 'empty'
  title: string
  description: string
  onRetry: () => void
  onReselectRegion: () => void
}

function RegionStatusNotice({
  variant,
  title,
  description,
  onRetry,
  onReselectRegion
}: RegionStatusNoticeProps) {
  return (
    <section
      role={variant === 'error' ? 'alert' : undefined}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h1>
      <p
        className={classNames(
          'mt-2 text-sm',
          variant === 'error'
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-300'
        )}
      >
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 dark:bg-brand-400 dark:text-gray-950 dark:hover:bg-brand-300"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={onReselectRegion}
          className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 bg-white px-5 text-sm text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600"
        >
          지역 다시 선택
        </button>
      </div>
    </section>
  )
}

function AddToCompareButton({ sigunguCode }: { sigunguCode: string }) {
  const { addBySigunguCode, items } = useComparison()
  const exists = items.some(
    (x) => String(x.sigunguCode) === String(sigunguCode)
  )
  if (!sigunguCode) return null
  return (
    <button
      type="button"
      disabled={exists}
      onClick={() => addBySigunguCode(sigunguCode)}
      className="inline-flex min-h-11 items-center justify-center self-center rounded-md border border-brand-600 px-3 text-sm text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950"
    >
      {exists ? '비교에 추가됨' : '비교에 추가'}
    </button>
  )
}

function AiSummaryExplainer() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelId = useId()

  // 터치 기기에는 hover가 없으므로 클릭으로 열고, 바깥 클릭과 Escape로 닫는다.
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: Event) => {
      const target = event.target
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const introSentences = ['AI는 다음 원칙을 바탕으로 요약을 제공합니다.']
  const bulletLines: string[] = [
    'ㆍ수치 대신 지역의 특징과 분위기에 집중해 자연스러운 문장으로 서술합니다.',
    'ㆍ지역의 고유 장점은 축제·문화, 자연 명소, 특산물, 대학·연구기관, 도시정책 등을 검색해 최근 기사나 공신력 있는 출처 2건 이상을 근거로 삼습니다.',
    'ㆍ근거가 부족하면 과도한 단정을 피하고, 일반적인 긍정적 특성을 중심으로 자연스럽게 묘사합니다.'
  ]
  const closingLines = [
    '서로 일치하거나 상호 보완하는 사실만 요약에 반영하며, 모호하거나 상충되는 정보는 제외합니다.'
  ]

  return (
    <span ref={containerRef} className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label="AI 요약 기준 설명"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={isOpen ? panelId : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex size-11 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-4 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-600 dark:bg-brand-900 dark:text-brand-200"
        >
          ?
        </span>
      </button>
      {/* 좁은 화면에서 가로 오버플로가 생기지 않도록 패널 폭을 뷰포트 기준으로 제한한다 */}
      {isOpen && (
        <div
          id={panelId}
          className="absolute left-0 top-full z-10 mt-2 w-max max-w-[min(100vw_-_8rem,32rem)] rounded-lg border border-brand-100 bg-white p-4 font-normal shadow-lg dark:border-brand-800 dark:bg-gray-900"
        >
          <div className="space-y-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
            {introSentences.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
            <div className="space-y-1">
              {bulletLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {closingLines.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
          </div>
        </div>
      )}
    </span>
  )
}
