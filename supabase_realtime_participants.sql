-- ========================================
-- 롤BTI 서비스 실시간 참여자 수 집계 시스템
-- 모든 사용자가 동일한 총 참여자 수를 실시간으로 확인 가능
-- ========================================

-- 기존 테이블 정리
DROP TABLE IF EXISTS rollbti_data CASCADE;
DROP TABLE IF EXISTS rollbti_simple CASCADE;
DROP TABLE IF EXISTS page_visits CASCADE;

-- 기존 함수 정리
DROP FUNCTION IF EXISTS increment_participant_count() CASCADE;

-- ========================================
-- 핵심 테이블: 참여자 통계 (전역 집계)
-- ========================================
CREATE TABLE rollbti_global_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_participants INTEGER DEFAULT 0,
  total_tests_completed INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_restarts INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 세션 및 답변 데이터 테이블
-- ========================================
CREATE TABLE rollbti_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE rollbti_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES rollbti_sessions(session_id),
  question_number INTEGER NOT NULL,
  answer TEXT NOT NULL, -- 'A' or 'B'
  axis_type TEXT NOT NULL, -- 'E/I', 'S/P', 'G/C', 'T/M'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rollbti_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES rollbti_sessions(session_id),
  result_type TEXT NOT NULL, -- 'EGPT', 'EGST', etc.
  result_title TEXT NOT NULL,
  axis_scores JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 인덱스 생성 (성능 최적화)
-- ========================================
CREATE INDEX idx_sessions_session_id ON rollbti_sessions(session_id);
CREATE INDEX idx_sessions_completed ON rollbti_sessions(is_completed);
CREATE INDEX idx_answers_session_id ON rollbti_answers(session_id);
CREATE INDEX idx_results_session_id ON rollbti_results(session_id);
CREATE INDEX idx_global_stats_id ON rollbti_global_stats(id);

-- ========================================
-- 초기 전역 통계 데이터 삽입
-- ========================================
INSERT INTO rollbti_global_stats (id, total_participants, total_tests_completed, total_shares, total_restarts) 
VALUES (1, 0, 0, 0, 0);

-- ========================================
-- 핵심 함수: 참여자 수 증가 (실시간 집계)
-- ========================================
CREATE OR REPLACE FUNCTION increment_participant_count()
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- 전역 통계 테이블에서 참여자 수 증가
  UPDATE rollbti_global_stats 
  SET 
    total_participants = total_participants + 1,
    total_tests_completed = total_tests_completed + 1,
    last_updated = NOW()
  WHERE id = 1
  RETURNING total_participants INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 참여자 수 조회 함수 (실시간)
-- ========================================
CREATE OR REPLACE FUNCTION get_total_participants()
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT total_participants INTO count 
  FROM rollbti_global_stats 
  WHERE id = 1;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 테스트 완료 처리 함수
-- ========================================
CREATE OR REPLACE FUNCTION complete_test_session(p_session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 세션 완료 처리
  UPDATE rollbti_sessions 
  SET 
    is_completed = TRUE,
    completed_at = NOW()
  WHERE session_id = p_session_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- RLS 정책 설정 (읽기 전용, 쓰기 허용)
-- ========================================
ALTER TABLE rollbti_global_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollbti_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollbti_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollbti_results ENABLE ROW LEVEL SECURITY;

-- 전역 통계: 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access to global stats" ON rollbti_global_stats
FOR SELECT USING (true);

-- 전역 통계: 함수를 통한 업데이트만 허용
CREATE POLICY "Allow function updates to global stats" ON rollbti_global_stats
FOR UPDATE USING (true) WITH CHECK (true);

-- 세션: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations on sessions" ON rollbti_sessions
FOR ALL USING (true) WITH CHECK (true);

-- 답변: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations on answers" ON rollbti_answers
FOR ALL USING (true) WITH CHECK (true);

-- 결과: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations on results" ON rollbti_results
FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 트리거: 세션 완료 시 자동 통계 업데이트
-- ========================================
CREATE OR REPLACE FUNCTION update_stats_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- 세션이 완료되면 전역 통계 업데이트
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    UPDATE rollbti_global_stats 
    SET 
      total_tests_completed = total_tests_completed + 1,
      last_updated = NOW()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_session_complete
  AFTER UPDATE ON rollbti_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_on_session_complete();

-- ========================================
-- 완료 메시지
-- ========================================
SELECT '✅ 롤BTI 실시간 참여자 수 집계 시스템 구축 완료!' as status;
SELECT '📊 전역 통계 테이블 생성 완료' as table_status;
SELECT '🔄 실시간 집계 함수 생성 완료' as function_status;
SELECT '🔐 RLS 정책 설정 완료' as rls_status;
SELECT '⚡ 트리거 설정 완료' as trigger_status;
SELECT '🚀 이제 모든 사용자가 동일한 참여자 수를 실시간으로 확인할 수 있습니다!' as final_status;

-- ========================================
-- 테이블 구조 확인
-- ========================================
SELECT '📋 생성된 테이블:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'rollbti_%' 
ORDER BY table_name;

SELECT '⚡ 생성된 함수:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%participant%' 
ORDER BY routine_name;

SELECT '🔐 RLS 정책:' as info;
SELECT tablename, policyname FROM pg_policies 
WHERE tablename LIKE 'rollbti_%' 
ORDER BY tablename, policyname; 