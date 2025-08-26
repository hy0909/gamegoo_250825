-- Supabase RLS 정책 수정 스크립트
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_sessions;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON user_sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_sessions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON user_sessions;

-- 2. 새로운 RLS 정책 생성 (익명 사용자도 허용)
CREATE POLICY "Enable insert for all users" ON user_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON user_sessions
FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON user_sessions
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_sessions
FOR DELETE USING (true);

-- 3. 다른 테이블들도 동일하게 수정
-- user_answers 테이블
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_answers;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON user_answers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_answers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON user_answers;

CREATE POLICY "Enable insert for all users" ON user_answers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON user_answers
FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON user_answers
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_answers
FOR DELETE USING (true);

-- user_results 테이블
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_results;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON user_results;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_results;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON user_results;

CREATE POLICY "Enable insert for all users" ON user_results
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON user_results
FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON user_results
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_results
FOR DELETE USING (true);

-- user_actions 테이블
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_actions;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON user_actions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_actions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON user_actions;

CREATE POLICY "Enable insert for all users" ON user_actions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON user_actions
FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON user_actions
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_actions
FOR DELETE USING (true);

-- overall_stats 테이블
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON overall_stats;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON overall_stats;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON overall_stats;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON overall_stats;

CREATE POLICY "Enable insert for all users" ON overall_stats
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON overall_stats
FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON overall_stats
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON overall_stats
FOR DELETE USING (true);

-- axis_statistics 테이블
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON axis_statistics;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON axis_statistics;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON axis_statistics;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON axis_statistics;

CREATE POLICY "Enable insert for all users" ON axis_statistics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON axis_statistics
FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON axis_statistics
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON axis_statistics
FOR DELETE USING (true);

-- 4. RLS 활성화 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_sessions', 'user_answers', 'user_results', 'user_actions', 'overall_stats', 'axis_statistics');

-- 5. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_sessions', 'user_answers', 'user_results', 'user_actions', 'overall_stats', 'axis_statistics'); 