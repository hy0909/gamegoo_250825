import React, { useState, useEffect } from 'react'
import './App.css'
import BarChart from './BarChart'
import { supabase, generateSessionId, getUtmParams, isSupabaseConnected, getParticipantCount, incrementParticipantCount } from './supabase'

// 롤BTI 질문 데이터 (9가지 질문)
const rollBtiQuestions = [
  { 
    id: 1, 
    question: "블리츠크랭크가 인베 가자고 하면?", 
    optionA: "무조건 따라감", 
    optionB: "가볍게 무시", 
    axis: 'EI' 
  },
  { 
    id: 2, 
    question: "게임 초반 운영은?", 
    optionA: "초반 압박으로 굴린다", 
    optionB: "안전하게 성장", 
    axis: 'SP' 
  },
  { 
    id: 3, 
    question: "초반 킬각이 보이면?", 
    optionA: "무조건 싸운다", 
    optionB: "안정적으로 간다", 
    axis: 'SP' 
  },
  { 
    id: 4, 
    question: "블루 버프를 먹고 싶은 다른 팀원이 있다면?", 
    optionA: "이미 내가 먹었다", 
    optionB: "양보한다", 
    axis: 'GC' 
  },
  { 
    id: 5, 
    question: "용/바론 한타 콜이 오면?", 
    optionA: "무조건 달려간다", 
    optionB: "라인 클리어부터 한다", 
    axis: 'EI' 
  },
  { 
    id: 6, 
    question: "한타 중, 적 딜러가 눈앞에 있다면?", 
    optionA: "즉시 진입", 
    optionB: "포지션 유지", 
    axis: 'EI' 
  },
  { 
    id: 7, 
    question: "내가 0/3/0 이 되었을 때?", 
    optionA: "침착하고 안정적으로 플레이", 
    optionB: "역전을 노린다, 과감한 플레이", 
    axis: 'TM' 
  },
  { 
    id: 8, 
    question: "연패 중일 때 나는?", 
    optionA: "큐 돌려!", 
    optionB: "쉬었다 한다", 
    axis: 'TM' 
  },
  { 
    id: 9, 
    question: "제어와드 막타는?", 
    optionA: "팀원에게 양보한다", 
    optionB: "내가 먹는다", 
    axis: 'GC' 
  }
]

