import { useState } from 'react'

import { classNames, formatNumberComma } from 'utils'
import { normalizeUrl } from 'shared/lib/url'

import type { JobVacancy } from 'types/search'

const INITIAL_VISIBLE_COUNT = 6
const LOAD_MORE_STEP = 6

type JobVacancyListProps = {
  vacancies: JobVacancy[]
}

export default function JobVacancyList({ vacancies }: JobVacancyListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  // 모집중을 앞으로 올리되 서버가 준 순서는 각 그룹 안에서 그대로 유지한다
  const openings = vacancies.filter((vacancy) => vacancy.active !== false)
  const closed = vacancies.filter((vacancy) => vacancy.active === false)
  const sortedVacancies = [...openings, ...closed]

  const visibleVacancies = sortedVacancies.slice(0, visibleCount)
  const remainingCount = sortedVacancies.length - visibleVacancies.length

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">채용공고</h2>
        <span className="text-sm tabular-nums text-gray-500">
          총 {formatNumberComma(vacancies.length)}건
        </span>
      </div>

      {vacancies.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-gray-500">현재 등록된 채용공고가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVacancies.map((vacancy) => (
              <JobVacancyCard key={vacancy.postingId} vacancy={vacancy} />
            ))}
          </div>

          {remainingCount > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) => current + LOAD_MORE_STEP)
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-700 transition hover:border-gray-400"
              >
                더보기 ({formatNumberComma(remainingCount)}건 남음)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/** 형식 검증은 매핑 단계가 끝냈고, 여기서는 값 없음·조각 수만 방어한다. */
function formatDotDate(value: string | null): string {
  if (!value) return ''
  const parts = value.split('-')
  if (parts.length !== 3) return ''
  return parts.join('.')
}

function JobVacancyCard({ vacancy }: { vacancy: JobVacancy }) {
  const isClosed = vacancy.active === false
  const title = vacancy.title || vacancy.companyName || '제목 정보 없음'
  const showCompanyName =
    vacancy.companyName.length > 0 && vacancy.companyName !== title

  const chips = [
    { key: 'regionName', value: vacancy.regionName },
    { key: 'jobName', value: vacancy.jobName },
    { key: 'employmentType', value: vacancy.employmentType }
  ].filter((chip) => chip.value.length > 0)

  // 급여는 "면접 후 결정" 같은 원문 텍스트라 숫자로 가공하지 않는다
  const conditions = [
    { key: 'salary', label: '급여', value: vacancy.salaryText },
    { key: 'experience', label: '경력', value: vacancy.experienceText },
    { key: 'education', label: '학력', value: vacancy.educationText }
  ].filter((condition) => condition.value.length > 0)

  const postingDateText = formatDotDate(vacancy.postingDate)
  const expirationDateText = formatDotDate(vacancy.expirationDate)
  const detailHref = normalizeUrl(vacancy.detailUrl)

  return (
    <article
      className={classNames(
        'flex size-full flex-col rounded-xl border border-gray-200 p-4 shadow-sm',
        isClosed ? 'bg-gray-50' : 'bg-white'
      )}
    >
      <div className="flex items-start gap-2">
        <h3
          className={classNames(
            'flex-1 text-base font-semibold',
            isClosed ? 'text-gray-500' : 'text-gray-900'
          )}
        >
          {title}
        </h3>
        {vacancy.active === true && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            모집중
          </span>
        )}
        {vacancy.active === false && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            마감
          </span>
        )}
      </div>

      {showCompanyName && (
        <p
          className={classNames(
            'mt-1 text-sm',
            isClosed ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          {vacancy.companyName}
        </p>
      )}

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className={classNames(
                'inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs',
                isClosed ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {chip.value}
            </span>
          ))}
        </div>
      )}

      {conditions.length > 0 && (
        <dl className="mt-3 space-y-1">
          {conditions.map((condition) => (
            <div key={condition.key} className="flex gap-2 text-sm">
              <dt className="w-10 shrink-0 text-gray-500">{condition.label}</dt>
              <dd
                className={classNames(
                  'flex-1',
                  isClosed ? 'text-gray-500' : 'text-gray-800'
                )}
              >
                {condition.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {(postingDateText || expirationDateText) && (
        <p className="mt-3 flex flex-wrap gap-x-2 text-xs tabular-nums text-gray-500">
          {postingDateText && <span>{postingDateText} 등록</span>}
          {expirationDateText && <span>~ {expirationDateText} 마감</span>}
        </p>
      )}

      {detailHref ? (
        <a
          href={detailHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-fit items-center gap-1 rounded-md border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          공고 상세 보기
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(새 탭에서 열립니다)</span>
        </a>
      ) : null}
    </article>
  )
}
