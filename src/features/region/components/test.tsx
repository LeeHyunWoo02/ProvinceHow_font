import { render, screen } from '@testing-library/react'

import { fetchRegionDetail } from 'utils'

import JobVacancyList from './JobVacancyList'
import RegionJobProfileSummary from './RegionJobProfileSummary'

// 배포 서버는 채용 데이터 수집 배치가 끝나기 전까지 모든 지역에 대해
// jobVacancies: [] 와 전 지표가 빈 regionJobProfile 을 준다.
// 값이 채워진 경로는 실서버로 확인할 수 없으므로 백엔드 응답 계약을 픽스처로 고정해 검증한다.
const DETAIL_FIXTURE = {
  sidoCode: '11',
  sidoName: '서울특별시',
  sigunguCode: '11110',
  sigunguName: '종로구',
  jobVacancies: [
    {
      postingId: '50123456',
      title: '백엔드 개발자 채용',
      companyName: '(주)예시',
      detailUrl:
        'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=50123456',
      regionName: '서울 종로구',
      jobName: '서버개발',
      salaryText: '면접 후 결정',
      experienceText: '신입',
      educationText: '대학교졸업(4년)이상',
      employmentType: '정규직',
      active: true,
      postingDate: '2026-08-10',
      expirationDate: '2026-09-10'
    },
    {
      postingId: '50123457',
      title: '마감된 공고',
      companyName: '(주)마감',
      detailUrl: '',
      regionName: '',
      jobName: '',
      salaryText: '',
      experienceText: '',
      educationText: '',
      employmentType: '',
      active: false,
      postingDate: null,
      expirationDate: '2026-07-01'
    }
  ],
  regionJobProfile: {
    salaryMedianManwon: 3800,
    newcomerRatio: 0.32,
    topIndustries: [
      { name: '정보통신업', count: 42 },
      { name: '제조업', count: 17 }
    ],
    sampleSize: 120,
    salaryParsedCount: 86
  }
}

function stubFetch(payload: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => payload
    }))
  )
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://150.230.109.220:8080')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it('신규 필드를 도메인 타입으로 매핑한다', async () => {
  stubFetch(DETAIL_FIXTURE)
  const detail = await fetchRegionDetail({ sigunguCode: '11110' })

  expect(detail.jobVacancies).toHaveLength(2)
  expect(detail.jobVacancies[0].salaryText).toBe('면접 후 결정')
  expect(detail.jobVacancies[0].active).toBe(true)
  // 0~1 실수를 그대로 보존해야 화면에서 퍼센트로 환산할 수 있다
  expect(detail.regionJobProfile?.newcomerRatio).toBe(0.32)
  expect(detail.regionJobProfile?.salaryMedianManwon).toBe(3800)
  expect(detail.regionJobProfile?.topIndustries).toHaveLength(2)
})

it('빈 응답에서도 안전한 기본값을 만든다', async () => {
  stubFetch({ sigunguCode: '11110', jobVacancies: [], regionJobProfile: null })
  const detail = await fetchRegionDetail({ sigunguCode: '11110' })

  expect(detail.jobVacancies).toEqual([])
  expect(detail.regionJobProfile).toBeNull()
})

it('ISO 날짜시각 문자열에서도 날짜를 살린다', async () => {
  stubFetch({
    sigunguCode: '11110',
    jobVacancies: [
      {
        ...DETAIL_FIXTURE.jobVacancies[0],
        postingDate: '2026-08-10T00:00:00',
        expirationDate: '2026-09-10T23:59:59'
      }
    ],
    regionJobProfile: null
  })
  const detail = await fetchRegionDetail({ sigunguCode: '11110' })

  expect(detail.jobVacancies[0].postingDate).toBe('2026-08-10')
  expect(detail.jobVacancies[0].expirationDate).toBe('2026-09-10')

  render(<JobVacancyList vacancies={detail.jobVacancies} />)
  expect(screen.getByText('2026.08.10 등록')).toBeInTheDocument()
})