// 롤BTI 결과 데이터 (16가지 유형)
const rollBtiResults = {
  'EGPT': { 
    type: 'EGPT', 
    title: '용감한 팀파이터', 
    description: '한타는 내 전부, 맵 끝에서라도 달려감. 멘탈이 강철이라 역전 각 보는 타입',
    strengths: '팀 결속력, 오브젝트 싸움 주도',
    weaknesses: '과도한 진입, 파밍 부족',
    champions: '아무무, 오공, 자르반 4세',
    goodWith: 'ICPT, ECST',
    avoidWith: 'IGPM',
    quote: '"한타는 내 삶의 이유다."'
  },
  'EGPM': { 
    type: 'EGPM', 
    title: '열혈 돌격수', 
    description: '한타 최전선, 그러나 기분에 따라 판단 바뀜. 잘 풀리면 미친 듯이 몰아치지만, 삐지면 존재감↓',
    strengths: '폭발적 파괴력',
    weaknesses: '멘탈 흔들리면 손해 큼',
    champions: '다리우스, 가렌',
    goodWith: 'ECPT, ICST',
    avoidWith: 'IGSM',
    quote: '"분노가 내 무기다."'
  },
  'EGST': { 
    type: 'EGST', 
    title: '초반 강탈자', 
    description: '초반 교전·갱킹에 모든 힘 쏟음. 이득 보면 그대로 스노우볼 굴림',
    strengths: '경기 템포 장악',
    weaknesses: '초반 실패 시 팀 부담↑',
    champions: '리 신, 판테온',
    goodWith: 'ICST, ECST',
    avoidWith: 'ICPT',
    quote: '"첫 10분이 내 전부다."'
  },
  'EGSM': { 
    type: 'EGSM', 
    title: '돌격 불도저', 
    description: '초반 킬 먹으면 기분 최고, 아니면 급다운. 감정 따라 플레이 기복 심함',
    strengths: '잘 풀릴 땐 무적',
    weaknesses: '흐름 끊기면 공백기',
    champions: '제드, 카타리나',
    goodWith: 'ECST',
    avoidWith: 'ICPT',
    quote: '"킬 먹었으니 내가 주인공이다."'
  },
  'ECPT': { 
    type: 'ECPT', 
    title: '헌신적 지휘관', 
    description: '자원 양보, 안정 운영, 팀 중심. 게임을 설계하는 브레인',
    strengths: '안정성과 팀워크',
    weaknesses: '개인 캐리력↓',
    champions: '브라움, 세나',
    goodWith: 'EGPT, EGST',
    avoidWith: 'IGPM',
    quote: '"내 팀이 곧 나다."'
  },
  'ECPM': { 
    type: 'ECPM', 
    title: '따뜻한 전투 요정', 
    description: '팀 살리기에 전념하지만, 가끔 섭섭해함. 케어에 자부심 강함',
    strengths: '아군 생존율↑',
    weaknesses: '멘탈 흔들리면 소극적',
    champions: '소라카, 유미',
    goodWith: 'EGPT, ICST',
    avoidWith: 'IGSM',
    quote: '"너를 살리는 게 내 사명."'
  },
  'ECST': { 
    type: 'ECST', 
    title: '오브젝트 마스터', 
    description: '초반 주도권 잡아 용·전령 다 챙김. 운영 중심형 한타 플레이어',
    strengths: '오브젝트 장악, 팀 이득 극대화',
    weaknesses: '지나친 운영 집중으로 전투 감각 저하',
    champions: '자르반 4세, 탈리야',
    goodWith: 'EGPT, ICPT',
    avoidWith: 'IGPM',
    quote: '"지도 위의 모든 점을 내 색으로."'
  },
  'ECSM': { 
    type: 'ECSM', 
    title: '전장의 힐러', 
    description: '초반 이득 후 팀원 살리기 집중. 기분 좋으면 날아다니지만, 안 풀리면 조용해짐',
    strengths: '팀 유지력 극대화',
    weaknesses: '초반 실패 시 영향력↓',
    champions: '잔나, 룰루',
    goodWith: 'EGST, ICPT',
    avoidWith: 'IGSM',
    quote: '"내 버프를 받은 자, 무적이리라."'
  },
  'IGPT': { 
    type: 'IGPT', 
    title: '솔라인 수호자', 
    description: '내 라인 성장에 집중, 그러나 멘탈 단단. 후반 캐리각 노림',
    strengths: '안정적 성장, 후반 영향력',
    weaknesses: '초반 한타 영향력↓',
    champions: '나서스, 초가스, 탑스몰더',
    goodWith: 'ECST, EGPT',
    avoidWith: 'EGST',
    quote: '"시간은 내 편이다."'
  },
  'IGPM': { 
    type: 'IGPM', 
    title: '외로운 캐리형', 
    description: '라인전 고립 플레이, 기분에 따라 영향력 요동. 팀플보다 개인 캐리 선호',
    strengths: '잘 풀리면 혼자 승리',
    weaknesses: '안 풀리면 팀 연계 단절',
    champions: '야스오, 이렐리아',
    goodWith: 'ECSM',
    avoidWith: 'EGPT',
    quote: '"내가 캐리하면 다 끝."'
  },
  'IGST': { 
    type: 'IGST', 
    title: '고독한 킬머신', 
    description: '혼자 놀다 타이밍 맞춰 치명적 진입. 초반 킬로 성장 터뜨림',
    strengths: '암살 능력',
    weaknesses: '팀 연계 부족',
    champions: '카직스, 피즈',
    goodWith: 'ECSM',
    avoidWith: 'ECPT',
    quote: '"그늘에서 꽃을 피운다."'
  },
  'IGSM': { 
    type: 'IGSM', 
    title: '터렛 다이버', 
    description: '라인전에서 과감한 다이브, 초반 폭발력. 멘탈 흔들리면 존재감 급감',
    strengths: '라인전 강함',
    weaknesses: '실패 시 스노우볼 역전당함',
    champions: '카밀, 레넥톤, 나서스, 요릭',
    goodWith: 'ECST',
    avoidWith: 'ECPT',
    quote: '"롤은 넥서스뿌수는 게임이다"'
  },
  'ICPT': { 
    type: 'ICPT', 
    title: '방패형 운영러', 
    description: '자원 양보, 안정적 운영. 팀을 지키는 든든한 존재',
    strengths: '방어적 운영, 후반 안정성',
    weaknesses: '캐리력 부족',
    champions: '말파이트, 마오카이',
    goodWith: 'EGPT',
    avoidWith: 'IGSM',
    quote: '"나는 벽이다."'
  },
  'ICPM': { 
    type: 'ICPM', 
    title: '가끔 삐지는 브루저', 
    description: '헌신하지만 가끔 감정 기복. 팀을 위해 몸 던지지만 불만 쌓임',
    strengths: '팀 기여도 높음',
    weaknesses: '멘탈 나가면 소극적',
    champions: '다리우스, 나르',
    goodWith: 'EGPT, ECST',
    avoidWith: 'IGSM',
    quote: '"오늘은 참는다."'
  },
  'ICST': { 
    type: 'ICST', 
    title: '전략 설계자', 
    description: '자원 양보, 운영·전략 설계에 능함. 미드, 전략적인 챔피언 선호',
    strengths: '안정적 초반 운영',
    weaknesses: '직접 킬 결정력↓',
    champions: '트위스티드 페이트, 리산드라, 조이, 아리',
    goodWith: 'EGST, EGPT',
    avoidWith: 'IGPM',
    quote: '"전쟁은 머리로 하는 것."'
  },
  'ICSM': { 
    type: 'ICSM', 
    title: '기분파 지원형', 
    description: '초반 이득 후 지원 집중, 기분 따라 영향력 달라짐',
    strengths: '팀 유연성',
    weaknesses: '멘탈 기복',
    champions: '룰루, 카르마',
    goodWith: 'EGST, ECST',
    avoidWith: 'IGSM',
    quote: '"기분 좋으면 날개 달린다."'
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState('main') // main, question, result
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [shareMessage, setShareMessage] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [utmParams, setUtmParams] = useState({})
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    // 세션 ID 생성
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    
    // UTM 파라미터 추출
    const utm = getUtmParams()
    setUtmParams(utm)
    
    // URL에서 result 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search)
    const resultParam = urlParams.get('result')
    
    if (resultParam && rollBtiResults[resultParam]) {
      setResult(rollBtiResults[resultParam])
      setCurrentPage('result')
    } else {
      // 메인 페이지 방문 로그
      logPageVisit('main')
      
      // 초기 참여자 수 설정
      initializeParticipantCount()
    }
  }, [])

  // 초기 참여자 수 설정 함수
  const initializeParticipantCount = async () => {
    try {
      console.log('=== 참여자 수 초기화 시작 ===')
      
      // 1. Supabase에서 최신 참여자 수 가져오기 (우선)
      let supabaseCount = 0
      try {
        supabaseCount = await getParticipantCount()
        console.log('Supabase에서 가져온 수:', supabaseCount)
      } catch (error) {
        console.error('Supabase 조회 실패:', error)
      }
      
      // 2. localStorage에서 저장된 수 확인 (보조)
      const savedCount = localStorage.getItem('gamegoo_participant_count')
      console.log('localStorage에서 가져온 수:', savedCount)
      
      // 3. 최종 참여자 수 결정 (Supabase 우선)
      let finalCount = 4 // 기본값 4명
      
      if (supabaseCount > 0) {
        // Supabase에 데이터가 있으면 우선 사용
        finalCount = supabaseCount
        console.log('Supabase 우선 사용:', finalCount)
      } else if (savedCount) {
        // Supabase에 데이터가 없으면 localStorage 사용
        const localCount = parseInt(savedCount)
        finalCount = Math.max(localCount, finalCount)
        console.log('localStorage 사용 (Supabase 없음):', finalCount)
      }
      
      // 4. 상태 업데이트 및 localStorage 동기화
      setParticipantCount(finalCount)
      localStorage.setItem('gamegoo_participant_count', finalCount.toString())
      
      console.log('최종 참여자 수 설정 완료:', finalCount)
      
      // 5. 주기적으로 Supabase와 동기화 (5초마다)
      const syncInterval = setInterval(async () => {
        try {
          const latestCount = await getParticipantCount()
          if (latestCount !== finalCount) {
            console.log('동기화: 참여자 수 업데이트', finalCount, '→', latestCount)
            setParticipantCount(latestCount)
            localStorage.setItem('gamegoo_participant_count', latestCount.toString())
            finalCount = latestCount
          }
        } catch (error) {
          console.error('동기화 중 오류:', error)
        }
      }, 5000) // 5초마다
      
      // 6. 컴포넌트 언마운트 시 인터벌 정리
      return () => clearInterval(syncInterval)
      
    } catch (error) {
      console.error('참여자 수 초기화 중 오류:', error)
      
      // 에러 발생 시 기본값 설정
      const fallbackCount = 4
      setParticipantCount(fallbackCount)
      localStorage.setItem('gamegoo_participant_count', fallbackCount.toString())
      console.log('fallback 참여자 수 설정:', fallbackCount)
    }
  }

  // 페이지 방문 로그 함수
  const logPageVisit = async (pageType, questionNumber = null, resultType = null) => {
    if (!isSupabaseConnected()) {
      console.log('Supabase 연결 없음 - 로그 저장 건너뜀')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('page_visits')
        .insert([
          {
            session_id: sessionId,
            page_type: pageType,
            question_number: questionNumber,
            referrer: utmParams.referrer,
            utm_source: utmParams.utm_source,
            utm_medium: utmParams.utm_medium,
            utm_campaign: utmParams.utm_campaign,
            user_agent: navigator.userAgent
          }
        ])
      
      if (error) console.error('페이지 방문 로그 오류:', error)
    } catch (error) {
      console.error('페이지 방문 로그 저장 실패:', error)
    }
  }

  // 테스트 결과 저장 함수
  const saveTestResult = async (resultType, resultTitle, userAnswers) => {
    if (!isSupabaseConnected()) {
      console.log('Supabase 연결 없음 - 결과 저장 건너뜀')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('user_test_results')
        .insert([
          {
            session_id: sessionId,
            result_type: resultType,
            result_title: resultTitle,
            answers: userAnswers,
            share_button_clicked: false,
            test_restarted: false,
            referrer: utmParams.referrer,
            utm_source: utmParams.utm_source,
            utm_medium: utmParams.utm_medium,
            utm_campaign: utmParams.utm_campaign,
            user_agent: navigator.userAgent
          }
        ])
      
      if (error) console.error('테스트 결과 저장 오류:', error)
    } catch (error) {
      console.error('테스트 결과 저장 실패:', error)
    }
  }

  // 공유 버튼 클릭 로그
  const logShareButtonClick = async () => {
    if (!isSupabaseConnected()) {
      console.log('Supabase 연결 없음 - 공유 로그 건너뜀')
      return
    }
    
    try {
      const { error } = await supabase
        .from('user_test_results')
        .update({ share_button_clicked: true })
        .eq('session_id', sessionId)
      
      if (error) console.error('공유 버튼 클릭 로그 오류:', error)
    } catch (error) {
      console.error('공유 버튼 클릭 로그 저장 실패:', error)
    }
  }

  // 테스트 재시작 로그
  const logTestRestart = async () => {
    if (!isSupabaseConnected()) {
      console.log('Supabase 연결 없음 - 재시작 로그 건너뜀')
      return
    }
    
    try {
      const { error } = await supabase
        .from('user_test_results')
        .update({ test_restarted: true })
        .eq('session_id', sessionId)
      
      if (error) console.error('테스트 재시작 로그 오류:', error)
    } catch (error) {
      console.error('테스트 재시작 로그 저장 실패:', error)
    }
  }

  // 참여자 수 로드 함수
  const loadParticipantCount = async () => {
    try {
      // localStorage에서 저장된 참여자 수 확인
      const savedCount = localStorage.getItem('gamegoo_participant_count')
      
      if (savedCount) {
        // 저장된 수가 있으면 먼저 표시
        setParticipantCount(parseInt(savedCount))
        console.log('localStorage에서 참여자 수 로드:', savedCount)
      }
      
      // Supabase에서 최신 참여자 수 가져오기
      const count = await getParticipantCount()
      
      if (count > 0) {
        // Supabase에서 가져온 수가 더 크면 업데이트
        const finalCount = Math.max(count, parseInt(savedCount || 0))
        setParticipantCount(finalCount)
        
        // localStorage에 저장
        localStorage.setItem('gamegoo_participant_count', finalCount.toString())
        console.log('참여자 수 업데이트 및 저장:', finalCount)
      }
    } catch (error) {
      console.error('참여자 수 로드 중 오류:', error)
      
      // 에러 발생 시 localStorage에서 가져온 수라도 표시
      const savedCount = localStorage.getItem('gamegoo_participant_count')
      if (savedCount) {
        setParticipantCount(parseInt(savedCount))
      }
    }
  }

  // 결과 타입 계산 함수
  const calculateResultType = (answers) => {
    let resultType = ''
    
    // E/I 축 (전투 참여도) - 질문 1, 5, 6
    const eiAnswers = [answers[0], answers[4], answers[5]]
    const eCount = eiAnswers.filter(ans => ans === 'A').length
    const iCount = eiAnswers.filter(ans => ans === 'B').length
    resultType += eCount > iCount ? 'E' : 'I'

    // G/C 축 (자원 사용 방식) - 질문 4, 9
    const gcAnswers = [answers[3], answers[8]]
    const gCount = gcAnswers.filter(ans => ans === 'A').length
    const cCount = gcAnswers.filter(ans => ans === 'B').length
    resultType += gCount > cCount ? 'G' : 'C'

    // P/S 축 (운영 스타일) - 질문 2, 3
    const psAnswers = [answers[1], answers[2]]
    const pCount = psAnswers.filter(ans => ans === 'B').length
    const sCount = psAnswers.filter(ans => ans === 'A').length
    resultType += pCount > sCount ? 'P' : 'S'

    // T/M 축 (멘탈 안정성) - 질문 7, 8
    const tmAnswers = [answers[6], answers[7]]
    const tCount = tmAnswers.filter(ans => ans === 'A').length
    const mCount = tmAnswers.filter(ans => ans === 'B').length
    resultType += tCount > mCount ? 'T' : 'M'

    console.log('결과 타입:', resultType)
    console.log('선택한 답변:', answers)
    
    return resultType
  }

  const startTest = () => {
    setCurrentPage('question')
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
    // 질문 페이지 방문 로그
    logPageVisit('question', 1)
  }

  const selectAnswer = async (answer) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    
    // 질문 페이지 방문 로그
    logPageVisit('question')
    
    if (newAnswers.length === rollBtiQuestions.length) {
      // 모든 질문에 답변 완료
      const resultType = calculateResultType(newAnswers)
      const resultData = rollBtiResults[resultType]
      
      if (resultData) {
        setResult(resultData)
        setCurrentPage('result')
        
        // URL 업데이트
        const newUrl = `${window.location.origin}${window.location.pathname}?result=${resultType}`
        window.history.pushState({}, '', newUrl)
        
        // 결과 저장 및 로그
        saveTestResult(resultType, newAnswers)
        logPageVisit('result', resultType)
        
        // Supabase 참여자 수 증가
        try {
          console.log('=== 테스트 완료 - 참여자 수 증가 시작 ===')
          console.log('현재 참여자 수:', participantCount)
          
          // 모든 테스트 시도마다 참여자 수 증가
          const incrementSuccess = await incrementParticipantCount()
          
          if (incrementSuccess) {
            // 성공적으로 증가했으면 Supabase에서 최신 수 가져오기
            const latestCount = await getParticipantCount()
            setParticipantCount(latestCount)
            localStorage.setItem('gamegoo_participant_count', latestCount.toString())
            console.log('✅ 참여자 수 증가 및 Supabase 동기화 완료:', participantCount, '→', latestCount)
          } else {
            // 실패했으면 로컬에서 +1 증가
            const newCount = participantCount + 1
            setParticipantCount(newCount)
            localStorage.setItem('gamegoo_participant_count', newCount.toString())
            console.log('⚠️ Supabase 실패, 로컬에서 참여자 수 증가:', participantCount, '→', newCount)
          }
        } catch (error) {
          console.error('❌ 참여자 수 증가 중 오류:', error)
          
          // 에러 발생 시에도 로컬에서 +1 증가
          const newCount = participantCount + 1
          setParticipantCount(newCount)
          localStorage.setItem('gamegoo_participant_count', newCount.toString())
          console.log('🔄 에러 발생으로 로컬에서 참여자 수 증가:', participantCount, '→', newCount)
        }
      }
    } else {
      setCurrentQuestion(newAnswers.length)
    }
  }

  const restartTest = () => {
    // 테스트 재시작 로그
    logTestRestart()
    
    setCurrentPage('main')
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
    setShareMessage('')
    
    // URL 파라미터 제거
    window.history.pushState({}, '', '/')
    
    // 메인 페이지 방문 로그
    logPageVisit('main')
  }

  const shareResult = async () => {
    // UTM 파라미터가 포함된 공유 링크 생성
    const baseUrl = window.location.origin + window.location.pathname
    const resultParam = `?result=${result.type}`
    const utmParams = `&utm_source=share&utm_medium=copy&utm_campaign=result`
    const shareUrl = baseUrl + resultParam + utmParams
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareMessage('링크가 복사되었습니다!')
      
      // 공유 버튼 클릭 로그
      logShareButtonClick()
      
      setTimeout(() => {
        setShareMessage('')
      }, 3000)
    } catch (err) {
      // 클립보드 API를 지원하지 않는 경우
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setShareMessage('링크가 복사되었습니다!')
      
      // 공유 버튼 클릭 로그
      logShareButtonClick()
      
      setTimeout(() => {
        setShareMessage('')
      }, 3000)
    }
  }

  const renderMainPage = () => (
    <div className="main-page">
      <h1>롤 BTI</h1>
      <p className="subtitle">League of Legends MBTI</p>
      
      <div className="game-icons">
        <span className="game-icon">🎮</span>
        <span className="game-icon">⚔️</span>
        <span className="game-icon">🏆</span>
      </div>
      
      <p className="description">
        리그 오브 레전드 플레이 스타일로 알아보는 나의 성향
      </p>
      
      {/* 참여자 수 표시 */}
      <div className="participant-count">
        <p>지금까지 <span className="count-highlight">{participantCount.toLocaleString()}</span>명이 참여했어요</p>
      </div>
      
      <button className="start-btn" onClick={startTest}>
        시작하기
      </button>
    </div>
  )

  const renderQuestionPage = () => (
    <div className="question-page">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentQuestion + 1) / rollBtiQuestions.length) * 100}%` }}
        ></div>
      </div>
      <div className="question-container">
        <h2 className="question-title">
          {rollBtiQuestions[currentQuestion].question}
        </h2>
        <div className="options">
          <button 
            className="option-btn option-a" 
            onClick={() => selectAnswer('A')}
          >
            <span className="option-label">A</span>
            <p className="option-text">{rollBtiQuestions[currentQuestion].optionA}</p>
          </button>
          <button 
            className="option-btn option-b" 
            onClick={() => selectAnswer('B')}
          >
            <span className="option-label">B</span>
            <p className="option-text">{rollBtiQuestions[currentQuestion].optionB}</p>
          </button>
        </div>
        <div className="question-counter">
          {currentQuestion + 1} / {rollBtiQuestions.length}
        </div>
      </div>
    </div>
  )

  const renderResultPage = () => (
    <div className="result-page">
      <div className="result-container">
        <h1 className="result-title">나의 롤BTI는?</h1>
        <div className="result-card">
          <div className="mbti-type">{result.type}</div>
          <h2 className="mbti-title">{result.title}</h2>
          
          {/* 대표 챔피언 프로필 */}
          <div className="champion-profiles">
            {result.champions.split(', ').slice(0, 2).map((champion, index) => (
              <div key={index} className="champion-profile">
                <div className="champion-image">
                  <img src={`/champions/${champion.toLowerCase().replace(/\s+/g, '')}.jpg`} alt={champion} />
                </div>
                <p className="champion-name">{champion}</p>
              </div>
            ))}
          </div>
          
          <p className="mbti-description">{result.description}</p>
          
          {/* 8각형 레이더 차트 */}
          <BarChart answers={answers} />
          
          <div className="result-details">
            <div className="detail-section">
              <h3>💪 강점</h3>
              <p>{result.strengths}</p>
            </div>
            <div className="detail-section">
              <h3>⚠️ 약점</h3>
              <p>{result.weaknesses}</p>
            </div>
            <div className="detail-section">
              <h3>🎯 대표 챔피언</h3>
              <p>{result.champions}</p>
            </div>
            <div className="detail-section">
              <h3>🤝 같이 하면 좋은 유형</h3>
              <p>{result.goodWith}</p>
            </div>
            <div className="detail-section">
              <h3>🚫 피해야 할 유형</h3>
              <p>{result.avoidWith}</p>
            </div>
            <div className="detail-section">
              <h3>💬 명대사</h3>
              <p className="quote">{result.quote}</p>
            </div>
          </div>
        </div>
        {shareMessage && (
          <div className="share-message">
            {shareMessage}
          </div>
        )}
        <div className="result-actions">
          <button className="restart-btn" onClick={restartTest}>
            다시 테스트하기
          </button>
          <button className="share-btn" onClick={shareResult}>
            결과 공유하기
          </button>
        </div>
        <div className="share-info">
          <p>💡 공유 링크로 친구들이 같은 결과를 볼 수 있어요!</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {currentPage === 'main' && renderMainPage()}
      {currentPage === 'question' && renderQuestionPage()}
      {currentPage === 'result' && renderResultPage()}
    </div>
  )
}

export default App
