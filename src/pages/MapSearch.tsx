import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegionCard from 'components/RegionCard'
import RegionDrilldown from 'components/RegionDrilldown'
import LoadingIndicator from 'components/LoadingIndicator'
import { ApiError, fetchRegionDetail } from 'utils'
import type {
  RegionRecommendation,
  RegionDetail,
  InfraStat
} from 'types/search'
import InteractiveMap from '../components/InteractiveMap'
import { REGION_JSON } from '../utils/regionCodes'

function toRecommendation(d: RegionDetail): RegionRecommendation {
  const totalJobInfo =
    d.totalJobInfo ??
    (typeof d.totalJobs === 'number'
      ? { count: d.totalJobs, url: d.jobURL }
      : null)
  const fitJobInfo =
    d.fitJobInfo ??
    (typeof d.fitJobs === 'number'
      ? {
          count: d.fitJobs,
          url: d.jobURL
        }
      : null)

  const dwellingSimple = d.dwellingInfo
    ? {
        monthMid: d.dwellingInfo.monthMid ?? null,
        jeonseMid: d.dwellingInfo.jeonseMid ?? null
      }
    : undefined

  const aggregatedInfra: InfraStat[] = (() => {
    const map = new Map<string, { num: number; score: number | null }>()
    for (const item of d.infraMajors ?? d.infraDetails ?? d.infra ?? []) {
      if (!item) continue
      const current = map.get(item.major) ?? { num: 0, score: null }
      map.set(item.major, {
        num: current.num + (item.num ?? 0),
        score: current.score ?? item.score ?? null
      })
    }
    return Array.from(map.entries()).map(([major, data]) => ({
      major: major as InfraStat['major'],
      num: data.num,
      score: data.score
    }))
  })()

  const totalSupportNum =
    d.totalSupportNum ?? d.totalSupportList?.length ?? null

  return {
    sidoCode: d.sidoCode,
    sidoName: d.sidoName,
    sigunguCode: d.sigunguCode,
    sigunguName: d.sigunguName,
    totalJobInfo,
    fitJobInfo,
    totalSupportNum,
    dwellingSimpleInfo: dwellingSimple,
    infraMajors: aggregatedInfra
  }
}

export default function MapSearch() {
  const [sidoName, setSidoName] = useState<string | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [resetToken, setResetToken] = useState(0)
  const navigate = useNavigate()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [selectedSidoCode, setSelectedSidoCode] = useState<string | null>(null)
  const [selectedRec, setSelectedRec] = useState<RegionRecommendation | null>(
    null
  )
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  // 다시 시도 버튼이 같은 시군구로 요청을 한 번 더 보내게 하는 토큰
  const [detailRetryToken, setDetailRetryToken] = useState(0)

  useEffect(() => {
    if (!selectedCode) {
      setSelectedRec(null)
      setSelectedSidoCode(null)
      setDetailError(null)
      setIsDetailLoading(false)
      return
    }
    // 지역을 빠르게 연속 클릭하면 늦게 도착한 응답이 최신 선택을 덮어쓰므로 무시한다
    let mounted = true
    setIsDetailLoading(true)
    setDetailError(null)
    fetchRegionDetail({ sigunguCode: selectedCode })
      .then((d) => {
        if (!mounted) return
        setSelectedRec(toRecommendation(d))
        setSelectedSidoCode(d.sidoCode ? String(d.sidoCode) : null)
        setSidoName(d.sidoName ?? null)
      })
      .catch((err) => {
        if (!mounted) return
        setSelectedRec(null)
        setDetailError(
          err instanceof ApiError
            ? err.message
            : '지역 정보를 불러오지 못했습니다.'
        )
      })
      .finally(() => {
        if (mounted) setIsDetailLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [selectedCode, detailRetryToken])
  return (
    <div className="p-4 pb-8 lg:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.45fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)]">
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:min-h-[520px] dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/60 px-5 py-4 dark:border-brand-900 dark:bg-brand-950/60">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {'지도 검색'}
              {sidoName ? (
                <span
                  aria-hidden="true"
                  className="text-gray-500 dark:text-gray-400"
                >
                  {' · '}
                </span>
              ) : null}
              {sidoName ? (
                <span className="text-gray-900 dark:text-gray-100">
                  {sidoName}
                </span>
              ) : null}
            </h1>
          </div>

          <div className="relative flex flex-1 flex-col p-4">
            {canGoBack && (
              <button
                type="button"
                onClick={() => {
                  setResetToken((t) => t + 1)
                  setSelectedCode(null)
                  setSelectedRec(null)
                  setSelectedSidoCode(null)
                  setSidoName(null)
                }}
                className="absolute right-6 top-6 z-50 inline-flex min-h-11 items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <span aria-hidden>←</span>
                <span className="ml-1">뒤로</span>
              </button>
            )}
            <InteractiveMap
              onSidoChange={(code, name) => {
                setSidoName(name)
                setSelectedSidoCode(code)
              }}
              onViewLevelChange={(view) => setCanGoBack(view === 'sigungu')}
              externalResetToken={resetToken}
              activeSigunguCode={selectedCode}
              onSigunguClick={(code) => {
                setSelectedCode(code)
                const parent = REGION_JSON.sigunguByCode?.[code]
                setSelectedSidoCode(parent?.sidoCode ?? code.slice(0, 2))
                setSidoName(parent?.sidoName ?? null)
              }}
            />
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <RegionDrilldown
            defaultSidoCode={selectedSidoCode ?? undefined}
            defaultSigunguCode={selectedCode ?? undefined}
            onSelect={(code) => {
              setSelectedCode(code)
              const parent = REGION_JSON.sigunguByCode?.[code]
              setSelectedSidoCode(parent?.sidoCode ?? code.slice(0, 2))
              setSidoName(parent?.sidoName ?? null)
            }}
            actionLabel="지역 정보 보기"
          />

          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-brand-100 bg-brand-50/60 px-5 py-4 dark:border-brand-900 dark:bg-brand-950/60">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                지역 정보
              </h2>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              {isDetailLoading ? (
                <LoadingIndicator
                  className="flex-1 justify-center py-10"
                  messages={[
                    '선택한 지역의 정보를 불러오고 있어요...',
                    '지역 데이터를 준비 중입니다. 잠시만 기다려 주세요.'
                  ]}
                />
              ) : detailError ? (
                <div
                  role="alert"
                  className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {detailError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDetailRetryToken((token) => token + 1)}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950"
                  >
                    다시 시도
                  </button>
                </div>
              ) : selectedRec ? (
                <RegionCard
                  item={selectedRec}
                  onCardClick={(code) => {
                    const search = new URLSearchParams()
                    search.set('sigunguCode', code)
                    navigate(`/region?${search.toString()}`)
                  }}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  지역을 선택해 주세요.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
