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

        // Supabase 클라이언트 초기화
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
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

// 기간별 STATBL_ID 매핑
const PERIOD_STATBL_IDS: Record<string, string> = {
    weekly: "T244183132827305",   // 주간 아파트 매매가격 변동률
    monthly: "A_2024_00045",      // 월간 아파트 매매가격 변동률
    yearly: "A_2024_00045",       // 연간은 월간 ID 사용 (별도 ID 없으면)
};

// 기간별 부동산통계정보시스템 API에서 데이터 가져오기
async function fetchRealEstateDataByPeriod(periodType: "weekly" | "monthly" | "yearly") {
    try {
        const baseUrl = "https://www.reb.or.kr/r-one/openapi/SttsApiTbl.do";
        const statblId = PERIOD_STATBL_IDS[periodType];

        const params = new URLSearchParams({
            KEY: RONE_API_KEY,
            Type: "json",
            pIndex: "1",
            pSize: "100",
            STATBL_ID: statblId,
        });

        console.log(`Calling R-ONE API for ${periodType}:`, `${baseUrl}?KEY=***&Type=json&STATBL_ID=${statblId}`);
        const response = await fetch(`${baseUrl}?${params}`);

        if (!response.ok) {
            console.log(`R-ONE API response not ok for ${periodType}:`, response.status);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(`R-ONE API ${periodType} response:`, JSON.stringify(data).substring(0, 300));

        if (data && data.SttsApiTbl && data.SttsApiTbl[1] && data.SttsApiTbl[1].row) {
            return processROneData(data.SttsApiTbl[1].row);
        }

        // 데이터 구조가 다를 수 있음
        if (data && data.row) {
            return processROneData(data.row);
        }

        console.log(`No data found for ${periodType}`);
        return null;
    } catch (error) {
        console.error(`Failed to fetch ${periodType} from R-ONE API:`, error);
        return null;
    }
}

// 기존 함수 유지 (호환성)
async function fetchRealEstateData() {
    return fetchRealEstateDataByPeriod("weekly");
}

// R-ONE API 데이터 처리
function processROneData(rows: any[]): Record<string, any> {
    const processed: Record<string, any> = {};
    const districtNameMapping: Record<string, string> = {
        "서울특별시": "seoul_avg",
        "서울": "seoul_avg",
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

    console.log(`Processing ${rows.length} rows from R-ONE API`);

    for (const row of rows) {
        // 다양한 필드명에서 지역명 추출 시도
        const regionName = row.CL_NM || row.REGION_NM || row.ITEM_NM || row.WRTTIME_IDTFR_ID || "";

        // 다양한 필드명에서 값 추출 시도
        const value = row.DATA_VALUE || row.DT || row.DATA || row.VALUE || "0";
        const period = row.TIME || row.PRD_DE || row.PERIOD || new Date().toISOString().split('T')[0];

        console.log(`Row: region=${regionName}, value=${value}, period=${period}`);

        // 지역명에서 구 이름 찾기
        let districtId = districtNameMapping[regionName];

        // 정확히 매칭되지 않으면 포함 여부 확인
        if (!districtId) {
            for (const [name, id] of Object.entries(districtNameMapping)) {
                if (regionName.includes(name) || name.includes(regionName)) {
                    districtId = id;
                    break;
                }
            }
        }

        if (districtId && districtId !== "seoul_avg") {
            processed[districtId] = {
                rate: parseFloat(value) || 0,
                period: period,
            };
            console.log(`Mapped: ${regionName} -> ${districtId} = ${value}`);
        }
    }

    console.log(`Processed ${Object.keys(processed).length} districts`);
    return processed;
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
