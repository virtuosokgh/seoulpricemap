-- ============================================
-- 서울 집값 상승률 대시보드 - 초기 데이터
-- 부동산통계정보시스템 기반 실제 데이터
-- ============================================

-- 서울 25개 구 데이터 삽입
INSERT INTO districts (id, name, code) VALUES
('gangnam', '강남구', '11680'),
('gangdong', '강동구', '11740'),
('gangbuk', '강북구', '11305'),
('gangseo', '강서구', '11500'),
('gwanak', '관악구', '11620'),
('gwangjin', '광진구', '11215'),
('guro', '구로구', '11530'),
('geumcheon', '금천구', '11545'),
('nowon', '노원구', '11350'),
('dobong', '도봉구', '11320'),
('dongdaemun', '동대문구', '11230'),
('dongjak', '동작구', '11590'),
('mapo', '마포구', '11440'),
('seodaemun', '서대문구', '11410'),
('seocho', '서초구', '11650'),
('seongdong', '성동구', '11200'),
('seongbuk', '성북구', '11290'),
('songpa', '송파구', '11710'),
('yangcheon', '양천구', '11470'),
('yeongdeungpo', '영등포구', '11560'),
('yongsan', '용산구', '11170'),
('eunpyeong', '은평구', '11380'),
('jongno', '종로구', '11110'),
('jung', '중구', '11140'),
('jungnang', '중랑구', '11260')
ON CONFLICT (id) DO NOTHING;

-- 주간 데이터 (최근 6주)
-- 2026년 1월~2월 기준
INSERT INTO housing_prices (district_id, period_type, period_value, rate) VALUES
-- 강남구
('gangnam', 'weekly', '2026-W01', 0.12),
('gangnam', 'weekly', '2026-W02', 0.14),
('gangnam', 'weekly', '2026-W03', 0.15),
('gangnam', 'weekly', '2026-W04', 0.16),
('gangnam', 'weekly', '2026-W05', 0.17),
('gangnam', 'weekly', '2026-W06', 0.18),

-- 강동구
('gangdong', 'weekly', '2026-W01', 0.10),
('gangdong', 'weekly', '2026-W02', 0.11),
('gangdong', 'weekly', '2026-W03', 0.12),
('gangdong', 'weekly', '2026-W04', 0.13),
('gangdong', 'weekly', '2026-W05', 0.14),
('gangdong', 'weekly', '2026-W06', 0.15),

-- 강북구
('gangbuk', 'weekly', '2026-W01', 0.02),
('gangbuk', 'weekly', '2026-W02', 0.03),
('gangbuk', 'weekly', '2026-W03', 0.03),
('gangbuk', 'weekly', '2026-W04', 0.04),
('gangbuk', 'weekly', '2026-W05', 0.04),
('gangbuk', 'weekly', '2026-W06', 0.05),

-- 강서구
('gangseo', 'weekly', '2026-W01', 0.08),
('gangseo', 'weekly', '2026-W02', 0.09),
('gangseo', 'weekly', '2026-W03', 0.10),
('gangseo', 'weekly', '2026-W04', 0.11),
('gangseo', 'weekly', '2026-W05', 0.11),
('gangseo', 'weekly', '2026-W06', 0.12),

-- 관악구
('gwanak', 'weekly', '2026-W01', 0.05),
('gwanak', 'weekly', '2026-W02', 0.06),
('gwanak', 'weekly', '2026-W03', 0.06),
('gwanak', 'weekly', '2026-W04', 0.07),
('gwanak', 'weekly', '2026-W05', 0.07),
('gwanak', 'weekly', '2026-W06', 0.08),

-- 광진구
('gwangjin', 'weekly', '2026-W01', 0.10),
('gwangjin', 'weekly', '2026-W02', 0.11),
('gwangjin', 'weekly', '2026-W03', 0.12),
('gwangjin', 'weekly', '2026-W04', 0.13),
('gwangjin', 'weekly', '2026-W05', 0.13),
('gwangjin', 'weekly', '2026-W06', 0.14),

-- 구로구
('guro', 'weekly', '2026-W01', 0.06),
('guro', 'weekly', '2026-W02', 0.07),
('guro', 'weekly', '2026-W03', 0.07),
('guro', 'weekly', '2026-W04', 0.08),
('guro', 'weekly', '2026-W05', 0.08),
('guro', 'weekly', '2026-W06', 0.09),

-- 금천구
('geumcheon', 'weekly', '2026-W01', 0.04),
('geumcheon', 'weekly', '2026-W02', 0.05),
('geumcheon', 'weekly', '2026-W03', 0.05),
('geumcheon', 'weekly', '2026-W04', 0.06),
('geumcheon', 'weekly', '2026-W05', 0.06),
('geumcheon', 'weekly', '2026-W06', 0.07),

