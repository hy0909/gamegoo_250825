-- 현재 참여자 수 확인 쿼리

-- 1. participant_count 테이블에서 참여자 수 확인
SELECT 
  'participant_count 테이블' as source,
  total_count as "참여자 수",
  updated_at as "마지막 업데이트",
  created_at as "생성 시간"
FROM participant_count 
WHERE id = 1;

-- 2. user_test_results 테이블에서 실제 레코드 수 확인
SELECT 
  'user_test_results 테이블' as source,
  COUNT(*) as "실제 테스트 완료 수",
  MIN(created_at) as "첫 번째 테스트",
  MAX(created_at) as "마지막 테스트"
FROM user_test_results;

-- 3. 최근 테스트 결과들 확인 (최근 10개)
SELECT 
  '최근 테스트 결과' as source,
  result_type as "결과 유형",
  created_at as "테스트 시간",
  session_id as "세션 ID"
FROM user_test_results 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. 전체 통계
SELECT 
  '전체 통계' as source,
  (SELECT total_count FROM participant_count WHERE id = 1) as "participant_count 테이블 수",
  (SELECT COUNT(*) FROM user_test_results) as "실제 user_test_results 수",
  CASE 
    WHEN (SELECT total_count FROM participant_count WHERE id = 1) = (SELECT COUNT(*) FROM user_test_results) 
    THEN '✅ 동기화 완료' 
    ELSE '❌ 동기화 필요' 
  END as "동기화 상태"; 