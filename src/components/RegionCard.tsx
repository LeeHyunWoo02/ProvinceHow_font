import type { RegionRecommendation, InfraStat } from 'types/search'
import { classNames, formatKRWMan, formatNumberComma } from 'utils'
import { useComparison } from 'state/comparisonStore'

function InfraBadge({ item }: { item: InfraStat }) {
  const label = item.major
  const value =
    typeof item.score === 'number' && Number.isFinite(item.score)
      ? Math.round(item.score)
      : item.num
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
      <span className="font-medium">{label}</span>
      <span className="tabular-nums text-gray-500 dark:text-gray-400">
        {typeof value === 'number' ? value : '-'}
      </span>
    </span>
  )
}

/**
 * `true`는 기존 호출부 호환용이며 기본 문구로 표시한다.
 * 하이라이트의 의미(조건 일치 / 비교 대상 중 최고)는 호출부마다 다르므로
 * 문자열을 주면 그 문구를 배지로 그대로 노출한다.
 */
type MetricsHighlightValue = boolean | string

type MetricsHighlight = {
  jobs?: MetricsHighlightValue
  support?: MetricsHighlightValue
  monthly?: MetricsHighlightValue
  jeonse?: MetricsHighlightValue
}

/** 호출부가 의미를 지정하지 않았을 때 쓰는 중립 문구. */
const DEFAULT_HIGHLIGHT_LABEL = '조건 일치'

function toHighlightLabel(value: MetricsHighlightValue | undefined) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : DEFAULT_HIGHLIGHT_LABEL
  }
  return value ? DEFAULT_HIGHLIGHT_LABEL : null
}