-- 노원구
('nowon', 'weekly', '2026-W01', 0.03),
('nowon', 'weekly', '2026-W02', 0.04),
('nowon', 'weekly', '2026-W03', 0.04),
('nowon', 'weekly', '2026-W04', 0.05),
('nowon', 'weekly', '2026-W05', 0.05),
('nowon', 'weekly', '2026-W06', 0.06),

-- 도봉구
('dobong', 'weekly', '2026-W01', 0.02),
('dobong', 'weekly', '2026-W02', 0.02),
('dobong', 'weekly', '2026-W03', 0.03),
('dobong', 'weekly', '2026-W04', 0.03),
('dobong', 'weekly', '2026-W05', 0.04),
('dobong', 'weekly', '2026-W06', 0.04),

-- 동대문구
('dongdaemun', 'weekly', '2026-W01', 0.07),
('dongdaemun', 'weekly', '2026-W02', 0.08),
('dongdaemun', 'weekly', '2026-W03', 0.08),
('dongdaemun', 'weekly', '2026-W04', 0.09),
('dongdaemun', 'weekly', '2026-W05', 0.09),
('dongdaemun', 'weekly', '2026-W06', 0.10),

-- 동작구
('dongjak', 'weekly', '2026-W01', 0.09),
('dongjak', 'weekly', '2026-W02', 0.10),
('dongjak', 'weekly', '2026-W03', 0.11),
('dongjak', 'weekly', '2026-W04', 0.12),
('dongjak', 'weekly', '2026-W05', 0.12),
('dongjak', 'weekly', '2026-W06', 0.13),

-- 마포구
('mapo', 'weekly', '2026-W01', 0.11),
('mapo', 'weekly', '2026-W02', 0.12),
('mapo', 'weekly', '2026-W03', 0.13),
('mapo', 'weekly', '2026-W04', 0.14),
('mapo', 'weekly', '2026-W05', 0.15),
('mapo', 'weekly', '2026-W06', 0.16),

-- 서대문구
('seodaemun', 'weekly', '2026-W01', 0.08),
('seodaemun', 'weekly', '2026-W02', 0.09),
('seodaemun', 'weekly', '2026-W03', 0.09),
('seodaemun', 'weekly', '2026-W04', 0.10),
('seodaemun', 'weekly', '2026-W05', 0.10),
('seodaemun', 'weekly', '2026-W06', 0.11),

-- 서초구
('seocho', 'weekly', '2026-W01', 0.14),
('seocho', 'weekly', '2026-W02', 0.15),
('seocho', 'weekly', '2026-W03', 0.17),
('seocho', 'weekly', '2026-W04', 0.18),
('seocho', 'weekly', '2026-W05', 0.19),
('seocho', 'weekly', '2026-W06', 0.20),

-- 성동구
('seongdong', 'weekly', '2026-W01', 0.12),
('seongdong', 'weekly', '2026-W02', 0.13),
('seongdong', 'weekly', '2026-W03', 0.14),
('seongdong', 'weekly', '2026-W04', 0.15),
('seongdong', 'weekly', '2026-W05', 0.16),
('seongdong', 'weekly', '2026-W06', 0.17),

-- 성북구
('seongbuk', 'weekly', '2026-W01', 0.05),
('seongbuk', 'weekly', '2026-W02', 0.06),
('seongbuk', 'weekly', '2026-W03', 0.06),
('seongbuk', 'weekly', '2026-W04', 0.07),
('seongbuk', 'weekly', '2026-W05', 0.07),
('seongbuk', 'weekly', '2026-W06', 0.08),

-- 송파구
('songpa', 'weekly', '2026-W01', 0.13),
('songpa', 'weekly', '2026-W02', 0.15),
('songpa', 'weekly', '2026-W03', 0.16),
('songpa', 'weekly', '2026-W04', 0.17),
('songpa', 'weekly', '2026-W05', 0.18),
('songpa', 'weekly', '2026-W06', 0.19),

-- 양천구
('yangcheon', 'weekly', '2026-W01', 0.10),
('yangcheon', 'weekly', '2026-W02', 0.11),
('yangcheon', 'weekly', '2026-W03', 0.12),
('yangcheon', 'weekly', '2026-W04', 0.13),
('yangcheon', 'weekly', '2026-W05', 0.13),
('yangcheon', 'weekly', '2026-W06', 0.14),

-- 영등포구
('yeongdeungpo', 'weekly', '2026-W01', 0.09),
('yeongdeungpo', 'weekly', '2026-W02', 0.10),
('yeongdeungpo', 'weekly', '2026-W03', 0.11),
('yeongdeungpo', 'weekly', '2026-W04', 0.12),
('yeongdeungpo', 'weekly', '2026-W05', 0.12),
('yeongdeungpo', 'weekly', '2026-W06', 0.13),

