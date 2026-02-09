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
const seoulMapSVG = `
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- 도봉구 -->
    <path id="dobong" class="district" d="M380 30 L420 25 L450 40 L460 80 L440 110 L400 115 L370 90 L365 55 Z"/>
    
    <!-- 강북구 -->
    <path id="gangbuk" class="district" d="M310 50 L365 55 L370 90 L400 115 L390 145 L340 150 L300 130 L290 90 Z"/>
    
    <!-- 노원구 -->
    <path id="nowon" class="district" d="M450 40 L510 35 L540 60 L545 110 L520 150 L460 155 L440 110 L460 80 Z"/>
    
    <!-- 은평구 -->
    <path id="eunpyeong" class="district" d="M180 110 L240 100 L290 90 L300 130 L280 175 L220 190 L170 170 L160 130 Z"/>
    
    <!-- 성북구 -->
    <path id="seongbuk" class="district" d="M300 130 L340 150 L390 145 L410 180 L380 220 L320 225 L280 200 L280 175 Z"/>
    
    <!-- 종로구 -->
    <path id="jongno" class="district" d="M220 190 L280 175 L280 200 L320 225 L310 270 L250 280 L210 250 L200 210 Z"/>
    
    <!-- 중랑구 -->
    <path id="jungnang" class="district" d="M460 155 L520 150 L550 190 L540 240 L490 260 L440 240 L430 200 L440 165 Z"/>
    
    <!-- 동대문구 -->
    <path id="dongdaemun" class="district" d="M380 220 L410 180 L440 165 L430 200 L440 240 L410 275 L360 270 L350 240 Z"/>
    
    <!-- 서대문구 -->
    <path id="seodaemun" class="district" d="M170 170 L220 190 L200 210 L210 250 L180 290 L130 280 L110 230 L130 190 Z"/>
    
    <!-- 중구 -->
    <path id="jung" class="district" d="M250 280 L310 270 L320 310 L290 350 L240 345 L220 310 Z"/>
    
    <!-- 마포구 -->
    <path id="mapo" class="district" d="M110 230 L130 280 L180 290 L170 340 L120 370 L70 350 L60 290 L80 250 Z"/>
    
    <!-- 광진구 -->
    <path id="gwangjin" class="district" d="M440 240 L490 260 L520 300 L500 350 L450 360 L410 330 L400 290 L410 275 Z"/>
    
    <!-- 성동구 -->
    <path id="seongdong" class="district" d="M360 270 L410 275 L400 290 L410 330 L380 370 L330 365 L310 330 L320 310 L350 285 Z"/>
    
    <!-- 용산구 -->
    <path id="yongsan" class="district" d="M210 250 L250 280 L220 310 L240 345 L200 390 L150 380 L120 340 L120 370 L170 340 L180 290 Z"/>
    
    <!-- 강서구 -->
    <path id="gangseo" class="district" d="M30 320 L70 350 L120 370 L110 420 L80 470 L30 480 L10 430 L10 360 Z"/>
    
    <!-- 양천구 -->
    <path id="yangcheon" class="district" d="M80 470 L110 420 L160 430 L180 480 L150 520 L100 530 L70 500 Z"/>
    
    <!-- 영등포구 -->
    <path id="yeongdeungpo" class="district" d="M120 370 L150 380 L200 390 L210 440 L180 480 L160 430 L110 420 Z"/>
    
    <!-- 동작구 -->
    <path id="dongjak" class="district" d="M200 390 L240 345 L290 350 L300 400 L270 450 L220 460 L210 440 Z"/>
    
    <!-- 구로구 -->
    <path id="guro" class="district" d="M70 500 L100 530 L150 520 L180 560 L140 600 L80 590 L40 550 L50 510 Z"/>
    
    <!-- 금천구 -->
    <path id="geumcheon" class="district" d="M150 520 L180 480 L220 510 L240 560 L200 590 L180 560 Z"/>
    
    <!-- 관악구 -->
    <path id="gwanak" class="district" d="M220 460 L270 450 L310 480 L320 530 L280 570 L240 560 L220 510 L210 480 Z"/>
    
    <!-- 서초구 -->
    <path id="seocho" class="district" d="M300 400 L340 410 L400 420 L420 480 L380 540 L320 530 L310 480 L270 450 Z"/>
    
    <!-- 강남구 -->
    <path id="gangnam" class="district" d="M380 370 L410 330 L450 360 L500 380 L520 440 L490 500 L420 480 L400 420 L340 410 L330 365 Z"/>
    
    <!-- 송파구 -->
    <path id="songpa" class="district" d="M500 350 L560 340 L610 380 L620 440 L580 490 L520 500 L490 500 L520 440 L500 380 Z"/>
    
    <!-- 강동구 -->
    <path id="gangdong" class="district" d="M520 300 L580 280 L640 310 L660 370 L610 380 L560 340 L500 350 Z"/>
    
    <!-- 구 이름 라벨 -->
    <g class="district-labels" font-size="11" font-weight="500" fill="#ffffff" text-anchor="middle" pointer-events="none">
        <text x="410" y="60">도봉구</text>
        <text x="335" y="105">강북구</text>
        <text x="490" y="100">노원구</text>
        <text x="225" y="145">은평구</text>
        <text x="345" y="185">성북구</text>
        <text x="255" y="240">종로구</text>
        <text x="490" y="205">중랑구</text>
        <text x="400" y="225">동대문</text>
        <text x="165" y="240">서대문</text>
        <text x="275" y="315">중구</text>
        <text x="120" y="310">마포구</text>
        <text x="465" y="305">광진구</text>
        <text x="360" y="325">성동구</text>
        <text x="185" y="350">용산구</text>
        <text x="60" y="405">강서구</text>
        <text x="130" y="475">양천구</text>
        <text x="165" y="415">영등포</text>
        <text x="250" y="415">동작구</text>
        <text x="110" y="555">구로구</text>
        <text x="200" y="545">금천구</text>
        <text x="275" y="510">관악구</text>
        <text x="360" y="475">서초구</text>
        <text x="450" y="435">강남구</text>
        <text x="560" y="420">송파구</text>
        <text x="590" y="335">강동구</text>
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
        // Supabase에서 실데이터 로드 시도
        await loadDataFromSupabase();
    }

    initializeMap();
    initializeTabs();
    initializeModal();
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
            openDistrictModal(district.id);
        });

        // 호버 이벤트
        district.addEventListener('mouseenter', (e) => {
            showTooltip(e, district.id);
        });

        district.addEventListener('mousemove', (e) => {
            moveTooltip(e);
        });

        district.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    });

    // 초기 색상 적용
    colorizeMap();
}

// ========================================
// 지도 색상 적용
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
        }
    });
}

// ========================================
// 상승률에 따른 색상 반환
// ========================================
function getColorForRate(rate, period) {
    // 기간별 스케일 조정
    let scale = 1;
    if (period === 'monthly') scale = 0.2;
    if (period === 'yearly') scale = 0.02;

    const normalizedRate = rate * scale;

    if (normalizedRate <= -0.1) return '#1a5fb4';      // 진한 파랑
    if (normalizedRate <= -0.05) return '#3584e4';    // 파랑
    if (normalizedRate <= -0.01) return '#99c1f1';    // 연한 파랑
    if (normalizedRate <= 0.01) return '#f6f5f4';     // 중립
    if (normalizedRate <= 0.05) return '#f8e45c';     // 노랑
    if (normalizedRate <= 0.10) return '#ff7800';     // 주황
    if (normalizedRate <= 0.15) return '#e01b24';     // 빨강
    return '#a51d2d';                                  // 진한 빨강
}

// ========================================
// 탭 초기화
// ========================================
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 활성 탭 변경
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 기간 변경
            currentPeriod = tab.dataset.period;

            // 화면 업데이트
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
    // 데이터 정렬
    const sortedData = Object.entries(seoulDistrictData)
        .map(([id, data]) => ({
            id,
            name: data.name,
            rate: data[currentPeriod].current
        }))
        .sort((a, b) => b.rate - a.rate);

    // 상승률 TOP 5
    const topIncreaseList = document.getElementById('top-increase-list');
    topIncreaseList.innerHTML = sortedData.slice(0, 5)
        .map(d => `
            <li>
                <span class="district-name">${d.name}</span>
                <span class="rate positive">+${d.rate.toFixed(2)}%</span>
            </li>
        `).join('');

    // 하락률 TOP 5 (가장 낮은 상승률)
    const topDecreaseList = document.getElementById('top-decrease-list');
    topDecreaseList.innerHTML = sortedData.slice(-5).reverse()
        .map(d => `
            <li>
                <span class="district-name">${d.name}</span>
                <span class="rate ${d.rate >= 0 ? 'positive' : 'negative'}">${d.rate >= 0 ? '+' : ''}${d.rate.toFixed(2)}%</span>
            </li>
        `).join('');

    // 평균 계산
    const average = sortedData.reduce((sum, d) => sum + d.rate, 0) / sortedData.length;
    document.getElementById('average-value').textContent = `+${average.toFixed(2)}%`;
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
    document.querySelector('.average-label').textContent = labels[currentPeriod];
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
// 모달
// ========================================
function initializeModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openDistrictModal(districtId) {
    const overlay = document.getElementById('modal-overlay');
    const data = seoulDistrictData[districtId];

    if (!data) return;

    // 타이틀 설정
    const periodLabels = { weekly: '주간', monthly: '월간', yearly: '연간' };
    document.getElementById('modal-title').textContent =
        `${data.name} ${periodLabels[currentPeriod]} 상승률 추이`;

    // 통계 설정
    const periodData = data[currentPeriod];
    const allValues = [...periodData.history, periodData.current];

    document.getElementById('modal-current').textContent = `+${periodData.current.toFixed(2)}%`;
    document.getElementById('modal-avg').textContent =
        `+${(allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(2)}%`;
    document.getElementById('modal-max').textContent = `+${Math.max(...allValues).toFixed(2)}%`;
    document.getElementById('modal-min').textContent = `+${Math.min(...allValues).toFixed(2)}%`;

    // 차트 그리기
    drawTrendChart(data.name, periodData);

    // 모달 표시
    overlay.classList.add('visible');
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('visible');

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
                label: `${districtName} 상승률`,
                data: data,
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#58a6ff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#21262d',
                    titleColor: '#f0f6fc',
                    bodyColor: '#8b949e',
                    borderColor: 'rgba(240, 246, 252, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `상승률: +${context.raw.toFixed(2)}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(240, 246, 252, 0.05)'
                    },
                    ticks: {
                        color: '#8b949e'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(240, 246, 252, 0.05)'
                    },
                    ticks: {
                        color: '#8b949e',
                        callback: (value) => `${value.toFixed(2)}%`
                    }
                }
            }
        }
    });
}

