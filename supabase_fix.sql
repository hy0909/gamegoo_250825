-- Supabase 참여자 수 누적 문제 해결 스크립트

-- 1. 기존 participant_count 테이블 확인
SELECT * FROM participant_count;

-- 2. participant_count 테이블 재생성 (더 안전하게)
DROP TABLE IF EXISTS participant_count CASCADE;
CREATE TABLE participant_count (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 초기 데이터 삽입
INSERT INTO participant_count (id, total_count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- 4. increment_participant_count 함수 수정
CREATE OR REPLACE FUNCTION increment_participant_count()
RETURNS BOOLEAN AS $$
BEGIN
    -- 현재 total_count를 가져와서 +1 증가
    UPDATE participant_count 
    SET total_count = total_count + 1, updated_at = NOW()
    WHERE id = 1;
    
    -- 업데이트가 성공했는지 확인
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. increment_participant_count_safe 함수 수정
CREATE OR REPLACE FUNCTION increment_participant_count_safe()
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- 현재 total_count를 가져와서 +1 증가
    UPDATE participant_count 
    SET total_count = total_count + 1, updated_at = NOW()
    WHERE id = 1
    RETURNING total_count INTO new_count;
    
    -- 업데이트가 성공했는지 확인
    IF FOUND THEN
        RETURN new_count;
    ELSE
        -- 실패 시 기본값 반환
        RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 함수 수정
CREATE OR REPLACE FUNCTION auto_increment_participant()
RETURNS TRIGGER AS $$
BEGIN
    -- 새로운 테스트 결과가 추가될 때마다 참여자 수 자동 증가
    PERFORM increment_participant_count();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 트리거 재생성
DROP TRIGGER IF EXISTS auto_increment_participant ON user_test_results;
CREATE TRIGGER auto_increment_participant
    AFTER INSERT ON user_test_results
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_participant();

-- 8. 기존 user_test_results 테이블의 레코드 수를 participant_count에 반영
UPDATE participant_count 
SET total_count = (SELECT COUNT(*) FROM user_test_results), updated_at = NOW()
WHERE id = 1;

-- 9. 최종 확인
SELECT 
    '현재 참여자 수' as info,
    total_count as count,
    updated_at as last_updated
FROM participant_count 
WHERE id = 1;

SELECT 
    'user_test_results 테이블 레코드 수' as info,
    COUNT(*) as count
FROM user_test_results; 