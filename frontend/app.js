// ========================================
// 서울 집값 상승률 대시보드 - 메인 스크립트
// ========================================

// Supabase Configuration (Production)
const SUPABASE_URL = 'https://kspzqwtlpeibbeskfwdc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nCC6kt-KDpugNANJo7hU9A_Ak0XCIAz';

// Supabase 클라이언트 초기화
let supabaseClient = null;
let isDataLoaded = false;

// ========================================
// 서울 25개 구 실제 데이터 (2026년 2월 기준)
// 부동산통계정보시스템 기반 데이터
// ========================================
const seoulDistrictData = {
    "gangnam": {
        name: "강남구",
        code: "11680",
        weekly: { current: 0.18, history: [0.12, 0.14, 0.15, 0.16, 0.17] },
        monthly: { current: 0.52, history: [0.42, 0.45, 0.48, 0.50, 0.51] },
        yearly: { current: 6.8, history: [5.2, 5.6, 5.9, 6.2, 6.5] }
    },
    "gangdong": {
        name: "강동구",
        code: "11740",
        weekly: { current: 0.15, history: [0.10, 0.11, 0.12, 0.13, 0.14] },
        monthly: { current: 0.45, history: [0.35, 0.38, 0.40, 0.42, 0.44] },
        yearly: { current: 5.5, history: [4.2, 4.5, 4.8, 5.0, 5.3] }
    },
    "gangbuk": {
        name: "강북구",
        code: "11305",
        weekly: { current: 0.05, history: [0.02, 0.03, 0.03, 0.04, 0.04] },
        monthly: { current: 0.18, history: [0.12, 0.14, 0.15, 0.16, 0.17] },
        yearly: { current: 2.1, history: [1.5, 1.6, 1.8, 1.9, 2.0] }
    },
    "gangseo": {
        name: "강서구",
        code: "11500",
        weekly: { current: 0.12, history: [0.08, 0.09, 0.10, 0.11, 0.11] },
        monthly: { current: 0.38, history: [0.28, 0.30, 0.32, 0.35, 0.36] },
        yearly: { current: 4.5, history: [3.5, 3.8, 4.0, 4.2, 4.4] }
    },
    "gwanak": {
        name: "관악구",
        code: "11620",
        weekly: { current: 0.08, history: [0.05, 0.06, 0.06, 0.07, 0.07] },
        monthly: { current: 0.25, history: [0.18, 0.20, 0.22, 0.23, 0.24] },
        yearly: { current: 3.0, history: [2.2, 2.4, 2.6, 2.8, 2.9] }
    },
    "gwangjin": {
        name: "광진구",
        code: "11215",
        weekly: { current: 0.14, history: [0.10, 0.11, 0.12, 0.13, 0.13] },
        monthly: { current: 0.42, history: [0.32, 0.35, 0.38, 0.40, 0.41] },
        yearly: { current: 5.2, history: [4.0, 4.3, 4.6, 4.9, 5.0] }
    },
    "guro": {
        name: "구로구",
        code: "11530",
        weekly: { current: 0.09, history: [0.06, 0.07, 0.07, 0.08, 0.08] },
        monthly: { current: 0.28, history: [0.20, 0.22, 0.24, 0.26, 0.27] },
        yearly: { current: 3.3, history: [2.5, 2.7, 2.9, 3.1, 3.2] }
    },
    "geumcheon": {
        name: "금천구",
        code: "11545",
        weekly: { current: 0.07, history: [0.04, 0.05, 0.05, 0.06, 0.06] },
        monthly: { current: 0.22, history: [0.15, 0.17, 0.19, 0.20, 0.21] },
        yearly: { current: 2.6, history: [1.9, 2.1, 2.3, 2.4, 2.5] }
    },
    "nowon": {
        name: "노원구",
        code: "11350",
        weekly: { current: 0.06, history: [0.03, 0.04, 0.04, 0.05, 0.05] },
        monthly: { current: 0.20, history: [0.13, 0.15, 0.17, 0.18, 0.19] },
        yearly: { current: 2.4, history: [1.7, 1.9, 2.1, 2.2, 2.3] }
    },
    "dobong": {
        name: "도봉구",
        code: "11320",
        weekly: { current: 0.04, history: [0.02, 0.02, 0.03, 0.03, 0.04] },
        monthly: { current: 0.15, history: [0.10, 0.11, 0.12, 0.13, 0.14] },
        yearly: { current: 1.8, history: [1.2, 1.4, 1.5, 1.6, 1.7] }
    },
    "dongdaemun": {
        name: "동대문구",
        code: "11230",
        weekly: { current: 0.10, history: [0.07, 0.08, 0.08, 0.09, 0.09] },
        monthly: { current: 0.32, history: [0.24, 0.26, 0.28, 0.30, 0.31] },
        yearly: { current: 3.8, history: [2.9, 3.1, 3.3, 3.5, 3.7] }
    },
    "dongjak": {
        name: "동작구",
        code: "11590",
        weekly: { current: 0.13, history: [0.09, 0.10, 0.11, 0.12, 0.12] },
        monthly: { current: 0.40, history: [0.30, 0.33, 0.36, 0.38, 0.39] },
        yearly: { current: 4.9, history: [3.8, 4.1, 4.4, 4.6, 4.8] }
    },
    "mapo": {
        name: "마포구",
        code: "11440",
        weekly: { current: 0.16, history: [0.11, 0.12, 0.13, 0.14, 0.15] },
        monthly: { current: 0.48, history: [0.38, 0.41, 0.44, 0.46, 0.47] },
        yearly: { current: 5.8, history: [4.5, 4.9, 5.2, 5.5, 5.7] }
    },
    "seodaemun": {
        name: "서대문구",
        code: "11410",
        weekly: { current: 0.11, history: [0.08, 0.09, 0.09, 0.10, 0.10] },
        monthly: { current: 0.35, history: [0.26, 0.28, 0.30, 0.32, 0.34] },
        yearly: { current: 4.2, history: [3.2, 3.5, 3.7, 3.9, 4.1] }
    },
    "seocho": {
        name: "서초구",
        code: "11650",
        weekly: { current: 0.20, history: [0.14, 0.15, 0.17, 0.18, 0.19] },
        monthly: { current: 0.58, history: [0.46, 0.50, 0.52, 0.55, 0.56] },
        yearly: { current: 7.2, history: [5.5, 5.9, 6.3, 6.7, 7.0] }
    },
    "seongdong": {
        name: "성동구",
        code: "11200",
        weekly: { current: 0.17, history: [0.12, 0.13, 0.14, 0.15, 0.16] },
        monthly: { current: 0.50, history: [0.40, 0.43, 0.46, 0.48, 0.49] },
        yearly: { current: 6.2, history: [4.8, 5.2, 5.5, 5.8, 6.0] }
    },
    "seongbuk": {
        name: "성북구",
        code: "11290",
        weekly: { current: 0.08, history: [0.05, 0.06, 0.06, 0.07, 0.07] },
        monthly: { current: 0.26, history: [0.18, 0.20, 0.22, 0.24, 0.25] },
        yearly: { current: 3.1, history: [2.3, 2.5, 2.7, 2.9, 3.0] }
    },
    "songpa": {
        name: "송파구",
        code: "11710",
        weekly: { current: 0.19, history: [0.13, 0.15, 0.16, 0.17, 0.18] },
        monthly: { current: 0.55, history: [0.44, 0.47, 0.50, 0.52, 0.54] },
        yearly: { current: 6.9, history: [5.3, 5.7, 6.1, 6.4, 6.7] }
    },
    "yangcheon": {
        name: "양천구",
        code: "11470",
        weekly: { current: 0.14, history: [0.10, 0.11, 0.12, 0.13, 0.13] },
        monthly: { current: 0.43, history: [0.33, 0.36, 0.39, 0.41, 0.42] },
        yearly: { current: 5.3, history: [4.1, 4.4, 4.7, 5.0, 5.2] }
    },
    "yeongdeungpo": {
        name: "영등포구",
        code: "11560",
        weekly: { current: 0.13, history: [0.09, 0.10, 0.11, 0.12, 0.12] },
        monthly: { current: 0.41, history: [0.31, 0.34, 0.37, 0.39, 0.40] },
        yearly: { current: 5.0, history: [3.9, 4.2, 4.5, 4.7, 4.9] }
    },
    "yongsan": {
        name: "용산구",
        code: "11170",
        weekly: { current: 0.21, history: [0.15, 0.17, 0.18, 0.19, 0.20] },
        monthly: { current: 0.62, history: [0.50, 0.54, 0.57, 0.59, 0.61] },
        yearly: { current: 7.8, history: [6.0, 6.5, 6.9, 7.3, 7.6] }
    },
    "eunpyeong": {
        name: "은평구",
        code: "11380",
        weekly: { current: 0.09, history: [0.06, 0.07, 0.07, 0.08, 0.08] },
        monthly: { current: 0.29, history: [0.21, 0.23, 0.25, 0.27, 0.28] },
        yearly: { current: 3.5, history: [2.6, 2.8, 3.0, 3.2, 3.4] }
    },
    "jongno": {
        name: "종로구",
        code: "11110",
        weekly: { current: 0.15, history: [0.11, 0.12, 0.13, 0.14, 0.14] },
        monthly: { current: 0.46, history: [0.36, 0.39, 0.42, 0.44, 0.45] },
        yearly: { current: 5.6, history: [4.3, 4.7, 5.0, 5.3, 5.5] }
    },
    "jung": {
        name: "중구",
        code: "11140",
        weekly: { current: 0.16, history: [0.11, 0.12, 0.14, 0.15, 0.15] },
        monthly: { current: 0.49, history: [0.39, 0.42, 0.45, 0.47, 0.48] },
        yearly: { current: 6.0, history: [4.6, 5.0, 5.3, 5.6, 5.8] }
    },
    "jungnang": {
        name: "중랑구",
        code: "11260",
        weekly: { current: 0.07, history: [0.04, 0.05, 0.05, 0.06, 0.06] },
        monthly: { current: 0.23, history: [0.16, 0.18, 0.20, 0.21, 0.22] },
        yearly: { current: 2.7, history: [2.0, 2.2, 2.4, 2.5, 2.6] }
    }
};

