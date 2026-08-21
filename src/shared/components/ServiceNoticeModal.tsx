import { useEffect, useId, useRef, useState } from 'react'

import { classNames } from 'utils'

/** 공지 내용이 바뀌면 이 값을 갱신한다. 이전 공지를 닫은 사용자에게도 다시 노출된다. */
const NOTICE_ID = 'job-vacancy-api-approval'
const STORAGE_KEY = `provincehow.notice.${NOTICE_ID}`
const DISMISS_ALWAYS = 'always'
const DISMISS_SESSION = 'session'

/** 프라이빗 모드처럼 스토리지 접근 자체가 예외를 던지는 환경이 있어 전부 감싼다. */
function readDismissed(): boolean {
  try {
    return (
      window.localStorage.getItem(STORAGE_KEY) === DISMISS_ALWAYS ||
      window.sessionStorage.getItem(STORAGE_KEY) === DISMISS_SESSION
    )
  } catch {
    return false
  }
}

function writeDismissed(forever: boolean): void {
  try {
    if (forever) {
      window.localStorage.setItem(STORAGE_KEY, DISMISS_ALWAYS)
      return
    }
    window.sessionStorage.setItem(STORAGE_KEY, DISMISS_SESSION)
  } catch {
    // 스토리지를 못 쓰는 환경에서는 다음 방문에 다시 노출되는 것을 허용한다
  }
}

/**
 * 사이트 진입 시 한 번 뜨는 서비스 공지 팝업.
 * 닫으면 같은 탭 세션 동안 다시 뜨지 않고, '다시 보지 않기'를 켜면 영구히 숨긴다.
 */
export default function ServiceNoticeModal() {
  const reactId = useId()
  const titleId = `${reactId}-title`
  const descriptionId = `${reactId}-description`

  const [isOpen, setIsOpen] = useState(() => !readDismissed())
  const [hideForever, setHideForever] = useState(false)
  const confirmRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      writeDismissed(hideForever)
      setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hideForever])

  // 팝업이 열린 동안 뒤쪽 화면이 스크롤되지 않게 막는다
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) confirmRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  function close() {
    writeDismissed(hideForever)
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-gray-900/50"
        onClick={close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="border-b border-brand-100 bg-brand-50/60 px-5 py-4 dark:border-brand-900 dark:bg-brand-950/40">
          <h2
            id={titleId}
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
          >
            채용공고 정보 제공 안내
          </h2>
        </div>

        <div
          id={descriptionId}
          className="space-y-3 px-5 py-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
        >
          <p>
            현재 채용공고 데이터는 제공 기관의 API 사용 승인을 기다리는
            중입니다. 승인이 완료될 때까지 지역별 채용공고와 채용 프로필이 비어
            있거나 표시되지 않을 수 있습니다.
          </p>
          <p>
            주거비, 지원사업, 생활 인프라 정보는 정상적으로 확인하실 수
            있습니다. 승인이 완료되면 채용 정보도 바로 제공할 예정입니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={hideForever}
              onChange={(event) => setHideForever(event.target.checked)}
              className="size-4 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-600"
            />
            다시 보지 않기
          </label>
          <button
            ref={confirmRef}
            type="button"
            onClick={close}
            className={classNames(
              'rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700',
              'focus:outline-none focus:ring-2 focus:ring-brand-600/40'
            )}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
