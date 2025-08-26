-- ========================================
-- 롤BTI 서비스 누락된 컬럼 추가 스크립트
-- ========================================

-- 1. user_sessions 테이블에 completed 컬럼 추가
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- 2. user_sessions 테이블에 completed_at 컬럼 추가
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 3. user_sessions 테이블에 UTM 컬럼들 추가
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS utm_source TEXT;

ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS utm_medium TEXT;

ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 4. user_answers 테이블에 axis 컬럼 추가
ALTER TABLE user_answers 
ADD COLUMN IF NOT EXISTS axis TEXT;

-- 5. user_results 테이블에 axis_scores 컬럼 추가
ALTER TABLE user_results 
ADD COLUMN IF NOT EXISTS axis_scores JSONB;

-- 6. user_actions 테이블에 action_data 컬럼 추가
ALTER TABLE user_actions 
ADD COLUMN IF NOT EXISTS action_data JSONB;

-- 7. overall_stats 테이블에 updated_at 컬럼 추가
ALTER TABLE overall_stats 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. axis_statistics 테이블에 updated_at 컬럼 추가
ALTER TABLE axis_statistics 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ========================================
-- 컬럼 타입 확인 및 수정
-- ========================================

-- user_sessions.completed가 BOOLEAN 타입인지 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' 
    AND column_name = 'completed' 
    AND data_type = 'boolean'
  ) THEN
    ALTER TABLE user_sessions ALTER COLUMN completed TYPE BOOLEAN USING completed::boolean;
  END IF;
END $$;

-- ========================================
-- 기본값 설정
-- ========================================

-- completed 컬럼 기본값 설정
UPDATE user_sessions SET completed = FALSE WHERE completed IS NULL;

-- ========================================
-- 완료 메시지
-- ========================================

SELECT '✅ 누락된 컬럼 추가가 완료되었습니다!' as status;
SELECT '📊 user_sessions 테이블 컬럼 확인' as check_status;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
ORDER BY ordinal_position; 