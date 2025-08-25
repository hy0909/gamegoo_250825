import React from 'react'

const BarChart = ({ answers }) => {
  // 각 축별 점수 계산 (0-100)
  const calculateScores = () => {
    if (!answers || answers.length === 0) return null

    // E/I 축 (전투 참여도) - 질문 1, 5, 6
    const eiAnswers = [answers[0], answers[4], answers[5]]
    const eScore = Math.round((eiAnswers.filter(ans => ans === 'A').length / 3) * 100)
    const iScore = Math.round((eiAnswers.filter(ans => ans === 'B').length / 3) * 100)

    // G/C 축 (자원 사용 방식) - 질문 4, 9
    const gcAnswers = [answers[3], answers[8]]
    const gScore = Math.round((gcAnswers.filter(ans => ans === 'A').length / 2) * 100)
    const cScore = Math.round((gcAnswers.filter(ans => ans === 'B').length / 2) * 100)

    // P/S 축 (운영 스타일) - 질문 2, 3
    const psAnswers = [answers[1], answers[2]]
    const pScore = Math.round((psAnswers.filter(ans => ans === 'B').length / 2) * 100)
    const sScore = Math.round((psAnswers.filter(ans => ans === 'A').length / 2) * 100)

    // T/M 축 (멘탈 안정성) - 질문 7, 8
    const tmAnswers = [answers[6], answers[7]]
    const tScore = Math.round((tmAnswers.filter(ans => ans === 'A').length / 2) * 100)
    const mScore = Math.round((tmAnswers.filter(ans => ans === 'B').length / 2) * 100)

    return {
      eScore, iScore, gScore, cScore, pScore, sScore, tScore, mScore
    }
  }

  const scores = calculateScores()
  if (!scores) return null

  const axes = [
    {
      name: '전투 참여도',
      type1: { name: 'E (Engager)', description: '한타, 교전 적극 참여', score: scores.eScore, color: '#00ff88' },
      type2: { name: 'I (Isolator)', description: '내 구역에서 안정적 플레이', score: scores.iScore, color: '#00ccff' }
    },
    {
      name: '자원 사용 방식',
      type1: { name: 'G (Greedy)', description: 'CS, 킬 욕심', score: scores.gScore, color: '#ff6b6b' },
      type2: { name: 'C (Contributor)', description: '팀원에게 자원 양보', score: scores.cScore, color: '#4ecdc4' }
    },
    {
      name: '운영 스타일',
      type1: { name: 'P (Playsafe)', description: '안정·시야·장기전 지향', score: scores.pScore, color: '#45b7d1' },
      type2: { name: 'S (Snowballer)', description: '초반 이득으로 굴리기', score: scores.sScore, color: '#96ceb4' }
    },
    {
      name: '멘탈 안정성',
      type1: { name: 'T (Tiltproof)', description: '멘탈 강철', score: scores.tScore, color: '#feca57' },
      type2: { name: 'M (Moody)', description: '감정 기복 큼', score: scores.mScore, color: '#ff9ff3' }
    }
  ]

  return (
    <div className="bar-chart-container">
      <h3 className="chart-title">🎯 롤BTI 4가지 축 분석</h3>
      <div className="axes-container">
        {axes.map((axis, index) => (
          <div key={index} className="axis-item">
            <h4 className="axis-name">{axis.name}</h4>
            <div className="bar-container">
              <div className="type-info type1">
                <span className="type-name">{axis.type1.name}</span>
                <span className="type-description">{axis.type1.description}</span>
                <span className="type-score">{axis.type1.score}%</span>
              </div>
              <div className="bar-wrapper">
                <div className="bar">
                  <div 
                    className="bar-fill type1-fill"
                    style={{ 
                      width: `${axis.type1.score}%`,
                      backgroundColor: axis.type1.color
                    }}
                  ></div>
                  <div 
                    className="bar-fill type2-fill"
                    style={{ 
                      width: `${axis.type2.score}%`,
                      backgroundColor: axis.type2.color
                    }}
                  ></div>
                </div>
              </div>
              <div className="type-info type2">
                <span className="type-name">{axis.type2.name}</span>
                <span className="type-description">{axis.type2.description}</span>
                <span className="type-score">{axis.type2.score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BarChart 