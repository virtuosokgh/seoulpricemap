// ============================================
// 서울 집값 상승률 대시보드 - Edge Function
// 부동산통계정보시스템 API 연동
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API 인증키
const RONE_API_KEY = "72b2df13552345c5b1cba5e4d7c7b6b9";
const DATA_GO_KR_API_KEY = "0DLJ6yf5JtB%2Bcivbpv0WW3MqNT3agDfOu8qHWIE3cS3ti9yWLqpXfo8%2FsUmumDAfiIkFgkk7JB7tQYX7%2Bx3AMw%3D%3D";

// 서울 구 코드 매핑
const DISTRICT_CODES: Record<string, string> = {
    "11680": "gangnam",
    "11740": "gangdong",
    "11305": "gangbuk",
    "11500": "gangseo",
    "11620": "gwanak",
    "11215": "gwangjin",
    "11530": "guro",
    "11545": "geumcheon",
    "11350": "nowon",
    "11320": "dobong",
    "11230": "dongdaemun",
    "11590": "dongjak",
    "11440": "mapo",
    "11410": "seodaemun",
    "11650": "seocho",
    "11200": "seongdong",
    "11290": "seongbuk",
    "11710": "songpa",
    "11470": "yangcheon",
    "11560": "yeongdeungpo",
    "11170": "yongsan",
    "11380": "eunpyeong",
    "11110": "jongno",
    "11140": "jung",
    "11260": "jungnang",
};

