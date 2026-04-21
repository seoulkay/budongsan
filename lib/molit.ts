import xml2js from 'xml2js'

const API_KEY = process.env.MOLIT_API_KEY
//const BASE_URL = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade'
//const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDevAPI/getRTMSDataSvcAptTrade'
const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev'

export interface TradeRecord {
  apartmentName: string
  area: number
  floor: number
  price: number
  year: number
  month: number
  day: number
  buildYear: number
  dong: string
}

export interface MonthlyStats {
  yearMonth: string
  avgPrice: number
  medianPrice: number
  count: number
  minPrice: number
  maxPrice: number
}

// 지역코드 매핑 (시군구 코드)
export const REGION_CODES: Record<string, Record<string, string>> = {
  '서울특별시': {
    '강남구': '11680', '강동구': '11740', '강북구': '11305', '강서구': '11500',
    '관악구': '11620', '광진구': '11215', '구로구': '11530', '금천구': '11545',
    '노원구': '11350', '도봉구': '11320', '동대문구': '11230', '동작구': '11590',
    '마포구': '11440', '서대문구': '11410', '서초구': '11650', '성동구': '11200',
    '성북구': '11290', '송파구': '11710', '양천구': '11470', '영등포구': '11560',
    '용산구': '11170', '은평구': '11380', '종로구': '11110', '중구': '11140', '중랑구': '11260',
  },
  '인천광역시': {
    '중구': '28110', '동구': '28140', '미추홀구': '28177', '연수구': '28185',
    '남동구': '28200', '부평구': '28237', '계양구': '28245', '서구': '28260',
    '강화군': '28710', '옹진군': '28720',
  },
  '경기도': {
    '수원시': '41111', '성남시': '41131', '의정부시': '41150', '안양시': '41171',
    '부천시': '41190', '광명시': '41210', '평택시': '41220', '안산시': '41270',
    '고양시': '41281', '과천시': '41290', '구리시': '41310', '남양주시': '41360',
    '오산시': '41370', '시흥시': '41390', '군포시': '41410', '의왕시': '41430',
    '하남시': '41450', '용인시': '41461', '파주시': '41480', '이천시': '41500',
  },
  '부산광역시': {
    '중구': '26110', '서구': '26140', '동구': '26170', '영도구': '26200',
    '부산진구': '26230', '동래구': '26260', '남구': '26290', '북구': '26320',
    '해운대구': '26350', '사하구': '26380', '금정구': '26410', '강서구': '26440',
    '연제구': '26470', '수영구': '26500', '사상구': '26530',
  },
}

// 실거래가 데이터 가져오기
export async function fetchTradeData(
  regionCode: string,
  dealYmd: string // YYYYMM 형식
): Promise<TradeRecord[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY!,
    pageNo: '1',
    numOfRows: '1000',
    LAWD_CD: regionCode,
    DEAL_YMD: dealYmd,
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  const text = await res.text()
  const parsed = await xml2js.parseStringPromise(text, { explicitArray: false })

  const items = parsed?.response?.body?.items?.item
  if (!items) return []

  const list = Array.isArray(items) ? items : [items]
  return list.map((item: any) => ({
   apartmentName: item['aptNm']?.trim() || '',
   area: parseFloat(item['excluUseAr'] || '0'),
   floor: parseInt(item['floor'] || '0'),
   price: parseInt((item['dealAmount'] || '0').replace(/,/g, '')),
   year: parseInt(item['dealYear'] || '0'),
   month: parseInt(item['dealMonth'] || '0'),
   day: parseInt(item['dealDay'] || '0'),
   buildYear: parseInt(item['buildYear'] || '0'),
   dong: item['umdNm']?.trim() || '',
  }))
}

// 여러 달 데이터 가져오기
export async function fetchMultiMonthData(
  regionCode: string,
  months: number = 12
): Promise<TradeRecord[]> {
  const now = new Date()
  const promises: Promise<TradeRecord[]>[] = []

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    promises.push(fetchTradeData(regionCode, yearMonth))
  }

  const results = await Promise.all(promises)
  return results.flat()
}

// 월별 통계 계산
export function calcMonthlyStats(records: TradeRecord[]): MonthlyStats[] {
  const grouped: Record<string, number[]> = {}

  records.forEach(r => {
    const key = `${r.year}.${String(r.month).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(r.price)
  })

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yearMonth, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return {
        yearMonth,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        medianPrice: sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid],
        count: prices.length,
        minPrice: sorted[0],
        maxPrice: sorted[sorted.length - 1],
      }
    })
}

// 평당 가격 계산 (만원/㎡)
export function calcPricePerArea(records: TradeRecord[]): { area: number, pricePerArea: number }[] {
  return records
    .filter(r => r.area > 0)
    .map(r => ({
      area: r.area,
      pricePerArea: Math.round((r.price * 10000) / r.area),
    }))
    .sort((a, b) => a.area - b.area)
}

// 인기 단지 TOP 10
export function getTopApartments(records: TradeRecord[]): { name: string, count: number, avgPrice: number }[] {
  const grouped: Record<string, number[]> = {}
  records.forEach(r => {
    if (!grouped[r.apartmentName]) grouped[r.apartmentName] = []
    grouped[r.apartmentName].push(r.price)
  })

  return Object.entries(grouped)
    .map(([name, prices]) => ({
      name,
      count: prices.length,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}
