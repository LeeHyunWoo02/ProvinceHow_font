export type InfraMajor = 'HEALTH' | 'FOOD' | 'CULTURE' | 'LIFE'

export interface InfraStat {
  major: InfraMajor
  num: number
  score?: number | null
}

export interface JobInfo {
  count: number
  url?: string | null
}

export interface DwellingSimpleInfo {
  monthMid?: number | null
  jeonseMid?: number | null
}

export interface DwellingInfo extends DwellingSimpleInfo {
  monthAvg?: number | null
  jeonseAvg?: number | null
}

export interface RegionRecommendation {
  sidoCode: string
  sidoName: string
  sigunguCode: string
  sigunguName: string
  score?: number | null
  isAiPick?: boolean
  aiPickReason?: string | null
  totalJobInfo?: JobInfo | null
  fitJobInfo?: JobInfo | null
  totalSupportNum?: number | null
  fitSupportNum?: number | null
  dwellingSimpleInfo?: DwellingSimpleInfo | null
  infraMajors?: InfraStat[]
}

export interface AiPickRecommendation {
  aiPickSigunguCode: string
  aiPickReason: string
}

export interface RegionDetailInfraItem {
  major: InfraMajor
  name: string
  num: number
  score?: number | null
}

export interface RegionDetailSupportItem {
  title: string
  url: string
  keyword?: string | null
}

export type JobVacancy = {
  postingId: string
  title: string
  companyName: string
  detailUrl: string
  regionName: string
  jobName: string
  salaryText: string
  experienceText: string
  educationText: string
  employmentType: string
  /** 모집중 여부. 서버가 값을 주지 않으면 null이며, 이때는 배지를 표시하지 않는다. */
  active: boolean | null
  postingDate: string | null
  expirationDate: string | null
}

export type JobIndustryShare = {
  name: string
  count: number
}

export type RegionJobProfile = {
  /** 연봉 중앙값. 단위는 만원이다. */
  salaryMedianManwon: number | null
  /** 신입 채용 비율. 0~1 실수이며 퍼센트가 아니다. */
  newcomerRatio: number | null
  topIndustries: JobIndustryShare[]
  sampleSize: number
  salaryParsedCount: number
}

export interface RegionDetail {
  sidoCode: string
  sidoName: string
  sigunguCode: string
  sigunguName: string
  aiUse?: boolean | null
  aiSummary?: string | null
  population?: number | null
  totalJobInfo?: JobInfo | null
  fitJobInfo?: JobInfo | null
  totalJobs?: number
  fitJobs?: number | null
  jobURL?: string | null
  monthlyRentAvg?: number
  monthlyRentMid?: number
  jeonseAvg?: number
  jeonseMid?: number
  fitSupportNum?: number | null
  totalSupportNum?: number | null
  totalSupportList?: RegionDetailSupportItem[]
  supportList?: RegionDetailSupportItem[]
  dwellingInfo?: DwellingInfo | null
  infra?: RegionDetailInfraItem[]
  infraDetails?: RegionDetailInfraItem[]
  infraMajors?: InfraStat[]
  jobVacancies: JobVacancy[]
  regionJobProfile: RegionJobProfile | null
}

// Region code aliases for clarity
export type SidoCode = string
export type SigunguCode = string
