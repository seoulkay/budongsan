module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/molit.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "REGION_CODES",
    ()=>REGION_CODES,
    "calcMonthlyStats",
    ()=>calcMonthlyStats,
    "calcPricePerArea",
    ()=>calcPricePerArea,
    "fetchMultiMonthData",
    ()=>fetchMultiMonthData,
    "fetchTradeData",
    ()=>fetchTradeData,
    "getTopApartments",
    ()=>getTopApartments
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$xml2js__$5b$external$5d$__$28$xml2js$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$xml2js$29$__ = __turbopack_context__.i("[externals]/xml2js [external] (xml2js, cjs, [project]/node_modules/xml2js)");
;
const API_KEY = process.env.MOLIT_API_KEY;
//const BASE_URL = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade'
//const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDevAPI/getRTMSDataSvcAptTrade'
const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const REGION_CODES = {
    '서울특별시': {
        '강남구': '11680',
        '강동구': '11740',
        '강북구': '11305',
        '강서구': '11500',
        '관악구': '11620',
        '광진구': '11215',
        '구로구': '11530',
        '금천구': '11545',
        '노원구': '11350',
        '도봉구': '11320',
        '동대문구': '11230',
        '동작구': '11590',
        '마포구': '11440',
        '서대문구': '11410',
        '서초구': '11650',
        '성동구': '11200',
        '성북구': '11290',
        '송파구': '11710',
        '양천구': '11470',
        '영등포구': '11560',
        '용산구': '11170',
        '은평구': '11380',
        '종로구': '11110',
        '중구': '11140',
        '중랑구': '11260'
    },
    '인천광역시': {
        '중구': '28110',
        '동구': '28140',
        '미추홀구': '28177',
        '연수구': '28185',
        '남동구': '28200',
        '부평구': '28237',
        '계양구': '28245',
        '서구': '28260',
        '강화군': '28710',
        '옹진군': '28720'
    },
    '경기도': {
        '수원시': '41111',
        '성남시': '41131',
        '의정부시': '41150',
        '안양시': '41171',
        '부천시': '41190',
        '광명시': '41210',
        '평택시': '41220',
        '안산시': '41270',
        '고양시': '41281',
        '과천시': '41290',
        '구리시': '41310',
        '남양주시': '41360',
        '오산시': '41370',
        '시흥시': '41390',
        '군포시': '41410',
        '의왕시': '41430',
        '하남시': '41450',
        '용인시': '41461',
        '파주시': '41480',
        '이천시': '41500'
    },
    '부산광역시': {
        '중구': '26110',
        '서구': '26140',
        '동구': '26170',
        '영도구': '26200',
        '부산진구': '26230',
        '동래구': '26260',
        '남구': '26290',
        '북구': '26320',
        '해운대구': '26350',
        '사하구': '26380',
        '금정구': '26410',
        '강서구': '26440',
        '연제구': '26470',
        '수영구': '26500',
        '사상구': '26530'
    }
};
async function fetchTradeData(regionCode, dealYmd// YYYYMM 형식
) {
    const params = new URLSearchParams({
        serviceKey: API_KEY,
        pageNo: '1',
        numOfRows: '1000',
        LAWD_CD: regionCode,
        DEAL_YMD: dealYmd
    });
    const res = await fetch(`${BASE_URL}?${params}`);
    const text = await res.text();
    const parsed = await __TURBOPACK__imported__module__$5b$externals$5d2f$xml2js__$5b$external$5d$__$28$xml2js$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$xml2js$29$__["default"].parseStringPromise(text, {
        explicitArray: false
    });
    const items = parsed?.response?.body?.items?.item;
    if (!items) return [];
    const list = Array.isArray(items) ? items : [
        items
    ];
    return list.map((item)=>({
            apartmentName: item['aptNm']?.trim() || '',
            area: parseFloat(item['excluUseAr'] || '0'),
            floor: parseInt(item['floor'] || '0'),
            price: parseInt((item['dealAmount'] || '0').replace(/,/g, '')),
            year: parseInt(item['dealYear'] || '0'),
            month: parseInt(item['dealMonth'] || '0'),
            day: parseInt(item['dealDay'] || '0'),
            buildYear: parseInt(item['buildYear'] || '0'),
            dong: item['umdNm']?.trim() || ''
        }));
}
async function fetchMultiMonthData(regionCode, months = 12) {
    const now = new Date();
    const promises = [];
    for(let i = 0; i < months; i++){
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        promises.push(fetchTradeData(regionCode, yearMonth));
    }
    const results = await Promise.all(promises);
    return results.flat();
}
function calcMonthlyStats(records) {
    const grouped = {};
    records.forEach((r)=>{
        const key = `${r.year}.${String(r.month).padStart(2, '0')}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r.price);
    });
    return Object.entries(grouped).sort(([a], [b])=>a.localeCompare(b)).map(([yearMonth, prices])=>{
        const sorted = [
            ...prices
        ].sort((a, b)=>a - b);
        const mid = Math.floor(sorted.length / 2);
        return {
            yearMonth,
            avgPrice: Math.round(prices.reduce((a, b)=>a + b, 0) / prices.length),
            medianPrice: sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid],
            count: prices.length,
            minPrice: sorted[0],
            maxPrice: sorted[sorted.length - 1]
        };
    });
}
function calcPricePerArea(records) {
    return records.filter((r)=>r.area > 0).map((r)=>({
            area: r.area,
            pricePerArea: Math.round(r.price * 10000 / r.area)
        })).sort((a, b)=>a.area - b.area);
}
function getTopApartments(records) {
    const grouped = {};
    records.forEach((r)=>{
        if (!grouped[r.apartmentName]) grouped[r.apartmentName] = [];
        grouped[r.apartmentName].push(r.price);
    });
    return Object.entries(grouped).map(([name, prices])=>({
            name,
            count: prices.length,
            avgPrice: Math.round(prices.reduce((a, b)=>a + b, 0) / prices.length)
        })).sort((a, b)=>b.count - a.count).slice(0, 10);
}
}),
"[project]/pages/api/trades.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$molit$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/molit.ts [api] (ecmascript)");
;
async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({
        error: 'Method not allowed'
    });
    const { sido, gugun, months = '12' } = req.query;
    if (!sido || !gugun) {
        return res.status(400).json({
            error: '시도와 구군을 입력하세요'
        });
    }
    const sidoStr = Array.isArray(sido) ? sido[0] : sido;
    const gugunStr = Array.isArray(gugun) ? gugun[0] : gugun;
    const monthsNum = parseInt(Array.isArray(months) ? months[0] : months);
    const regionCode = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$molit$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["REGION_CODES"][sidoStr]?.[gugunStr];
    if (!regionCode) {
        return res.status(400).json({
            error: '지원하지 않는 지역입니다'
        });
    }
    try {
        const records = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$molit$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["fetchMultiMonthData"])(regionCode, monthsNum);
        const monthlyStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$molit$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["calcMonthlyStats"])(records);
        const topApartments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$molit$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getTopApartments"])(records);
        const prices = records.map((r)=>r.price);
        const sorted = [
            ...prices
        ].sort((a, b)=>a - b);
        const mid = Math.floor(sorted.length / 2);
        res.status(200).json({
            summary: {
                totalCount: records.length,
                avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b)=>a + b, 0) / prices.length) : 0,
                medianPrice: sorted.length > 0 ? sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid] : 0,
                minPrice: sorted[0] || 0,
                maxPrice: sorted[sorted.length - 1] || 0
            },
            monthlyStats,
            topApartments,
            recentTrades: records.sort((a, b)=>{
                const da = new Date(a.year, a.month - 1, a.day).getTime();
                const db = new Date(b.year, b.month - 1, b.day).getTime();
                return db - da;
            }).slice(0, 20)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: '데이터 조회 중 오류가 발생했습니다'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__09-i6ib._.js.map