import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 환경 변수 확인 및 디버깅
console.log('🔍 Supabase 환경변수 확인:')
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 설정 안됨')
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 설정 안됨')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Supabase 환경 변수가 설정되지 않았습니다!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '설정 안됨')
  console.error('Supabase 기능이 작동하지 않습니다!')
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
  const connected = supabase !== null
  console.log('🔍 Supabase 연결 상태:', connected ? '✅ 연결됨' : '❌ 연결 안됨')
  return connected
}

// 참여자 수 조회 함수 (연결 상태 확인 추가)
export const getParticipantCount = async () => {
  try {
    console.log('🔄 Supabase 참여자 수 조회 시작...')
    
    // Supabase 연결 상태 확인
    if (!isSupabaseConnected()) {
      console.error('❌ Supabase가 연결되지 않았습니다!')
      return 4 // 기본값
    }
    
    // participant_count 테이블에서 total_count 조회
    const { data, error } = await supabase
      .from('participant_count')
      .select('total_count')
      .eq('id', 1)
      .single()
    
    if (error) {
      console.error('❌ Supabase 참여자 수 조회 실패:', error)
      
      // fallback: user_test_results 테이블에서 레코드 수 계산
      console.log('🔄 fallback: user_test_results에서 레코드 수 계산...')
      const { count, error: countError } = await supabase
        .from('user_test_results')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('❌ fallback 조회도 실패:', countError)
        return 4 // 기본값
      }
      
      const fallbackCount = count || 4
      console.log('✅ fallback 참여자 수:', fallbackCount)
      
      // participant_count 테이블에 fallback 수 저장
      try {
        await supabase
          .from('participant_count')
          .upsert({ 
            id: 1, 
            total_count: fallbackCount, 
            updated_at: new Date().toISOString() 
          })
        console.log('✅ fallback 수를 participant_count에 저장')
      } catch (upsertError) {
        console.error('❌ fallback 수 저장 실패:', upsertError)
      }
      
      return fallbackCount
    }
    
    const count = data.total_count || 4
    console.log('✅ Supabase 참여자 수 조회 완료:', count)
    return count
    
  } catch (error) {
    console.error('❌ Supabase 참여자 수 조회 중 오류:', error)
    return 4 // 기본값
  }
}

// 참여자 수 증가 함수 (연결 상태 확인 추가)
export const incrementParticipantCount = async () => {
  try {
    console.log('🔄 Supabase 참여자 수 증가 시작...')
    
    // Supabase 연결 상태 확인
    if (!isSupabaseConnected()) {
      console.error('❌ Supabase가 연결되지 않았습니다!')
      return false
    }
    
    // 새로운 increment_participant_count_safe 함수 호출
    const { data, error } = await supabase.rpc('increment_participant_count_safe')
    
    if (error) {
      console.error('❌ Supabase 참여자 수 증가 실패:', error)
      return false
    }
    
    console.log('✅ Supabase 참여자 수 증가 완료, 새로운 수:', data)
    return true
    
  } catch (error) {
    console.error('❌ Supabase 참여자 수 증가 중 오류:', error)
    return false
  }
} 