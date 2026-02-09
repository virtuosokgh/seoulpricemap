-- ============================================
-- 서울 집값 상승률 대시보드 - 데이터베이스 스키마
-- Supabase PostgreSQL
-- ============================================

-- 서울 25개 구 테이블
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주택가격 상승률 테이블
CREATE TABLE IF NOT EXISTS housing_prices (
    id SERIAL PRIMARY KEY,
    district_id TEXT NOT NULL REFERENCES districts(id),
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
    period_value TEXT NOT NULL, -- e.g., "2026-W06", "2026-02", "2026"
    rate DECIMAL(5, 2) NOT NULL, -- 상승률 (예: 0.15 = 0.15%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(district_id, period_type, period_value)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_housing_prices_district ON housing_prices(district_id);
CREATE INDEX IF NOT EXISTS idx_housing_prices_period ON housing_prices(period_type, period_value);
CREATE INDEX IF NOT EXISTS idx_housing_prices_created ON housing_prices(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_prices ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Allow public read access on districts"
    ON districts FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on housing_prices"
    ON housing_prices FOR SELECT
    USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_housing_prices_updated_at
    BEFORE UPDATE ON housing_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
