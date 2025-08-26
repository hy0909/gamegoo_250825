// ========================================
// 로컬 전용 롤BTI 서비스
// Supabase 연결 없이 로컬에서만 작동
// ========================================

// 사용자 세션 초기화 (로컬)
export async function initSession(sessionId) {
  try {
    console.log('✅ 로컬 세션 생성:', sessionId);
    return true;
  } catch (error) {
    console.warn('⚠️ 세션 생성 실패:', error.message);
    return false;
  }
}

// 사용자 답변 저장 (로컬)
export async function saveUserAnswers(sessionId, answers) {
  try {
    console.log('✅ 답변 저장 성공 (로컬)');
    return true;
  } catch (error) {
    console.warn('⚠️ 답변 저장 실패:', error.message);
    return false;
  }
}

// 사용자 결과 저장 (로컬)
export async function saveUserResult(sessionId, resultType, resultTitle, axisScores) {
  try {
    console.log('✅ 결과 저장 성공 (로컬)');
    return true;
  } catch (error) {
    console.warn('⚠️ 결과 저장 실패:', error.message);
    return false;
  }
}

// 세션 완료 처리 (로컬)
export async function completeUserSession(sessionId) {
  try {
    console.log('✅ 세션 완료 처리 성공 (로컬)');
    return true;
  } catch (error) {
    console.warn('⚠️ 세션 완료 처리 실패:', error.message);
    return false;
  }
}

// 참여자 수 증가 (로컬)
export async function incrementParticipantCount() {
  try {
    // localStorage에서 현재 참여자 수 가져오기
    const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
    const newCount = currentCount + 1;
    
    // localStorage에 저장
    localStorage.setItem('participantCount', newCount.toString());
    
    console.log('✅ 로컬 참여자 수 증가:', newCount);
    return newCount;
  } catch (error) {
    console.warn('⚠️ 참여자 수 증가 실패:', error.message);
    return false;
  }
}

// 참여자 수 가져오기 (로컬)
export async function getParticipantCount() {
  try {
    // localStorage에서 참여자 수 가져오기
    const count = parseInt(localStorage.getItem('participantCount') || '0', 10);
    console.log('✅ 로컬 참여자 수 조회:', count);
    return count;
  } catch (error) {
    console.warn('⚠️ 참여자 수 조회 실패:', error.message);
    return 0;
  }
}

// 사용자 행동 추적 (로컬)
export async function trackUserAction(sessionId, actionType, actionData = {}) {
  try {
    console.log('✅ 행동 추적 성공 (로컬):', actionType);
    return true;
  } catch (error) {
    console.warn('⚠️ 행동 추적 실패:', error.message);
    return false;
  }
}

// Supabase 연결 상태 확인 (항상 false)
export function isSupabaseConnected() {
  return false;
} 