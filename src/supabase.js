import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase 환경 변수 확인:')
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음')
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 설정되지 않음')

let supabase = null

// Supabase 연결 시도
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase 클라이언트 생성 완료')
    
    // 연결 테스트
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn('⚠️ Supabase 연결 테스트 실패:', error.message)
      } else {
        console.log('✅ Supabase 연결 테스트 성공')
      }
    })
  } catch (error) {
    console.error('❌ Supabase 클라이언트 초기화 실패:', error)
  }
} else {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다')
}

// 사용자 세션 초기화
export async function initSession(sessionId) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 로컬 세션 생성')
      return sessionId
    }

    console.log('🔍 Supabase 연결 상태:', supabase ? '연결됨' : '연결 안됨')

    // rollbti_sessions 테이블에 새 세션 생성
    const { data, error } = await supabase
      .from('rollbti_sessions')
      .insert([
        { 
          session_id: sessionId,
          started_at: new Date().toISOString(),
          is_completed: false
        }
      ])
      .select()

    if (error) {
      console.warn('⚠️ 세션 생성 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      return sessionId
    }

    console.log('✅ 세션 생성 성공:', data)
    return sessionId
  } catch (error) {
    console.warn('⚠️ 세션 생성 실패:', error.message)
    return sessionId
  }
}

// 사용자 답변 저장
export async function saveUserAnswers(sessionId, answers) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 답변 저장 건너뜀')
      return true
    }

    console.log('🔍 답변 저장 시도:', { sessionId, answers })

    // rollbti_answers 테이블에 답변 저장
    const answerData = answers.map((answer, index) => ({
      session_id: sessionId,
      question_number: index + 1,
      answer: answer,
      axis_type: getAxisType(index), // 질문 번호에 따른 축 타입
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('rollbti_answers')
      .insert(answerData)
      .select()

    if (error) {
      console.warn('⚠️ 답변 저장 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      return false
    }

    console.log('✅ 답변 저장 성공:', data)
    return true
  } catch (error) {
    console.warn('⚠️ 답변 저장 실패:', error.message)
    return false
  }
}

// 질문 번호에 따른 축 타입 반환
function getAxisType(questionIndex) {
  const axisMap = [
    'E/I',    // 0번 질문
    'S/P',    // 1번 질문
    'S/P',    // 2번 질문
    'G/C',    // 3번 질문
    'G/C',    // 4번 질문
    'E/I',    // 5번 질문
    'E/I',    // 6번 질문
    'T/M',    // 7번 질문
    'T/M'     // 8번 질문
  ]
  return axisMap[questionIndex] || 'E/I'
}

// 사용자 결과 저장
export async function saveUserResult(sessionId, resultType, resultTitle, axisScores) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 결과 저장 건너뜀')
      return true
    }

    console.log('🔍 결과 저장 시도:', { sessionId, resultType, resultTitle, axisScores })

    // rollbti_results 테이블에 결과 저장
    const { data, error } = await supabase
      .from('rollbti_results')
      .insert([
        {
          session_id: sessionId,
          result_type: resultType,
          result_title: resultTitle,
          axis_scores: axisScores,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.warn('⚠️ 결과 저장 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      return false
    }

    console.log('✅ 결과 저장 성공:', data)
    return true
  } catch (error) {
    console.warn('⚠️ 결과 저장 실패:', error.message)
    return false
  }
}

// 세션 완료 처리
export async function completeUserSession(sessionId) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 세션 완료 처리 건너뜀')
      return true
    }

    console.log('🔍 세션 완료 처리 시도:', sessionId)

    // rollbti_sessions 테이블에서 세션 완료 처리
    const { data, error } = await supabase
      .from('rollbti_sessions')
      .update({ 
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()

    if (error) {
      console.warn('⚠️ 세션 완료 처리 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      return false
    }

    console.log('✅ 세션 완료 처리 성공:', data)
    return true
  } catch (error) {
    console.warn('⚠️ 세션 완료 처리 실패:', error.message)
    return false
  }
}

// 참여자 수 증가 (실시간 집계)
export async function incrementParticipantCount() {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 로컬 카운트 사용')
      // localStorage에서 현재 참여자 수 가져오기
      const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
      const newCount = currentCount + 1;
      localStorage.setItem('participantCount', newCount.toString());
      return newCount;
    }

    console.log('🔍 참여자 수 증가 시도 (Supabase 실시간 집계)')

    // Supabase 함수를 통한 참여자 수 증가
    const { data, error } = await supabase
      .rpc('increment_participant_count')

    if (error) {
      console.warn('⚠️ 참여자 수 증가 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      // 로컬 폴백
      const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
      const newCount = currentCount + 1;
      localStorage.setItem('participantCount', newCount.toString());
      return newCount;
    }

    console.log('✅ 참여자 수 증가 성공 (실시간 집계):', data)
    
    // localStorage에도 저장 (동기화)
    localStorage.setItem('participantCount', data.toString());
    
    return data
  } catch (error) {
    console.warn('⚠️ 참여자 수 증가 실패:', error.message)
    // 로컬 폴백
    const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('participantCount', newCount.toString());
    return newCount;
  }
}

// 참여자 수 가져오기 (실시간 집계)
export async function getParticipantCount() {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 로컬 카운트 사용')
      const count = parseInt(localStorage.getItem('participantCount') || '0', 10);
      return count;
    }

    console.log('🔍 참여자 수 조회 시도 (Supabase 실시간 집계)')

    // rollbti_global_stats 테이블에서 실시간 참여자 수 조회
    const { data, error } = await supabase
      .from('rollbti_global_stats')
      .select('total_participants')
      .eq('id', 1)
      .single()

    if (error) {
      console.warn('⚠️ 참여자 수 조회 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      // 로컬 폴백
      const count = parseInt(localStorage.getItem('participantCount') || '0', 10);
      return count;
    }

    const totalCount = data?.total_participants || 0
    console.log('✅ 참여자 수 조회 성공 (실시간 집계):', totalCount)
    
    // localStorage 동기화
    localStorage.setItem('participantCount', totalCount.toString());
    
    return totalCount
  } catch (error) {
    console.warn('⚠️ 참여자 수 조회 실패:', error.message)
    // 로컬 폴백
    const count = parseInt(localStorage.getItem('participantCount') || '0', 10);
    return count;
  }
}

// 사용자 행동 추적
export async function trackUserAction(sessionId, actionType, actionData = {}) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 행동 추적 건너뜀')
      return true
    }

    console.log('🔍 행동 추적 시도:', { sessionId, actionType, actionData })

    // 전역 통계 업데이트 (공유, 재시작 등)
    if (actionType === 'share_clicked') {
      const { error } = await supabase
        .from('rollbti_global_stats')
        .update({ 
          total_shares: supabase.sql`total_shares + 1`,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) {
        console.warn('⚠️ 공유 통계 업데이트 실패:', error.message)
      }
    } else if (actionType === 'restart_clicked') {
      const { error } = await supabase
        .from('rollbti_global_stats')
        .update({ 
          total_restarts: supabase.sql`total_restarts + 1`,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) {
        console.warn('⚠️ 재시작 통계 업데이트 실패:', error.message)
      }
    }

    console.log('✅ 행동 추적 성공:', actionType)
    return true
  } catch (error) {
    console.warn('⚠️ 행동 추적 실패:', error.message)
    return false
  }
}

// Supabase 연결 상태 확인
export function isSupabaseConnected() {
  const connected = supabase !== null
  console.log('🔍 Supabase 연결 상태 확인:', connected ? '연결됨' : '연결 안됨')
  return connected
} 