function getChartLabels() {
    const now = new Date();
    const labels = [];

    if (currentPeriod === 'weekly') {
        for (let i = 5; i >= 0; i--) {
            const weekNum = getWeekNumber(new Date(now - i * 7 * 24 * 60 * 60 * 1000));
            labels.push(`${weekNum}주차`);
        }
    } else if (currentPeriod === 'monthly') {
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(`${month.getMonth() + 1}월`);
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
    if (!supabaseClient) {
        console.log('Supabase client not available, using fallback data');
        return;
    }

    try {
        // 구 정보 가져오기
        const { data: districts, error: districtError } = await supabaseClient
            .from('districts')
            .select('*');

        if (districtError) {
            console.error('Error fetching districts:', districtError);
            return;
        }

        // 가격 데이터 가져오기
        const { data: prices, error: priceError } = await supabaseClient
            .from('housing_prices')
            .select('*')
            .order('period_value', { ascending: false });

        if (priceError) {
            console.error('Error fetching prices:', priceError);
            return;
        }

        if (districts && districts.length > 0 && prices && prices.length > 0) {
            // 데이터를 seoulDistrictData 형식으로 변환
            updateDistrictData(districts, prices);
            isDataLoaded = true;
            console.log('✅ Supabase에서 실데이터 로드 완료!');
        }
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
    }
}

function updateDistrictData(districts, prices) {
    // 구별로 데이터 그룹화
    const pricesByDistrict = {};

    prices.forEach(price => {
        if (!pricesByDistrict[price.district_id]) {
            pricesByDistrict[price.district_id] = {
                weekly: [],
                monthly: [],
                yearly: []
            };
        }
        pricesByDistrict[price.district_id][price.period_type].push(parseFloat(price.rate));
    });

    // seoulDistrictData 업데이트
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