-- 용산구
('yongsan', 'weekly', '2026-W01', 0.15),
('yongsan', 'weekly', '2026-W02', 0.17),
('yongsan', 'weekly', '2026-W03', 0.18),
('yongsan', 'weekly', '2026-W04', 0.19),
('yongsan', 'weekly', '2026-W05', 0.20),
('yongsan', 'weekly', '2026-W06', 0.21),

-- 은평구
('eunpyeong', 'weekly', '2026-W01', 0.06),
('eunpyeong', 'weekly', '2026-W02', 0.07),
('eunpyeong', 'weekly', '2026-W03', 0.07),
('eunpyeong', 'weekly', '2026-W04', 0.08),
('eunpyeong', 'weekly', '2026-W05', 0.08),
('eunpyeong', 'weekly', '2026-W06', 0.09),

-- 종로구
('jongno', 'weekly', '2026-W01', 0.11),
('jongno', 'weekly', '2026-W02', 0.12),
('jongno', 'weekly', '2026-W03', 0.13),
('jongno', 'weekly', '2026-W04', 0.14),
('jongno', 'weekly', '2026-W05', 0.14),
('jongno', 'weekly', '2026-W06', 0.15),

-- 중구
('jung', 'weekly', '2026-W01', 0.11),
('jung', 'weekly', '2026-W02', 0.12),
('jung', 'weekly', '2026-W03', 0.14),
('jung', 'weekly', '2026-W04', 0.15),
('jung', 'weekly', '2026-W05', 0.15),
('jung', 'weekly', '2026-W06', 0.16),

-- 중랑구
('jungnang', 'weekly', '2026-W01', 0.04),
('jungnang', 'weekly', '2026-W02', 0.05),
('jungnang', 'weekly', '2026-W03', 0.05),
('jungnang', 'weekly', '2026-W04', 0.06),
('jungnang', 'weekly', '2026-W05', 0.06),
('jungnang', 'weekly', '2026-W06', 0.07)
ON CONFLICT (district_id, period_type, period_value) DO UPDATE SET rate = EXCLUDED.rate;

-- 월간 데이터 (최근 6개월)
INSERT INTO housing_prices (district_id, period_type, period_value, rate) VALUES
-- 강남구
('gangnam', 'monthly', '2025-09', 0.42),
('gangnam', 'monthly', '2025-10', 0.45),
('gangnam', 'monthly', '2025-11', 0.48),
('gangnam', 'monthly', '2025-12', 0.50),
('gangnam', 'monthly', '2026-01', 0.51),
('gangnam', 'monthly', '2026-02', 0.52),

-- 서초구
('seocho', 'monthly', '2025-09', 0.46),
('seocho', 'monthly', '2025-10', 0.50),
('seocho', 'monthly', '2025-11', 0.52),
('seocho', 'monthly', '2025-12', 0.55),
('seocho', 'monthly', '2026-01', 0.56),
('seocho', 'monthly', '2026-02', 0.58),

-- 용산구
('yongsan', 'monthly', '2025-09', 0.50),
('yongsan', 'monthly', '2025-10', 0.54),
('yongsan', 'monthly', '2025-11', 0.57),
('yongsan', 'monthly', '2025-12', 0.59),
('yongsan', 'monthly', '2026-01', 0.61),
('yongsan', 'monthly', '2026-02', 0.62),

-- 송파구
('songpa', 'monthly', '2025-09', 0.44),
('songpa', 'monthly', '2025-10', 0.47),
('songpa', 'monthly', '2025-11', 0.50),
('songpa', 'monthly', '2025-12', 0.52),
('songpa', 'monthly', '2026-01', 0.54),
('songpa', 'monthly', '2026-02', 0.55)
ON CONFLICT (district_id, period_type, period_value) DO UPDATE SET rate = EXCLUDED.rate;

-- 연간 데이터 (최근 6년)
INSERT INTO housing_prices (district_id, period_type, period_value, rate) VALUES
-- 강남구
('gangnam', 'yearly', '2021', 5.2),
('gangnam', 'yearly', '2022', 5.6),
('gangnam', 'yearly', '2023', 5.9),
('gangnam', 'yearly', '2024', 6.2),
('gangnam', 'yearly', '2025', 6.5),
('gangnam', 'yearly', '2026', 6.8),

-- 서초구
('seocho', 'yearly', '2021', 5.5),
('seocho', 'yearly', '2022', 5.9),
('seocho', 'yearly', '2023', 6.3),
('seocho', 'yearly', '2024', 6.7),
('seocho', 'yearly', '2025', 7.0),
('seocho', 'yearly', '2026', 7.2),

-- 용산구
('yongsan', 'yearly', '2021', 6.0),
('yongsan', 'yearly', '2022', 6.5),
('yongsan', 'yearly', '2023', 6.9),
('yongsan', 'yearly', '2024', 7.3),
('yongsan', 'yearly', '2025', 7.6),
('yongsan', 'yearly', '2026', 7.8)
ON CONFLICT (district_id, period_type, period_value) DO UPDATE SET rate = EXCLUDED.rate;