it('의미 없는 연봉 중앙값과 중복 업종을 걸러낸다', async () => {
  stubFetch({
    sigunguCode: '11110',
    jobVacancies: [],
    regionJobProfile: {
      salaryMedianManwon: '',
      newcomerRatio: 0,
      topIndustries: [
        { name: '제조업', count: 10 },
        { name: '제조업', count: 4 }
      ],
      sampleSize: 10,
      salaryParsedCount: 0
    }
  })
  const detail = await fetchRegionDetail({ sigunguCode: '11110' })

  // '' 는 Number()로 0이 되므로 값 없음으로 정규화해야 '0만원'이 뜨지 않는다
  expect(detail.regionJobProfile?.salaryMedianManwon).toBeNull()
  // 0% 신입 채용은 의미 있는 값이라 유지한다
  expect(detail.regionJobProfile?.newcomerRatio).toBe(0)
  expect(detail.regionJobProfile?.topIndustries).toEqual([
    { name: '제조업', count: 10 }
  ])

  render(<RegionJobProfileSummary profile={detail.regionJobProfile} />)
  expect(screen.queryByText('0만원')).toBeNull()
  expect(screen.getByText('집계 정보 없음')).toBeInTheDocument()
  expect(screen.getByText('0%')).toBeInTheDocument()
})

it('업종 비중이 100%를 넘지 않는다', () => {
  render(
    <RegionJobProfileSummary
      profile={{
        salaryMedianManwon: null,
        newcomerRatio: null,
        topIndustries: [{ name: '제조업', count: 200 }],
        sampleSize: 100,
        salaryParsedCount: 100
      }}
    />
  )
  expect(screen.getByText('200건 · 100%')).toBeInTheDocument()
})

it('채용 프로필을 만원·퍼센트 단위로 표기한다', () => {
  render(<RegionJobProfileSummary profile={DETAIL_FIXTURE.regionJobProfile} />)

  expect(screen.getByText('3,800만원')).toBeInTheDocument()
  expect(screen.getByText('32%')).toBeInTheDocument()
  // 게이지는 바로 위 문단이 같은 값을 읽어주므로 스크린리더에서 감춘다
  expect(screen.queryByLabelText(/신입 채용 비율/)).toBeNull()
  expect(screen.getByText('주요 업종 Top 2')).toBeInTheDocument()
  expect(screen.getByText('42건 · 35%')).toBeInTheDocument()
  expect(
    screen.getByText('표본 120건 기준 · 연봉 파싱 86건')
  ).toBeInTheDocument()
  expect(screen.queryByText('표본이 적어 참고용 수치입니다.')).toBeNull()
})

it('지표가 모두 비면 프로필 섹션을 렌더링하지 않는다', () => {
  const { container } = render(
    <RegionJobProfileSummary
      profile={{
        salaryMedianManwon: null,
        newcomerRatio: null,
        topIndustries: [],
        sampleSize: 0,
        salaryParsedCount: 0
      }}
    />
  )
  expect(container).toBeEmptyDOMElement()
})

it('일부 지표만 비면 나머지는 그대로 보여준다', () => {
  render(
    <RegionJobProfileSummary
      profile={{
        salaryMedianManwon: null,
        newcomerRatio: 0.5,
        topIndustries: [],
        sampleSize: 12,
        salaryParsedCount: 0
      }}
    />
  )
  expect(screen.getByText('집계 정보 없음')).toBeInTheDocument()
  expect(screen.getByText('50%')).toBeInTheDocument()
  expect(screen.getByText('표본이 적어 참고용 수치입니다.')).toBeInTheDocument()
})

it('채용공고 카드와 마감 배지를 렌더링한다', () => {
  render(<JobVacancyList vacancies={DETAIL_FIXTURE.jobVacancies} />)

  expect(screen.getByText('총 2건')).toBeInTheDocument()
  expect(screen.getByText('백엔드 개발자 채용')).toBeInTheDocument()
  // 급여 원문 텍스트는 숫자로 가공하지 않는다
  expect(screen.getByText('면접 후 결정')).toBeInTheDocument()
  expect(screen.getByText('모집중')).toBeInTheDocument()
  expect(screen.getByText('마감')).toBeInTheDocument()
  expect(screen.getByText('2026.08.10 등록')).toBeInTheDocument()
  expect(screen.getByText('~ 2026.09.10 마감')).toBeInTheDocument()

  const link = screen.getByRole('link', { name: /공고 상세 보기/ })
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  // detailUrl이 빈 공고에는 링크를 만들지 않는다
  expect(screen.getAllByRole('link')).toHaveLength(1)
})

it('공고가 없으면 빈 상태를 보여준다', () => {
  render(<JobVacancyList vacancies={[]} />)
  expect(
    screen.getByText('현재 등록된 채용공고가 없습니다.')
  ).toBeInTheDocument()
})
