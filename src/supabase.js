import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 환경 변수 확인
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. 기본 기능만 작동합니다.')
}

// Supabase 클라이언트 생성 (환경 변수가 없어도 에러 방지)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// 세션 ID 생성 함수
export const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// UTM 파라미터 추출 함수
export const getUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    referrer: document.referrer || null
  }
}

// Supabase 연결 상태 확인 함수
export const isSupabaseConnected = () => {
  return supabase !== null
}

// 참여자 수 가져오기 함수
export const getParticipantCount = async () => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase가 연결되지 않았습니다.')
    return 0
  }

  try {
    // 새로운 participant_count 테이블에서 참여자 수 가져오기
    const { data, error } = await supabase
      .from('participant_count')
      .select('total_count')
      .single()

    if (error) {
      console.error('참여자 수 조회 오류:', error)
      
      // 기존 방식으로 fallback (user_test_results 테이블 사용)
      const { count, error: countError } = await supabase
        .from('user_test_results')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('fallback 참여자 수 조회 오류:', countError)
        return 0
      }

      return count || 0
    }

    return data.total_count || 0
  } catch (error) {
    console.error('참여자 수 조회 중 오류:', error)
    return 0
  }
}

// 참여자 수 증가 함수 (테스트 완료 시 호출)
export const incrementParticipantCount = async () => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase가 연결되지 않았습니다.')
    return false
  }

  try {
    // 1. 현재 참여자 수 확인
    const { data: currentData, error: currentError } = await supabase
      .from('participant_count')
      .select('total_count')
      .single()

    if (currentError) {
      console.error('현재 참여자 수 조회 오류:', currentError)
      return false
    }

    const currentCount = currentData.total_count || 0

    // 2. 참여자 수 증가
    const { data, error } = await supabase
      .from('participant_count')
      .update({ 
        total_count: currentCount + 1,
        last_updated: new Date().toISOString()
      })
      .eq('id', 1)
      .select()

    if (error) {
      console.error('참여자 수 증가 오류:', error)
      return false
    }

    console.log('참여자 수 증가 성공:', currentCount, '→', currentCount + 1)
    return true

  } catch (error) {
    console.error('참여자 수 증가 중 오류:', error)
    return false
  }
} 