import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.vite_supabase_url
const supabaseAnonKey = import.meta.env.vite_supabase_anon_key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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