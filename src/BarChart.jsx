import React, { useState, useEffect } from 'react'

const BarChart = ({ answers }) => {
  const [animatedScores, setAnimatedScores] = useState({})
  const [isAnimating, setIsAnimating] = useState(false)

  console.log('=== BarChart 디버깅 시작 ===')
  console.log('answers:', answers)
  console.log('answers 타입:', typeof answers)
  console.log('answers 길이:', answers ? answers.length : 'undefined')
  
  // answers가 없거나 비어있으면 기본 메시지 표시
  if (!answers || answers.length === 0) {
    console.log('answers가 없음 - 기본 메시지 표시')
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#ffffff',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        margin: '2rem 0',
        border: '2px solid #00ff88'
      }}>
        <h3>🎯 롤BTI 4가지 축 분석</h3>
        <p>답변을 완료하면 차트가 표시됩니다.</p>
        <p style={{ fontSize: '0.8rem', color: '#cccccc' }}>
          현재 answers: {JSON.stringify(answers)}
        </p>
      </div>
    )
  }

  // 점수 계산
  const calculateScores = () => {
    const scores = {
      eScore: Math.round((answers.filter((ans, index) => [0, 4, 5].includes(index) && ans === 'A').length / 3) * 100),
      iScore: Math.round((answers.filter((ans, index) => [0, 4, 5].includes(index) && ans === 'B').length / 3) * 100),
      gScore: Math.round((answers.filter((ans, index) => [3, 8].includes(index) && ans === 'A').length / 2) * 100),
      cScore: Math.round((answers.filter((ans, index) => [3, 8].includes(index) && ans === 'B').length / 2) * 100),
      pScore: Math.round((answers.filter((ans, index) => [1, 2].includes(index) && ans === 'B').length / 2) * 100),
      sScore: Math.round((answers.filter((ans, index) => [1, 2].includes(index) && ans === 'A').length / 2) * 100),
      tScore: Math.round((answers.filter((ans, index) => [6, 7].includes(index) && ans === 'A').length / 2) * 100),
      mScore: Math.round((answers.filter((ans, index) => [6, 7].includes(index) && ans === 'B').length / 2) * 100)
    }
    
    console.log('계산된 점수:', scores)
    return scores
  }

  const scores = calculateScores()
  
  // 애니메이션 시작
  useEffect(() => {
    if (scores && Object.keys(scores).length > 0) {
      setIsAnimating(true)
      
      // 0부터 시작해서 점수까지 애니메이션
      const animationDuration = 1500 // 1.5초
      const steps = 60
      const stepDuration = animationDuration / steps
      
      let currentStep = 0
      
      const animate = () => {
        if (currentStep <= steps) {
          const progress = currentStep / steps
          
          const animatedValues = {}
          Object.keys(scores).forEach(key => {
            animatedValues[key] = Math.round(scores[key] * progress)
          })
          
          setAnimatedScores(animatedValues)
          currentStep++
          
          setTimeout(animate, stepDuration)
        } else {
          setIsAnimating(false)
        }
      }
      
      animate()
    }
  }, [scores])

  // 축 데이터
  const axes = [
    {
      name: '전투 참여도',
      type1: { name: 'E (Engager)', score: animatedScores.eScore || 0, color: '#00ff88' },
      type2: { name: 'I (Isolator)', score: animatedScores.iScore || 0, color: '#00ccff' }
    },
    {
      name: '자원 사용 방식',
      type1: { name: 'G (Greedy)', score: animatedScores.gScore || 0, color: '#ff6b6b' },
      type2: { name: 'C (Contributor)', score: animatedScores.cScore || 0, color: '#4ecdc4' }
    },
    {
      name: '운영 스타일',
      type1: { name: 'P (Playsafe)', score: animatedScores.pScore || 0, color: '#45b7d1' },
      type2: { name: 'S (Snowballer)', score: animatedScores.sScore || 0, color: '#96ceb4' }
    },
    {
      name: '멘탈 안정성',
      type1: { name: 'T (Tiltproof)', score: animatedScores.tScore || 0, color: '#feca57' },
      type2: { name: 'M (Moody)', score: animatedScores.mScore || 0, color: '#ff9ff3' }
    }
  ]

  console.log('BarChart 렌더링 완료')
  
  return (
    <div style={{ 
      margin: '2rem 0',
      padding: '1rem',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      border: '2px solid #00ff88'
    }}>
      <h3 style={{ 
        color: '#00ff88', 
        fontSize: '1.3rem', 
        marginBottom: '2rem',
        textAlign: 'center',
        fontWeight: '600'
      }}>
        🎯 롤BTI 4가지 축 분석
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {axes.map((axis, index) => (
          <div key={index} style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h4 style={{
              color: '#ffffff',
              fontSize: '1rem',
              marginBottom: '1rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {axis.name}
            </h4>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'space-between'
            }}>
              {/* Type 1 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                <span style={{
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  marginBottom: '0.3rem'
                }}>
                  {axis.type1.name}
                </span>
                <span style={{
                  color: axis.type1.color,
                  fontSize: '1rem',
                  fontWeight: '700',
                  textShadow: `0 0 10px ${axis.type1.color}`
                }}>
                  {axis.type1.score}%
                </span>
              </div>
              
              {/* 막대 그래프 */}
              <div style={{
                flex: 1,
                height: '24px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                margin: '0 1rem',
                position: 'relative'
              }}>
                {/* Type 1 막대 */}
                <div style={{
                  height: '100%',
                  width: `${axis.type1.score}%`,
                  backgroundColor: axis.type1.color,
                  borderRadius: '12px 0 0 12px',
                  transition: 'width 0.1s ease',
                  minWidth: '0',
                  boxShadow: `0 0 10px ${axis.type1.color}`,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {/* 막대 내부 그라데이션 효과 */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(90deg, ${axis.type1.color} 0%, rgba(255,255,255,0.3) 50%, ${axis.type1.color} 100%)`,
                    borderRadius: '12px 0 0 12px'
                  }}></div>
                </div>
                
                {/* Type 2 막대 */}
                <div style={{
                  height: '100%',
                  width: `${axis.type2.score}%`,
                  backgroundColor: axis.type2.color,
                  borderRadius: '0 12px 12px 0',
                  transition: 'width 0.1s ease',
                  minWidth: '0',
                  boxShadow: `0 0 10px ${axis.type2.color}`,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* 막대 내부 그라데이션 효과 */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(90deg, ${axis.type2.color} 0%, rgba(255,255,255,0.3) 50%, ${axis.type2.color} 100%)`,
                    borderRadius: '0 12px 12px 0'
                  }}></div>
                </div>
              </div>
              
              {/* Type 2 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                <span style={{
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  marginBottom: '0.3rem'
                }}>
                  {axis.type2.name}
                </span>
                <span style={{
                  color: axis.type2.color,
                  fontSize: '1rem',
                  fontWeight: '700',
                  textShadow: `0 0 10px ${axis.type2.color}`
                }}>
                  {axis.type2.score}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 애니메이션 상태 표시 */}
      {isAnimating && (
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          color: '#00ff88',
          fontSize: '0.9rem'
        }}>
          ⚡ 차트 애니메이션 진행 중...
        </div>
      )}
      
      {/* 디버깅 정보 */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <p style={{ color: '#ffffff', margin: '0.5rem 0' }}>
          <strong>디버깅 정보:</strong>
        </p>
        <p style={{ color: '#ffffff', margin: '0.5rem 0' }}>
          answers 길이: {answers.length}
        </p>
        <p style={{ color: '#ffffff', margin: '0.5rem 0' }}>
          answers 내용: {JSON.stringify(answers)}
        </p>
        <p style={{ color: '#ffffff', margin: '0.5rem 0' }}>
          원본 점수: {JSON.stringify(scores)}
        </p>
        <p style={{ color: '#ffffff', margin: '0.5rem 0' }}>
          애니메이션 점수: {JSON.stringify(animatedScores)}
        </p>
        <p style={{ color: '#ffffff', margin: '0.5rem 0' }}>
          애니메이션 상태: {isAnimating ? '진행 중' : '완료'}
        </p>
      </div>
    </div>
  )
}

export default BarChart 