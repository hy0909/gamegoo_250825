-- ========================================
-- 롤BTI 서비스 - page_visits 테이블 활용
-- 기존 테이블을 활용하여 간단하게 구현
-- ========================================

-- page_visits 테이블에 RLS 활성화 (이미 존재하는 경우)
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 모든 작업 가능하도록 정책 생성
DROP POLICY IF EXISTS "Enable all operations for all users" ON page_visits;
CREATE POLICY "Enable all operations for all users" ON page_visits 
FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 간단한 통계 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS rollbti_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_participants INTEGER DEFAULT 0,
  total_tests_completed INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_restarts INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터 삽입 (테이블이 비어있는 경우)
INSERT INTO rollbti_stats (id, total_participants, total_tests_completed, total_shares, total_restarts)
VALUES (1, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 설정
ALTER TABLE rollbti_stats ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 모든 작업 가능
CREATE POLICY "Enable all operations for all users" ON rollbti_stats 
FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 간단한 함수 생성
-- ========================================
-- 참여자 수 증가 함수
CREATE OR REPLACE FUNCTION increment_participant_count()
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  new_count INTEGER;
BEGIN
  -- 현재 참여자 수 가져오기
  SELECT total_participants INTO current_count 
  FROM rollbti_stats 
  WHERE id = 1;
  
  -- 참여자 수 증가
  new_count := COALESCE(current_count, 0) + 1;
  
  -- 업데이트
  UPDATE rollbti_stats 
  SET 
    total_participants = new_count,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 완료 메시지
-- ========================================
SELECT '✅ 롤BTI page_visits 테이블 활용 설정 완료!' as status;
SELECT '📊 기존 테이블 활용 완료' as table_status;
SELECT '🔐 RLS 정책 설정 완료' as rls_status;
SELECT '⚡ 함수 생성 완료' as function_status;
SELECT '🚀 이제 롤BTI 서비스가 정상 작동합니다!' as final_status;

-- ========================================
-- 테이블 구조 확인
-- ========================================
SELECT '📋 테이블 목록:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT '🔐 RLS 정책 확인:' as info;
SELECT schemaname, tablename, policyname FROM pg_policies ORDER BY tablename, policyname;

SELECT '⚡ 함수 확인:' as info;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name; 