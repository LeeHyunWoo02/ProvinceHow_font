import { useEffect, useId, useRef, useState } from 'react'

import { classNames } from 'utils'

export type ComboboxOption = {
  value: string
  label: string
  /** 오른쪽에 흐리게 붙는 보조 설명. 대분류명 등. */
  hint?: string
}

type ComboboxProps = {
  label: string
  /** 입력창에 보이는 텍스트. 선택값의 이름이거나 사용자가 친 검색어다. */
  query: string
  onQueryChange: (query: string) => void
  options: ComboboxOption[]
  onSelect: (option: ComboboxOption) => void
  /** 목록에서 고르지 않고 입력창을 떠났을 때 한 번 호출된다. */
  onCommit?: () => void
  placeholder?: string
  description?: string
  /** 입력값과 일치하는 항목이 없을 때 보여줄 문구. */
  emptyMessage?: string
  onClear?: () => void
}

/**
 * WAI-ARIA Combobox 패턴을 따르는 자동완성 입력.
 * 목록 항목은 role="option"이라 포커스를 받지 않고, 이동은 방향키가 담당한다.
 */
export default function Combobox({
  label,
  query,
  onQueryChange,
  options,
  onSelect,
  onCommit,
  placeholder,
  description,
  emptyMessage,
  onClear
}: ComboboxProps) {
  const reactId = useId()
  const inputId = `${reactId}-input`
  const listboxId = `${reactId}-listbox`
  const descriptionId = description ? `${reactId}-description` : undefined

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxRef = useRef<HTMLUListElement | null>(null)

  const hasOptions = options.length > 0
  const isExpanded = isOpen && hasOptions
  const activeOptionId =
    isExpanded && activeIndex >= 0
      ? `${reactId}-option-${activeIndex}`
      : undefined

  // 목록이 바뀌면 이전 위치가 다른 항목을 가리키게 되므로 강조를 거둔다
  useEffect(() => {
    setActiveIndex(-1)
  }, [options])

  useEffect(() => {
    if (!isExpanded || activeIndex < 0) return
    const listbox = listboxRef.current
    const activeOption = listbox?.children[activeIndex]
    if (activeOption instanceof HTMLElement) {
      activeOption.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, isExpanded])

  const close = () => {
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const selectOption = (option: ComboboxOption) => {
    onSelect(option)
    close()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!hasOptions) return
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(event.key === 'ArrowDown' ? 0 : options.length - 1)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      const next = activeIndex + step
      const wrapped =
        next < 0 ? options.length - 1 : next >= options.length ? 0 : next
      setActiveIndex(wrapped)
      return
    }

    if (event.key === 'Enter') {
      if (isExpanded && activeIndex >= 0) {
        event.preventDefault()
        selectOption(options[activeIndex])
      }
      return
    }

    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault()
        close()
      }
      return
    }

    if (event.key === 'Tab' && isOpen) {
      close()
    }
  }

  // 포커스가 이 컴포넌트 밖으로 나갈 때만 닫는다. 타이머로 추측하지 않는다.
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    close()
    onCommit?.()
  }

  return (
    <div className="flex flex-col gap-2" onBlur={handleBlur}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-describedby={descriptionId}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            onQueryChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={classNames(
            'w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400',
            'focus:border-brand-700 focus:ring-2 focus:ring-brand-700/25 dark:focus:border-brand-400 dark:focus:ring-brand-400/40',
            onClear && query ? 'pr-10' : ''
          )}
        />
        {onClear && query && (
          <button
            type="button"
            aria-label={`${label} 입력 지우기`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onClear()
              setIsOpen(true)
            }}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        )}
        <ul
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          aria-label={label}
          className={classNames(
            // 다크에서는 그림자가 표면을 분리하지 못하므로 경계선을 한 단계 밝게 둔다
            'absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
            isExpanded ? '' : 'hidden'
          )}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${reactId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={classNames(
                'flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left',
                index === activeIndex
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                  : ''
              )}
            >
              <span>{option.label}</span>
              {option.hint && (
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {option.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {description && (
        <p
          id={descriptionId}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      {emptyMessage && !hasOptions && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {emptyMessage}
        </p>
      )}
    </div>
  )
}
