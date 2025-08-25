-- Supabase 참여자 수 누적 문제 최종 해결 스크립트

-- 1. 기존 테이블 및 함수 완전 정리
DROP TRIGGER IF EXISTS auto_increment_participant ON user_test_results;
DROP FUNCTION IF EXISTS increment_participant_count();
DROP FUNCTION IF EXISTS increment_participant_count_safe();
DROP TABLE IF EXISTS participant_count CASCADE;

-- 2. participant_count 테이블 재생성 (완벽한 구조)
CREATE TABLE participant_count (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 초기 데이터 삽입
INSERT INTO participant_count (id, total_count, created_at, updated_at) 
VALUES (1, 0, NOW(), NOW());

-- 4. 참여자 수 자동 증가 함수 (트리거용 - 완벽 수정)
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

-- 5. 안전한 참여자 수 증가 함수 (RPC용 - 완벽 수정)
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

-- 6. 트리거 생성 (완벽 수정)
CREATE TRIGGER auto_increment_participant
  AFTER INSERT ON user_test_results
  FOR EACH ROW
  EXECUTE FUNCTION increment_participant_count();

-- 7. 기존 user_test_results 데이터를 participant_count에 반영
UPDATE participant_count 
SET total_count = (SELECT COUNT(*) FROM user_test_results), 
    updated_at = NOW()
WHERE id = 1;

-- 8. 최종 확인
SELECT 
  '현재 참여자 수' as info,
  total_count as count,
  created_at as "생성 시간",
  updated_at as "마지막 업데이트"
FROM participant_count 
WHERE id = 1;

SELECT 
  'user_test_results 테이블 레코드 수' as info,
  COUNT(*) as count
FROM user_test_results;

-- 9. 테스트: 새로운 레코드 삽입 시 자동 증가 확인
-- INSERT INTO user_test_results (session_id, result_type, result_title, answers) 
-- VALUES ('test_session', 'TEST', '테스트 결과', '[]');
-- 
-- SELECT total_count as "테스트 후 참여자 수" FROM participant_count WHERE id = 1; 