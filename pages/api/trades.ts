import type { NextApiRequest, NextApiResponse } from 'next'
import {
  fetchMultiMonthData,
  calcMonthlyStats,
  getTopApartments,
  REGION_CODES,
} from '../../lib/molit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { sido, gugun, months = '12' } = req.query

  if (!sido || !gugun) {
    return res.status(400).json({ error: '시도와 구군을 입력하세요' })
  }

  const sidoStr = Array.isArray(sido) ? sido[0] : sido
  const gugunStr = Array.isArray(gugun) ? gugun[0] : gugun
  const monthsNum = parseInt(Array.isArray(months) ? months[0] : months)

  const regionCode = REGION_CODES[sidoStr]?.[gugunStr]
  if (!regionCode) {
    return res.status(400).json({ error: '지원하지 않는 지역입니다' })
  }

  try {
    const records = await fetchMultiMonthData(regionCode, monthsNum)
    const monthlyStats = calcMonthlyStats(records)
    const topApartments = getTopApartments(records)

    const prices = records.map(r => r.price)
    const sorted = [...prices].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)

    res.status(200).json({
      summary: {
        totalCount: records.length,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        medianPrice: sorted.length > 0
          ? (sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid])
          : 0,
        minPrice: sorted[0] || 0,
        maxPrice: sorted[sorted.length - 1] || 0,
      },
      monthlyStats,
      topApartments,
      recentTrades: records
        .sort((a, b) => {
          const da = new Date(a.year, a.month - 1, a.day).getTime()
          const db = new Date(b.year, b.month - 1, b.day).getTime()
          return db - da
        })
        .slice(0, 20),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다' })
  }
}
