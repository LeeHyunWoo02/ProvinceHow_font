import { formatKRWMan, formatNumberComma, formatRatioPercent } from 'utils'

import type { RegionJobProfile } from 'types/search'

/** 이 수치 미만이면 통계로 보기 어려워 참고용이라고 안내한다. */
const LOW_SAMPLE_SIZE = 30
/** 연봉 텍스트 파싱 성공 비율이 이 값 미만이면 중앙값 신뢰도가 낮다. */
const LOW_SALARY_PARSED_RATIO = 0.5

type RegionJobProfileSummaryProps = {
  profile: RegionJobProfile | null
}

export default function RegionJobProfileSummary({
  profile
}: RegionJobProfileSummaryProps) {
  if (!profile) return null

  const {
    salaryMedianManwon,
    newcomerRatio,
    topIndustries,
    sampleSize,
    salaryParsedCount
  } = profile

  // 보여줄 지표가 하나도 없으면 빈 껍데기 섹션을 만들지 않는다
  const hasAnyMetric =
    salaryMedianManwon !== null ||
    newcomerRatio !== null ||
    topIndustries.length > 0
  if (!hasAnyMetric) return null

  const newcomerPercent =
    newcomerRatio === null ? null : Math.round(newcomerRatio * 100)
  const maxIndustryCount = topIndustries.reduce(
    (max, industry) => Math.max(max, industry.count),
    0
  )

  const captionParts: string[] = []
  if (sampleSize > 0) {
    captionParts.push(`표본 ${formatNumberComma(sampleSize)}건 기준`)
  }
  if (salaryParsedCount > 0) {
    captionParts.push(`연봉 파싱 ${formatNumberComma(salaryParsedCount)}건`)
  }

  const isLowConfidence =
    sampleSize < LOW_SAMPLE_SIZE ||
    (sampleSize > 0 && salaryParsedCount / sampleSize < LOW_SALARY_PARSED_RATIO)

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold dark:text-gray-100">
        지역 채용 프로필
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              연봉 중앙값
            </p>
            {salaryMedianManwon === null ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                집계 정보 없음
              </p>
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatKRWMan(salaryMedianManwon)}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              신입 채용 비율
            </p>
            {newcomerRatio === null || newcomerPercent === null ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                집계 정보 없음
              </p>
            ) : (
              <>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {formatRatioPercent(newcomerRatio)}
                </p>
                {/* 바로 위 문단이 같은 수치를 읽어주므로 막대는 장식으로 둔다 */}
                <div
                  aria-hidden="true"
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                >
                  {/* 채움 폭은 런타임 계산값이라 인라인 style로만 표현할 수 있다 */}
                  <div
                    className="h-full rounded-full bg-brand-600 dark:bg-brand-300"
                    style={{ width: `${newcomerPercent}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {topIndustries.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              주요 업종 Top {topIndustries.length}
            </h3>
            <ul className="mt-3 space-y-2">
              {topIndustries.map((industry) => {
                const barPercent =
                  maxIndustryCount > 0
                    ? Math.round((industry.count / maxIndustryCount) * 100)
                    : 0
                // 표본 대비 비중은 100%를 넘을 수 없다. 서버 값이 어긋나도 상한을 지킨다
                const sharePercent =
                  sampleSize > 0
                    ? formatRatioPercent(
                        Math.min(1, industry.count / sampleSize)
                      )
                    : null

                return (
                  <li key={industry.name} className="flex items-center gap-3">
                    {/* 좁은 화면에서는 잘릴 수 있으므로 전체 이름을 title로 남긴다 */}
                    <span
                      title={industry.name}
                      className="w-24 shrink-0 truncate text-sm text-gray-700 dark:text-gray-200"
                    >
                      {industry.name}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <span
                        className="block h-full rounded-full bg-brand-400"
                        style={{ width: `${barPercent}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                      {formatNumberComma(industry.count)}건
                      {sharePercent ? ` · ${sharePercent}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {captionParts.length > 0 && (
          <p className="mt-4 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {captionParts.join(' · ')}
          </p>
        )}
        {/* 신뢰도 경고는 지표보다 먼저 읽혀야 하므로 색이 아닌 문구로도 경고임을 밝힌다 */}
        {isLowConfidence && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <span aria-hidden="true">⚠</span>
            <span className="font-semibold">주의</span>
            <span>표본이 적어 참고용 수치입니다.</span>
          </p>
        )}
      </div>
    </section>
  )
}