export default function RegionCard({
  item,
  metricsColsClass = 'sm:grid-cols-4',
  metricsHighlight,
  canAdd = false,
  onCardClick = undefined,
  jobCodeForDetail
}: {
  item: RegionRecommendation
  metricsColsClass?: string
  metricsHighlight?: MetricsHighlight
  canAdd?: boolean
  onCardClick?: (sigunguCode: string) => void
  jobCodeForDetail?: string
}) {
  const { addBySigunguCode } = useComparison()
  const infra = item.infraMajors ?? []

  const jobInfo = item.fitJobInfo ?? item.totalJobInfo
  const jobValue = jobInfo?.count
  const hasFitJobData = Boolean(item.fitJobInfo && jobInfo?.count !== undefined)
  const jobLabel = hasFitJobData ? '맞춤 일자리' : '전체 일자리'

  const totalJobFallback = item.totalJobInfo?.count ?? 0
  const displayJobValue = jobValue ?? totalJobFallback

  const supportValue =
    typeof item.fitSupportNum === 'number'
      ? item.fitSupportNum
      : item.totalSupportNum ?? null
  const supportLabel =
    typeof item.fitSupportNum === 'number' ? '맞춤 지원사업' : '전체 지원사업'

  const monthlyValue = item.dwellingSimpleInfo?.monthMid ?? null
  const jeonseValue = item.dwellingSimpleInfo?.jeonseMid ?? null

  const hasScore =
    typeof item.score === 'number' && !item.isAiPick && item.score !== null

  const regionName = [item.sidoName, item.sigunguName]
    .filter((part) => Boolean(part))
    .join(' ')

  const handleCardClick = () => {
    if (!item.sigunguCode) return
    onCardClick?.(String(item.sigunguCode))
  }

  const titleContent = (
    <>
      {item.sidoName}
      {item.sigunguName ? (
        <span aria-hidden="true" className="text-gray-500 dark:text-gray-400">
          {' · '}
        </span>
      ) : null}
      <span className="text-gray-900 dark:text-gray-100">
        {item.sigunguName}
      </span>
    </>
  )

  return (
    <article
      className={classNames(
        'w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 dark:border-gray-800 dark:bg-gray-900',
        onCardClick !== undefined &&
          'cursor-pointer hover:border-brand-200 hover:bg-gray-50 hover:shadow-md dark:hover:border-brand-700 dark:hover:bg-gray-800'
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <div className="mr-auto">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {onCardClick !== undefined ? (
              // 카드 전체 클릭은 마우스 편의이고, 키보드 사용자의 주 경로는 이 제목 버튼이다
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleCardClick()
                }}
                className="rounded-md text-left hover:underline focus:outline-none focus:ring-2 focus:ring-brand-700/25 dark:focus:ring-brand-400/40"
              >
                {titleContent}
                <span className="sr-only">{` ${regionName} 상세 정보 보기`}</span>
              </button>
            ) : (
              titleContent
            )}
          </h3>
        </div>
        <div className="flex flex-row items-end gap-2">
          {item.isAiPick ? (
            <div className="rounded-lg bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 px-3 py-1.5 text-white dark:from-brand-500 dark:via-brand-400 dark:to-brand-300 dark:text-gray-950">
              <span className="text-sm font-semibold">AI Pick</span>
            </div>
          ) : hasScore ? (
            <div className="rounded-lg bg-brand-50 px-3 py-1.5 text-brand-700 ring-1 ring-inset ring-brand-600/20 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-400/30">
              <span className="text-sm font-semibold">Score</span>{' '}
              <span className="tabular-nums">{item.score}</span>
            </div>
          ) : null}

          {canAdd && (
            <button
              type="button"
              onClick={(event) => {
                addBySigunguCode(
                  String(item.sigunguCode),
                  jobCodeForDetail ? { jobCode: jobCodeForDetail } : undefined
                )
                event.preventDefault()
                event.stopPropagation()
              }}
              className="inline-flex rounded-md border border-brand-600 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-700/25 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950 dark:focus:ring-brand-400/40"
            >
              비교에 추가
            </button>
          )}
        </div>
      </div>

      {item.isAiPick &&
        item.aiPickReason &&
        item.aiPickReason.trim().length > 0 && (
          <p className="mt-4 rounded-xl bg-gradient-to-r from-brand-50 via-white to-brand-100 px-4 py-3 text-sm text-gray-700 ring-1 ring-brand-100 dark:from-brand-950 dark:via-gray-900 dark:to-brand-900 dark:text-gray-200 dark:ring-brand-900">
            <span className="mr-2 rounded-md bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 px-2 py-1 font-semibold text-white dark:from-brand-500 dark:via-brand-400 dark:to-brand-300 dark:text-gray-950">
              AI Reason
            </span>
            {item.aiPickReason}
          </p>
        )}

      <div
        className={classNames('mt-4 grid grid-cols-2 gap-4', metricsColsClass)}
      >
        {typeof displayJobValue === 'number' && (
          <MetricBox
            label={jobLabel}
            value={formatNumberComma(displayJobValue)}
            highlightLabel={toHighlightLabel(metricsHighlight?.jobs)}
          />
        )}

        {typeof supportValue === 'number' && (
          <MetricBox
            label={supportLabel}
            value={formatNumberComma(supportValue)}
            highlightLabel={toHighlightLabel(metricsHighlight?.support)}
          />
        )}

        {typeof monthlyValue === 'number' && monthlyValue > 0 && (
          <MetricBox
            label="월세 중앙값"
            value={formatKRWMan(monthlyValue)}
            highlightLabel={toHighlightLabel(metricsHighlight?.monthly)}
          />
        )}

        {typeof jeonseValue === 'number' && jeonseValue > 0 && (
          <MetricBox
            label="전세 중앙값"
            value={formatKRWMan(jeonseValue)}
            highlightLabel={toHighlightLabel(metricsHighlight?.jeonse)}
          />
        )}
      </div>

      {infra.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {infra.map((i) => (
            <InfraBadge key={`${i.major}`} item={i} />
          ))}
        </div>
      )}
    </article>
  )
}

type MetricBoxProps = {
  label: string
  value: string
  highlightLabel: string | null
}

function MetricBox({ label, value, highlightLabel }: MetricBoxProps) {
  const isHighlighted = highlightLabel !== null

  return (
    <div
      className={classNames(
        'rounded-lg border p-3',
        isHighlighted
          ? 'border-green-200 bg-green-50 ring-1 ring-green-200 dark:border-green-800 dark:bg-green-950 dark:ring-green-800'
          : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800'
      )}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
        {value}
      </p>
      {/*
        강조를 색으로만 전달하지 않도록 의미를 글자로 함께 적는다.
        다크에서 배지는 강조 박스(green-950)보다 한 단계 밝아야 알약 형태가 보인다.
      */}
      {isHighlighted && (
        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
          <span aria-hidden="true">✓</span>
          {highlightLabel}
        </p>
      )}
    </div>
  )
}
