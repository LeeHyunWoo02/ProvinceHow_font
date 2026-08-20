import {
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
  useRef,
  useCallback
} from 'react'
import { REGION_JSON } from '../utils/regionCodes'
import { classNames } from '../utils'
import LoadingIndicator from './LoadingIndicator'
import { useMapPathData } from './useMapPathData'

type ViewLevel = 'sido' | 'sigungu'

type ScreenPoint = { x: number; y: number }

const TOOLTIP_MARGIN = 8
const TOOLTIP_CURSOR_GAP = 12

// 툴팁·aria-label·상태 표시가 항상 같은 지역명을 쓰도록 계산을 한 곳에 모은다.
function getRegionLabel(viewLevel: ViewLevel, code: string): string {
  if (viewLevel === 'sido') {
    return REGION_JSON.sidoByCode?.[code] ?? code
  }
  return REGION_JSON.sigunguByCode?.[code]?.name ?? code
}

export default function InteractiveMap({
  onSidoChange,
  onViewLevelChange,
  externalResetToken,
  onSigunguClick,
  activeSigunguCode
}: {
  onSidoChange?: (code: string | null, name: string | null) => void
  onViewLevelChange?: (view: ViewLevel) => void
  externalResetToken?: number
  onSigunguClick?: (sigunguCode: string) => void
  activeSigunguCode?: string | null
}) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('sido')
  const [selectedSido, setSelectedSido] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipAnchor, setTooltipAnchor] = useState<ScreenPoint | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<ScreenPoint | null>(
    null
  )
  const measureGroupRef = useRef<SVGGElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  // 키보드로 시도를 선택했을 때만 시군구 첫 도형으로 포커스를 옮긴다.
  const shouldFocusFirstPathRef = useRef(false)
  const [fitTransform, setFitTransform] = useState<string>('')

  // 첫 화면은 시도 지도이므로 시군구 뷰로 넘어갈 때까지 4.5MB 청크를 받지 않는다.
  // activeSigunguCode로 강제 전환되는 경로도 같은 시점에 로드를 시작한다.
  const needsSigungu = viewLevel === 'sigungu' || Boolean(activeSigunguCode)
  const {
    sidoPaths,
    sigunguPaths,
    error: mapPathError,
    isLoading: isMapPathLoading,
    retry: retryMapPathLoad
  } = useMapPathData({ needsSigungu })

  const sigunguEntries = useMemo(() => {
    if (!selectedSido) return [] as Array<[string, string]>
    return Object.entries(sigunguPaths).filter(([code]) =>
      code.startsWith(selectedSido)
    )
  }, [sigunguPaths, selectedSido])

  useEffect(() => {
    if (!activeSigunguCode) return
    const parent = REGION_JSON.sigunguByCode?.[activeSigunguCode]
    const parentCode = parent?.sidoCode ?? activeSigunguCode.slice(0, 2)
    if (!parentCode) return

    setViewLevel('sigungu')
    if (selectedSido !== parentCode) {
      setSelectedSido(parentCode)
      onSidoChange?.(
        parentCode,
        REGION_JSON.sidoByCode?.[parentCode] ?? parent?.sidoName ?? parentCode
      )
    }
  }, [activeSigunguCode, onSidoChange, selectedSido])

  const tooltipLabel = useMemo(() => {
    if (!hoveredId) return ''
    return getRegionLabel(viewLevel, hoveredId)
  }, [hoveredId, viewLevel])

  const mapAriaLabel = useMemo(() => {
    if (viewLevel === 'sido') return '대한민국 시도 지도'
    const sidoName = selectedSido ? getRegionLabel('sido', selectedSido) : ''
    return sidoName ? `${sidoName} 시군구 지도` : '시군구 지도'
  }, [viewLevel, selectedSido])

  // 시군구 뷰에서는 hover가 없는 터치 환경을 위해 현재 지역명을 고정 위치에 보여준다.
  const statusLabel = useMemo(() => {
    if (viewLevel !== 'sigungu') return null
    if (hoveredId) return getRegionLabel('sigungu', hoveredId)
    if (activeSigunguCode) return getRegionLabel('sigungu', activeSigunguCode)
    return '지역을 선택해 주세요.'
  }, [viewLevel, hoveredId, activeSigunguCode])

  const clearTooltip = useCallback(() => {
    setHoveredId(null)
    setTooltipAnchor(null)
    setTooltipPosition(null)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
    setTooltipAnchor({
      x: e.clientX + TOOLTIP_CURSOR_GAP,
      y: e.clientY + TOOLTIP_CURSOR_GAP
    })
  }

  const handlePathFocus = (
    e: React.FocusEvent<SVGPathElement>,
    code: string
  ) => {
    // 키보드 포커스에는 커서 좌표가 없으므로 도형의 화면상 위치를 기준으로 삼는다.
    const rect = e.currentTarget.getBoundingClientRect()
    setHoveredId(code)
    setTooltipAnchor({
      x: rect.left + rect.width / 2,
      y: rect.bottom + TOOLTIP_MARGIN
    })
  }

  const selectSido = useCallback(
    (code: string) => {
      setSelectedSido(code)
      setViewLevel('sigungu')
      clearTooltip()
      onSidoChange?.(code, getRegionLabel('sido', code))
    },
    [clearTooltip, onSidoChange]
  )

  const handlePathKeyDown = (
    e: React.KeyboardEvent<SVGPathElement>,
    activate: () => void
  ) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    // Space의 기본 동작인 페이지 스크롤을 막는다.
    if (e.key === ' ') e.preventDefault()
    activate()
  }

  const resetToSido = () => {
    setViewLevel('sido')
    setSelectedSido(null)
    clearTooltip()
    onSidoChange?.(null, null)
  }

  // notify parent when view changes (to show/hide external back button)
  useEffect(() => {
    onViewLevelChange?.(viewLevel)
  }, [viewLevel, onViewLevelChange])

  // allow parent to request reset via token change
  useEffect(() => {
    if (externalResetToken !== undefined) {
      resetToSido()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalResetToken])

  // 키보드로 시도를 열면 포커스가 사라지므로 시군구 첫 도형으로 옮겨 준다.
  useEffect(() => {
    if (!shouldFocusFirstPathRef.current) return
    if (viewLevel !== 'sigungu' || sigunguEntries.length === 0) return
    shouldFocusFirstPathRef.current = false
    svgRef.current?.querySelector<SVGPathElement>('path')?.focus()
  }, [viewLevel, sigunguEntries])

  // Auto-fit currently visible shapes into the fixed viewBox (800x1000)
  useLayoutEffect(() => {
    const g = measureGroupRef.current
    if (!g) return
    // Defer to next frame to ensure DOM updated
    const raf = requestAnimationFrame(() => {
      try {
        const bbox = g.getBBox()
        const viewW = 800
        const viewH = 1000
        if (
          !isFinite(bbox.width) ||
          !isFinite(bbox.height) ||
          bbox.width === 0 ||
          bbox.height === 0
        ) {
          setFitTransform('')
          return
        }
        const padRatio = 0.02
        const pad = Math.max(5, Math.min(bbox.width, bbox.height) * padRatio)
        const s = Math.min(
          viewW / (bbox.width + pad * 2),
          viewH / (bbox.height + pad * 2)
        )
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        // Center the bbox at view center with padding considered in scaling
        // translate(viewCenter) - scale(s) - translate(-bboxCenter)
        const centerX = viewW / 2
        const centerY = viewH / 2
        const t = `translate(${centerX} ${centerY}) scale(${s}) translate(${-cx} ${-cy})`
        setFitTransform(t)
      } catch {
        setFitTransform('')
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [viewLevel, selectedSido, sigunguEntries, sidoPaths])

  // 툴팁이 뷰포트 오른쪽·아래로 넘치면 기준점 반대편으로 접어 넣는다.
  useLayoutEffect(() => {
    const el = tooltipRef.current
    if (!el || !tooltipAnchor || !tooltipLabel) return
    const { width, height } = el.getBoundingClientRect()
    const maxLeft = window.innerWidth - width - TOOLTIP_MARGIN
    const maxTop = window.innerHeight - height - TOOLTIP_MARGIN
    const flippedLeft =
      tooltipAnchor.x > maxLeft
        ? tooltipAnchor.x - width - TOOLTIP_CURSOR_GAP * 2
        : tooltipAnchor.x
    const flippedTop =
      tooltipAnchor.y > maxTop
        ? tooltipAnchor.y - height - TOOLTIP_CURSOR_GAP * 2
        : tooltipAnchor.y
    setTooltipPosition({
      x: Math.max(TOOLTIP_MARGIN, Math.min(flippedLeft, maxLeft)),
      y: Math.max(TOOLTIP_MARGIN, Math.min(flippedTop, maxTop))
    })
  }, [tooltipAnchor, tooltipLabel])

  return (
    <div className="relative w-full">
      {/* external header is rendered by parent; keep component body minimal */}
      <p className="sr-only">
        지역은 오른쪽 지역 선택 입력으로도 고를 수 있습니다.
      </p>

      <div
        className="w-full"
        style={{
          aspectRatio: '4/5',
          maxWidth: 900,
          maxHeight: '55vh',
          margin: '0 auto'
        }}
      >
        {isMapPathLoading && (
          <div className="flex size-full items-center justify-center">
            <LoadingIndicator
              messages={['지도 데이터를 불러오는 중입니다...']}
            />
          </div>
        )}

        {!isMapPathLoading && mapPathError && (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              {mapPathError}
            </p>
            <button
              type="button"
              onClick={retryMapPathLoad}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-600 px-4 py-2 text-sm text-brand-700 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isMapPathLoading && !mapPathError && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 1000"
            className="size-full"
            preserveAspectRatio="xMidYMid meet"
            ref={svgRef}
            role="group"
            aria-label={mapAriaLabel}
            onMouseLeave={clearTooltip}
          >
            <g transform={fitTransform}>
              <g ref={measureGroupRef}>
                {viewLevel === 'sido'
                  ? Object.entries(sidoPaths).map(([code, d]) => {
                      const label = getRegionLabel('sido', code)
                      return (
                        <path
                          key={code}
                          d={d}
                          role="button"
                          tabIndex={0}
                          aria-label={label}
                          className={classNames(
                            'cursor-pointer fill-gray-300 stroke-white stroke-[0.5] transition-colors dark:fill-gray-700 dark:stroke-gray-900',
                            '[@media(hover:hover)]:hover:fill-brand-400',
                            'focus-visible:stroke-brand-700 focus-visible:stroke-2 dark:focus-visible:stroke-brand-300'
                          )}
                          onMouseEnter={() => setHoveredId(code)}
                          onMouseMove={handleMouseMove}
                          onFocus={(e) => handlePathFocus(e, code)}
                          onBlur={clearTooltip}
                          onKeyDown={(e) =>
                            handlePathKeyDown(e, () => {
                              shouldFocusFirstPathRef.current = true
                              selectSido(code)
                            })
                          }
                          onClick={() => selectSido(code)}
                        />
                      )
                    })
                  : sigunguEntries.map(([code, d]) => {
                      const isActive = activeSigunguCode === code
                      const label = getRegionLabel('sigungu', code)
                      return (
                        <path
                          key={code}
                          d={d}
                          role="button"
                          tabIndex={0}
                          aria-label={label}
                          aria-current={isActive ? 'true' : undefined}
                          className={classNames(
                            'cursor-pointer stroke-white stroke-[0.5] transition-colors dark:stroke-gray-900',
                            isActive
                              ? 'fill-brand-500 dark:fill-brand-300'
                              : 'fill-gray-300 [@media(hover:hover)]:hover:fill-brand-400 dark:fill-gray-700',
                            'focus-visible:stroke-brand-700 focus-visible:stroke-2 dark:focus-visible:stroke-brand-300'
                          )}
                          onMouseEnter={() => setHoveredId(code)}
                          onMouseMove={handleMouseMove}
                          onFocus={(e) => handlePathFocus(e, code)}
                          onBlur={clearTooltip}
                          onKeyDown={(e) =>
                            handlePathKeyDown(e, () => onSigunguClick?.(code))
                          }
                          onClick={() => onSigunguClick?.(code)}
                        />
                      )
                    })}
              </g>
            </g>
          </svg>
        )}
      </div>

      {statusLabel && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-950/90 dark:text-gray-100">
          {statusLabel}
        </div>
      )}

      {hoveredId && tooltipLabel && tooltipAnchor && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs text-white shadow dark:bg-gray-100/90 dark:text-gray-950"
          style={{
            left: tooltipPosition?.x ?? tooltipAnchor.x,
            top: tooltipPosition?.y ?? tooltipAnchor.y,
            visibility: tooltipPosition ? 'visible' : 'hidden'
          }}
        >
          {tooltipLabel}
        </div>
      )}
    </div>
  )
}
