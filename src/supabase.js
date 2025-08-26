import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. 기본 기능만 작동합니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Supabase 환경 변수 확인:')
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음')
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 설정되지 않음')

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase 클라이언트 생성 완료')
} else {
  console.log('❌ Supabase 클라이언트 생성 실패')
}

// 전체 참여자 수 가져오기 (테스트 완료한 사용자 수)
export const getParticipantCount = async () => {
  try {
    if (!supabase) {
      console.log('❌ Supabase 클라이언트가 없습니다')
      return null
    }

    // user_sessions 테이블에서 completed = true인 세션 수를 가져옴
    const { data, error, count } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)

    if (error) {
      console.error('❌ 참여자 수 조회 실패:', error)
      return null
    }

    console.log('✅ Supabase에서 참여자 수 조회:', count)
    return count || 0
  } catch (error) {
    console.error('❌ 참여자 수 조회 중 오류:', error)
    return null
  }
}

// 참여자 수 증가 (테스트 완료 시)
export const incrementParticipantCount = async () => {
  try {
    if (!supabase) {
      console.log('❌ Supabase 클라이언트가 없습니다')
      return false
    }

    // 새로운 완료된 세션을 추가하는 대신, 기존 세션을 completed = true로 업데이트
    // 이 함수는 실제로는 호출되지 않고, completeUserSession에서 처리됨
    console.log('✅ 참여자 수 증가 처리됨')
    return true
  } catch (error) {
    console.error('❌ 참여자 수 증가 실패:', error)
    return false
  }
}

// 새로운 분석 함수들

// 1. 사용자 세션 생성
export const createUserSession = async () => {
  if (!supabase) return null

  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{ session_id: sessionId }])
      .select()
      .single()

    if (error) {
      console.error('세션 생성 오류:', error)
      return null
    }

    return sessionId
  } catch (error) {
    console.error('세션 생성 예외:', error)
    return null
  }
}

// 2. 사용자 답변 저장
export const saveUserAnswers = async (sessionId, answers) => {
  if (!supabase || !sessionId || !answers) return false

  try {
    // 질문별 축 매핑
    const questionAxisMapping = {
      0: 'E/I', 1: 'G/C', 2: 'P/S', 3: 'T/M', 4: 'E/I',
      5: 'G/C', 6: 'P/S', 7: 'T/M', 8: 'E/I'
    }

    const answerData = answers.map((answer, index) => ({
      session_id: sessionId,
      question_index: index,
      answer: answer,
      axis: questionAxisMapping[index]
    }))

    const { error } = await supabase
      .from('user_answers')
      .insert(answerData)

    if (error) {
      console.error('답변 저장 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('답변 저장 예외:', error)
    return false
  }
}

// 3. 사용자 결과 저장
export const saveUserResult = async (sessionId, resultType, resultTitle, axisScores) => {
  if (!supabase || !sessionId) return false

  try {
    const { error } = await supabase
      .from('user_results')
      .insert([{
        session_id: sessionId,
        result_type: resultType,
        result_title: resultTitle,
        axis_scores: axisScores
      }])

    if (error) {
      console.error('결과 저장 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('결과 저장 예외:', error)
    return false
  }
}

// 4. 사용자 행동 추적
export const trackUserAction = async (sessionId, actionType, actionData = null) => {
  if (!supabase || !sessionId) return false

  try {
    const { error } = await supabase
      .from('user_actions')
      .insert([{
        session_id: sessionId,
        action_type: actionType,
        action_data: actionData
      }])

    if (error) {
      console.error('행동 추적 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('행동 추적 예외:', error)
    return false
  }
}

// 5. 세션 완료 처리
export const completeUserSession = async (sessionId) => {
  if (!supabase || !sessionId) return false

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('session_id', sessionId)

    if (error) {
      console.error('세션 완료 처리 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('세션 완료 처리 예외:', error)
    return false
  }
}

// 6. 전체 통계 조회
export const getOverallStats = async () => {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('overall_stats')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('전체 통계 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('전체 통계 조회 예외:', error)
    return null
  }
}

// 7. 축별 통계 조회
export const getAxisStatistics = async () => {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('axis_statistics')
      .select('*')
      .order('axis')

    if (error) {
      console.error('축별 통계 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('축별 통계 조회 예외:', error)
    return null
  }
} 