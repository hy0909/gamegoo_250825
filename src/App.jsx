import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import BarChart from './BarChart'
import { 
  supabase,
  getParticipantCount, 
  incrementParticipantCount,
  createUserSession,
  saveUserAnswers,
  saveUserResult,
  trackUserAction,
  completeUserSession
} from './supabase'

function App() {
  const [currentPage, setCurrentPage] = useState('main')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [shareMessage, setShareMessage] = useState('')
  const [participantCount, setParticipantCount] = useState(0)
  const [sessionId, setSessionId] = useState(null)

  // 롤BTI 질문 데이터
  const rollBtiQuestions = [
    {
      question: "블리츠크랭크가 인베 가자고 하면?",
      optionA: "무조건 따라감",
      optionB: "가볍게 무시",
      axis: ['E', 'I']
    },
    {
      question: "초반 운영에서 중요한 것은?",
      optionA: "안전한 파밍과 시야 확보",
      optionB: "적극적인 로밍과 갱킹",
      axis: ['G', 'C']
    },
    {
      question: "초반에 킬각이 보이면?",
      optionA: "신중하게 판단하고 기회만 노림",
      optionB: "즉시 달려가서 싸움을 시작",
      axis: ['P', 'S']
    },
    {
      question: "블루 버프를 먹었을 때?",
      optionA: "팀원들과 공유하여 전체적인 이득을 추구",
      optionB: "혼자서 더 많은 파밍과 압박을 시도",
      axis: ['T', 'M']
    },
    {
      question: "제어와드를 놓을 때?",
      optionA: "팀의 안전을 위해 전략적 위치에 배치",
      optionB: "개인적인 안전을 위해 내 주변에 집중",
      axis: ['E', 'I']
    },
    {
      question: "용이나 바론 한타에서 중요한 것은?",
      optionA: "팀원들과의 협력과 포지셔닝",
      optionB: "개인의 딜링과 생존",
      axis: ['G', 'C']
    },
    {
      question: "한타에서 딜러 역할을 맡았을 때?",
      optionA: "안전한 위치에서 지속적인 딜링",
      optionB: "리스크를 감수하고 적극적인 플레이",
      axis: ['P', 'S']
    },
    {
      question: "0/3/0 상황에서 중요한 것은?",
      optionA: "체계적인 운영과 팀워크로 역전",
      optionB: "감정적이 되지 않고 침착하게 대응",
      axis: ['T', 'M']
    },
    {
      question: "연패를 하고 있을 때?",
      optionA: "전략을 바꾸고 새로운 방법을 시도",
      optionB: "기본기에 충실하고 안정적인 플레이",
      axis: ['E', 'I']
    }
  ]

  // 롤BTI 결과 데이터 (16가지 유형)
  const rollBtiResults = {
    'EGPT': {
      type: 'EGPT',
      title: '용감한 팀파이터',
      description: '팀을 위해 적극적으로 싸우며, 안정적인 운영을 선호하는 전략적 플레이어입니다.',
      champions: '리신, 판테온',
      strengths: '팀워크가 뛰어나고 전략적 사고가 명확합니다.',
      weaknesses: '때로는 너무 보수적일 수 있습니다.',
      goodWith: 'ICST, EGPT 유형과 궁합이 좋습니다.',
      avoidWith: 'EGST, IGPT 유형과는 주의가 필요합니다.',
      quote: '한타는 내 삶의 이유다.'
    },
    'EGST': {
      type: 'EGST',
      title: '열정적인 공격수',
      description: '팀을 위해 적극적으로 싸우며, 공격적인 운영을 선호하는 열정적인 플레이어입니다.',
      champions: '야스오, 카타리나',
      strengths: '공격성이 뛰어나고 팀워크가 좋습니다.',
      weaknesses: '때로는 너무 공격적일 수 있습니다.',
      goodWith: 'ICST, EGPT 유형과 궁합이 좋습니다.',
      avoidWith: 'EGPT, ICST 유형과는 주의가 필요합니다.',
      quote: '공격이 최고의 방어다.'
    },
    'ECPT': {
      type: 'ECPT',
      title: '신중한 팀플레이어',
      description: '팀을 위해 적극적으로 싸우며, 안정적인 운영을 선호하는 신중한 플레이어입니다.',
      champions: '오리아나, 빅토르',
      strengths: '팀워크가 뛰어나고 안정적입니다.',
      weaknesses: '때로는 너무 신중할 수 있습니다.',
      goodWith: 'ICST, EGPT 유형과 궁합이 좋습니다.',
      avoidWith: 'EGST, IGPT 유형과는 주의가 필요합니다.',
      quote: '팀워크가 승리의 열쇠다.'
    },
    'ECST': {
      type: 'ECST',
      title: '열정적인 팀워커',
      description: '팀을 위해 적극적으로 싸우며, 공격적인 운영을 선호하는 열정적인 팀워커입니다.',
      champions: '레나타 글라스크, 나미',
      strengths: '팀워크가 뛰어나고 열정적입니다.',
      weaknesses: '때로는 너무 열정적일 수 있습니다.',
      goodWith: 'ICST, EGPT 유형과 궁합이 좋습니다.',
      avoidWith: 'EGPT, IGPT 유형과는 주의가 필요합니다.',
      quote: '팀을 위한 희생이 최고의 미덕이다.'
    },
    'ICPT': {
      type: 'ICPT',
      title: '전략적 개인플레이어',
      description: '개인적인 플레이를 선호하며, 안정적인 운영을 추구하는 전략적 플레이어입니다.',
      champions: '베인, 케이틀린',
      strengths: '전략적 사고가 뛰어나고 안정적입니다.',
      weaknesses: '팀워크가 부족할 수 있습니다.',
      goodWith: 'EGPT, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'EGST, IGPT 유형과는 주의가 필요합니다.',
      quote: '전략이 승리를 만든다.'
    },
    'ICST': {
      type: 'ICST',
      title: '공격적인 개인플레이어',
      description: '개인적인 플레이를 선호하며, 공격적인 운영을 추구하는 공격적인 플레이어입니다.',
      champions: '제리, 트리스타나',
      strengths: '공격성이 뛰어나고 개인 플레이가 좋습니다.',
      weaknesses: '팀워크가 부족할 수 있습니다.',
      goodWith: 'EGPT, ICPT 유형과 궁합이 좋습니다.',
      avoidWith: 'EGST, IGPT 유형과는 주의가 필요합니다.',
      quote: '개인의 실력이 승리를 결정한다.'
    },
    'IGPT': {
      type: 'IGPT',
      title: '안정적인 운영자',
      description: '안정적인 운영을 선호하며, 팀워크를 중시하는 안정적인 운영자입니다.',
      champions: '말자하, 아지르',
      strengths: '안정적이고 팀워크가 좋습니다.',
      weaknesses: '공격성이 부족할 수 있습니다.',
      goodWith: 'EGPT, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'EGST, IGPT 유형과는 주의가 필요합니다.',
      quote: '안정적인 운영이 승리의 기반이다.'
    },
    'IGST': {
      type: 'IGST',
      title: '공격적인 운영자',
      description: '안정적인 운영을 선호하며, 공격적인 플레이를 추구하는 공격적인 운영자입니다.',
      champions: '카사딘, 카시오페아',
      strengths: '공격적이고 안정적입니다.',
      weaknesses: '팀워크가 부족할 수 있습니다.',
      goodWith: 'EGPT, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'EGST, IGPT 유형과는 주의가 필요합니다.',
      quote: '공격적인 운영이 승리를 만든다.'
    },
    'EGPM': {
      type: 'EGPM',
      title: '열혈 돌격수',
      description: '한타 최전선에서 적극적으로 싸우지만, 기분에 따라 판단이 바뀌는 플레이어입니다.',
      champions: '다리우스, 가렌',
      strengths: '폭발적 파괴력과 열정적인 플레이',
      weaknesses: '멘탈이 흔들리면 손해가 큽니다.',
      goodWith: 'ECPT, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'IGSM, ICPT 유형과는 주의가 필요합니다.',
      quote: '분노가 내 무기다.'
    },
    'EGSM': {
      type: 'EGSM',
      title: '돌격 불도저',
      description: '초반 킬을 먹으면 기분이 최고가 되고, 아니면 급격히 다운되는 플레이어입니다.',
      champions: '제드, 카타리나',
      strengths: '잘 풀릴 때는 무적',
      weaknesses: '흐름이 끊기면 공백기가 길어집니다.',
      goodWith: 'ECST, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'ICPT, IGPT 유형과는 주의가 필요합니다.',
      quote: '킬 먹었으니 내가 주인공이다.'
    },
    'ECPM': {
      type: 'ECPM',
      title: '따뜻한 전투 요정',
      description: '팀 살리기에 전념하지만, 가끔 섭섭해하는 플레이어입니다.',
      champions: '소라카, 유미',
      strengths: '아군 생존율을 크게 높입니다.',
      weaknesses: '멘탈이 흔들리면 소극적이 됩니다.',
      goodWith: 'EGPT, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'IGSM, IGPT 유형과는 주의가 필요합니다.',
      quote: '너를 살리는 게 내 사명.'
    },
    'ECSM': {
      type: 'ECSM',
      title: '전장의 힐러',
      description: '초반 이득 후 팀원 살리기에 집중하는 플레이어입니다.',
      champions: '잔나, 룰루',
      strengths: '팀 유지력을 극대화합니다.',
      weaknesses: '초반 실패 시 영향력이 떨어집니다.',
      goodWith: 'EGST, ICPT 유형과 궁합이 좋습니다.',
      avoidWith: 'IGSM, IGPT 유형과는 주의가 필요합니다.',
      quote: '내 버프를 받은 자, 무적이리라.'
    },
    'IGPM': {
      type: 'IGPM',
      title: '외로운 캐리형',
      description: '라인전에서 고립된 플레이를 선호하며, 개인 캐리에 집중하는 플레이어입니다.',
      champions: '야스오, 이렐리아',
      strengths: '잘 풀리면 혼자서 승리를 만듭니다.',
      weaknesses: '안 풀리면 팀 연계가 단절됩니다.',
      goodWith: 'ECSM, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'EGPT, EGPT 유형과는 주의가 필요합니다.',
      quote: '내가 캐리하면 다 끝.'
    },
    'IGSM': {
      type: 'IGSM',
      title: '터렛 다이버',
      description: '라인전에서 과감한 다이브를 시도하며, 초반 폭발력을 추구하는 플레이어입니다.',
      champions: '카밀, 레넥톤',
      strengths: '라인전에서 매우 강합니다.',
      weaknesses: '실패 시 스노우볼을 역전당할 수 있습니다.',
      goodWith: 'ECST, ICST 유형과 궁합이 좋습니다.',
      avoidWith: 'ECPT, IGPT 유형과는 주의가 필요합니다.',
      quote: '롤은 넥서스뿌수는 게임이다.'
    },
    'ICPM': {
      type: 'ICPM',
      title: '가끔 삐지는 브루저',
      description: '헌신적으로 플레이하지만 가끔 감정 기복이 있는 플레이어입니다.',
      champions: '다리우스, 나르',
      strengths: '팀 기여도가 높습니다.',
      weaknesses: '멘탈이 나가면 소극적이 됩니다.',
      goodWith: 'EGPT, ECST 유형과 궁합이 좋습니다.',
      avoidWith: 'IGSM, IGPT 유형과는 주의가 필요합니다.',
      quote: '오늘은 참는다.'
    },
    'ICSM': {
      type: 'ICSM',
      title: '기분파 지원형',
      description: '초반 이득 후 지원에 집중하며, 기분에 따라 영향력이 달라지는 플레이어입니다.',
      champions: '룰루, 카르마',
      strengths: '팀 유연성이 뛰어납니다.',
      weaknesses: '멘탈 기복이 심합니다.',
      goodWith: 'EGST, ECST 유형과 궁합이 좋습니다.',
      avoidWith: 'IGSM, IGPT 유형과는 주의가 필요합니다.',
      quote: '기분 좋으면 날개 달린다.'
    }
  }

  // Supabase 연결 상태 확인
  const isSupabaseConnected = () => {
    try {
      return supabase && supabase.auth && supabase.auth.session
    } catch (error) {
      console.log('⚠️ Supabase 연결 확인 실패:', error)
      return false
    }
  }

  // 세션 초기화 (Supabase 연결 실패 시에도 작동)
  const initSession = async () => {
    try {
      if (isSupabaseConnected()) {
        const newSessionId = await createUserSession()
        if (newSessionId) {
          setSessionId(newSessionId)
          console.log('✅ Supabase 세션 생성:', newSessionId)
        }
      } else {
        console.log('⚠️ Supabase 연결 없음 - 로컬 세션 사용')
        // 로컬 세션 ID 생성 (Supabase 연결 실패 시)
        const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSessionId(localSessionId)
        console.log('✅ 로컬 세션 생성:', localSessionId)
      }
    } catch (error) {
      console.log('⚠️ 세션 생성 실패 - 로컬 세션 사용:', error)
      // 로컬 세션 ID 생성 (에러 발생 시)
      const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(localSessionId)
      console.log('✅ 로컬 세션 생성:', localSessionId)
    }
  }

  // Supabase 연결 확인 및 참여자 수 가져오기
  const fetchParticipantCount = useCallback(async () => {
    try {
      const count = await getParticipantCount();
      if (count !== null && count !== undefined) {
        setParticipantCount(count);
        // localStorage에 저장
        localStorage.setItem('participantCount', count.toString());
        console.log('✅ Supabase에서 참여자 수 가져옴:', count);
      }
    } catch (error) {
      console.warn('⚠️ Supabase 연결 없음 - 로컬 카운트 사용');
      // localStorage에서 복구 시도
      const localCount = localStorage.getItem('participantCount');
      if (localCount) {
        const count = parseInt(localCount, 10);
        setParticipantCount(count);
        console.log('🛡️ localStorage에서 참여자 수 복구:', count);
      }
    }
  }, []);

  // 컴포넌트 마운트 시 참여자 수 가져오기
  useEffect(() => {
    fetchParticipantCount()
    
    // 더 자주 참여자 수 업데이트 (3초마다)
    const interval = setInterval(fetchParticipantCount, 3000)
    
    return () => clearInterval(interval)
  }, [fetchParticipantCount])

  // 참여자 수가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (participantCount > 0) {
      localStorage.setItem('participantCount', participantCount.toString())
    }
  }, [participantCount])

  // URL 파라미터 처리 (결과 공유 링크)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const resultParam = urlParams.get('result')
    
    if (resultParam && rollBtiResults[resultParam]) {
      setResult(rollBtiResults[resultParam])
      setCurrentPage('result')
      // 디버깅을 위한 기본 답변 설정
      setAnswers(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'])
    }
  }, [])

  // 사용자 세션 생성
  useEffect(() => {
    initSession()
  }, [])

  // 결과 계산 함수
  const calculateResultType = (answers) => {
    if (!answers || answers.length === 0) return 'EGPT'
    
    // 각 축별 점수 계산
    let scores = {
      'E/I': { E: 0, I: 0 },
      'G/C': { G: 0, C: 0 },
      'P/S': { P: 0, S: 0 },
      'T/M': { T: 0, M: 0 }
    }
    
    // 질문별 축 매핑
    const questionAxisMapping = [
      'E/I', 'G/C', 'P/S', 'T/M', 'E/I',
      'G/C', 'P/S', 'T/M', 'E/I'
    ]
    
    // 각 답변에 따라 점수 계산
    answers.forEach((answer, index) => {
      const axis = questionAxisMapping[index]
      if (axis && scores[axis]) {
        if (answer === 'A') {
          // A 답변은 첫 번째 성향
          if (axis === 'E/I') scores[axis].E++
          else if (axis === 'G/C') scores[axis].G++
          else if (axis === 'P/S') scores[axis].P++
          else if (axis === 'T/M') scores[axis].T++
        } else if (answer === 'B') {
          // B 답변은 두 번째 성향
          if (axis === 'E/I') scores[axis].I++
          else if (axis === 'G/C') scores[axis].C++
          else if (axis === 'P/S') scores[axis].S++
          else if (axis === 'T/M') scores[axis].M++
        }
      }
    })
    
    // 결과 유형 결정
    const resultType = [
      scores['E/I'].E > scores['E/I'].I ? 'E' : 'I',
      scores['G/C'].G > scores['G/C'].C ? 'G' : 'C',
      scores['P/S'].P > scores['P/S'].S ? 'P' : 'S',
      scores['T/M'].T > scores['T/M'].M ? 'T' : 'M'
    ].join('')
    
    return resultType
  }

  // 답변 선택 처리
  const selectAnswer = async (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (newAnswers.length === rollBtiQuestions.length) {
      // 모든 질문에 답변 완료
      const resultType = calculateResultType(newAnswers);
      const result = rollBtiResults[resultType];
      
      // 로컬로만 처리 (Supabase 연결 없음)
      try {
        // 참여자 수 증가
        await incrementParticipantCount();
        
        console.log('✅ 테스트 완료 및 로컬 데이터 저장 성공');
      } catch (error) {
        console.warn('⚠️ 로컬 데이터 저장 실패:', error);
      }

      setCurrentPage('result');
    } else {
      setCurrentQuestion(newAnswers.length);
    }
  };

  // 테스트 시작 함수
  const startTest = () => {
    setCurrentPage('question')
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
  }

  // 테스트 재시작 함수
  const restartTest = () => {
    setCurrentPage('main')
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
    
    // 새로운 세션 생성
    initSession()
  }

  // 결과 공유
  const shareResult = async () => {
    if (result) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?result=${result.type}`
      
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShareMessage('링크가 복사되었습니다!')
        
        setTimeout(() => setShareMessage(''), 3000)
      } catch (error) {
        console.error('클립보드 복사 실패:', error)
        setShareMessage('링크 복사에 실패했습니다.')
        setTimeout(() => setShareMessage(''), 3000)
      }
    }
  }

  // 메인 페이지 렌더링
  const renderMainPage = () => (
    <div className="main-page">
      <div className="main-content">
        <h1 className="title">롤BTI</h1>
        <p className="subtitle">나의 롤 플레이 스타일을 알아보자!</p>
        
        {/* 이모지 애니메이션 영역 */}
        <div className="emoji-container">
          <span className="emoji">🎮</span>
          <span className="emoji">⚔️</span>
          <span className="emoji">🏆</span>
        </div>
        
        {/* 참여자 수 표시 */}
        <div className="participant-count">
          지금까지 {participantCount}명이 참여했어요!
        </div>
        
        <button className="start-btn" onClick={startTest}>
          시작하기
        </button>
      </div>
    </div>
  )

  // 질문 페이지 렌더링
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

  // 결과 페이지 렌더링
  const renderResultPage = () => (
    <div className="result-page">
      <div className="result-container">
        <h1 className="result-title">나의 롤BTI는?</h1>
        <div className="result-card">
          <div className="mbti-type">{result.type}</div>
          <h2 className="mbti-title">{result.title}</h2>
          
          {/* 명대사 - 제목 없이 바로 표시 */}
          <p className="mbti-quote">{result.quote}</p>
          
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
          
          {/* 4축 가로 막대그래프 */}
          <BarChart answers={answers} />
          
          {/* 함께하면 좋은 유형 섹션 */}
          <div className="compatibility-section">
            <div className="compatibility-title">함께하면 좋은 유형</div>
            <div className="compatibility-cards">
              <div className="compatibility-card positive">
                <div className="card-indicator positive">
                  <span>✓</span>
                </div>
                <div className="card-title">함께하면 좋은 유형 1</div>
                <div className="character-image">
                  <div className="character-helmet tryndamere">
                    <div className="helmet-horns"></div>
                    <div className="helmet-face">
                      <div className="helmet-eyes"></div>
                      <div className="helmet-beard"></div>
                    </div>
                  </div>
                </div>
                <div className="character-subtitle">{result.goodWith.split(', ')[0]}</div>
                <div className="character-description">
                  이 유형과 함께하면 시너지가 좋습니다.
                </div>
              </div>

              <div className="compatibility-card positive">
                <div className="card-indicator positive">
                  <span>✓</span>
                </div>
                <div className="card-title">함께하면 좋은 유형 2</div>
                <div className="character-image">
                  <div className="character-helmet zed">
                    <div className="helmet-wings"></div>
                    <div className="helmet-face">
                      <div className="helmet-visor"></div>
                      <div className="helmet-accent"></div>
                    </div>
                  </div>
                </div>
                <div className="character-subtitle">{result.goodWith.split(', ')[1]}</div>
                <div className="character-description">
                  이 유형과 함께하면 시너지가 좋습니다.
                </div>
              </div>
            </div>
          </div>

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
              <h3>🤝 함께하면 좋은 유형</h3>
              <p>{result.goodWith}</p>
            </div>
            <div className="detail-section">
              <h3>🚫 피해야 할 유형</h3>
              <p>{result.avoidWith}</p>
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