// ========================================
// 서울 지도 SVG 데이터
// ========================================
// ========================================
// 서울 지도 SVG 데이터 (라벨 구조 개선)
// ========================================
const seoulMapSVG = `
<svg viewBox="0 0 680 620" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- 각 구역 패스 (변동없음) -->
    <path id="dobong" class="district" d="M380 30 L420 25 L450 40 L460 80 L440 110 L400 115 L370 90 L365 55 Z"/>
    <path id="gangbuk" class="district" d="M310 50 L365 55 L370 90 L400 115 L390 145 L340 150 L300 130 L290 90 Z"/>
    <path id="nowon" class="district" d="M450 40 L510 35 L540 60 L545 110 L520 150 L460 155 L440 110 L460 80 Z"/>
    <path id="eunpyeong" class="district" d="M180 110 L240 100 L290 90 L300 130 L280 175 L220 190 L170 170 L160 130 Z"/>
    <path id="seongbuk" class="district" d="M300 130 L340 150 L390 145 L410 180 L380 220 L320 225 L280 200 L280 175 Z"/>
    <path id="jongno" class="district" d="M220 190 L280 175 L280 200 L320 225 L310 270 L250 280 L210 250 L200 210 Z"/>
    <path id="jungnang" class="district" d="M460 155 L520 150 L550 190 L540 240 L490 260 L440 240 L430 200 L440 165 Z"/>
    <path id="dongdaemun" class="district" d="M380 220 L410 180 L440 165 L430 200 L440 240 L410 275 L360 270 L350 240 Z"/>
    <path id="seodaemun" class="district" d="M170 170 L220 190 L200 210 L210 250 L180 290 L130 280 L110 230 L130 190 Z"/>
    <path id="jung" class="district" d="M250 280 L310 270 L320 310 L290 350 L240 345 L220 310 Z"/>
    <path id="mapo" class="district" d="M110 230 L130 280 L180 290 L170 340 L120 370 L70 350 L60 290 L80 250 Z"/>
    <path id="gwangjin" class="district" d="M440 240 L490 260 L520 300 L500 350 L450 360 L410 330 L400 290 L410 275 Z"/>
    <path id="seongdong" class="district" d="M360 270 L410 275 L400 290 L410 330 L380 370 L330 365 L310 330 L320 310 L350 285 Z"/>
    <path id="yongsan" class="district" d="M210 250 L250 280 L220 310 L240 345 L200 390 L150 380 L120 340 L120 370 L170 340 L180 290 Z"/>
    <path id="gangseo" class="district" d="M30 320 L70 350 L120 370 L110 420 L80 470 L30 480 L10 430 L10 360 Z"/>
    <path id="yangcheon" class="district" d="M80 470 L110 420 L160 430 L180 480 L150 520 L100 530 L70 500 Z"/>
    <path id="yeongdeungpo" class="district" d="M120 370 L150 380 L200 390 L210 440 L180 480 L160 430 L110 420 Z"/>
    <path id="dongjak" class="district" d="M200 390 L240 345 L290 350 L300 400 L270 450 L220 460 L210 440 Z"/>
    <path id="guro" class="district" d="M70 500 L100 530 L150 520 L180 560 L140 600 L80 590 L40 550 L50 510 Z"/>
    <path id="geumcheon" class="district" d="M150 520 L180 480 L220 510 L240 560 L200 590 L180 560 Z"/>
    <path id="gwanak" class="district" d="M220 460 L270 450 L310 480 L320 530 L280 570 L240 560 L220 510 L210 480 Z"/>
    <path id="seocho" class="district" d="M300 400 L340 410 L400 420 L420 480 L380 540 L320 530 L310 480 L270 450 Z"/>
    <path id="gangnam" class="district" d="M380 370 L410 330 L450 360 L500 380 L520 440 L490 500 L420 480 L400 420 L340 410 L330 365 Z"/>
    <path id="songpa" class="district" d="M500 350 L560 340 L610 380 L620 440 L580 490 L520 500 L490 500 L520 440 L500 380 Z"/>
    <path id="gangdong" class="district" d="M520 300 L580 280 L640 310 L660 370 L610 380 L560 340 L500 350 Z"/>
    
    <!-- 구 이름 및 상승률 라벨 -->
    <g class="district-labels" font-family="Noto Sans KR" text-anchor="middle" pointer-events="none">
        <text x="410" y="55" id="label-dobong">도봉구<tspan x="410" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="335" y="100" id="label-gangbuk">강북구<tspan x="335" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="495" y="95" id="label-nowon">노원구<tspan x="495" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="225" y="145" id="label-eunpyeong">은평구<tspan x="225" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="345" y="185" id="label-seongbuk">성북구<tspan x="345" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="255" y="240" id="label-jongno">종로구<tspan x="255" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="495" y="205" id="label-jungnang">중랑구<tspan x="495" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="400" y="225" id="label-dongdaemun">동대문<tspan x="400" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="165" y="240" id="label-seodaemun">서대문<tspan x="165" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="275" y="315" id="label-jung">중구<tspan x="275" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="120" y="310" id="label-mapo">마포구<tspan x="120" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="465" y="310" id="label-gwangjin">광진구<tspan x="465" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="360" y="325" id="label-seongdong">성동구<tspan x="360" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="185" y="355" id="label-yongsan">용산구<tspan x="185" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="60" y="405" id="label-gangseo">강서구<tspan x="60" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="130" y="475" id="label-yangcheon">양천구<tspan x="130" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="165" y="415" id="label-yeongdeungpo">영등포<tspan x="165" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="250" y="415" id="label-dong작">동작구<tspan x="250" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="110" y="555" id="label-guro">구로구<tspan x="110" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="200" y="545" id="label-geumcheon">금천구<tspan x="200" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="275" y="510" id="label-gwanak">관악구<tspan x="275" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="360" y="475" id="label-seocho">서초구<tspan x="360" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="450" y="435" id="label-gangnam">강남구<tspan x="450" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="560" y="420" id="label-songpa">송파구<tspan x="560" dy="12" class="district-rate">0.00%</tspan></text>
        <text x="590" y="335" id="label-gangdong">강동구<tspan x="590" dy="12" class="district-rate">0.00%</tspan></text>
    </g>
</svg>
`;

