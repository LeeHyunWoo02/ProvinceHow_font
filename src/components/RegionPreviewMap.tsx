import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { REGION_JSON } from '../utils/regionCodes'
import { classNames } from '../utils'
import LoadingIndicator from './LoadingIndicator'
import { useMapPathData } from './useMapPathData'

export default function RegionPreviewMap({
  sigunguCode
}: {
  sigunguCode?: string | null
}) {
  // 시군구 코드가 없으면 시도 지도로 폴백하므로 4.5MB 청크를 받을 이유가 없다.
  const {
    sidoPaths,
    sigunguPaths,
    error: mapPathError,
    isLoading: isMapPathLoading,
    retry: retryMapPathLoad
  } = useMapPathData({ needsSigungu: Boolean(sigunguCode) })

  const selectedSigunguPath = sigunguCode
    ? sigunguPaths[sigunguCode]
    : undefined
  const parentInfo = sigunguCode
    ? REGION_JSON.sigunguByCode?.[sigunguCode]
    : undefined
  const parentSidoCode = parentInfo?.sidoCode
  const siblingSigungu = useMemo(() => {
    if (!parentSidoCode) return [] as Array<[string, string]>
    return Object.entries(sigunguPaths).filter(([code]) =>
      code.startsWith(parentSidoCode)
    )
  }, [parentSidoCode, sigunguPaths])

  // 이 지도는 "이 지역이 어디인가"를 알려주므로 장식이 아니다. 지역명을 접근명으로 준다.
  const mapAriaLabel = useMemo(() => {
    if (!parentInfo) return '대한민국 지도'
    const sidoName =
      (parentSidoCode ? REGION_JSON.sidoByCode?.[parentSidoCode] : undefined) ??
      parentInfo.sidoName ??
      ''
    const regionName = `${sidoName} ${parentInfo.name}`.trim()
    return `${regionName}의 위치를 표시한 지도`
  }, [parentInfo, parentSidoCode])

  const measureGroupRef = useRef<SVGGElement | null>(null)
  const [fitTransform, setFitTransform] = useState('')

  useLayoutEffect(() => {
    const g = measureGroupRef.current
    if (!g) return
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
        const padRatio = 0.04
        const pad = Math.max(5, Math.min(bbox.width, bbox.height) * padRatio)
        const scale = Math.min(
          viewW / (bbox.width + pad * 2),
          viewH / (bbox.height + pad * 2)
        )
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        const centerX = viewW / 2
        const centerY = viewH / 2
        const transform = `translate(${centerX} ${centerY}) scale(${scale}) translate(${-cx} ${-cy})`
        setFitTransform(transform)
      } catch {
        setFitTransform('')
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [siblingSigungu, selectedSigunguPath, parentSidoCode, sidoPaths])

  return (
    <div className="flex size-full min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-inner dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      {isMapPathLoading && (
        <LoadingIndicator
          compact
          messages={['지도 데이터를 불러오는 중입니다...']}
        />
      )}

      {!isMapPathLoading && mapPathError && (
        <div className="flex flex-col items-center gap-3 px-4 text-center">
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
          className="size-full max-h-80 max-w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={mapAriaLabel}
        >
          <g transform={fitTransform} ref={measureGroupRef}>
            {siblingSigungu.length > 0
              ? siblingSigungu.map(([code, d]) => (
                  <path
                    key={code}
                    d={d}
                    className={classNames(
                      'stroke-white stroke-[0.5] dark:stroke-gray-900',
                      code === sigunguCode
                        ? 'fill-brand-600 dark:fill-brand-400'
                        : 'fill-gray-400 dark:fill-gray-600'
                    )}
                  />
                ))
              : Object.entries(sidoPaths).map(([code, d]) => (
                  <path
                    key={code}
                    d={d}
                    className={classNames(
                      'stroke-white stroke-[0.5] dark:stroke-gray-900',
                      code === parentSidoCode
                        ? 'fill-brand-600 dark:fill-brand-400'
                        : 'fill-gray-400 dark:fill-gray-600'
                    )}
                  />
                ))}
            {selectedSigunguPath ? (
              <path
                d={selectedSigunguPath}
                className="fill-brand-600 stroke-white stroke-[0.8] dark:fill-brand-400 dark:stroke-gray-900"
              />
            ) : null}
          </g>
        </svg>
      )}
    </div>
  )
}
