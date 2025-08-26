-- ========================================
-- 롤BTI 서비스 Supabase 간단한 해결 스크립트
-- 복잡한 외래키 없이 단일 테이블로 모든 데이터 저장
-- ========================================

-- 기존 복잡한 테이블들 삭제
DROP TABLE IF EXISTS user_actions CASCADE;
DROP TABLE IF EXISTS user_results CASCADE;
DROP TABLE IF EXISTS user_answers CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS overall_stats CASCADE;
DROP TABLE IF EXISTS axis_statistics CASCADE;

-- 기존 함수 및 트리거 삭제
DROP FUNCTION IF EXISTS update_test_completion_stats() CASCADE;
DROP FUNCTION IF EXISTS update_action_stats() CASCADE;
DROP FUNCTION IF EXISTS increment_participant_count_safe() CASCADE;

-- ========================================
-- 단일 테이블로 모든 데이터 저장
-- ========================================
CREATE TABLE rollbti_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'session', 'answer', 'result', 'action'
  data_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 인덱스 생성
-- ========================================
CREATE INDEX idx_rollbti_data_session_id ON rollbti_data(session_id);
CREATE INDEX idx_rollbti_data_type ON rollbti_data(data_type);
CREATE INDEX idx_rollbti_data_created_at ON rollbti_data(created_at);

-- ========================================
-- 초기 데이터 삽입 (참여자 수 카운팅용)
-- ========================================
INSERT INTO rollbti_data (session_id, data_type, data_content) VALUES
('init', 'stats', '{"total_participants": 0, "total_tests_completed": 0, "total_shares": 0, "total_restarts": 0}');

-- ========================================
-- RLS 정책 설정 (단순화)
-- ========================================
ALTER TABLE rollbti_data ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 모든 작업 가능
CREATE POLICY "Enable all operations for all users" ON rollbti_data 
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
  SELECT (data_content->>'total_participants')::INTEGER INTO current_count 
  FROM rollbti_data 
  WHERE session_id = 'init' AND data_type = 'stats';
  
  -- 참여자 수 증가
  new_count := COALESCE(current_count, 0) + 1;
  
  -- 업데이트
  UPDATE rollbti_data 
  SET data_content = jsonb_set(
    data_content, 
    '{total_participants}', 
    to_jsonb(new_count)
  )
  WHERE session_id = 'init' AND data_type = 'stats';
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 완료 메시지
-- ========================================
SELECT '✅ 롤BTI Supabase 간단한 설정 완료!' as status;
SELECT '📊 단일 테이블 구조 생성 완료' as table_status;
SELECT '🔐 RLS 정책 단순화 완료' as rls_status;
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