serve(async (req: Request) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get("action");

        // Supabase 클라이언트 초기화 (service_role 키로 RLS 우회)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        if (action === "fetch-api") {
            // 부동산통계정보시스템 API 호출
            const data = await fetchRealEstateData();

            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "sync-data") {
            // 주간, 월간, 연간 데이터 모두 가져오기
            const results = {
                weekly: await fetchRealEstateDataByPeriod("weekly"),
                monthly: await fetchRealEstateDataByPeriod("monthly"),
                yearly: await fetchRealEstateDataByPeriod("yearly"),
            };

            const now = new Date();
            const allInsertData: any[] = [];

            // 주간 데이터 처리
            if (results.weekly && Object.keys(results.weekly).length > 0) {
                const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
                const weeklyPeriod = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

                Object.entries(results.weekly).forEach(([districtId, info]: [string, any]) => {
                    allInsertData.push({
                        district_id: districtId,
                        period_type: 'weekly',
                        period_value: weeklyPeriod,
                        rate: info.rate
                    });
                });
            }

            // 월간 데이터 처리
            if (results.monthly && Object.keys(results.monthly).length > 0) {
                const monthlyPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                Object.entries(results.monthly).forEach(([districtId, info]: [string, any]) => {
                    allInsertData.push({
                        district_id: districtId,
                        period_type: 'monthly',
                        period_value: monthlyPeriod,
                        rate: info.rate
                    });
                });
            }

            // 연간 데이터 처리
            if (results.yearly && Object.keys(results.yearly).length > 0) {
                const yearlyPeriod = `${now.getFullYear()}`;

                Object.entries(results.yearly).forEach(([districtId, info]: [string, any]) => {
                    allInsertData.push({
                        district_id: districtId,
                        period_type: 'yearly',
                        period_value: yearlyPeriod,
                        rate: info.rate
                    });
                });
            }

            if (allInsertData.length === 0) {
                return new Response(JSON.stringify({ success: false, error: "No data from API" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }

            // DB에 저장
            const { error: insertError } = await supabaseClient
                .from('housing_prices')
                .upsert(allInsertData, { onConflict: 'district_id,period_type,period_value' });

            if (insertError) {
                console.error("Insert error:", insertError);
                return new Response(JSON.stringify({ success: false, error: insertError.message }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 500,
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: `Synced ${allInsertData.length} records (weekly: ${Object.keys(results.weekly || {}).length}, monthly: ${Object.keys(results.monthly || {}).length}, yearly: ${Object.keys(results.yearly || {}).length})`,
                data: results
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "get-districts") {
            // 구 목록 조회
            const { data, error } = await supabaseClient
                .from("districts")
                .select("*")
                .order("name");

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "get-prices") {
            // 가격 데이터 조회
            const periodType = url.searchParams.get("period") || "weekly";
            const districtId = url.searchParams.get("district");

            let query = supabaseClient
                .from("housing_prices")
                .select("*, districts(name)")
                .eq("period_type", periodType)
                .order("period_value", { ascending: false })
                .limit(6);

            if (districtId) {
                query = query.eq("district_id", districtId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        return new Response(
            JSON.stringify({ error: "Invalid action" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});

// ============================================
// R-ONE API 설정
// ============================================

// 기간별 STATBL_ID 및 DTACYCLE_CD 매핑
const PERIOD_CONFIG: Record<string, { statblId: string; dtacycleCd: string }> = {
    weekly: { statblId: "T244183132827305", dtacycleCd: "WK" },   // (주) 매매가격지수
    monthly: { statblId: "A_2024_00045", dtacycleCd: "MM" },      // (월) 매매가격지수
    yearly: { statblId: "A_2024_00045", dtacycleCd: "MM" },       // 연간도 월간 지수 사용
};

// 서울 구 이름 → district_id 매핑
const DISTRICT_NAME_MAPPING: Record<string, string> = {
    "강남구": "gangnam",
    "강동구": "gangdong",
    "강북구": "gangbuk",
    "강서구": "gangseo",
    "관악구": "gwanak",
    "광진구": "gwangjin",
    "구로구": "guro",
    "금천구": "geumcheon",
    "노원구": "nowon",
    "도봉구": "dobong",
    "동대문구": "dongdaemun",
    "동작구": "dongjak",
    "마포구": "mapo",
    "서대문구": "seodaemun",
    "서초구": "seocho",
    "성동구": "seongdong",
    "성북구": "seongbuk",
    "송파구": "songpa",
    "양천구": "yangcheon",
    "영등포구": "yeongdeungpo",
    "용산구": "yongsan",
    "은평구": "eunpyeong",
    "종로구": "jongno",
    "중구": "jung",
    "중랑구": "jungnang",
};

// ============================================
// WRTTIME_IDTFR_ID 계산 (기간 코드 생성)
// ============================================
function getWrttimeId(periodType: string, offset: number = 0): string {
    const now = new Date();

    if (periodType === "weekly") {
        // 주간: YYYYWW 형식 (예: 202506 = 2025년 6주차)
        const target = new Date(now.getTime() - offset * 7 * 24 * 60 * 60 * 1000);
        const yearStart = new Date(target.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((target.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        const weekNum = Math.ceil(dayOfYear / 7);
        return `${target.getFullYear()}${String(weekNum).padStart(2, '0')}`;
    } else {
        // 월간/연간: YYYYMM 형식 (예: 202501 = 2025년 1월)
        const targetMonth = now.getMonth() - offset;
        const target = new Date(now.getFullYear(), targetMonth, 1);
        return `${target.getFullYear()}${String(target.getMonth() + 1).padStart(2, '0')}`;
    }
}

// ============================================
// R-ONE SttsApiTblData API 호출
// ============================================
async function fetchIndexData(statblId: string, dtacycleCd: string, wrttimeId: string): Promise<any[] | null> {
    try {
        const baseUrl = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";

        const params = new URLSearchParams({
            KEY: RONE_API_KEY,
            Type: "json",
            pIndex: "1",
            pSize: "230",
            STATBL_ID: statblId,
            DTACYCLE_CD: dtacycleCd,
            WRTTIME_IDTFR_ID: wrttimeId,
        });

        console.log(`Calling R-ONE API: STATBL_ID=${statblId}, DTACYCLE_CD=${dtacycleCd}, WRTTIME=${wrttimeId}`);
        const response = await fetch(`${baseUrl}?${params}`);

        if (!response.ok) {
            console.error(`R-ONE API HTTP error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // 에러 응답 처리
        if (data?.RESULT?.CODE && data.RESULT.CODE !== "INFO-000") {
            console.error(`R-ONE API error: ${data.RESULT.CODE} - ${data.RESULT.MESSAGE}`);
            return null;
        }

        // 정상 데이터 추출
        if (data?.SttsApiTblData?.[1]?.row) {
            return data.SttsApiTblData[1].row;
        }

        // 데이터 없음 (INFO-200)
        if (data?.SttsApiTblData?.[0]?.head?.[1]?.RESULT?.CODE === "INFO-200") {
            console.log(`No data for WRTTIME=${wrttimeId}`);
            return null;
        }

        console.log(`Unexpected response structure:`, JSON.stringify(data).substring(0, 200));
        return null;
    } catch (error) {
        console.error(`fetchIndexData error:`, error);
        return null;
    }
}

// ============================================
// 서울 구별 지수 추출
// ============================================
function extractSeoulDistrictIndex(rows: any[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const row of rows) {
        const fullName = row.CLS_FULLNM || "";
        const districtName = row.CLS_NM || "";

        // 서울 구 단위 데이터만 필터 (depth 4: 서울>지역>권역>구)
        if (!fullName.startsWith("서울")) continue;
        const depth = fullName.split(">").length;
        if (depth !== 4) continue;

        const districtId = DISTRICT_NAME_MAPPING[districtName];
        if (!districtId) continue;

        const indexValue = parseFloat(row.DTA_VAL);
        if (!isNaN(indexValue)) {
            result[districtId] = indexValue;
        }
    }

    return result;
}

// ============================================
// 변동률 계산: (현재지수 - 이전지수) / 이전지수 × 100
// ============================================
function calculateChangeRates(
    currentIndex: Record<string, number>,
    previousIndex: Record<string, number>
): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [districtId, currentVal] of Object.entries(currentIndex)) {
        const previousVal = previousIndex[districtId];
        if (previousVal && previousVal !== 0) {
            const rate = ((currentVal - previousVal) / previousVal) * 100;
            result[districtId] = {
                rate: Math.round(rate * 100) / 100,  // 소수점 2자리
                period: new Date().toISOString().split('T')[0],
                currentIndex: currentVal,
                previousIndex: previousVal,
            };
        }
    }

    return result;
}

// ============================================
// 최근 사용 가능한 데이터 찾기 (최대 maxOffset까지 탐색)
// ============================================
async function findAvailableData(
    statblId: string, dtacycleCd: string, periodType: string, startOffset: number, maxOffset: number
): Promise<{ rows: any[]; wrttime: string; offset: number } | null> {
    for (let offset = startOffset; offset <= maxOffset; offset++) {
        const wrttime = getWrttimeId(periodType, offset);
        const rows = await fetchIndexData(statblId, dtacycleCd, wrttime);
        if (rows) {
            console.log(`Found data at offset=${offset}, wrttime=${wrttime}`);
            return { rows, wrttime, offset };
        }
    }
    return null;
}

// ============================================
// 기간별 부동산통계정보시스템 API에서 변동률 계산
// ============================================
async function fetchRealEstateDataByPeriod(periodType: "weekly" | "monthly" | "yearly"): Promise<Record<string, any> | null> {
    try {
        const config = PERIOD_CONFIG[periodType];

        if (periodType === "yearly") {
            // 연간: 같은 달의 작년 vs 올해 비교
            const currentData = await findAvailableData(config.statblId, config.dtacycleCd, "monthly", 0, 6);
            if (!currentData) {
                console.log("No current monthly data for yearly comparison");
                return null;
            }
            // 12개월 전 데이터
            const previousWrttime = getWrttimeId("monthly", currentData.offset + 12);
            const previousRows = await fetchIndexData(config.statblId, config.dtacycleCd, previousWrttime);
            if (!previousRows) {
                console.log(`No data for 12 months prior (${previousWrttime})`);
                return null;
            }

            const currentIndex = extractSeoulDistrictIndex(currentData.rows);
            const previousIndex = extractSeoulDistrictIndex(previousRows);
            console.log(`Yearly: current=${currentData.wrttime}, previous=${previousWrttime}`);
            return calculateChangeRates(currentIndex, previousIndex);
        }

        // 주간/월간: 최근 사용 가능한 2개 연속 기간 비교
        const currentData = await findAvailableData(config.statblId, config.dtacycleCd, periodType, 0, 6);
        if (!currentData) {
            console.log(`No available data found for ${periodType}`);
            return null;
        }

        const previousData = await findAvailableData(config.statblId, config.dtacycleCd, periodType, currentData.offset + 1, currentData.offset + 7);
        if (!previousData) {
            console.log(`No previous data found for ${periodType}`);
            return null;
        }

        console.log(`Fetching ${periodType}: current=${currentData.wrttime}, previous=${previousData.wrttime}`);

        // 서울 구별 지수 추출
        const currentIndex = extractSeoulDistrictIndex(currentData.rows);
        const previousIndex = extractSeoulDistrictIndex(previousData.rows);

        console.log(`Seoul districts found: current=${Object.keys(currentIndex).length}, previous=${Object.keys(previousIndex).length}`);

        // 변동률 계산
        const changeRates = calculateChangeRates(currentIndex, previousIndex);
        console.log(`Calculated change rates for ${Object.keys(changeRates).length} districts`);

        return changeRates;
    } catch (error) {
        console.error(`Failed to fetch ${periodType}:`, error);
        return null;
    }
}

// 기존 함수 유지 (호환성)
async function fetchRealEstateData() {
    return fetchRealEstateDataByPeriod("weekly");
}

async function fetchFromDataGoKr() {
    try {
        const baseUrl = "https://apis.data.go.kr/1613000/";
        const endpoint = "HousingPriceIndexService/getHousingPriceIndex";

        const params = new URLSearchParams({
            serviceKey: decodeURIComponent(DATA_GO_KR_API_KEY),
            sigunguCode: "11",
            pageNo: "1",
            numOfRows: "100",
            type: "json",
        });

        const response = await fetch(`${baseUrl}${endpoint}?${params}`);

        if (!response.ok) {
            throw new Error(`Data.go.kr API request failed: ${response.status}`);
        }

        const data = await response.json();
        return processApiData(data);
    } catch (error) {
        console.error("Failed to fetch from data.go.kr:", error);
        return null;
    }
}

function processApiData(apiData: any) {
    // API 응답 데이터를 내부 형식으로 변환
    const processed: Record<string, any> = {};

    if (!apiData?.response?.body?.items?.item) {
        return processed;
    }

    const items = apiData.response.body.items.item;

    for (const item of items) {
        const regionCode = item.regionCode || item.sigunguCode;
        const districtId = DISTRICT_CODES[regionCode];

        if (districtId) {
            processed[districtId] = {
                rate: parseFloat(item.changeRate || item.indexRate || 0),
                period: item.period || item.statYear + "-" + item.statMonth,
            };
        }
    }

    return processed;
}