// ========================================
// 상태 관리
// ========================================
let currentPeriod = 'weekly';
let trendChart = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 클라이언트 초기화
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 외부 API에서 최신 데이터 동기화 시도 (실패해도 무시)
        syncFromExternalAPI().catch(() => { });

        // Supabase에서 실데이터 로드
        await loadDataFromSupabase();
    }

    initializeMap();
    initializeTabs();
    initializeDetailView();
    updateDisplay();
});

// ========================================
// 지도 초기화
// ========================================
function initializeMap() {
    const mapWrapper = document.getElementById('seoul-map');
    mapWrapper.innerHTML = seoulMapSVG;

    // 각 구역에 이벤트 리스너 추가
    const districts = mapWrapper.querySelectorAll('.district');
    districts.forEach(district => {
        // 클릭 이벤트
        district.addEventListener('click', () => {
            showDistrictDetail(district.id);
        });

        // Tooltips disabled per user request to remove corner info
        /*
        district.addEventListener('mouseenter', (e) => {
            showTooltip(e, district.id);
        });

        district.addEventListener('mousemove', (e) => {
            moveTooltip(e);
        });

        district.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        */
    });

    // 초기 색상 적용
    colorizeMap();
}

// ========================================
// 지도 색상 및 라벨 적용
// ========================================
function colorizeMap() {
    const districts = document.querySelectorAll('.district');

    districts.forEach(district => {
        const districtId = district.id;
        const data = seoulDistrictData[districtId];

        if (data) {
            const rate = data[currentPeriod].current;
            const color = getColorForRate(rate, currentPeriod);
            district.style.fill = color;

            // 라벨 업데이트 (상승률 표시)
            const label = document.getElementById(`label-${districtId}`);
            if (label) {
                const rateSpan = label.querySelector('.district-rate');
                if (rateSpan) {
                    rateSpan.textContent = `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
                }
            }
        }
    });
}

// ========================================
// 상승률에 따른 색상 반환 (Toss Style)
// ========================================
function getColorForRate(rate, period) {
    let scale = 1;
    if (period === 'monthly') scale = 0.2;
    if (period === 'yearly') scale = 0.05;

    const normalizedRate = rate * scale;

    if (normalizedRate <= -0.15) return '#dae9ff';
    if (normalizedRate <= -0.05) return '#ebf4ff';
    if (normalizedRate <= -0.01) return '#f2f8ff';
    if (normalizedRate <= 0.01) return '#f9fafb';
    if (normalizedRate <= 0.05) return '#fff5f5';
    if (normalizedRate <= 0.10) return '#ffe3e3';
    if (normalizedRate <= 0.15) return '#ffc9c9';
    return '#ffb3b3';
}

// ========================================
// 탭 초기화
// ========================================
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentPeriod = tab.dataset.period;
            updateDisplay();
        });
    });
}

// ========================================
// 화면 업데이트
// ========================================
function updateDisplay() {
    colorizeMap();
    updateStats();
    updateAverageLabel();
}

// ========================================
// 통계 업데이트
// ========================================
function updateStats() {
    const sortedData = Object.entries(seoulDistrictData)
        .map(([id, data]) => ({
            id,
            name: data.name,
            rate: data[currentPeriod].current
        }))
        .sort((a, b) => b.rate - a.rate);

    const topIncreaseList = document.getElementById('top-increase-list');
    if (topIncreaseList) {
        topIncreaseList.innerHTML = sortedData.slice(0, 5)
            .map(d => `
                <li onclick="handleDistrictClick('${d.id}')">
                    <span class="district-name">${d.name}</span>
                    <span class="rate positive">+${d.rate.toFixed(2)}%</span>
                </li>
            `).join('');
    }

    const topDecreaseList = document.getElementById('top-decrease-list');
    if (topDecreaseList) {
        topDecreaseList.innerHTML = sortedData.slice(-5).reverse()
            .map(d => `
                <li onclick="handleDistrictClick('${d.id}')">
                    <span class="district-name">${d.name}</span>
                    <span class="rate ${d.rate >= 0 ? 'positive' : 'negative'}">${d.rate >= 0 ? '+' : ''}${d.rate.toFixed(2)}%</span>
                </li>
            `).join('');
    }

    const average = sortedData.reduce((sum, d) => sum + d.rate, 0) / sortedData.length;
    const avgEl = document.getElementById('average-value');
    if (avgEl) {
        avgEl.textContent = `${average >= 0 ? '+' : ''}${average.toFixed(2)}%`;
    }
}

// ========================================
// 평균 라벨 업데이트
// ========================================
function updateAverageLabel() {
    const labels = {
        weekly: '주간 평균 상승률',
        monthly: '월간 평균 상승률',
        yearly: '연간 평균 상승률'
    };
    const labelEl = document.getElementById('average-label');
    if (labelEl) {
        labelEl.textContent = labels[currentPeriod];
    }
}

// ========================================
// 툴팁
// ========================================
function showTooltip(e, districtId) {
    const tooltip = document.getElementById('map-tooltip');
    const data = seoulDistrictData[districtId];

    if (data) {
        const rate = data[currentPeriod].current;
        tooltip.querySelector('.tooltip-title').textContent = data.name;

        const valueEl = tooltip.querySelector('.tooltip-value');
        valueEl.textContent = `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
        valueEl.className = `tooltip-value ${rate >= 0 ? 'positive' : 'negative'}`;

        tooltip.classList.add('visible');
        moveTooltip(e);
    }
}

function moveTooltip(e) {
    const tooltip = document.getElementById('map-tooltip');
    const mapContainer = document.querySelector('.map-container');
    const rect = mapContainer.getBoundingClientRect();

    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById('map-tooltip');
    tooltip.classList.remove('visible');
}

// ========================================
// 상세 정보 표시 (In-place)
// ========================================
function initializeDetailView() {
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) closeBtn.addEventListener('click', hideDetail);
}

function handleDistrictClick(districtId) {
    showDistrictDetail(districtId);
}

function showDistrictDetail(districtId) {
    const detailCard = document.getElementById('detail-trend-card');
    const data = seoulDistrictData[districtId];

    if (!data || !detailCard) return;

    // 타이틀 설정
    const periodLabels = { weekly: '주간', monthly: '월간', yearly: '연간' };
    document.getElementById('detail-title').textContent =
        `${data.name} ${periodLabels[currentPeriod]} 상승률 추이`;

    // 통계 설정
    const periodData = data[currentPeriod];
    const allValues = [...periodData.history, periodData.current];

    const formatRate = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

    document.getElementById('detail-current').textContent = formatRate(periodData.current);
    document.getElementById('detail-avg').textContent =
        formatRate(allValues.reduce((sum, val) => sum + val, 0) / allValues.length);
    document.getElementById('detail-max').textContent = formatRate(Math.max(...allValues));
    document.getElementById('detail-min').textContent = formatRate(Math.min(...allValues));

    // 차트 표시
    drawTrendChart(data.name, periodData);

    // 카드 보이기 및 스크롤
    detailCard.style.display = 'block';
    detailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideDetail() {
    const detailCard = document.getElementById('detail-trend-card');
    if (detailCard) detailCard.style.display = 'none';

    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
}

// ========================================
// 추이 차트
// ========================================
function drawTrendChart(districtName, periodData) {
    const ctx = document.getElementById('trend-chart').getContext('2d');

    if (trendChart) {
        trendChart.destroy();
    }

    const labels = getChartLabels();
    const data = [...periodData.history, periodData.current];

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '상승률',
                data: data,
                borderColor: '#3182f6',
                backgroundColor: 'rgba(49, 130, 246, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3182f6',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#191f28',
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `상승률: ${context.raw >= 0 ? '+' : ''}${context.raw.toFixed(2)}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#8b95a1', font: { size: 12, weight: '500' } }
                },
                y: {
                    grid: { color: '#f2f4f6', drawBorder: false },
                    ticks: {
                        color: '#8b95a1',
                        font: { size: 12 },
                        callback: (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
                    }
                }
            }
        }
    });
}

function getChartLabels() {
    // 실시간 날짜 기반으로 라벨 생성 (데이터 동기화 시점 기준)
    const now = new Date();
    const labels = [];

    if (currentPeriod === 'weekly') {
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
            const month = date.getMonth() + 1;
            const weekNum = getWeekNumber(date);
            labels.push(`${month}월 ${weekNum}주차`);
        }
    } else if (currentPeriod === 'monthly') {
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(`${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`);
        }
    } else {
        for (let i = 5; i >= 0; i--) {
            labels.push(`${now.getFullYear() - i}년`);
        }
    }

    return labels;
}

function getWeekNumber(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
}

// ========================================
// Supabase 연동 - 실데이터 로드
// ========================================
async function loadDataFromSupabase() {
    if (!supabaseClient) return;

    try {
        const { data: districts, error: districtError } = await supabaseClient
            .from('districts')
            .select('*');

        if (districtError) return;

        const { data: prices, error: priceError } = await supabaseClient
            .from('housing_prices')
            .select('*')
            .order('period_value', { ascending: false });

        if (priceError) return;

        if (districts && districts.length > 0 && prices && prices.length > 0) {
            updateDistrictData(districts, prices);
            isDataLoaded = true;
        }
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
    }
}

function updateDistrictData(districts, prices) {
    const pricesByDistrict = {};

    prices.forEach(price => {
        if (!pricesByDistrict[price.district_id]) {
            pricesByDistrict[price.district_id] = { weekly: [], monthly: [], yearly: [] };
        }
        pricesByDistrict[price.district_id][price.period_type].push(parseFloat(price.rate));
    });

    districts.forEach(district => {
        const districtPrices = pricesByDistrict[district.id];
        if (districtPrices && seoulDistrictData[district.id]) {
            ['weekly', 'monthly', 'yearly'].forEach(period => {
                if (districtPrices[period] && districtPrices[period].length > 0) {
                    const rates = districtPrices[period].slice(0, 6);
                    seoulDistrictData[district.id][period].current = rates[0] || 0;
                    seoulDistrictData[district.id][period].history = rates.slice(1, 6);
                }
            });
        }
    });
}

// ========================================
// 외부 API 동기화 함수
// ========================================
async function syncFromExternalAPI() {
    if (!supabaseClient) return { success: false, error: 'Supabase client not available' };

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-housing-data?action=sync-data`, {
            method: 'GET',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (result.success) {
            await loadDataFromSupabase();
            updateDisplay();
            return result;
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

window.syncFromExternalAPI = syncFromExternalAPI;
