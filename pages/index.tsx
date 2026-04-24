import { useState, useMemo } from 'react'
import Head from 'next/head'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { REGION_CODES } from '../lib/molit'

const fmtPrice = (p: number) => {
  if (p >= 10000) return `${(p / 10000).toFixed(1)}억`
  return `${(p / 1000).toFixed(0)}천만`
}
const fmtPriceFull = (p: number) => {
  const uk = Math.floor(p / 10000)
  const rest = p % 10000
  if (uk > 0 && rest > 0) return `${uk}억 ${rest.toLocaleString()}만원`
  if (uk > 0) return `${uk}억원`
  return `${p.toLocaleString()}만원`
}

export default function Home() {
  const [sido, setSido] = useState('서울특별시')
  const [gugun, setGugun] = useState('마포구')
  const [months, setMonths] = useState('12')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedApt, setSelectedApt] = useState<string | null>(null)

  const sidoList = Object.keys(REGION_CODES)
  const gugunList = Object.keys(REGION_CODES[sido] || {})

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    setSelectedApt(null)
    try {
      const res = await fetch(`/api/trades?sido=${encodeURIComponent(sido)}&gugun=${encodeURIComponent(gugun)}&months=${months}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 선택된 아파트의 모든 거래 내역 (100건)
  const aptTrades = useMemo(() => {
    if (!data || !selectedApt) return []
    return data.allTrades
      ? data.allTrades.filter((t: any) => t.apartmentName === selectedApt)
      : data.recentTrades.filter((t: any) => t.apartmentName === selectedApt)
  }, [data, selectedApt])

  // 선택된 아파트의 월별 통계
  const aptMonthlyStats = useMemo(() => {
    if (!aptTrades.length) return []
    const grouped: Record<string, number[]> = {}
    aptTrades.forEach((t: any) => {
      const key = `${t.year}.${String(t.month).padStart(2, '0')}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(t.price)
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, prices]) => ({
        yearMonth,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        count: prices.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
      }))
  }, [aptTrades])

  // 선택된 아파트 요약
  const aptSummary = useMemo(() => {
    if (!aptTrades.length) return null
    const prices = aptTrades.map((t: any) => t.price)
    const sorted = [...prices].sort((a: number, b: number) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return {
      totalCount: prices.length,
      avgPrice: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length),
      medianPrice: sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid],
      minPrice: sorted[0],
      maxPrice: sorted[sorted.length - 1],
    }
  }, [aptTrades])

  const prevMonth = data?.monthlyStats?.slice(-2)?.[0]
  const lastMonth = data?.monthlyStats?.slice(-1)?.[0]
  const priceDiff = lastMonth && prevMonth
    ? Math.round(((lastMonth.avgPrice - prevMonth.avgPrice) / prevMonth.avgPrice) * 100 * 10) / 10
    : null

  return (
    <>
      <Head>
        <title>집값지도 — 아파트 실거래가 분석</title>
        <meta name="description" content="국토교통부 실거래가 데이터 기반 아파트 가격 분석" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedApt && (
                <button onClick={() => setSelectedApt(null)} className="mr-1 text-gray-400 hover:text-gray-700">
                  ←
                </button>
              )}
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="6" width="3" height="7" fill="white" rx="0.5"/>
                  <rect x="5.5" y="3" width="3" height="10" fill="white" rx="0.5"/>
                  <rect x="10" y="1" width="3" height="12" fill="white" rx="0.5"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                {selectedApt ? selectedApt : '집값지도'}
              </span>
            </div>
            <span className="text-xs text-gray-400">국토교통부 실거래가 공공데이터</span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">

          {/* ── 아파트 상세 뷰 ── */}
          {selectedApt && aptSummary && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setSelectedApt(null)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                  ← {gugun} 전체로 돌아가기
                </button>
              </div>

              {/* 요약 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '평균 매매가', value: fmtPrice(aptSummary.avgPrice) },
                  { label: '중위 매매가', value: fmtPrice(aptSummary.medianPrice) },
                  { label: '총 거래건수', value: `${aptSummary.totalCount}건` },
                  { label: '최고가', value: fmtPrice(aptSummary.maxPrice) },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* 월별 추이 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-sm font-medium text-gray-700 mb-4">월별 평균 매매가 추이</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={aptMonthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="yearMonth" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tickFormatter={v => fmtPrice(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
                    <Tooltip formatter={(v: number) => [fmtPriceFull(v), '평균']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 거래량 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-sm font-medium text-gray-700 mb-4">월별 거래량</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={aptMonthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="yearMonth" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip formatter={(v: number) => [`${v}건`, '거래량']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 실거래 내역 100건 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-700">실거래 내역</h2>
                  <span className="text-xs text-gray-400">{aptTrades.length}건</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-right font-medium pb-2 pr-4">전용면적</th>
                        <th className="text-right font-medium pb-2 pr-4">층</th>
                        <th className="text-right font-medium pb-2 pr-4">거래금액</th>
                        <th className="text-right font-medium pb-2 pr-4">거래일</th>
                        <th className="text-left font-medium pb-2">거래유형</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aptTrades.slice(0, 100).map((t: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 pr-4 text-right text-gray-600">{t.area.toFixed(1)}㎡</td>
                          <td className="py-2.5 pr-4 text-right text-gray-600">{t.floor}층</td>
                          <td className="py-2.5 pr-4 text-right font-semibold text-blue-600">{fmtPriceFull(t.price)}</td>
                          <td className="py-2.5 pr-4 text-right text-gray-400 text-xs">{t.year}.{String(t.month).padStart(2,'0')}.{String(t.day).padStart(2,'0')}</td>
                          <td className="py-2.5 text-left text-gray-400 text-xs">{t.dealingGbn || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-center text-gray-300 pb-4">
                데이터 출처: 국토교통부 실거래가 공공데이터 포털 · 참고용이며 투자 결정의 근거로 사용하지 마세요
              </p>
            </div>
          )}

          {/* ── 지역 전체 뷰 ── */}
          {!selectedApt && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-1">아파트 실거래가 분석</h1>
                <p className="text-sm text-gray-400 mb-5">지역을 선택하면 실거래 데이터를 분석해드려요</p>
                <div className="flex flex-wrap gap-3">
                  <select value={sido} onChange={e => { setSido(e.target.value); setGugun(Object.keys(REGION_CODES[e.target.value])[0]) }} className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {sidoList.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={gugun} onChange={e => setGugun(e.target.value)} className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {gugunList.map(g => <option key={g}>{g}</option>)}
                  </select>
                  <select value={months} onChange={e => setMonths(e.target.value)} className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="6">최근 6개월</option>
                    <option value="12">최근 1년</option>
                    <option value="24">최근 2년</option>
                    <option value="36">최근 3년</option>
                  </select>
                  <button onClick={handleSearch} disabled={loading} className="h-10 px-6 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {loading ? '조회 중...' : '분석하기'}
                  </button>
                </div>
                {error && <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>}
              </div>

              {!data && !loading && (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-4xl mb-3">🏢</div>
                  <p className="text-sm">지역을 선택하고 분석하기를 눌러주세요</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-20 text-gray-400">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-sm">데이터를 불러오는 중입니다...</p>
                </div>
              )}

              {data && !loading && (
                <div className="space-y-5">
                  {/* 요약 카드 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: '평균 매매가', value: fmtPrice(data.summary.avgPrice), sub: priceDiff !== null ? `전월比 ${priceDiff > 0 ? '+' : ''}${priceDiff}%` : '', up: priceDiff !== null ? priceDiff > 0 : null },
                      { label: '중위 매매가', value: fmtPrice(data.summary.medianPrice), sub: '', up: null },
                      { label: '총 거래건수', value: `${data.summary.totalCount.toLocaleString()}건`, sub: `${months}개월`, up: null },
                      { label: '최고가', value: fmtPrice(data.summary.maxPrice), sub: '최저 ' + fmtPrice(data.summary.minPrice), up: null },
                    ].map(card => (
                      <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                        <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                        {card.sub && (
                          <p className={`text-xs mt-1 ${card.up === true ? 'text-emerald-500' : card.up === false ? 'text-red-500' : 'text-gray-400'}`}>
                            {card.up === true ? '▲ ' : card.up === false ? '▼ ' : ''}{card.sub}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 월별 추이 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-sm font-medium text-gray-700 mb-4">월별 평균 매매가 추이</h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={data.monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="yearMonth" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis tickFormatter={v => fmtPrice(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
                        <Tooltip formatter={(v: number) => [fmtPriceFull(v), '평균 매매가']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
                        <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 거래량 + TOP 10 */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <h2 className="text-sm font-medium text-gray-700 mb-4">월별 거래량</h2>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="yearMonth" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                          <Tooltip formatter={(v: number) => [`${v}건`, '거래량']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* TOP 10 — 클릭 가능 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <h2 className="text-sm font-medium text-gray-700 mb-1">거래량 상위 단지 TOP 10</h2>
                      <p className="text-xs text-gray-400 mb-3">단지명 클릭 시 상세 분석</p>
                      <div className="space-y-1 overflow-y-auto max-h-48">
                        {data.topApartments.map((apt: any, i: number) => (
                          <div
                            key={apt.name}
                            onClick={() => setSelectedApt(apt.name)}
                            className="flex items-center justify-between text-sm cursor-pointer rounded-lg px-2 py-2 hover:bg-blue-50 group transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                              <span className="text-gray-700 truncate group-hover:text-blue-600 transition-colors">{apt.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-400">{apt.count}건</span>
                              <span className="text-xs font-medium text-blue-600">{fmtPrice(apt.avgPrice)}</span>
                              <span className="text-xs text-gray-300 group-hover:text-blue-400">→</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 최근 실거래 내역 — 단지명 클릭 가능 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-medium text-gray-700">최근 실거래 내역</h2>
                      <span className="text-xs text-gray-400">단지명 클릭 시 상세 분석</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-100">
                            <th className="text-left font-medium pb-2 pr-4">단지명</th>
                            <th className="text-left font-medium pb-2 pr-4">동</th>
                            <th className="text-right font-medium pb-2 pr-4">전용면적</th>
                            <th className="text-right font-medium pb-2 pr-4">층</th>
                            <th className="text-right font-medium pb-2 pr-4">거래금액</th>
                            <th className="text-right font-medium pb-2">거래일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentTrades.map((t: any, i: number) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2.5 pr-4">
                                <button
                                  onClick={() => setSelectedApt(t.apartmentName)}
                                  className="text-gray-800 font-medium hover:text-blue-600 text-left transition-colors"
                                >
                                  {t.apartmentName}
                                </button>
                              </td>
                              <td className="py-2.5 pr-4 text-gray-500 text-xs">{t.dong}</td>
                              <td className="py-2.5 pr-4 text-right text-gray-600">{t.area.toFixed(1)}㎡</td>
                              <td className="py-2.5 pr-4 text-right text-gray-600">{t.floor}층</td>
                              <td className="py-2.5 pr-4 text-right font-semibold text-blue-600">{fmtPriceFull(t.price)}</td>
                              <td className="py-2.5 text-right text-gray-400 text-xs">{t.year}.{String(t.month).padStart(2,'0')}.{String(t.day).padStart(2,'0')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-300 pb-4">
                    데이터 출처: 국토교통부 실거래가 공공데이터 포털 · 참고용이며 투자 결정의 근거로 사용하지 마세요
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}
