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
        // R-ONE API 엔드포인트 (주택가격동향조사 매매가격지수변동률)
        const baseUrl = "https://api.reb.or.kr/statistics";
        const endpoint = "/weeklyHousingPriceIndexChange";

        const params = new URLSearchParams({
            serviceKey: RONE_API_KEY,
            region: "11", // 서울특별시
            houseType: "01", // 아파트
            pageNo: "1",
            numOfRows: "100",
            dataType: "json",
        });

        const response = await fetch(`${baseUrl}${endpoint}?${params}`);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return processApiData(data);
    } catch (error) {
        console.error("Failed to fetch from R-ONE API:", error);
        // Fallback: 공공데이터포털 API 시도
        return fetchFromDataGoKr();
    }
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
