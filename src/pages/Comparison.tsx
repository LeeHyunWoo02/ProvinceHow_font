import { useMemo } from 'react'
import RegionDrilldown from 'components/RegionDrilldown'
import RegionCard from 'components/RegionCard'
import LoadingIndicator from 'components/LoadingIndicator'
import { useNavigate } from 'react-router-dom'
import type {
  InfraStat,
  RegionRecommendation,
  RegionDetail,
  RegionDetailInfraItem
} from 'types/search'
import { formatKRWMan, formatNumberComma } from 'utils'
import { COMPARISON_MAX_ITEMS, useComparison } from 'state/comparisonStore'

type MetricEntry = { value: number; sigunguName: string }

/** 최고/최저 지역을 하나 고른다. 값이 같으면 먼저 추가된 지역이 남는다. */
function pickExtreme(
  entries: MetricEntry[],
  mode: 'max' | 'min'
): MetricEntry | null {
  return entries.reduce<MetricEntry | null>((best, entry) => {
    if (!best) return entry
    if (mode === 'max') return entry.value > best.value ? entry : best
    return entry.value < best.value ? entry : best
  }, null)
}

export default function Comparison() {
  const navigate = useNavigate()
  const {
    items,
    addBySigunguCode,
    removeBySigunguCode,
    isAdding,
    error,
    clearError
  } = useComparison()

  function toRecommendation(d: RegionDetail): RegionRecommendation {
    const infraByMajor = new Map<string, number>()
    ;(d.infra || []).forEach((i: RegionDetailInfraItem) =>
      infraByMajor.set(i.major, (infraByMajor.get(i.major) || 0) + (i.num || 0))
    )
    const infra: InfraStat[] =
      d.infraMajors ??
      Array.from(infraByMajor.entries()).map(([major, num]) => ({
        major: major as InfraStat['major'],
        num
      }))

    const totalJobInfo =
      d.totalJobInfo ??
      (typeof d.totalJobs === 'number'
        ? { count: d.totalJobs, url: d.jobURL }
        : null)
    const fitJobInfo =
      d.fitJobInfo ??
      (typeof d.fitJobs === 'number'
        ? { count: d.fitJobs, url: d.jobURL }
        : null)

    const dwellingSimple = d.dwellingInfo
      ? {
          monthMid: d.dwellingInfo.monthMid ?? null,
          jeonseMid: d.dwellingInfo.jeonseMid ?? null
        }
      : undefined

    return {
      sidoCode: d.sidoCode,
      sidoName: d.sidoName,
      sigunguCode: d.sigunguCode,
      sigunguName: d.sigunguName,
      totalJobInfo,
      fitJobInfo,
      fitSupportNum: d.fitSupportNum ?? null,
      totalSupportNum: d.totalSupportNum ?? d.totalSupportList?.length ?? null,
      dwellingSimpleInfo: dwellingSimple,
      infraMajors: infra
    }
  }

  const recommendations = useMemo(() => items.map(toRecommendation), [items])

  const metricsExtremes = useMemo(() => {
    const jobEntries: MetricEntry[] = []
    const supportEntries: MetricEntry[] = []
    const monthlyEntries: MetricEntry[] = []
    const jeonseEntries: MetricEntry[] = []

    recommendations.forEach((rec) => {
      const sigunguName = rec.sigunguName || rec.sidoName || '선택한 지역'

      const jobValue =
        typeof rec.fitJobInfo?.count === 'number'
          ? rec.fitJobInfo.count
          : typeof rec.totalJobInfo?.count === 'number'
            ? rec.totalJobInfo.count
            : null
      if (jobValue != null) {
        jobEntries.push({ value: jobValue, sigunguName })
      }

      const supportValue =
        typeof rec.fitSupportNum === 'number'
          ? rec.fitSupportNum
          : typeof rec.totalSupportNum === 'number'
            ? rec.totalSupportNum
            : null
      if (supportValue != null) {
        supportEntries.push({ value: supportValue, sigunguName })
      }

      const monthlyValue =
        typeof rec.dwellingSimpleInfo?.monthMid === 'number'
          ? rec.dwellingSimpleInfo.monthMid
          : null
      if (monthlyValue != null && monthlyValue > 0) {
        monthlyEntries.push({ value: monthlyValue, sigunguName })
      }

      const jeonseValue =
        typeof rec.dwellingSimpleInfo?.jeonseMid === 'number'
          ? rec.dwellingSimpleInfo.jeonseMid
          : null
      if (jeonseValue != null && jeonseValue > 0) {
        jeonseEntries.push({ value: jeonseValue, sigunguName })
      }
    })

    return {
      maxJob: pickExtreme(jobEntries, 'max'),
      maxSupport: pickExtreme(supportEntries, 'max'),
      minMonthly: pickExtreme(monthlyEntries, 'min'),
      minJeonse: pickExtreme(jeonseEntries, 'min')
    }
  }, [recommendations])

  // 색으로만 표시된 최고/최저값을 문장으로도 전달한다
  const summaryLines = useMemo(() => {
    const lines: { id: string; label: string; text: string }[] = []
    if (metricsExtremes.maxJob) {
      lines.push({
        id: 'maxJob',
        label: '일자리가 가장 많은 지역',
        text: `${metricsExtremes.maxJob.sigunguName} (${formatNumberComma(
          metricsExtremes.maxJob.value
        )}건)`
      })
    }
    if (metricsExtremes.maxSupport) {
      lines.push({
        id: 'maxSupport',
        label: '지원사업이 가장 많은 지역',
        text: `${metricsExtremes.maxSupport.sigunguName} (${formatNumberComma(
          metricsExtremes.maxSupport.value
        )}건)`
      })
    }
    if (metricsExtremes.minMonthly) {
      lines.push({
        id: 'minMonthly',
        label: '월세 중앙값이 가장 낮은 지역',
        text: `${metricsExtremes.minMonthly.sigunguName} (${formatKRWMan(
          metricsExtremes.minMonthly.value
        )})`
      })
    }
    if (metricsExtremes.minJeonse) {
      lines.push({
        id: 'minJeonse',
        label: '전세 중앙값이 가장 낮은 지역',
        text: `${metricsExtremes.minJeonse.sigunguName} (${formatKRWMan(
          metricsExtremes.minJeonse.value
        )})`
      })
    }
    return lines
  }, [metricsExtremes])

  const isFull = items.length >= COMPARISON_MAX_ITEMS

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-semibold dark:text-gray-100">비교 분석</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          추가하기 버튼으로 여러 지역을 추가해 비교하세요. 최대{' '}
          {COMPARISON_MAX_ITEMS}개 지역까지 담을 수 있습니다. (현재{' '}
          <span className="tabular-nums">{items.length}</span>개)
        </p>
        <div className="mt-4">
          <RegionDrilldown actionLabel="추가하기" onSelect={addBySigunguCode} />
        </div>
        {isFull && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            비교 목록이 가득 찼습니다. 새 지역을 추가하려면 기존 지역을 먼저
            제거해 주세요.
          </p>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={clearError}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600"
          >
            닫기
          </button>
        </div>
      )}

      {isAdding && (
        <LoadingIndicator
          className="py-6"
          messages={[
            '선택한 지역의 세부 정보를 불러오고 있어요...',
            '비교 데이터를 준비 중입니다. 잠시만 기다려 주세요.'
          ]}
          description="곧 비교 목록에 추가됩니다."
        />
      )}

      <section className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              추가된 지역이 없습니다.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              위의 지역 선택에서 시도와 시군구를 고른 뒤 추가하기 버튼을 누르면
              이곳에서 비교할 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            {summaryLines.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  비교 요약
                </h2>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {summaryLines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800"
                    >
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        {line.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {line.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => {
                const jobValue =
                  typeof rec.fitJobInfo?.count === 'number'
                    ? rec.fitJobInfo.count
                    : typeof rec.totalJobInfo?.count === 'number'
                      ? rec.totalJobInfo.count
                      : null
                const supportValue =
                  typeof rec.fitSupportNum === 'number'
                    ? rec.fitSupportNum
                    : typeof rec.totalSupportNum === 'number'
                      ? rec.totalSupportNum
                      : null
                const monthlyValue =
                  typeof rec.dwellingSimpleInfo?.monthMid === 'number'
                    ? rec.dwellingSimpleInfo.monthMid
                    : null
                const jeonseValue =
                  typeof rec.dwellingSimpleInfo?.jeonseMid === 'number'
                    ? rec.dwellingSimpleInfo.jeonseMid
                    : null

                // 비교 화면의 강조는 "조건 일치"가 아니라 "이 목록 안에서 최적"이라는 뜻이다
                const metricsHighlight = {
                  jobs:
                    metricsExtremes.maxJob != null &&
                    jobValue != null &&
                    jobValue === metricsExtremes.maxJob.value &&
                    '최다 일자리',
                  support:
                    metricsExtremes.maxSupport != null &&
                    supportValue != null &&
                    supportValue === metricsExtremes.maxSupport.value &&
                    '최다 지원사업',
                  monthly:
                    metricsExtremes.minMonthly != null &&
                    monthlyValue != null &&
                    monthlyValue > 0 &&
                    monthlyValue === metricsExtremes.minMonthly.value &&
                    '최저 월세',
                  jeonse:
                    metricsExtremes.minJeonse != null &&
                    jeonseValue != null &&
                    jeonseValue > 0 &&
                    jeonseValue === metricsExtremes.minJeonse.value &&
                    '최저 전세'
                }

                const sigunguCode = String(rec.sigunguCode || '')
                const regionName =
                  rec.sigunguName || rec.sidoName || '선택한 지역'

                return (
                  <div key={sigunguCode} className="relative h-full">
                    {/* 터치 타깃 44px를 확보하려고 클릭 영역과 시각적 원을 분리한다 */}
                    <button
                      type="button"
                      aria-label={`${regionName} 비교에서 제거`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        removeBySigunguCode(sigunguCode)
                      }}
                      className="group absolute right-0 top-0 z-10 inline-flex size-11 items-center justify-center"
                    >
                      <span
                        aria-hidden="true"
                        className="inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow ring-1 ring-gray-200 transition group-hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:group-hover:bg-gray-700"
                      >
                        ×
                      </span>
                    </button>
                    <RegionCard
                      item={rec}
                      metricsColsClass="sm:grid-cols-2"
                      metricsHighlight={metricsHighlight}
                      onCardClick={(code) =>
                        navigate(
                          `/region?sigunguCode=${encodeURIComponent(code)}`
                        )
                      }
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
