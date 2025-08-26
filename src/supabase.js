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

    // page_visits 테이블에 방문 기록
    const { data, error } = await supabase
      .from('page_visits')
      .insert([
        { 
          session_id: sessionId,
          page_name: 'rollbti_test',
          visited_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.warn('⚠️ 방문 기록 저장 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      return sessionId
    }

    console.log('✅ 방문 기록 저장 성공:', data)
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

    // rollbti_simple 테이블에 답변 저장
    const { data, error } = await supabase
      .from('rollbti_simple')
      .insert([
        {
          session_id: sessionId,
          data_type: 'answers',
          data_content: answers,
          created_at: new Date().toISOString()
        }
      ])
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

// 사용자 결과 저장
export async function saveUserResult(sessionId, resultType, resultTitle, axisScores) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 결과 저장 건너뜀')
      return true
    }

    console.log('🔍 결과 저장 시도:', { sessionId, resultType, resultTitle, axisScores })

    // rollbti_simple 테이블에 결과 저장
    const { data, error } = await supabase
      .from('rollbti_simple')
      .insert([
        {
          session_id: sessionId,
          data_type: 'result',
          data_content: {
            type: resultType,
            title: resultTitle,
            axis_scores: axisScores
          },
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

    // rollbti_simple 테이블에 완료 기록
    const { data, error } = await supabase
      .from('rollbti_simple')
      .insert([
        {
          session_id: sessionId,
          data_type: 'completed',
          data_content: { completed: true },
          created_at: new Date().toISOString()
        }
      ])
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

// 참여자 수 증가
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

    console.log('🔍 참여자 수 증가 시도 (Supabase)')

    // rollbti_simple 테이블에서 participant_count 증가
    // 먼저 현재 값을 조회
    const { data: currentData, error: selectError } = await supabase
      .from('rollbti_simple')
      .select('participant_count')
      .eq('id', 1)
      .single()

    if (selectError) {
      console.warn('⚠️ 현재 참여자 수 조회 실패:', selectError.message)
      // 새로운 레코드 생성
      const { data: insertData, error: insertError } = await supabase
        .from('rollbti_simple')
        .insert([
          {
            id: 1,
            participant_count: 1,
            data_type: 'stats',
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (insertError) {
        console.warn('⚠️ 참여자 수 초기화 실패:', insertError.message)
        // 로컬 폴백
        const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
        const newCount = currentCount + 1;
        localStorage.setItem('participantCount', newCount.toString());
        return newCount;
      }

      console.log('✅ 참여자 수 초기화 성공:', insertData)
      return 1
    }

    // 기존 값 증가
    const currentCount = currentData.participant_count || 0
    const newCount = currentCount + 1

    const { data: updateData, error: updateError } = await supabase
      .from('rollbti_simple')
      .update({ participant_count: newCount })
      .eq('id', 1)
      .select()

    if (updateError) {
      console.warn('⚠️ 참여자 수 증가 실패:', updateError.message)
      console.log('🔍 에러 상세:', updateError)
      // 로컬 폴백
      const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
      const newCount = currentCount + 1;
      localStorage.setItem('participantCount', newCount.toString());
      return newCount;
    }

    console.log('✅ 참여자 수 증가 성공:', updateData)
    return newCount
  } catch (error) {
    console.warn('⚠️ 참여자 수 증가 실패:', error.message)
    // 로컬 폴백
    const currentCount = parseInt(localStorage.getItem('participantCount') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('participantCount', newCount.toString());
    return newCount;
  }
}

// 참여자 수 가져오기
export async function getParticipantCount() {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음 - 로컬 카운트 사용')
      const count = parseInt(localStorage.getItem('participantCount') || '0', 10);
      return count;
    }

    console.log('🔍 참여자 수 조회 시도 (Supabase)')

    // rollbti_simple 테이블에서 참여자 수 조회
    const { data, error } = await supabase
      .from('rollbti_simple')
      .select('participant_count')
      .eq('id', 1)
      .single()

    if (error) {
      console.warn('⚠️ 참여자 수 조회 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      // 로컬 폴백
      const count = parseInt(localStorage.getItem('participantCount') || '0', 10);
      return count;
    }

    console.log('✅ 참여자 수 조회 성공:', data?.participant_count || 0)
    return data?.participant_count || 0
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

    // rollbti_simple 테이블에 행동 기록
    const { data, error } = await supabase
      .from('rollbti_simple')
      .insert([
        {
          session_id: sessionId,
          data_type: 'action',
          data_content: {
            action: actionType,
            ...actionData
          },
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.warn('⚠️ 행동 추적 실패:', error.message)
      console.log('🔍 에러 상세:', error)
      return false
    }

    console.log('✅ 행동 추적 성공:', data)
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