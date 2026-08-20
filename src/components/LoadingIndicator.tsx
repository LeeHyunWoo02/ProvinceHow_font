import { useState } from 'react'
import { classNames } from 'utils'

const DEFAULT_MESSAGES = [
  '데이터를 정리하고 있어요...',
  '잠시만 기다려 주세요. 더 나은 정보를 준비 중입니다.',
  '최신 정보를 수집하는 중입니다.',
  '필요한 자료를 모으고 있어요...'
]

function sanitizeMessages(messages?: string[]): string[] {
  if (!Array.isArray(messages)) return DEFAULT_MESSAGES
  const filtered = messages
    .map((msg) => (typeof msg === 'string' ? msg.trim() : ''))
    .filter((msg) => msg.length > 0)
  return filtered.length > 0 ? filtered : DEFAULT_MESSAGES
}

function pickRandomMessage(messages?: string[]): string {
  const pool = sanitizeMessages(messages)
  return pool[Math.floor(Math.random() * pool.length)]
}

type LoadingIndicatorProps = {
  messages?: string[]
  className?: string
  compact?: boolean
  description?: string
}

export default function LoadingIndicator({
  messages,
  className,
  compact = false,
  description
}: LoadingIndicatorProps) {
  // 로딩 중 문구가 리렌더마다 바뀌지 않도록 마운트 시 한 번만 고른다
  const [message] = useState(() => pickRandomMessage(messages))

  const spinnerSize = compact ? 'h-8 w-8' : 'h-12 w-12'

  return (
    <div
      role="status"
      aria-live="polite"
      className={classNames(
        compact
          ? 'flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300'
          : 'flex flex-col items-center gap-4 text-center text-sm text-gray-600 dark:text-gray-300',
        className
      )}
    >
      <div
        className={classNames(
          'relative flex items-center justify-center',
          compact ? 'h-8 w-8' : 'h-14 w-14'
        )}
      >
        <span
          className={classNames(
            'absolute rounded-full border-2 border-brand-100 dark:border-brand-900',
            spinnerSize
          )}
        />
        {/* 축소 모션 설정에서는 회전을 멈추고 정적인 원호와 문구로 상태를 전달한다 */}
        <span
          className={classNames(
            'absolute animate-loading-rotate rounded-full border-2 border-brand-500 border-t-transparent motion-reduce:animate-none dark:border-brand-400 dark:border-t-transparent',
            spinnerSize
          )}
        />
      </div>
      <div className="space-y-1">
        <p>{message}</p>
        {description ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
