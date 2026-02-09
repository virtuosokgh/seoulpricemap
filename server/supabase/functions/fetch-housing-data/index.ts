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
            // 외부 API에서 데이터를 가져와 DB에 저장
            const apiData = await fetchRealEstateData();

            if (!apiData || Object.keys(apiData).length === 0) {
                return new Response(JSON.stringify({ success: false, error: "No data from API" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }

            // 현재 주차 계산
            const now = new Date();
            const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
            const periodValue = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

            // DB에 저장
            const insertData = Object.entries(apiData).map(([districtId, info]: [string, any]) => ({
                district_id: districtId,
                period_type: 'weekly',
                period_value: periodValue,
                rate: info.rate
            }));

            const { error: insertError } = await supabaseClient
                .from('housing_prices')
                .upsert(insertData, { onConflict: 'district_id,period_type,period_value' });

            if (insertError) {
                console.error("Insert error:", insertError);
                return new Response(JSON.stringify({ success: false, error: insertError.message }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 500,
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: `Synced ${insertData.length} districts for ${periodValue}`,
                data: apiData
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

// 부동산통계정보시스템 API에서 데이터 가져오기
async function fetchRealEstateData() {
    try {
        // R-ONE API 엔드포인트 (주택가격동향조사)
        // 주간 아파트 매매가격지수 변동률 - STATBL_ID 확인 필요
        const baseUrl = "https://www.reb.or.kr/r-one/openapi/SttsApiTbl.do";

        const params = new URLSearchParams({
            KEY: RONE_API_KEY,
            Type: "json",
            pIndex: "1",
            pSize: "100",
            STATBL_ID: "T_한국부동산원_주간아파트매매가격변동률_시도",  // 주간 아파트 매매가격 변동률
        });

        console.log("Calling R-ONE API:", `${baseUrl}?${params}`);
        const response = await fetch(`${baseUrl}?${params}`);

        if (!response.ok) {
            console.log("R-ONE API response not ok:", response.status);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("R-ONE API response:", JSON.stringify(data).substring(0, 500));

        if (data && data.SttsApiTbl && data.SttsApiTbl[1] && data.SttsApiTbl[1].row) {
            return processROneData(data.SttsApiTbl[1].row);
        }

        throw new Error("No data from R-ONE API");
    } catch (error) {
        console.error("Failed to fetch from R-ONE API:", error);
        // Fallback: 공공데이터포털 API 시도
        return fetchFromDataGoKr();
    }
}

// R-ONE API 데이터 처리
function processROneData(rows: any[]): Record<string, any> {
    const processed: Record<string, any> = {};
    const districtNameMapping: Record<string, string> = {
        "서울특별시": "seoul_avg",
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

    for (const row of rows) {
        const regionName = row.CL_NM || row.WRTTIME_IDTFR_ID;
        const districtId = districtNameMapping[regionName];

        if (districtId && districtId !== "seoul_avg") {
            processed[districtId] = {
                rate: parseFloat(row.DT || row.DATA || 0),
                period: row.PRD_DE || row.TIME || new Date().toISOString().split('T')[0],
            };
        }
    }

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
