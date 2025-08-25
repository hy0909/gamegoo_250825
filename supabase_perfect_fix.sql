-- ========================================
-- 롤BTI 서비스 데이터베이스 스키마 (완벽 수정 버전)
-- ========================================

-- 1. 기존 테이블 및 함수 정리
DROP TRIGGER IF EXISTS auto_increment_participant ON user_test_results;
DROP FUNCTION IF EXISTS increment_participant_count();
DROP FUNCTION IF EXISTS increment_participant_count_safe(INTEGER);
DROP TABLE IF EXISTS participant_count CASCADE;

-- 2. 사용자 테스트 결과 테이블 (기존 유지)
CREATE TABLE IF NOT EXISTS user_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result_type TEXT NOT NULL,
  result_title TEXT NOT NULL,
  answers JSONB NOT NULL,
  share_button_clicked BOOLEAN DEFAULT FALSE,
  test_restarted BOOLEAN DEFAULT FALSE,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_address INET
);

-- 3. 페이지 방문 로그 테이블 (기존 유지)
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_type TEXT NOT NULL,
  question_number INTEGER,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_address INET
);

-- 4. 참여자 수 추적 테이블 (완벽 수정)
CREATE TABLE participant_count (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_test_results_session_id ON user_test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_user_test_results_result_type ON user_test_results(result_type);
CREATE INDEX IF NOT EXISTS idx_user_test_results_created_at ON user_test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_type ON page_visits(page_type);

-- 6. 참여자 수 자동 증가 함수 (트리거용 - 완벽 수정)
CREATE OR REPLACE FUNCTION increment_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- participant_count 테이블에 id=1인 레코드가 없으면 생성
  INSERT INTO participant_count (id, total_count, updated_at)
  VALUES (1, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET 
    total_count = participant_count.total_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 안전한 참여자 수 증가 함수 (RPC용 - 완벽 수정)
CREATE OR REPLACE FUNCTION increment_participant_count_safe()
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- participant_count 테이블에 id=1인 레코드가 없으면 생성
  INSERT INTO participant_count (id, total_count, updated_at)
  VALUES (1, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET 
    total_count = participant_count.total_count + 1,
    updated_at = NOW()
  RETURNING total_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 생성 (완벽 수정)
CREATE TRIGGER auto_increment_participant
  AFTER INSERT ON user_test_results
  FOR EACH ROW
  EXECUTE FUNCTION increment_participant_count();

-- 9. 초기 데이터 삽입 (완벽 수정)
INSERT INTO participant_count (id, total_count, created_at, updated_at) 
VALUES (1, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  total_count = EXCLUDED.total_count,
  updated_at = NOW();

-- 10. 기존 user_test_results 데이터를 participant_count에 반영
UPDATE participant_count 
SET total_count = (SELECT COUNT(*) FROM user_test_results), 
    updated_at = NOW()
WHERE id = 1;

-- ========================================
-- 실행 완료 확인 쿼리
-- ========================================

-- 테이블 생성 확인
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'user_test_results' THEN '사용자 테스트 결과'
    WHEN table_name = 'page_visits' THEN '페이지 방문 로그'
    WHEN table_name = 'participant_count' THEN '참여자 수 추적'
  END as description,
  '생성됨' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_test_results', 'page_visits', 'participant_count');

-- 함수 생성 확인
SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'increment_participant_count' THEN '기본 참여자 수 자동 증가 함수 (트리거용)'
    WHEN proname = 'increment_participant_count_safe' THEN '안전한 참여자 수 증가 함수 (RPC용)'
  END as description,
  '생성됨' as status
FROM pg_proc 
WHERE proname IN ('increment_participant_count', 'increment_participant_count_safe');

-- 트리거 생성 확인
SELECT 
  tgname as trigger_name,
  '참여자 수 자동 증가 트리거' as description,
  '생성됨' as status
FROM pg_trigger 
WHERE tgname = 'auto_increment_participant';

-- 초기 데이터 확인
SELECT 
  total_count as "현재 참여자 수",
  created_at as "생성 시간",
  updated_at as "마지막 업데이트",
  '설정됨' as status
FROM participant_count;

-- 테스트: 새로운 레코드 삽입 시 자동 증가 확인
-- INSERT INTO user_test_results (session_id, result_type, result_title, answers) 
-- VALUES ('test_session', 'TEST', '테스트 결과', '[]');
-- 
-- SELECT total_count as "테스트 후 참여자 수" FROM participant_count WHERE id = 1; 