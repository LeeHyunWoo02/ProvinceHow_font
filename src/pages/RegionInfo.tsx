import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ApiError,
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
    if (!sigunguCode) {
      setError('시군구 코드가 필요합니다. (?sigunguCode=)')
      setData(null)
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
  }, [sigunguCode, jobCode])

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
  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 헤더 메타 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          {/* 좌측: 타이틀 + 지표(줄바꿈 단락) */}
          <div className="flex-1">
            <div className="flex items-end gap-2">
              <div className="mr-auto">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {data.sidoName}
                  {data.sigunguName ? (
                    <span className="text-gray-400"> · </span>
                  ) : null}
                  <span className="text-gray-900">{data.sigunguName}</span>
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {data.sidoCode ?? ''}
                  {data.sidoCode ? ' / ' : ''}
                  {data.sigunguCode ?? ''}
                </p>
              </div>

              {jobLinkUrl && (
                <a
                  href={jobLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center self-center rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-brand-700"
                >
                  채용 정보 바로가기
                </a>
              )}
              <AddToCompareButton
                sigunguCode={String(data.sigunguCode || '')}
              />
            </div>

            {/* 인구 + 일자리 카드 */}
            <div className="mt-5 flex flex-wrap gap-2">
              {typeof population === 'number' && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">인구수</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                    {formatNumberComma(population)}
                  </p>
                </div>
              )}
              {jobs && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">{jobs.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                    {typeof jobs.value === 'number'
                      ? formatNumberComma(jobs.value)
                      : '-'}
                  </p>
                </div>
              )}
            </div>

            {/* 월세/전세: 각 단락 내 줄바꿈 */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">월세</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">평균</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof monthlyAvg === 'number'
                      ? formatKRWMan(monthlyAvg)
                      : '-'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">중간</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof monthlyMid === 'number'
                      ? formatKRWMan(monthlyMid)
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">전세</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">평균</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof jeonseAvg === 'number'
                      ? formatKRWMan(jeonseAvg)
                      : '-'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">중간</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
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
                <h2 className="mb-2 text-sm font-semibold text-gray-800">
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
                        className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700"
                      >
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                          {it.major}
                        </span>
                        <span>{it.name}</span>
                        <span className="tabular-nums text-gray-500">
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

          {/* 우측: 위치 정보 목업 */}
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
        <section className="relative rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-md shadow-brand-100/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 top-1/2 size-56 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-200/60 via-brand-400/20 to-brand-600/30 blur-3xl"
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <div className="flex items-center gap-4">
              <span className="relative flex size-12 items-center justify-center rounded-full bg-white/80 text-3xl text-brand-600 shadow-lg ring-1 ring-brand-200">
                <span
                  role="img"
                  aria-label="AI insights"
                  className="drop-shadow-sm"
                >
                  💡
                </span>
              </span>
              <div>
                <div className="flex items-center gap-1 text-lg font-semibold tracking-wide text-brand-600">
                  AI Insight
                  <span className="inline-flex items-center">
                    <AiSummaryExplainer />
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-gray-600/50">
                  이 지역의 특징을 한눈에 살펴보세요
                </h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 md:max-w-3xl">
              {aiSummary}
            </p>
          </div>
        </section>
      )}

      <RegionJobProfileSummary profile={data.regionJobProfile} />

      {/* 지역이 바뀌면 더보기로 늘린 노출 개수를 초기화하기 위해 key로 remount한다 */}
      <JobVacancyList key={data.sigunguCode} vacancies={data.jobVacancies} />

      {/* 지원정책 리스트 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">지원정책</h2>
        {data.totalSupportNum != null && (
          <p className="text-sm text-gray-500">
            총 지원사업
            <span className="mx-1 font-semibold text-gray-700">
              {formatNumberComma(data.totalSupportNum)}건
            </span>
            을 제공합니다.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSupportTagCodes([])}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              hasSelectedSupportTags
                ? 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                : 'border-brand-600 bg-brand-50 text-brand-700'
            }`}
          >
            전체
          </button>
          {supportTags.map((tag) => {
            const active = selectedSupportTagSet.has(tag.code)
            return (
              <button
                key={tag.code}
                type="button"
                onClick={() => toggleSupportTagCode(tag.code)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                #{tag.name}
              </button>
            )
          })}
          {supportTagsLoading && (
            <LoadingIndicator
              compact
              className="text-xs text-gray-500"
              messages={[
                '지원 정책 태그를 불러오는 중입니다...',
                '지역별 지원사업 분류를 준비하고 있어요.'
              ]}
              description="조금만 기다려 주시면 필터를 사용할 수 있어요."
            />
          )}
          {!supportTagsLoading && supportTagsError && (
            <span className="text-xs text-red-500">{supportTagsError}</span>
          )}
          {!supportTagsLoading &&
            !supportTagsError &&
            supportTags.length === 0 && (
              <span className="text-xs text-gray-400">
                표시할 필터 태그가 없습니다.
              </span>
            )}
        </div>
        {hasAnySupportItems ? (
          filteredSupportList.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSupportList.map((s, i) => (
                <article
                  key={`${s.title}-${i}`}
                  className="size-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex size-full flex-col">
                    <h3 className="text-base font-semibold text-gray-900">
                      {s.title}
                    </h3>
                    {s.keyword && (
                      <span className="mt-2 inline-flex w-fit items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                        #{s.keyword}
                      </span>
                    )}
                    {normalizeUrl(s.url) ? (
                      <a
                        href={normalizeUrl(s.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-fit rounded-md border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                      >
                        자세히 보기
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              선택한 필터에 해당하는 지원정책이 없습니다.
            </p>
          )
        ) : (
          <p className="text-gray-500">표시할 지원정책이 없습니다.</p>
        )}
      </section>
    </div>
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
      className="inline-flex items-center justify-center self-center rounded-md border border-brand-600 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exists ? '비교에 추가됨' : '비교에 추가'}
    </button>
  )
}

function AiSummaryExplainer() {
  const introSentences = ['AI는 다음 원칙을 바탕으로 요약을 제공합니다.']
  const bulletLines: string[] = [
    'ㆍ수치 대신 지역의 특징과 분위기에 집중해 자연스러운 문장으로 서술합니다.',
    'ㆍ지역의 고유 장점은 축제·문화, 자연 명소, 특산물, 대학·연구기관, 도시정책 등을 검색해 최근 기사나 공신력 있는 출처 2건 이상을 근거로 삼습니다.',
    'ㆍ근거가 부족하면 과도한 단정을 피하고, 일반적인 긍정적 특성을 중심으로 자연스럽게 묘사합니다.'
  ]
  const closingLines = [
    '서로 일치하거나 상호 보완하는 사실만 요약에 반영하며, 모호하거나 상충되는 정보는 제외합니다.'
  ]

  const explainer = (
    <div className="space-y-2 text-xs leading-5 text-gray-600">
      {introSentences.map((sentence) => (
        <p key={sentence}>{sentence}</p>
      ))}
      <div className="space-y-1">
        {bulletLines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      {closingLines.map((sentence) => (
        <p key={sentence}>{sentence}</p>
      ))}
    </div>
  )

  return (
    <div className="relative inline-flex items-center">
      <div className="group inline-flex items-center">
        <span className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-600">
          ?
        </span>
        <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-max -translate-x-10 rounded-lg border border-brand-100 bg-white p-4 shadow-lg group-hover:block">
          {explainer}
        </div>
      </div>
    </div>
  )
}
