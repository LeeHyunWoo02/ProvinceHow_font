import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import Combobox from 'shared/components/Combobox'
import {
  loadSidoList,
  loadSigunguList,
  getSigunguBySido,
  REGION_JSON
} from 'utils/regionCodes'

import type { ComboboxOption } from 'shared/components/Combobox'

interface Props {
  defaultSidoCode?: string
  defaultSigunguCode?: string
  onSelect: (sigunguCode: string) => void
  actionLabel?: string
}

export default function RegionDrilldown({
  defaultSidoCode,
  defaultSigunguCode,
  onSelect,
  actionLabel = '선택 완료'
}: Props) {
  const hintId = useId()
  const sidoList = useMemo(() => loadSidoList(), [])
  const [sido, setSido] = useState<string>(() => {
    if (!defaultSidoCode) {
      return ''
    }
    return defaultSidoCode
  })
  const [sigungu, setSigungu] = useState<string>(() => {
    if (!defaultSigunguCode) {
      return ''
    }
    const parent = REGION_JSON.sigunguByCode[defaultSigunguCode]
    if (!parent) {
      return ''
    }
    return defaultSigunguCode
  })
  const [sidoQuery, setSidoQuery] = useState('')
  const [sigunguQuery, setSigunguQuery] = useState('')

  const sigunguListAll = useMemo(() => loadSigunguList(), [])
  const sigunguList = useMemo(
    () => (sido ? getSigunguBySido(sido) : sigunguListAll),
    [sido, sigunguListAll]
  )
  useEffect(() => {
    if (defaultSigunguCode) {
      const parent = REGION_JSON.sigunguByCode[defaultSigunguCode]
      if (!parent) {
        setSigungu('')
        if (!defaultSidoCode) {
          setSido('')
        }
        return
      }
      setSido(parent.sidoCode)
      setSigungu(defaultSigunguCode)
      return
    }

    if (defaultSidoCode) {
      setSido(defaultSidoCode)
      setSigungu('')
      return
    }

    setSido('')
    setSigungu('')
  }, [defaultSidoCode, defaultSigunguCode])
  const duplicateNamesInCurrent = useMemo(() => {
    const count = new Map<string, number>()
    for (const g of sigunguList) {
      count.set(g.name, (count.get(g.name) || 0) + 1)
    }
    const dup = new Set<string>()
    for (const [name, c] of count.entries()) if (c > 1) dup.add(name)
    // 만약 시도가 비어 있어 전역 목록을 보여줄 때는 전역 중복 기준 적용
    if (!sido) {
      const globalCount = new Map<string, number>()
      for (const g of sigunguListAll)
        globalCount.set(g.name, (globalCount.get(g.name) || 0) + 1)
      for (const [name, c] of globalCount.entries()) if (c > 1) dup.add(name)
    }
    return dup
  }, [sigunguList, sigunguListAll, sido])

  const getSigunguLabel = useCallback(
    (g: { code: string; name: string; sidoCode: string }): string => {
      const needPrefix = duplicateNamesInCurrent.has(g.name)
      return needPrefix && !sido
        ? `${REGION_JSON.sidoByCode[g.sidoCode] || ''} ${g.name}`.trim()
        : g.name
    },
    [duplicateNamesInCurrent, sido]
  )
  const filteredSido = useMemo(() => {
    const q = sidoQuery.trim()
    if (!q) return sidoList
    return sidoList.filter((s) =>
      s.name.toLowerCase().includes(q.toLowerCase())
    )
  }, [sidoList, sidoQuery])
  const filteredSigungu = useMemo(() => {
    const q = sigunguQuery.trim()
    if (!q) return sigunguList
    return sigunguList.filter((g) => {
      const label = getSigunguLabel(g)
      return (
        g.name.toLowerCase().includes(q.toLowerCase()) ||
        label.toLowerCase().includes(q.toLowerCase())
      )
    })
  }, [getSigunguLabel, sigunguList, sigunguQuery])

  const sidoOptions = useMemo<ComboboxOption[]>(
    () => filteredSido.map((s) => ({ value: s.code, label: s.name })),
    [filteredSido]
  )
  const sigunguOptions = useMemo<ComboboxOption[]>(
    () =>
      filteredSigungu.map((g) => {
        const label = getSigunguLabel(g)
        const sidoName = REGION_JSON.sidoByCode[g.sidoCode] || ''
        // 라벨에 이미 시·도명이 붙었거나 시·도가 정해져 있으면 보조 설명은 중복이다
        const needHint = !sido && sidoName !== '' && label === g.name
        return {
          value: g.code,
          label,
          hint: needHint ? sidoName : undefined
        }
      }),
    [filteredSigungu, getSigunguLabel, sido]
  )

  useEffect(() => {
    if (!sigunguList.find((s) => s.code === sigungu)) {
      setSigungu('')
    }
  }, [sigungu, sigunguList])

  // 초기 질의 텍스트를 현재 선택값의 이름으로 세팅
  useEffect(() => {
    const currentSidoName = REGION_JSON.sidoByCode[sido]
    setSidoQuery(currentSidoName || '')
  }, [sido])
  useEffect(() => {
    const current = sigunguList.find((g) => g.code === sigungu)
    setSigunguQuery(current ? getSigunguLabel(current) : '')
  }, [getSigunguLabel, sigungu, sigunguList])

  // 목록에서 고르지 않고 입력창을 떠났을 때, 이름이 정확히 일치하면 선택으로 확정한다
  const confirmSidoInput = () => {
    const name = sidoQuery.trim()
    const match = sidoList.find((s) => s.name === name)
    if (match) {
      setSido(match.code)
      setSidoQuery(match.name)
    } else {
      setSido('')
      setSidoQuery('')
      setSigungu('')
      setSigunguQuery('')
    }
  }

  const confirmSigunguInput = () => {
    const name = sigunguQuery.trim()
    const baseList = sido ? sigunguList : sigunguListAll
    const match = baseList.find((g) => getSigunguLabel(g) === name)
    if (match) {
      setSigungu(match.code)
      setSigunguQuery(getSigunguLabel(match))
      setSido(match.sidoCode)
      setSidoQuery(REGION_JSON.sidoByCode[match.sidoCode] || '')
    } else {
      setSigungu('')
      setSigunguQuery('')
    }
  }

  const handleSidoQueryChange = (query: string) => {
    setSidoQuery(query)
    setSido('')
  }

  const handleSidoSelect = (option: ComboboxOption) => {
    setSido(option.value)
    setSidoQuery(option.label)
    // 시군구는 자동 선택하지 않고 비움
    setSigungu('')
    setSigunguQuery('')
  }

  const handleSigunguQueryChange = (query: string) => {
    setSigunguQuery(query)
    setSigungu('')
  }

  const handleSigunguSelect = (option: ComboboxOption) => {
    setSigungu(option.value)
    setSigunguQuery(option.label)
    // 시군구 선택 시 해당 시도 자동 채움
    const parent = REGION_JSON.sigunguByCode[option.value]
    if (parent) {
      setSido(parent.sidoCode)
      setSidoQuery(parent.sidoName || '')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="border-b border-gray-100 bg-brand-50/60 px-5 py-4 dark:border-gray-800 dark:bg-brand-950">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            지역 선택
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          시·도를 고르고, 시·군·구를 선택하세요.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Combobox
          label="시·도"
          query={sidoQuery}
          onQueryChange={handleSidoQueryChange}
          options={sidoOptions}
          onSelect={handleSidoSelect}
          onCommit={confirmSidoInput}
          onClear={() => handleSidoQueryChange('')}
          placeholder="예: 경상북도"
          description="시·도 이름으로 검색해 선택하세요."
        />

        <Combobox
          label="시·군·구"
          query={sigunguQuery}
          onQueryChange={handleSigunguQueryChange}
          options={sigunguOptions}
          onSelect={handleSigunguSelect}
          onCommit={confirmSigunguInput}
          onClear={() => handleSigunguQueryChange('')}
          placeholder="예: 안동시"
          description="시·군·구 이름으로 검색해 선택하세요."
          emptyMessage={
            sigunguQuery.trim()
              ? '해당 이름의 시·군·구를 찾을 수 없습니다.'
              : undefined
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
        <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
          {sigungu
            ? '선택한 지역은 페이지 이동 후 상단에 표시됩니다.'
            : '시·군·구를 선택하면 아래 버튼을 사용할 수 있습니다.'}
        </p>
        <button
          type="button"
          disabled={!sigungu}
          aria-describedby={hintId}
          onClick={() => sigungu && onSelect(sigungu)}
          className="min-h-11 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none dark:bg-brand-400 dark:text-gray-950 dark:shadow-none dark:hover:bg-brand-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
