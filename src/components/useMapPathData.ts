import { useCallback, useEffect, useState } from 'react'

export type MapPathsMap = Record<string, string>

const EMPTY_PATHS: MapPathsMap = {}

const LOAD_ERROR_MESSAGE = '지도 데이터를 불러오지 못했습니다.'

// 지도 좌표 JSON은 합계 4.6MB라 정적 import하면 지도를 쓰지 않는 화면까지
// 전량 내려받는다. 동적 import로 별도 청크로 분리하고, 모듈 수준에 프로미스를
// 캐시해 여러 지도 컴포넌트가 동시에 마운트돼도 한 번만 받아 파싱하게 한다.
// 시도(101kB)와 시군구(4.5MB)는 필요 시점이 다르므로 캐시도 따로 둔다.
let pendingSidoLoad: Promise<MapPathsMap> | null = null
let pendingSigunguLoad: Promise<MapPathsMap> | null = null

function loadSidoPaths(): Promise<MapPathsMap> {
  if (!pendingSidoLoad) {
    pendingSidoLoad = import('../assets/sido.json')
      .then((module) => module.default as MapPathsMap)
      .catch((error: unknown) => {
        // 실패한 프로미스를 캐시에 남기면 재시도가 영원히 같은 오류를 돌려준다.
        pendingSidoLoad = null
        throw error
      })
  }
  return pendingSidoLoad
}

function loadSigunguPaths(): Promise<MapPathsMap> {
  if (!pendingSigunguLoad) {
    pendingSigunguLoad = import('../assets/sigungu.json')
      .then((module) => module.default as MapPathsMap)
      .catch((error: unknown) => {
        pendingSigunguLoad = null
        throw error
      })
  }
  return pendingSigunguLoad
}

type LazyPathsState = {
  paths: MapPathsMap | null
  error: string | null
  isLoading: boolean
  retry: () => void
}

// enabled가 false인 동안에는 동적 import 자체를 시작하지 않는다.
function useLazyPaths(
  load: () => Promise<MapPathsMap>,
  enabled: boolean
): LazyPathsState {
  const [paths, setPaths] = useState<MapPathsMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let isSubscribed = true
    setError(null)

    load()
      .then((loaded) => {
        if (!isSubscribed) return
        setPaths(loaded)
      })
      .catch(() => {
        if (!isSubscribed) return
        setError(LOAD_ERROR_MESSAGE)
      })

    return () => {
      isSubscribed = false
    }
  }, [enabled, load, retryToken])

  const retry = useCallback(() => setRetryToken((token) => token + 1), [])

  // 이펙트가 실행되기 전 한 프레임 동안 빈 지도가 그려지지 않도록 상태에서 파생한다.
  const isLoading = enabled && paths === null && error === null

  return { paths, error, isLoading, retry }
}

type UseMapPathDataOptions = {
  // 시군구 path가 실제로 필요한 시점에만 true로 올린다.
  needsSigungu: boolean
}

type MapPathDataState = {
  sidoPaths: MapPathsMap
  sigunguPaths: MapPathsMap
  error: string | null
  isLoading: boolean
  retry: () => void
}

export function useMapPathData({
  needsSigungu
}: UseMapPathDataOptions): MapPathDataState {
  const sido = useLazyPaths(loadSidoPaths, true)
  const sigungu = useLazyPaths(loadSigunguPaths, needsSigungu)

  const retrySido = sido.retry
  const retrySigungu = sigungu.retry
  const retry = useCallback(() => {
    retrySido()
    retrySigungu()
  }, [retrySido, retrySigungu])

  return {
    sidoPaths: sido.paths ?? EMPTY_PATHS,
    sigunguPaths: sigungu.paths ?? EMPTY_PATHS,
    error: sido.error ?? (needsSigungu ? sigungu.error : null),
    isLoading: sido.isLoading || sigungu.isLoading,
    retry
  }
}
