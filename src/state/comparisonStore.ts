import { create } from 'zustand'
import type { RegionDetail } from 'types/search'
import { ApiError, fetchRegionDetail } from 'utils'

/** 비교 화면은 카드 그리드라 항목이 많아지면 한눈에 비교할 수 없다. 실용 한계를 상한으로 둔다. */
export const COMPARISON_MAX_ITEMS = 6

type ComparisonState = {
  items: RegionDetail[]
  isAdding: boolean
  error: string | null
  addBySigunguCode: (
    sigunguCode: string,
    options?: { jobCode?: string }
  ) => Promise<void>
  removeBySigunguCode: (sigunguCode: string) => void
  clearError: () => void
  clear: () => void
}

export const useComparison = create<ComparisonState>((set, get) => ({
  items: [],
  isAdding: false,
  error: null,
  addBySigunguCode: async (
    sigunguCode: string,
    options?: { jobCode?: string }
  ) => {
    if (!sigunguCode) return
    const exists = get().items.some(
      (x) => String(x.sigunguCode) === String(sigunguCode)
    )
    if (exists) return
    if (get().items.length >= COMPARISON_MAX_ITEMS) {
      set({
        error: `비교는 최대 ${COMPARISON_MAX_ITEMS}개 지역까지 가능합니다. 기존 지역을 제거한 뒤 다시 추가해 주세요.`
      })
      return
    }
    set({ isAdding: true, error: null })
    try {
      const data = await fetchRegionDetail({
        sigunguCode,
        midJobCode: options?.jobCode,
        jobCode: options?.jobCode
      })
      set((state) => ({ items: [...state.items, data] }))
    } catch (err) {
      // 호출부가 여러 곳이라 예외를 다시 던지면 미처리 거부가 된다. 상태로만 표현한다.
      set({
        error:
          err instanceof ApiError
            ? err.message
            : '지역 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      })
    } finally {
      set({ isAdding: false })
    }
  },
  removeBySigunguCode: (sigunguCode: string) => {
    set((state) => ({
      items: state.items.filter(
        (x) => String(x.sigunguCode) !== String(sigunguCode)
      )
    }))
  },
  clearError: () => set({ error: null }),
  clear: () => set({ items: [], error: null })
}))
