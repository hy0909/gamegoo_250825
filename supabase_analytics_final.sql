-- 롤BTI 사용자 행동 추적 및 분석을 위한 Supabase 스키마
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테스트 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE
);

-- 2. 사용자 선택지 답변 테이블
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL, -- 0-8 (9개 질문)
  answer TEXT NOT NULL CHECK (answer IN ('A', 'B')),
  axis TEXT NOT NULL CHECK (axis IN ('E/I', 'G/C', 'P/S', 'T/M')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 결과 유형 테이블
CREATE TABLE IF NOT EXISTS user_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  result_type TEXT NOT NULL, -- 예: EGPT, ICST 등
  result_title TEXT NOT NULL, -- 예: "용감한 팀파이터"
  axis_scores JSONB NOT NULL, -- 4축 점수 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 행동 추적 테이블
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('test_completed', 'restart_clicked', 'share_clicked')),
  action_data JSONB, -- 추가 데이터 (예: 공유 링크, 재시작 횟수 등)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 전체 통계 테이블 (실시간 집계용)
CREATE TABLE IF NOT EXISTS overall_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_participants INTEGER DEFAULT 0,
  total_tests_completed INTEGER DEFAULT 0,
  total_restarts INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 축별 통계 테이블
CREATE TABLE IF NOT EXISTS axis_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  axis TEXT NOT NULL CHECK (axis IN ('E/I', 'G/C', 'P/S', 'T/M')),
  left_score INTEGER DEFAULT 0, -- E, G, P, T
  right_score INTEGER DEFAULT 0, -- I, C, S, M
  total_answers INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON user_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_user_results_session_id ON user_results(session_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_session_id ON user_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_axis ON user_answers(axis);
CREATE INDEX IF NOT EXISTS idx_user_results_result_type ON user_results(result_type);

-- 초기 데이터 삽입
INSERT INTO overall_stats (id, total_participants, total_tests_completed, total_restarts, total_shares)
VALUES (1, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO axis_statistics (axis, left_score, right_score, total_answers) VALUES
  ('E/I', 0, 0, 0),
  ('G/C', 0, 0, 0),
  ('P/S', 0, 0, 0),
  ('T/M', 0, 0, 0)
ON CONFLICT DO NOTHING;

-- 함수: 테스트 완료 시 통계 업데이트
CREATE OR REPLACE FUNCTION update_test_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 전체 통계 업데이트
  UPDATE overall_stats 
  SET 
    total_participants = total_participants + 1,
    total_tests_completed = total_tests_completed + 1,
    last_updated = NOW()
  WHERE id = 1;
  
  -- 축별 통계 업데이트 (JSONB에서 점수 추출)
  UPDATE axis_statistics 
  SET 
    left_score = left_score + COALESCE((NEW.axis_scores->>'E')::INTEGER, 0) + 
                                   COALESCE((NEW.axis_scores->>'G')::INTEGER, 0) + 
                                   COALESCE((NEW.axis_scores->>'P')::INTEGER, 0) + 
                                   COALESCE((NEW.axis_scores->>'T')::INTEGER, 0),
    right_score = right_score + COALESCE((NEW.axis_scores->>'I')::INTEGER, 0) + 
                                    COALESCE((NEW.axis_scores->>'C')::INTEGER, 0) + 
                                    COALESCE((NEW.axis_scores->>'S')::INTEGER, 0) + 
                                    COALESCE((NEW.axis_scores->>'M')::INTEGER, 0),
    total_answers = total_answers + 9,
    last_updated = NOW()
  WHERE axis = 'E/I';
  
  UPDATE axis_statistics 
  SET 
    left_score = left_score + COALESCE((NEW.axis_scores->>'G')::INTEGER, 0),
    right_score = right_score + COALESCE((NEW.axis_scores->>'C')::INTEGER, 0),
    total_answers = total_answers + 2,
    last_updated = NOW()
  WHERE axis = 'G/C';
  
  UPDATE axis_statistics 
  SET 
    left_score = left_score + COALESCE((NEW.axis_scores->>'P')::INTEGER, 0),
    right_score = right_score + COALESCE((NEW.axis_scores->>'S')::INTEGER, 0),
    total_answers = total_answers + 2,
    last_updated = NOW()
  WHERE axis = 'P/S';
  
  UPDATE axis_statistics 
  SET 
    left_score = left_score + COALESCE((NEW.axis_scores->>'T')::INTEGER, 0),
    right_score = right_score + COALESCE((NEW.axis_scores->>'M')::INTEGER, 0),
    total_answers = total_answers + 2,
    last_updated = NOW()
  WHERE axis = 'T/M';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 결과 생성 시 통계 자동 업데이트
DROP TRIGGER IF EXISTS trigger_update_test_stats ON user_results;
CREATE TRIGGER trigger_update_test_stats
  AFTER INSERT ON user_results
  FOR EACH ROW
  EXECUTE FUNCTION update_test_completion_stats();

-- 함수: 행동 추적 시 통계 업데이트
CREATE OR REPLACE FUNCTION update_action_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action_type = 'restart_clicked' THEN
    UPDATE overall_stats 
    SET total_restarts = total_restarts + 1, last_updated = NOW()
    WHERE id = 1;
  ELSIF NEW.action_type = 'share_clicked' THEN
    UPDATE overall_stats 
    SET total_shares = total_shares + 1, last_updated = NOW()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 행동 추적 시 통계 자동 업데이트
DROP TRIGGER IF EXISTS trigger_update_action_stats ON user_actions;
CREATE TRIGGER trigger_update_action_stats
  AFTER INSERT ON user_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_action_stats();

-- RLS (Row Level Security) 활성화
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis_statistics ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow anonymous read access to stats" ON overall_stats;
DROP POLICY IF EXISTS "Allow anonymous read access to axis stats" ON axis_statistics;
DROP POLICY IF EXISTS "Allow anonymous insert to sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow anonymous insert to answers" ON user_answers;
DROP POLICY IF EXISTS "Allow anonymous insert to results" ON user_results;
DROP POLICY IF EXISTS "Allow anonymous insert to actions" ON user_actions;

-- 익명 사용자 읽기 권한 (통계 조회용)
CREATE POLICY "Allow anonymous read access to stats" ON overall_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to axis stats" ON axis_statistics
  FOR SELECT USING (true);

-- 익명 사용자 쓰기 권한 (데이터 수집용)
CREATE POLICY "Allow anonymous insert to sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert to answers" ON user_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert to results" ON user_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert to actions" ON user_actions
  FOR INSERT WITH CHECK (true);

-- 참여자 수 증가를 위한 RPC 함수 (기존 함수와 호환)
CREATE OR REPLACE FUNCTION increment_participant_count_safe()
RETURNS INTEGER AS $$
BEGIN
  UPDATE overall_stats 
  SET 
    total_participants = total_participants + 1,
    last_updated = NOW()
  WHERE id = 1;
  
  RETURN (SELECT total_participants FROM overall_stats WHERE id = 1);
END;
$$ LANGUAGE plpgsql;

-- 테이블 생성 확인 쿼리
SELECT 'Tables created successfully!' as status;

-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_sessions', 'user_answers', 'user_results', 'user_actions', 'overall_stats', 'axis_statistics');

-- 초기 데이터 확인
SELECT * FROM overall_stats;
SELECT * FROM axis_statistics; 