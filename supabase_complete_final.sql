-- ========================================
-- 롤BTI 서비스 Supabase 완전 설정 스크립트
-- 전체를 복사해서 Supabase SQL Editor에 붙여넣기하세요!
-- ========================================

-- 기존 테이블 삭제 (깨끗하게 시작)
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
-- 1. 사용자 세션 테이블
-- ========================================
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- ========================================
-- 2. 사용자 답변 테이블
-- ========================================
CREATE TABLE user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  axis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 사용자 결과 테이블
-- ========================================
CREATE TABLE user_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  result_type TEXT NOT NULL,
  result_title TEXT NOT NULL,
  axis_scores JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. 사용자 행동 추적 테이블
-- ========================================
CREATE TABLE user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. 전체 통계 테이블
-- ========================================
CREATE TABLE overall_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_participants INTEGER DEFAULT 0,
  total_tests_completed INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_restarts INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. 축별 통계 테이블
-- ========================================
CREATE TABLE axis_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  axis_name TEXT NOT NULL,
  left_score INTEGER DEFAULT 0,
  right_score INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 외래키 제약조건 추가
-- ========================================
ALTER TABLE user_answers 
ADD CONSTRAINT fk_user_answers_session 
FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE;

ALTER TABLE user_results 
ADD CONSTRAINT fk_user_results_session 
FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE;

ALTER TABLE user_actions 
ADD CONSTRAINT fk_user_actions_session 
FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE;

-- ========================================
-- 인덱스 생성
-- ========================================
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_completed ON user_sessions(completed);
CREATE INDEX idx_user_answers_session_id ON user_answers(session_id);
CREATE INDEX idx_user_answers_question_index ON user_answers(question_index);
CREATE INDEX idx_user_results_session_id ON user_results(session_id);
CREATE INDEX idx_user_results_result_type ON user_results(result_type);
CREATE INDEX idx_user_actions_session_id ON user_actions(session_id);
CREATE INDEX idx_user_actions_action_type ON user_actions(action_type);

-- ========================================
-- 초기 데이터 삽입
-- ========================================
INSERT INTO overall_stats (id, total_participants, total_tests_completed, total_shares, total_restarts)
VALUES (1, 0, 0, 0, 0);

INSERT INTO axis_statistics (axis_name, left_score, right_score, total_votes) VALUES
('E/I', 0, 0, 0),
('G/C', 0, 0, 0),
('P/S', 0, 0, 0),
('T/M', 0, 0, 0);

-- ========================================
-- RLS (Row Level Security) 정책 설정
-- ========================================
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis_statistics ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 대한 정책 생성 (익명 사용자도 모든 작업 가능)
CREATE POLICY "Enable insert for all users" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON user_sessions FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON user_sessions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON user_sessions FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON user_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON user_answers FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON user_answers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON user_answers FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON user_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON user_results FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON user_results FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON user_results FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON user_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON user_actions FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON user_actions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON user_actions FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON overall_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON overall_stats FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON overall_stats FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON overall_stats FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON axis_statistics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON axis_statistics FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON axis_statistics FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON axis_statistics FOR DELETE USING (true);

-- ========================================
-- 함수 생성
-- ========================================
-- 테스트 완료 시 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_test_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 전체 통계 업데이트
  UPDATE overall_stats 
  SET 
    total_participants = total_participants + 1,
    total_tests_completed = total_tests_completed + 1,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 행동 추적 시 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_action_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action_type = 'share_clicked' THEN
    UPDATE overall_stats 
    SET total_shares = total_shares + 1, updated_at = NOW()
    WHERE id = 1;
  ELSIF NEW.action_type = 'restart_clicked' THEN
    UPDATE overall_stats 
    SET total_restarts = total_restarts + 1, updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 참여자 수 증가 함수 (RPC)
CREATE OR REPLACE FUNCTION increment_participant_count_safe()
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- 현재 참여자 수 가져오기
  SELECT total_participants INTO current_count 
  FROM overall_stats 
  WHERE id = 1;
  
  -- 참여자 수 증가
  UPDATE overall_stats 
  SET 
    total_participants = COALESCE(current_count, 0) + 1,
    updated_at = NOW()
  WHERE id = 1;
  
  -- 새로운 값 반환
  RETURN COALESCE(current_count, 0) + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 트리거 생성
-- ========================================
-- 테스트 완료 시 통계 업데이트 트리거
CREATE TRIGGER trigger_update_test_completion_stats
  AFTER UPDATE OF completed ON user_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION update_test_completion_stats();

-- 행동 추적 시 통계 업데이트 트리거
CREATE TRIGGER trigger_update_action_stats
  AFTER INSERT ON user_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_action_stats();

-- ========================================
-- 완료 메시지
-- ========================================
SELECT '✅ 롤BTI Supabase 설정이 완료되었습니다!' as status;
SELECT '📊 테이블 생성 완료' as table_status;
SELECT '🔐 RLS 정책 설정 완료' as rls_status;
SELECT '⚡ 함수 및 트리거 생성 완료' as function_status;
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

SELECT '🎯 트리거 확인:' as info;
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table; 