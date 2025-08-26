import React from 'react'

const BarChart = ({ answers }) => {
  // 4개 축에 대한 점수 계산
  const calculateScores = () => {
    if (!answers || answers.length === 0) return null
    
    // 각 축별로 A/B 답변 수 계산
    const scores = {
      'E/I': { E: 0, I: 0, total: 0 },
      'G/C': { G: 0, C: 0, total: 0 },
      'P/S': { P: 0, S: 0, total: 0 },
      'T/M': { T: 0, M: 0, total: 0 }
    }
    
    // 질문별 축 매핑 (9개 질문 순서대로)
    const questionAxisMapping = {
      0: 'E/I',  // 질문1: E vs I
      1: 'G/C',  // 질문2: G vs C
      2: 'P/S',  // 질문3: P vs S
      3: 'T/M',  // 질문4: T vs M
      4: 'E/I',  // 질문5: E vs I
      5: 'G/C',  // 질문6: G vs C
      6: 'P/S',  // 질문7: P vs S
      7: 'T/M',  // 질문8: T vs M
      8: 'E/I'   // 질문9: E vs I
    }
    
    // 각 답변을 해당 축에 카운트
    answers.forEach((answer, index) => {
      const axis = questionAxisMapping[index]
      if (axis && scores[axis]) {
        if (answer === 'A') {
          // A 답변은 첫 번째 성향 (E, G, P, T)
          if (axis === 'E/I') scores[axis].E++
          else if (axis === 'G/C') scores[axis].G++
          else if (axis === 'P/S') scores[axis].P++
          else if (axis === 'T/M') scores[axis].T++
        } else if (answer === 'B') {
          // B 답변은 두 번째 성향 (I, C, S, M)
          if (axis === 'E/I') scores[axis].I++
          else if (axis === 'G/C') scores[axis].C++
          else if (axis === 'P/S') scores[axis].S++
          else if (axis === 'T/M') scores[axis].M++
        }
        scores[axis].total++
      }
    })
    
    return scores
  }
  
  const scores = calculateScores()
  
  if (!scores) {
    return (
      <div className="bar-chart">
        <div className="chart-placeholder">
          <p>차트를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  // 각 축의 성향 레이블
  const axisLabels = {
    'E/I': { left: 'E (전투참여)', right: 'I (안정운영)' },
    'G/C': { left: 'G (팀워크)', right: 'C (개인플레이)' },
    'P/S': { left: 'P (안정지향)', right: 'S (공격지향)' },
    'T/M': { left: 'T (전략적)', right: 'M (직감적)' }
  }
  
  return (
    <div className="bar-chart">
      <h3 className="chart-title">나의 롤BTI 프로필</h3>
      
      {Object.entries(scores).map(([axis, score]) => {
        const leftScore = score[Object.keys(score)[0]] // E, G, P, T
        const rightScore = score[Object.keys(score)[1]] // I, C, S, M
        const total = score.total
        
        if (total === 0) return null
        
        const leftPercentage = total > 0 ? (leftScore / total) * 100 : 0
        const rightPercentage = total > 0 ? (rightScore / total) * 100 : 0
        
        return (
          <div key={axis} className="axis-row">
            <div className="axis-label left">{axisLabels[axis].left}</div>
            
            <div className="bar-container">
              <div className="bar-wrapper">
                <div 
                  className="bar left-bar" 
                  style={{ width: `${leftPercentage}%` }}
                >
                  <span className="bar-score">{leftScore}</span>
                </div>
                <div 
                  className="bar right-bar" 
                  style={{ width: `${rightPercentage}%` }}
                >
                  <span className="bar-score">{rightScore}</span>
                </div>
              </div>
            </div>
            
            <div className="axis-label right">{axisLabels[axis].right}</div>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart 