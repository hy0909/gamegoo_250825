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
    const { count, error } = await supabase
      .from('user_test_results')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('참여자 수 조회 오류:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('참여자 수 조회 중 오류:', error)
    return 0
  }
} 